import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai';

const router = Router();

router.use(authenticate);

const summarizeSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  documentId: z.string().uuid().optional(),
});

const qaSchema = z.object({
  content: z.string().min(10),
  context: z.string().optional(),
  documentId: z.string().uuid().optional(),
});

const flashcardsSchema = z.object({
  content: z.string().min(10),
  count: z.number().min(1).max(20).optional().default(5),
  documentId: z.string().uuid().optional(),
});

const studyPlanSchema = z.object({
  content: z.string().min(10),
  timeAvailable: z.string().optional(),
});

router.get('/providers', async (req: AuthRequest, res: Response) => {
  try {
    const status = await aiService.checkProvidersStatus();
    const activeProvider = process.env.AI_PROVIDER || 'ollama';
    
    res.json({
      success: true,
      data: {
        providers: status,
        active: activeProvider,
      },
    });
  } catch (error) {
    throw error;
  }
});

router.post('/summarize', async (req: AuthRequest, res: Response) => {
  try {
    const data = summarizeSchema.parse(req.body);
    
    const result = await aiService.summarize(data.content);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    if (data.documentId) {
      await prisma.document.update({
        where: { id: data.documentId },
        data: {
          summary: result.data?.summary,
          keyPoints: result.data?.keyPoints || [],
        },
      });
    }
    
    res.json({
      success: true,
      data: result.data,
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

router.post('/qa', async (req: AuthRequest, res: Response) => {
  try {
    const data = qaSchema.parse(req.body);
    
    const result = await aiService.generateQA(data.content, data.context);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    let qaRecord = null;
    if (data.documentId) {
      qaRecord = await prisma.qA.create({
        data: {
          userId: req.userId!,
          documentId: data.documentId,
          question: result.data?.question || '',
          answer: result.data?.answer || '',
          confidence: result.data?.confidence,
        },
      });
    }
    
    res.json({
      success: true,
      data: {
        ...result.data,
        id: qaRecord?.id,
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

router.post('/flashcards', async (req: AuthRequest, res: Response) => {
  try {
    const data = flashcardsSchema.parse(req.body);
    
    const result = await aiService.generateFlashcards(data.content);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    const flashcards = result.data?.flashcards || [];
    const count = Math.min(data.count, flashcards.length);
    
    const createdFlashcards = await Promise.all(
      flashcards.slice(0, count).map((card: any) =>
        prisma.flashcard.create({
          data: {
            userId: req.userId!,
            documentId: data.documentId,
            front: card.front,
            back: card.back,
            tags: card.tags || [],
          },
        })
      )
    );
    
    res.json({
      success: true,
      data: {
        flashcards: createdFlashcards,
        generated: flashcards.length,
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

router.post('/study-plan', async (req: AuthRequest, res: Response) => {
  try {
    const data = studyPlanSchema.parse(req.body);
    
    const result = await aiService.generateStudyPlan(data.content, data.timeAvailable);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    res.json({
      success: true,
      data: result.data,
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

export default router;
