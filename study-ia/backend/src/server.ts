import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import flashcardRoutes from './routes/flashcard.routes';
import aiRoutes from './routes/ai.routes';
import studyRoutes from './routes/study.routes';
import uploadRoutes from './routes/upload.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error.middleware';

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
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://*.ngrok.io',
      'https://*.ngrok-free.app',
      'https://*.onrender.com',
      undefined
    ];
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(null, true);
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

app.get('*', (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║              Study-IA Backend Server                  ║
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
