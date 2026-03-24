import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';

describe('Zod Validation Schemas', () => {
  describe('User Registration Schema', () => {
    const userSchema = z.object({
      email: z.string().email('Email inválido'),
      password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
      name: z.string().min(1, 'El nombre es requerido').optional(),
    });

    it('should validate correct user data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'John Doe',
      };
      const result = userSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      };
      const result = userSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '123',
      };
      const result = userSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should accept user without name', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = userSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123',
      };
      const result = userSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Document Schema', () => {
    const documentSchema = z.object({
      title: z.string().min(1, 'El título es requerido'),
      content: z.string().min(1, 'El contenido es requerido'),
      sourceType: z.enum(['text', 'pdf', 'url']).optional(),
    });

    it('should validate correct document', () => {
      const validData = {
        title: 'My Document',
        content: 'Document content here',
        sourceType: 'text' as const,
      };
      const result = documentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept document without sourceType', () => {
      const validData = {
        title: 'My Document',
        content: 'Content',
      };
      const result = documentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid sourceType', () => {
      const invalidData = {
        title: 'My Document',
        content: 'Content',
        sourceType: 'invalid',
      };
      const result = documentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Flashcard Schema', () => {
    const flashcardSchema = z.object({
      front: z.string().min(1, 'La pregunta es requerida'),
      back: z.string().min(1, 'La respuesta es requerida'),
      documentId: z.string().optional(),
    });

    it('should validate correct flashcard', () => {
      const validData = {
        front: 'What is AI?',
        back: 'Artificial Intelligence is...',
        documentId: 'doc-123',
      };
      const result = flashcardSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty front', () => {
      const invalidData = {
        front: '',
        back: 'Answer',
      };
      const result = flashcardSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('SM-2 Review Schema', () => {
    const reviewSchema = z.object({
      id: z.string().min(1),
      quality: z.number().min(0).max(5),
    });

    it('should validate quality 0-5', () => {
      for (let i = 0; i <= 5; i++) {
        const validData = { id: 'card-1', quality: i };
        const result = reviewSchema.safeParse(validData);
        expect(result.success).toBe(true);
      }
    });

    it('should reject quality below 0', () => {
      const invalidData = { id: 'card-1', quality: -1 };
      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject quality above 5', () => {
      const invalidData = { id: 'card-1', quality: 6 };
      const result = reviewSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('AI Request Schema', () => {
    const aiRequestSchema = z.object({
      content: z.string().min(1, 'El contenido es requerido'),
      task: z.enum(['summarize', 'flashcards', 'qa', 'study_plan', 'topics']),
      options: z.object({
        maxTokens: z.number().optional(),
        temperature: z.number().min(0).max(2).optional(),
      }).optional(),
    });

    it('should validate correct AI request', () => {
      const validData = {
        content: 'Some content to process',
        task: 'summarize' as const,
        options: {
          maxTokens: 1000,
          temperature: 0.7,
        },
      };
      const result = aiRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate all task types', () => {
      const tasks = ['summarize', 'flashcards', 'qa', 'study_plan', 'topics'];
      tasks.forEach(task => {
        const validData = { content: 'test', task };
        const result = aiRequestSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid task', () => {
      const invalidData = {
        content: 'test',
        task: 'invalid_task',
      };
      const result = aiRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject temperature outside 0-2', () => {
      const invalidData = {
        content: 'test',
        task: 'summarize' as const,
        options: { temperature: 3 },
      };
      const result = aiRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Search Topics Schema', () => {
    const searchTopicsSchema = z.object({
      tema: z.string().min(1, 'El tema es requerido'),
      grado: z.string().min(1, 'El grado es requerido'),
      area: z.string().optional(),
    });

    it('should validate search request', () => {
      const validData = {
        tema: 'Fotosíntesis',
        grado: '10',
        area: 'cientifico',
      };
      const result = searchTopicsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should work without area', () => {
      const validData = {
        tema: 'Historia',
        grado: '11',
      };
      const result = searchTopicsSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
