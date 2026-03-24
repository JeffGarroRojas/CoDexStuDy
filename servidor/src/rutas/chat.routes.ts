import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { role, content } = req.body;
    const userId = req.userId!;

    if (!role || !content) {
      return res.status(400).json({
        success: false,
        error: 'Role y content son requeridos',
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        userId,
        role,
        content,
      },
    });

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error guardando mensaje:', error);
    res.status(500).json({
      success: false,
      error: 'Error al guardar mensaje',
    });
  }
});

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 50;

    const messages = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error obteniendo mensajes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener mensajes',
    });
  }
});

router.delete('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    await prisma.chatMessage.deleteMany({
      where: { userId },
    });

    res.json({
      success: true,
      message: 'Historial eliminado',
    });
  } catch (error) {
    console.error('Error eliminando mensajes:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar historial',
    });
  }
});

export default router;
