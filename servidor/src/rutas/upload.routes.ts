import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { extractTextFromPDF, sanitizeFilename } from '../utils/pdfExtractor';
import { aiService } from '../servicios/ai';
import { uploadLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${sanitizeFilename(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  },
});

router.post('/upload', uploadLimiter, authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se encontró archivo PDF',
      });
    }

    const { text, pages, wordCount, title } = await extractTextFromPDF(req.file.path);

    if (wordCount < 10) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'El PDF no contiene suficiente texto para procesar',
      });
    }

    res.json({
      success: true,
      data: {
        text,
        pages,
        wordCount,
        title,
        filename: req.file.originalname,
      },
    });
  } catch (error: any) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar PDF',
    });
  }
});

router.post('/extract-topics', uploadLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { text } = z.object({
      text: z.string().min(50, 'El texto es muy corto para extraer temas'),
    }).parse(req.body);

    const result = await aiService.extractTopics(text);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error al extraer temas',
      });
    }

    res.json({
      success: true,
      data: {
        topics: result.data?.topics || [],
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al extraer temas',
    });
  }
});

router.post('/process', uploadLimiter, authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { text, title, filename, method, flashcardCount, topics } = z.object({
      text: z.string().min(10),
      title: z.string().optional(),
      filename: z.string().optional(),
      method: z.enum(['resumen', 'flashcards', 'qa', 'plan', 'hibrido']),
      flashcardCount: z.number().min(1).max(50).optional().default(5),
      topics: z.array(z.string()).min(1, 'Debes confirmar al menos un tema'),
    }).parse(req.body);

    const userId = req.userId!;
    const document = await prisma.document.create({
      data: {
        userId,
        title: title || filename || 'Documento procesado',
        content: text.substring(0, 50000),
        sourceType: 'pdf',
        sourceUrl: filename,
        wordCount: text.split(/\s+/).filter(Boolean).length,
      },
    });

    const topicsContext = topics.join(', ');
    const results: any = {
      documentId: document.id,
      documentTitle: document.title,
      topics,
    };

    if (method === 'resumen' || method === 'hibrido') {
      const summaryResult = await aiService.summarizeWithTopics(topics, text);
      if (summaryResult.success) {
        await prisma.document.update({
          where: { id: document.id },
          data: {
            summary: summaryResult.data?.summary,
            keyPoints: summaryResult.data?.keyPoints || [],
          },
        });
        results.summary = summaryResult.data;
      }
    }

    if (method === 'flashcards' || method === 'hibrido') {
      const flashcardsResult = await aiService.generateFlashcardsWithTopics(topics, text);
      if (flashcardsResult.success && flashcardsResult.data?.flashcards) {
        const cards = flashcardsResult.data.flashcards.slice(0, flashcardCount);
        const createdCards = await Promise.all(
          cards.map((card: any) =>
            prisma.flashcard.create({
              data: {
                userId,
                documentId: document.id,
                front: card.front,
                back: card.back,
                tags: card.tags || topics.slice(0, 2),
              },
            })
          )
        );
        results.flashcards = createdCards;
        results.flashcardsGenerated = cards.length;
      }
    }

    if (method === 'qa' || method === 'hibrido') {
      const qaResult = await aiService.generateQA(text, topicsContext);
      if (qaResult.success) {
        results.qa = qaResult.data;
      }
    }

    if (method === 'plan' || method === 'hibrido') {
      const planResult = await aiService.generateStudyPlan(text, topicsContext);
      if (planResult.success) {
        results.studyPlan = planResult.data;
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al procesar',
    });
  }
});

export default router;
