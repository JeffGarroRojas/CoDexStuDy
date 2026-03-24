import { describe, it, expect } from '@jest/globals';
import { calculateSM2, SM2Input, SM2Result } from './sm2';

describe('SM-2 Algorithm - Unit Tests', () => {
  describe('calculateSM2', () => {
    it('should be a function', () => {
      expect(typeof calculateSM2).toBe('function');
    });

    it('should return an object with correct properties', () => {
      const input: SM2Input = {
        quality: 4,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      };
      const result = calculateSM2(input);
      
      expect(result).toHaveProperty('easeFactor');
      expect(result).toHaveProperty('interval');
      expect(result).toHaveProperty('repetitions');
      expect(result).toHaveProperty('nextReview');
    });
  });

  describe('First Review (repetitions = 0)', () => {
    it('should set interval to 1 for quality >= 3', () => {
      const result = calculateSM2({
        quality: 3,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it('should reset repetitions for quality < 3', () => {
      const result = calculateSM2({
        quality: 2,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it('should work for quality = 0 (complete blackout)', () => {
      const result = calculateSM2({
        quality: 0,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it('should work for quality = 5 (perfect response)', () => {
      const result = calculateSM2({
        quality: 5,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });
  });

  describe('Second Review (repetitions = 1)', () => {
    it('should set interval to 6 for successful review', () => {
      const result = calculateSM2({
        quality: 3,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it('should reset on failed review', () => {
      const result = calculateSM2({
        quality: 1,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('Subsequent Reviews (repetitions >= 2)', () => {
    it('should multiply interval by ease factor', () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.interval).toBe(15);
      expect(result.repetitions).toBe(3);
    });

    it('should compound intervals correctly', () => {
      let result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.interval).toBe(15);

      result = calculateSM2({
        quality: 4,
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
      });
      expect(result.interval).toBe(38);

      result = calculateSM2({
        quality: 4,
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
      });
      expect(result.interval).toBe(95);
    });

    it('should round interval to integer', () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.33,
        interval: 6,
        repetitions: 2,
      });
      expect(Number.isInteger(result.interval)).toBe(true);
    });
  });

  describe('Ease Factor Calculation', () => {
    it('should increase ease factor for quality >= 3', () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBeGreaterThanOrEqual(2.5);
    });

    it('should decrease ease factor for quality < 3', () => {
      const result = calculateSM2({
        quality: 2,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBeLessThan(2.5);
    });

    it('should not go below 1.3', () => {
      const result = calculateSM2({
        quality: 0,
        easeFactor: 1.3,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('should have max ease factor around 2.5', () => {
      const result = calculateSM2({
        quality: 5,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBeLessThanOrEqual(2.6);
    });

    it('should round ease factor to 2 decimal places', () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      const decimalPlaces = (result.easeFactor.toString().split('.')[1] || '').length;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
    });
  });

  describe('Next Review Date', () => {
    it('should be a Date object', () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });
      expect(result.nextReview).toBeInstanceOf(Date);
    });

    it('should be in the future', () => {
      const before = Date.now();
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
      });
      expect(result.nextReview.getTime()).toBeGreaterThan(before);
    });

    it('should be approximately interval days in the future', () => {
      const interval = 5;
      const before = Date.now();
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 1,
      });
      
      const daysDiff = Math.round((result.nextReview.getTime() - before) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeGreaterThanOrEqual(interval - 1);
      expect(daysDiff).toBeLessThanOrEqual(interval + 1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle quality = 3 (correct with difficulty)', () => {
      const result = calculateSM2({
        quality: 3,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.interval).toBeGreaterThan(0);
      expect(result.repetitions).toBe(3);
    });

    it('should handle very low ease factor', () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 1.3,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(result.interval).toBeGreaterThan(0);
    });

    it('should handle maximum quality = 5', () => {
      const result = calculateSM2({
        quality: 5,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBeGreaterThan(2.5);
      expect(result.interval).toBeGreaterThan(6);
    });

    it('should handle minimum quality = 0', () => {
      const result = calculateSM2({
        quality: 0,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBeLessThan(2.5);
      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });
  });

  describe('SM2Result type', () => {
    it('should return correct SM2Result structure', () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 0,
        repetitions: 0,
      });

      const typedResult = result as SM2Result;
      expect(typeof typedResult.easeFactor).toBe('number');
      expect(typeof typedResult.interval).toBe('number');
      expect(typeof typedResult.repetitions).toBe('number');
      expect(typedResult.nextReview instanceof Date).toBe(true);
    });
  });
});

describe('SM-2 Performance', () => {
  it('should calculate quickly for single call', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: i,
        repetitions: i % 5,
      });
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
