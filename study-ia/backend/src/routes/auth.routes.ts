import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../server';
import { ValidationError } from '../middleware/error.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
  email: z.string().email('Invalid email'),
  password: z.string().min(1),
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
      throw new ValidationError('Email already registered');
    }
    
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
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
        onboardingDone: true,
      },
    });
    
    const token = generateToken(user.id);
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          studyMethod: user.studyMethod,
          level: user.level,
          learningStyle: user.learningStyle,
        },
        token,
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

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }
    
    const isValid = await bcrypt.compare(data.password, user.password);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
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
        },
        token,
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

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
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
        error: 'User not found',
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

router.put('/method', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided',
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
        error: 'Invalid method',
      });
    }
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
  }
});

export default router;
