import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { sendVerificationEmail } from '../services/email.service';

const router = Router();
const prisma = new PrismaClient();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/send-code', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, nombre y contraseña son requeridos',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Este email ya está registrado',
      });
    }

    await prisma.emailVerification.deleteMany({
      where: { email },
    });

    const code = generateCode();
    const hashedPassword = await bcrypt.hash(password, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.emailVerification.create({
      data: {
        email,
        code,
        name,
        password: hashedPassword,
        expiresAt,
      },
    });

    const emailSent = await sendVerificationEmail(email, code, name);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        error: 'No se pudo enviar el email. Verifica que el correo sea válido.',
      });
    }

    res.json({
      success: true,
      message: 'Código enviado',
      email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    });
  } catch (error) {
    console.error('Error en send-code:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar la solicitud',
    });
  }
});

router.post('/verify-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email y código son requeridos',
      });
    }

    const verification = await prisma.emailVerification.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return res.status(400).json({
        success: false,
        error: 'Código inválido o expirado',
      });
    }

    const user = await prisma.user.create({
      data: {
        email: verification.email,
        password: verification.password!,
        name: verification.name,
        onboardingDone: false,
      },
    });

    await prisma.emailVerification.deleteMany({
      where: { email },
    });

    const token = Buffer.from(`${user.id}:${uuidv4()}`).toString('base64');

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    console.error('Error en verify-code:', error);
    res.status(500).json({
      success: false,
      error: 'Error al verificar el código',
    });
  }
});

export default router;
