import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should handle objects', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj.name).toBe('Test');
    expect(obj).toHaveProperty('value', 42);
  });
});

describe('SM-2 Algorithm Tests', () => {
  it('should calculate next review correctly', () => {
    const quality = 4;
    const easeFactor = 2.5;
    const interval = 0;
    const repetitions = 0;

    let newInterval = interval;
    let newRepetitions = repetitions;

    if (quality >= 3) {
      if (repetitions === 0) newInterval = 1;
      else if (repetitions === 1) newInterval = 6;
      else newInterval = Math.round(interval * easeFactor);
      newRepetitions = repetitions + 1;
    }

    expect(newInterval).toBe(1);
    expect(newRepetitions).toBe(1);
  });

  it('should reset on failed review', () => {
    const quality = 2;
    const interval = 6;
    const repetitions = 3;

    let newInterval = interval;
    let newRepetitions = repetitions;

    if (quality < 3) {
      newRepetitions = 0;
      newInterval = 1;
    }

    expect(newInterval).toBe(1);
    expect(newRepetitions).toBe(0);
  });
});

describe('Form Validation Tests', () => {
  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
    expect(emailRegex.test('test@')).toBe(false);
  });

  it('should validate password strength', () => {
    const minPasswordLength = 6;
    const isValidPassword = (password: string) => password.length >= minPasswordLength;
    
    expect(isValidPassword('123456')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});

describe('Data Transformation Tests', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00');
    const formatted = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    expect(formatted).toContain('15');
    expect(formatted).toContain('enero');
  });

  it('should calculate word count', () => {
    const text = 'Hola mundo esto es una prueba';
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    expect(wordCount).toBe(6);
  });
});
