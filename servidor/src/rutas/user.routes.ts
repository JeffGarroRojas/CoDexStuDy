import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Endpoint para finalizar el onboarding conversacional de CoDDy
router.post('/onboarding', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const onboardingSchema = z.object({
            name: z.string().optional(),
            grado: z.string().optional(),
            objective: z.string().optional(),
        });

        const data = onboardingSchema.parse(req.body);

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.grado && { grado: data.grado }),
                ...(data.objective && { objective: data.objective }),
                isFirstLogin: false,
                onboardingDone: true,
            },
            select: {
                id: true,
                email: true,
                name: true,
                grado: true,
                objective: true,
                isFirstLogin: true,
                onboardingDone: true,
            }
        });

        res.json({
            success: true,
            message: 'Onboarding completado exitosamente',
            data: { user }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, error: 'Datos de perfil inválidos' });
        }
        console.error('Error en onboarding:', error);
        res.status(500).json({ success: false, error: 'Error interno al procesar el onboarding' });
    }
});

export default router;
