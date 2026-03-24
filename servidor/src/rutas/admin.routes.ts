import { Router, Response } from 'express';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.get('/users', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            documents: true,
            flashcards: true,
            studySessions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    throw error;
  }
});

router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalDocuments,
      totalFlashcards,
      totalSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.flashcard.count(),
      prisma.studySession.count(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDocuments,
        totalFlashcards,
        totalSessions,
      },
    });
  } catch (error) {
    throw error;
  }
});

export default router;
