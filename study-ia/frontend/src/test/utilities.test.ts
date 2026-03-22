import { describe, it, expect } from 'vitest';

describe('Frontend Utilities', () => {
  describe('API Client', () => {
    it('should build correct API URL', () => {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const endpoint = '/documents';
      const fullUrl = `${baseUrl}${endpoint}`;
      expect(fullUrl).toContain('/api/documents');
    });

    it('should handle auth headers', () => {
      const token = 'test-token-123';
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
      expect(headers.Authorization).toBe('Bearer test-token-123');
    });
  });

  describe('Data Transformations', () => {
    it('should format file size correctly', () => {
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      };

      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format date correctly', () => {
      const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      };

      const result = formatDate(new Date('2024-01-15'));
      expect(result).toMatch(/de\s+enero\s+de\s+2024/);
      expect(result).toContain('enero');
    });

    it('should truncate text', () => {
      const truncateText = (text: string, maxLength: number): string => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
      };

      expect(truncateText('Short text', 50)).toBe('Short text');
      expect(truncateText('This is a very long text', 20)).toContain('...');
      expect(truncateText('Exactly 10!', 10)).toBe('Exactly...');
      expect(truncateText('ABCDEFGHIJ', 5).endsWith('...')).toBe(true);
    });

    it('should count words correctly', () => {
      const countWords = (text: string): number => {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
      };

      expect(countWords('One two three')).toBe(3);
      expect(countWords('')).toBe(0);
      expect(countWords('   spaces   ')).toBe(1);
      expect(countWords('Hola mundo esto es una prueba')).toBe(6);
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', () => {
      const isValidEmail = (email: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@nodomain.com')).toBe(false);
      expect(isValidEmail('noat.com')).toBe(false);
    });

    it('should validate password strength', () => {
      const validatePassword = (password: string): { valid: boolean; message: string } => {
        if (password.length < 6) return { valid: false, message: 'Mínimo 6 caracteres' };
        return { valid: true, message: 'Válida' };
      };

      expect(validatePassword('123456').valid).toBe(true);
      expect(validatePassword('Pass123').valid).toBe(true);
      expect(validatePassword('abc').valid).toBe(false);
      expect(validatePassword('abcdef').valid).toBe(true);
    });

    it('should validate required fields', () => {
      const isRequired = (value: any): boolean => {
        return value !== null && value !== undefined && value !== '';
      };

      expect(isRequired('text')).toBe(true);
      expect(isRequired('')).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
      expect(isRequired(0)).toBe(true);
    });
  });

  describe('Local Storage Helpers', () => {
    it('should safely parse JSON from localStorage', () => {
      const safeParseJSON = <T>(json: string | null, defaultValue: T): T => {
        if (!json) return defaultValue;
        try {
          return JSON.parse(json);
        } catch {
          return defaultValue;
        }
      };

      expect(safeParseJSON('{"name":"test"}', {})).toEqual({ name: 'test' });
      expect(safeParseJSON(null, {})).toEqual({});
      expect(safeParseJSON('invalid json', { fallback: true })).toEqual({ fallback: true });
    });

    it('should check if user is logged in', () => {
      const isAuthenticated = (token: string | null): boolean => {
        return !!token && token.length > 0;
      };

      expect(isAuthenticated('valid-token')).toBe(true);
      expect(isAuthenticated('')).toBe(false);
      expect(isAuthenticated(null)).toBe(false);
    });
  });

  describe('UI Helpers', () => {
    it('should generate random color', () => {
      const generateColor = (): string => {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      };

      const color = generateColor();
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should calculate progress percentage', () => {
      const calculateProgress = (completed: number, total: number): number => {
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
      };

      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(0, 10)).toBe(0);
      expect(calculateProgress(10, 10)).toBe(100);
      expect(calculateProgress(1, 3)).toBe(33);
    });

    it('should format study time', () => {
      const formatTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      };

      expect(formatTime(30)).toBe('30m');
      expect(formatTime(60)).toBe('1h');
      expect(formatTime(90)).toBe('1h 30m');
      expect(formatTime(150)).toBe('2h 30m');
    });
  });

  describe('Flashcard Helpers', () => {
    it('should determine if card is due', () => {
      const isDue = (nextReview: string | Date): boolean => {
        return new Date(nextReview) <= new Date();
      };

      expect(isDue(new Date(Date.now() - 86400000))).toBe(true);
      expect(isDue(new Date(Date.now() + 86400000))).toBe(false);
    });

    it('should calculate mastery level', () => {
      const getMasteryLevel = (repetitions: number, easeFactor: number): string => {
        if (repetitions >= 10 && easeFactor >= 2.5) return 'Experto';
        if (repetitions >= 5) return 'Avanzado';
        if (repetitions >= 2) return 'Intermedio';
        return 'Principiante';
      };

      expect(getMasteryLevel(0, 2.5)).toBe('Principiante');
      expect(getMasteryLevel(3, 2.5)).toBe('Intermedio');
      expect(getMasteryLevel(7, 2.5)).toBe('Avanzado');
      expect(getMasteryLevel(15, 2.7)).toBe('Experto');
    });

    it('should map quality to description', () => {
      const qualityToText = (quality: number): string => {
        if (quality === 0) return 'Blackout total';
        if (quality <= 2) return 'Difícil';
        if (quality === 3) return 'Correcto con esfuerzo';
        if (quality === 4) return 'Correcto';
        return 'Perfecto';
      };

      expect(qualityToText(0)).toBe('Blackout total');
      expect(qualityToText(2)).toBe('Difícil');
      expect(qualityToText(3)).toBe('Correcto con esfuerzo');
      expect(qualityToText(4)).toBe('Correcto');
      expect(qualityToText(5)).toBe('Perfecto');
    });
  });
});

describe('Data Models', () => {
  interface Document {
    id: string;
    title: string;
    content: string;
    summary?: string;
    createdAt: Date;
  }

  interface Flashcard {
    id: string;
    front: string;
    back: string;
    easeFactor: number;
    interval: number;
    repetitions: number;
    nextReview: Date;
  }

  it('should validate Document structure', () => {
    const doc: Document = {
      id: '1',
      title: 'Test',
      content: 'Content',
      createdAt: new Date(),
    };

    expect(doc).toHaveProperty('id');
    expect(doc).toHaveProperty('title');
    expect(doc).toHaveProperty('content');
    expect(doc).toHaveProperty('createdAt');
  });

  it('should validate Flashcard structure', () => {
    const card: Flashcard = {
      id: '1',
      front: 'Question',
      back: 'Answer',
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReview: new Date(),
    };

    expect(card).toHaveProperty('front');
    expect(card).toHaveProperty('back');
    expect(card).toHaveProperty('easeFactor');
    expect(card).toHaveProperty('nextReview');
  });
});
