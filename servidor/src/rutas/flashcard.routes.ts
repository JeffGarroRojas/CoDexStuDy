import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { redis } from '../server';

const router = Router();

router.use(authenticate);

const createFlashcardSchema = z.object({
  documentId: z.string().uuid().optional(),
  front: z.string().min(1),
  back: z.string().min(1),
  tags: z.array(z.string()).optional().default([]),
});

const reviewSchema = z.object({
  flashcardId: z.string().uuid(),
  quality: z.number().min(0).max(5),
});

const SM2Algorithm = (flashcard: any, quality: number) => {
  let { easeFactor, interval, repetitions } = flashcard;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = quality === 5 ? 5 : 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 0; // Same day review
  }

  easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview, quality };
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { due, documentId, tags, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const where: any = { userId: req.userId };

    if (due === 'true') {
      where.nextReview = { lte: new Date() };
    }

    if (documentId) {
      where.documentId = documentId;
    }

    if (tags) {
      const tagList = (tags as string).split(',');
      where.tags = { hasSome: tagList };
    }

    const [flashcards, total] = await Promise.all([
      prisma.flashcard.findMany({
        where,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { nextReview: 'asc' },
        include: {
          document: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.flashcard.count({ where }),
    ]);

    const stats = await prisma.flashcard.groupBy({
      by: ['difficulty'],
      where: { userId: req.userId },
      _count: true,
    });

    res.json({
      success: true,
      data: {
        flashcards,
        stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    throw error;
  }
});

router.get('/due', async (req: AuthRequest, res: Response) => {
  try {
    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string);

    const flashcards = await prisma.flashcard.findMany({
      where: {
        userId: req.userId,
        nextReview: { lte: new Date() },
      },
      take: limitNum,
      orderBy: { nextReview: 'asc' },
      include: {
        document: {
          select: { id: true, title: true },
        },
      },
    });

    res.json({
      success: true,
      data: { flashcards, count: flashcards.length },
    });
  } catch (error) {
    throw error;
  }
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const cacheKey = `stats:${req.userId}`;

    if (redis) {
      const cached = await redis.get(cacheKey);

      if (cached) {
        return res.json({
          success: true,
          data: JSON.parse(cached),
          cached: true,
        });
      }
    }

    const [totalCards, dueCards, masteredCards, recentSessions] = await Promise.all([
      prisma.flashcard.count({ where: { userId: req.userId } }),
      prisma.flashcard.count({ where: { userId: req.userId, nextReview: { lte: new Date() } } }),
      prisma.flashcard.count({ where: { userId: req.userId, repetitions: { gte: 5 } } }),
      prisma.studySession.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 7,
      }),
    ]);

    const stats = {
      totalCards,
      dueCards,
      masteredCards,
      recentSessions,
      retention: totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0,
    };

    if (redis) {
      await redis.setex(cacheKey, 300, JSON.stringify(stats));
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    throw error;
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createFlashcardSchema.parse(req.body);

    if (data.documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: data.documentId, userId: req.userId },
      });
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: 'Document not found',
        });
      }
    }

    const flashcard = await prisma.flashcard.create({
      data: {
        ...data,
        userId: req.userId!,
      },
    });

    if (redis) await redis.del(`stats:${req.userId}`);

    res.status(201).json({
      success: true,
      data: { flashcard },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    throw error;
  }
});

router.post('/review', async (req: AuthRequest, res: Response) => {
  try {
    const data = reviewSchema.parse(req.body);
    const startTime = Date.now();

    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id: data.flashcardId,
        userId: req.userId,
      },
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard not found',
      });
    }

    const sm2Result = SM2Algorithm(flashcard, data.quality);

    const [review, updatedFlashcard] = await prisma.$transaction([
      prisma.review.create({
        data: {
          flashcardId: data.flashcardId,
          quality: data.quality,
          responseTime: Date.now() - startTime,
        },
      }),
      prisma.flashcard.update({
        where: { id: data.flashcardId },
        data: {
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
          nextReview: sm2Result.nextReview,
          difficulty: data.quality < 3 ? flashcard.difficulty + 1 : flashcard.difficulty,
        },
      }),
    ]);

    if (redis) await redis.del(`stats:${req.userId}`);

    res.json({
      success: true,
      data: {
        review,
        flashcard: updatedFlashcard,
        nextReview: sm2Result.nextReview,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    throw error;
  }
});

router.post('/explain', async (req: AuthRequest, res: Response) => {
  try {
    const { flashcardId } = req.body;

    if (!flashcardId) {
      return res.status(400).json({
        success: false,
        error: 'flashcardId es requerido',
      });
    }

    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id: flashcardId,
        userId: req.userId,
      },
      include: {
        document: {
          select: { content: true },
        },
      },
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard no encontrada',
      });
    }

    const { aiService } = await import('../servicios/ai');

    const explanationPrompt = `Eres un tutor de estudio experto. Explica paso a paso POR QUÉ la siguiente respuesta es correcta.

PREGUNTA: ${flashcard.front}
RESPUESTA CORRECTA: ${flashcard.back}

${flashcard.document?.content ? `CONTEXTO ADICIONAL:\n${flashcard.document.content.substring(0, 2000)}` : ''}

Instrucciones:
1. Explica el concepto principal
2. Desglosa los puntos clave
3. Da un ejemplo práctico si es posible
4. Usa un tono amigable y motivador

Responde de forma clara y organizada, idealmente en español.`;

    const result = await aiService.process({
      content: explanationPrompt,
      task: 'summarize',
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error al generar explicación',
      });
    }

    res.json({
      success: true,
      data: {
        explanation: result.data?.summary || 'No se pudo generar la explicación.',
        flashcard: {
          id: flashcard.id,
          front: flashcard.front,
          back: flashcard.back,
        },
      },
    });
  } catch (error: any) {
    console.error('Explain error:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });

    if (!flashcard) {
      return res.status(404).json({
        success: false,
        error: 'Flashcard not found',
      });
    }

    await prisma.flashcard.delete({
      where: { id: req.params.id },
    });

    if (redis) await redis.del(`stats:${req.userId}`);

    res.json({
      success: true,
      message: 'Flashcard deleted',
    });
  } catch (error) {
    throw error;
  }
});

export default router;
