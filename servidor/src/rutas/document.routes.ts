import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

const createDocumentSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  sourceType: z.enum(['text', 'pdf', 'url']).optional().default('text'),
  sourceUrl: z.string().url().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', search } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const where: any = { userId: req.userId };
    
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { content: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          summary: true,
          sourceType: true,
          wordCount: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { flashcards: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: {
        documents,
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

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
      include: {
        flashcards: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }
    
    res.json({
      success: true,
      data: { document },
    });
  } catch (error) {
    throw error;
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createDocumentSchema.parse(req.body);
    
    const wordCount = data.content.split(/\s+/).filter(Boolean).length;
    
    const document = await prisma.document.create({
      data: {
        ...data,
        userId: req.userId!,
        wordCount,
      },
    });
    
    res.status(201).json({
      success: true,
      data: { document },
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

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { title, content, summary, keyPoints } = req.body;
    
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }
    
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : document.wordCount;
    
    const updated = await prisma.document.update({
      where: { id: req.params.id },
      data: {
        title: title || document.title,
        content: content || document.content,
        summary: summary !== undefined ? summary : document.summary,
        keyPoints: keyPoints || document.keyPoints,
        wordCount,
      },
    });
    
    res.json({
      success: true,
      data: { document: updated },
    });
  } catch (error) {
    throw error;
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await prisma.document.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }
    
    await prisma.document.delete({
      where: { id: req.params.id },
    });
    
    res.json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    throw error;
  }
});

export default router;
