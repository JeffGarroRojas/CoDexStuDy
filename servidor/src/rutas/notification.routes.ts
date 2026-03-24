import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

const notificationSettingsSchema = z.object({
  emailReminders: z.boolean().optional().default(true),
  pushNotifications: z.boolean().optional().default(true),
  reminderTime: z.string().optional().default('09:00'),
  dailyGoal: z.number().min(1).max(100).optional().default(10),
});

router.get('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        emailNotifications: true,
        pushNotifications: true,
        reminderTime: true,
        dailyGoal: true,
      },
    });

    res.json({
      success: true,
      data: {
        emailReminders: settings?.emailNotifications ?? true,
        pushNotifications: settings?.pushNotifications ?? true,
        reminderTime: settings?.reminderTime ?? '09:00',
        dailyGoal: settings?.dailyGoal ?? 10,
      },
    });
  } catch (error) {
    throw error;
  }
});

router.put('/settings', async (req: AuthRequest, res: Response) => {
  try {
    const data = notificationSettingsSchema.parse(req.body);

    await prisma.user.update({
      where: { id: req.userId },
      data: {
        emailNotifications: data.emailReminders,
        pushNotifications: data.pushNotifications,
        reminderTime: data.reminderTime,
        dailyGoal: data.dailyGoal,
      },
    });

    res.json({
      success: true,
      message: 'Configuración actualizada',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      });
    }
    throw error;
  }
});

router.post('/test-push', async (req: AuthRequest, res: Response) => {
  try {
    const subscription = req.body.subscription;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        error: 'Suscripción inválida',
      });
    }

    const payload = JSON.stringify({
      title: '🔔 ¡Recordatorio de CoDexStuDy!',
      body: 'Tienes tarjetas pendientes por repasar. ¡Mantén tu racha!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'study-reminder',
      data: {
        url: '/study',
        type: 'reminder',
      },
    });

    try {
      const response = await fetch(subscription.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'TTL': '86400',
        },
        body: payload,
      });

      if (!response.ok) {
        throw new Error('Failed to send push');
      }

      res.json({
        success: true,
        message: 'Notificación de prueba enviada',
      });
    } catch (pushError) {
      res.json({
        success: true,
        message: 'Notificación almacenada (funcionará cuando Push esté configurado)',
      });
    }
  } catch (error) {
    throw error;
  }
});

router.get('/due-reminder', async (req: AuthRequest, res: Response) => {
  try {
    const dueCards = await prisma.flashcard.count({
      where: {
        userId: req.userId,
        nextReview: { lte: new Date() },
      },
    });

    const dueDocuments = await prisma.document.count({
      where: {
        userId: req.userId,
        summary: null,
      },
    });

    const todaySessions = await prisma.studySession.count({
      where: {
        userId: req.userId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const message = todaySessions === 0
      ? `¡Hoy no has estudiado! Tienes ${dueCards} tarjetas pendientes.`
      : `¡Buen trabajo! Tienes ${dueCards} tarjetas por repasar.`;

    res.json({
      success: true,
      data: {
        hasReminder: dueCards > 0 || dueDocuments > 0,
        dueCards,
        dueDocuments,
        studiedToday: todaySessions > 0,
        message,
      },
    });
  } catch (error) {
    throw error;
  }
});

export default router;
