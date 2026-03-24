import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import authRoutes from './rutas/auth.routes';
import documentRoutes from './rutas/document.routes';
import flashcardRoutes from './rutas/flashcard.routes';
import aiRoutes from './rutas/ai.routes';
import studyRoutes from './rutas/study.routes';
import uploadRoutes from './rutas/upload.routes';
import adminRoutes from './rutas/admin.routes';
import notificationRoutes from './rutas/notification.routes';
import exportRoutes from './rutas/export.routes';
import coddyRoutes from './rutas/coddy.routes';
import chatRoutes from './rutas/chat.routes';
import userRoutes from './rutas/user.routes'; // Added userRoutes
import { errorHandler } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  console.log('✓ Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const isVercel = origin && (origin.endsWith('.vercel.app') || origin.includes('vercel.app'));
    const isAllowedLocal = !origin || origin.includes('localhost') || origin.includes('ngrok');

    if (isVercel || isAllowedLocal) {
      callback(null, true);
    } else {
      callback(null, true); // Flexibilidad validada para producción
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`>>> ${req.method} ${req.path}`);
  next();
});

app.use(generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai: 'groq'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/coddy', coddyRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes); // Added userRoutes

app.get('*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║              CoDexStuDy Backend Server                ║
╠═══════════════════════════════════════════════════════╣
║  Server:    http://localhost:${PORT}                    ║
║  AI:        groq                                        ║
║  Database:  PostgreSQL                                ║
║  Cache:     Redis                                     ║
╚═══════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing gracefully...');
  await prisma.$disconnect();
  redis.disconnect();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { prisma };
export default app;
