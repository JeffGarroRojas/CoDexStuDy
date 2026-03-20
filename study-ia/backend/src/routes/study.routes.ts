import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

const startSessionSchema = z.object({
  topic: z.string().min(1).max(255),
});

router.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    const [sessions, total] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId: req.userId },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studySession.count({ where: { userId: req.userId } }),
    ]);
    
    const stats = await prisma.studySession.aggregate({
      where: { userId: req.userId },
      _sum: {
        duration: true,
        cardsStudied: true,
        cardsLearned: true,
      },
      _avg: {
        accuracy: true,
      },
    });
    
    res.json({
      success: true,
      data: {
        sessions,
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

router.post('/sessions/start', async (req: AuthRequest, res: Response) => {
  try {
    const data = startSessionSchema.parse(req.body);
    
    const existingSession = await prisma.studySession.findFirst({
      where: {
        userId: req.userId,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    if (existingSession) {
      return res.json({
        success: true,
        data: { session: existingSession },
        message: 'Resuming existing session',
      });
    }
    
    const session = await prisma.studySession.create({
      data: {
        userId: req.userId!,
        topic: data.topic,
        duration: 0,
      },
    });
    
    res.status(201).json({
      success: true,
      data: { session },
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

router.put('/sessions/:id/end', async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }
    
    const { cardsStudied, cardsLearned, accuracy } = req.body;
    
    const duration = Math.round(
      (new Date().getTime() - session.createdAt.getTime()) / 1000 / 60
    );
    
    const updated = await prisma.studySession.update({
      where: { id: req.params.id },
      data: {
        duration,
        cardsStudied: cardsStudied ?? session.cardsStudied,
        cardsLearned: cardsLearned ?? session.cardsLearned,
        accuracy: accuracy ?? session.accuracy,
      },
    });
    
    res.json({
      success: true,
      data: { session: updated },
    });
  } catch (error) {
    throw error;
  }
});

router.get('/sessions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId,
      },
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
      });
    }
    
    res.json({
      success: true,
      data: { session },
    });
  } catch (error) {
    throw error;
  }
});

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [
      weeklySessions,
      monthlySessions,
      totalCards,
      dueCards,
      recentActivity,
    ] = await Promise.all([
      prisma.studySession.findMany({
        where: { userId: req.userId, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.studySession.count({
        where: { userId: req.userId, createdAt: { gte: monthAgo } },
      }),
      prisma.flashcard.count({ where: { userId: req.userId } }),
      prisma.flashcard.count({
        where: { userId: req.userId, nextReview: { lte: now } },
      }),
      prisma.studySession.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);
    
    const totalMinutesThisWeek = weeklySessions.reduce(
      (sum, s) => sum + s.duration,
      0
    );
    const avgAccuracy =
      weeklySessions.length > 0
        ? weeklySessions.reduce((sum, s) => sum + s.accuracy, 0) /
          weeklySessions.length
        : 0;
    
    res.json({
      success: true,
      data: {
        totalCards,
        dueCards,
        monthlySessions,
        weeklyMinutes: totalMinutesThisWeek,
        weeklyAccuracy: Math.round(avgAccuracy * 100) / 100,
        streak: calculateStreak(recentActivity),
        recentActivity,
      },
    });
  } catch (error) {
    throw error;
  }
});

function calculateStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const sessionDates = new Set(
    sessions.map((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  
  while (sessionDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }
  
  return streak;
}

export default router;
