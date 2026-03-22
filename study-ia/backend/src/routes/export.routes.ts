import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

interface AnkiCard {
  front: string;
  back: string;
  tags: string[];
}

interface CSVRecord {
  front: string;
  back: string;
  tags?: string;
}

router.get('/export/flashcards', async (req: AuthRequest, res: Response) => {
  try {
    const { format = 'json', documentId } = req.query;

    const where: any = { userId: req.userId };
    if (documentId) {
      where.documentId = documentId;
    }

    const flashcards = await prisma.flashcard.findMany({
      where,
      select: {
        front: true,
        back: true,
        tags: true,
        difficulty: true,
        easeFactor: true,
        repetitions: true,
        nextReview: true,
        createdAt: true,
      },
    });

    if (format === 'csv') {
      const csvHeader = 'front,back,tags,difficulty,easeFactor,repetitions,nextReview,createdAt\n';
      const csvRows = flashcards.map((card) =>
        `"${card.front.replace(/"/g, '""')}","${card.back.replace(/"/g, '""')}","${card.tags.join(',')}","${card.difficulty}","${card.easeFactor}","${card.repetitions}","${card.nextReview.toISOString()}","${card.createdAt.toISOString()}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=flashcards_export.csv');
      return res.send(csvHeader + csvRows);
    }

    if (format === 'anki') {
      const ankiLines = flashcards.map((card) =>
        `${card.front}\t${card.back}\t${card.tags.join(' ')}`
      ).join('\n');

      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=flashcards_anki.txt');
      return res.send(ankiLines);
    }

    res.json({
      success: true,
      data: {
        flashcards,
        count: flashcards.length,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    throw error;
  }
});

router.post('/import/flashcards', async (req: AuthRequest, res: Response) => {
  try {
    const { content, format = 'json', documentId } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Contenido es requerido',
      });
    }

    let cards: AnkiCard[] = [];

    if (format === 'csv') {
      const lines = content.split('\n').filter((line: string) => line.trim());
      const header = lines[0]?.toLowerCase();

      const hasHeader = header.includes('front') || header.includes('back');

      for (let i = hasHeader ? 1 : 0; i < lines.length; i++) {
        const match = lines[i].match(/^"?([^"]*)"?, "?([^"]*)"?(?:, ?"?(.*?)"?)?$/);
        if (match) {
          cards.push({
            front: match[1].trim(),
            back: match[2].trim(),
            tags: match[3] ? match[3].split(',').map((t: string) => t.trim()) : [],
          });
        }
      }
    } else if (format === 'anki') {
      const lines = content.split('\n').filter((line: string) => line.trim());
      for (const line of lines) {
        const [front, back, tagsStr] = line.split('\t');
        if (front && back) {
          cards.push({
            front: front.trim(),
            back: back.trim(),
            tags: tagsStr ? tagsStr.trim().split(' ').filter(Boolean) : [],
          });
        }
      }
    } else {
      try {
        cards = JSON.parse(content);
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Formato JSON inválido',
        });
      }
    }

    if (cards.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se encontraron tarjetas válidas',
      });
    }

    const createdCards = await Promise.all(
      cards.slice(0, 100).map((card: AnkiCard) =>
        prisma.flashcard.create({
          data: {
            userId: req.userId!,
            documentId: documentId || null,
            front: card.front.substring(0, 1000),
            back: card.back.substring(0, 1000),
            tags: card.tags.slice(0, 10),
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      data: {
        imported: createdCards.length,
        totalFound: cards.length,
        truncated: cards.length > 100,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error al importar tarjetas',
    });
  }
});

router.get('/export/documents', async (req: AuthRequest, res: Response) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        keyPoints: true,
        sourceType: true,
        createdAt: true,
      },
    });

    const flashcards = await prisma.flashcard.findMany({
      where: { userId: req.userId },
      select: {
        front: true,
        back: true,
        tags: true,
        documentId: true,
      },
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      documents: documents.map((doc) => ({
        ...doc,
        flashcards: flashcards.filter((fc) => fc.documentId === doc.id),
      })),
      flashcardsWithoutDocument: flashcards.filter((fc) => !fc.documentId),
    };

    res.json({
      success: true,
      data: exportData,
    });
  } catch (error) {
    throw error;
  }
});

export default router;
