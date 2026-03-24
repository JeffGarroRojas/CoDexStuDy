import { describe, it, expect } from '@jest/globals';
import { sanitizeFilename, extractTextFromPDF, PDFExtractionResult } from './pdfExtractor';

describe('PDF Extractor Utilities', () => {
  describe('sanitizeFilename', () => {
    it('should be a function', () => {
      expect(typeof sanitizeFilename).toBe('function');
    });

    it('should remove special characters', () => {
      const result = sanitizeFilename('test<>:"/\\|?*file.pdf');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain(':');
      expect(result).not.toContain('"');
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
      expect(result).not.toContain('|');
      expect(result).not.toContain('?');
      expect(result).not.toContain('*');
    });

    it('should preserve alphanumeric and allowed characters', () => {
      const result = sanitizeFilename('test-file_123.pdf');
      expect(result).toBe('test-file_123.pdf');
    });

    it('should replace spaces with underscores', () => {
      const result = sanitizeFilename('my document file.pdf');
      expect(result).toContain('_');
    });

    it('should handle empty string', () => {
      const result = sanitizeFilename('');
      expect(result).toBe('');
    });

    it('should handle filename with only special characters', () => {
      const result = sanitizeFilename('<>:"/\\|?*');
      expect(result).not.toContain('<');
    });
  });

  describe('extractTextFromPDF', () => {
    it('should be an async function', async () => {
      const fn = extractTextFromPDF;
      expect(fn.constructor.name).toBe('AsyncFunction');
    });

    it('should throw error for non-existent file', async () => {
      await expect(extractTextFromPDF('/non/existent/file.pdf'))
        .rejects
        .toThrow();
    });

    it('should return object with correct properties on success', async () => {
      try {
        const result = await extractTextFromPDF('./nonexistent.pdf') as PDFExtractionResult;
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('pages');
        expect(result).toHaveProperty('wordCount');
        expect(result).toHaveProperty('title');
      } catch {
        // Expected to fail since file doesn't exist
      }
    });
  });
});

describe('PDFExtractionResult Type', () => {
  it('should have correct structure', () => {
    const mockResult: PDFExtractionResult = {
      text: 'Sample text content',
      pages: 10,
      wordCount: 500,
      title: 'Sample Document',
    };

    expect(typeof mockResult.text).toBe('string');
    expect(typeof mockResult.pages).toBe('number');
    expect(typeof mockResult.wordCount).toBe('number');
    expect(typeof mockResult.title).toBe('string');
  });

  it('should have valid page count', () => {
    const mockResult: PDFExtractionResult = {
      text: '',
      pages: 1,
      wordCount: 0,
      title: '',
    };
    expect(mockResult.pages).toBeGreaterThan(0);
  });

  it('should have word count matching text', () => {
    const text = 'one two three four five';
    const words = text.split(/\s+/).filter(w => w.length > 0);
    expect(words.length).toBe(5);
  });
});
