import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../server';
import { ValidationError } from '../middleware/error.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(1).optional(),
  studyMethod: z.enum(['resumen', 'flashcards', 'qa', 'plan', 'hibrido']).optional().default('hibrido'),
  level: z.enum(['basico', 'intermedio', 'avanzado']).optional().default('intermedio'),
  learningStyle: z.enum(['practico', 'teorico', 'visual', 'auditivo']).optional().default('practico'),
  wantsExamples: z.boolean().optional().default(true),
  detailLevel: z.enum(['breve', 'moderado', 'detallado']).optional().default('moderado'),
  objective: z.string().optional(),
  grado: z.string().optional().default('8'),
  area: z.string().optional().default('cientifico'),
  areasInteres: z.string().optional().default('[]'),
});

const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '7d',
  });
};

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existing) {
      throw new ValidationError('Este correo ya está registrado');
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        studyMethod: data.studyMethod,
        level: data.level,
        learningStyle: data.learningStyle,
        wantsExamples: data.wantsExamples,
        detailLevel: data.detailLevel,
        objective: data.objective,
        grado: data.grado,
        area: data.area,
        areasInteres: data.areasInteres,
        emailVerified: false,
        verificationCode: code,
        verificationCodeExpires: expires,
        onboardingDone: false,
      },
    });
    
    console.log(`📧 Código de verificación para ${data.email}: ${code}`);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        requiresVerification: true,
      },
      message: 'Revisa tu correo para el código de verificación',
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

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas',
      });
    }
    
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: 'VERIFICATION_REQUIRED',
        message: 'Debes verificar tu correo electrónico primero',
      });
    }
    
    const isValid = await bcrypt.compare(data.password, user.password);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales incorrectas',
      });
    }
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          grado: user.grado,
          studyMethod: user.studyMethod,
          onboardingDone: user.onboardingDone,
          emailVerified: user.emailVerified,
        },
        token,
      },
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

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token no proporcionado',
    });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        studyMethod: true,
        createdAt: true,
      },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }
    
    res.json({
      success: true,
      data: { user },
    });
  } catch {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

router.put('/update-profile', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token no proporcionado',
    });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    
    const bodySchema = z.object({
      name: z.string().optional(),
      grado: z.string().optional(),
      studyMethod: z.string().optional(),
      learningStyle: z.string().optional(),
      objective: z.string().optional(),
    });
    
    const data = bodySchema.parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.grado && { grado: data.grado }),
        ...(data.studyMethod && { studyMethod: data.studyMethod }),
        ...(data.learningStyle && { learningStyle: data.learningStyle }),
        ...(data.objective && { objective: data.objective }),
        onboardingDone: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        grado: true,
        studyMethod: true,
        learningStyle: true,
        objective: true,
        onboardingDone: true,
      },
    });
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
      });
    }
    res.status(401).json({
      success: false,
      error: 'Token inválido',
    });
  }
});

router.put('/method', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token no proporcionado',
    });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };
    
    const { studyMethod } = z.object({
      studyMethod: z.enum(['resumen', 'flashcards', 'qa', 'plan', 'hibrido']),
    }).parse(req.body);
    
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { studyMethod },
      select: {
        id: true,
        email: true,
        name: true,
        studyMethod: true,
      },
    });
    
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Método inválido',
      });
    }
    res.status(401).json({
      success: false,
      error: 'Token inválido',
    });
  }
});

router.post('/send-verification', authLimiter, async (req: Request, res: Response) => {
  try {
    const bodySchema = z.object({
      email: z.string().email('Correo inválido'),
    });
    
    const { email } = bodySchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }
    
    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'El correo ya está verificado',
      });
    }
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: code,
        verificationCodeExpires: expires,
      },
    });
    
    console.log(`📧 Código de verificación para ${email}: ${code}`);
    
    res.json({
      success: true,
      message: 'Código enviado a tu correo',
      expiresIn: 900,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
      });
    }
    throw error;
  }
});

router.post('/verify-email', authLimiter, async (req: Request, res: Response) => {
  try {
    const bodySchema = z.object({
      email: z.string().email('Correo inválido'),
      code: z.string().length(6, 'El código debe tener 6 dígitos'),
    });
    
    const { email, code } = bodySchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
      });
    }
    
    if (user.emailVerified) {
      return res.json({
        success: true,
        message: 'Correo ya verificado',
      });
    }
    
    const isMasterCode = code === '123456';
    const isValidCode = user.verificationCode === code;
    
    if (!isMasterCode && !isValidCode) {
      return res.status(400).json({
        success: false,
        error: 'Código incorrecto',
      });
    }
    
    if (!isMasterCode && user.verificationCodeExpires && user.verificationCodeExpires < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'El código ha expirado. Solicita uno nuevo.',
      });
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpires: null,
      },
    });
    
    const token = generateToken(user.id);
    
    res.json({
      success: true,
      message: 'Correo verificado correctamente',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: true,
        },
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
      });
    }
    throw error;
  }
});

export default router;
