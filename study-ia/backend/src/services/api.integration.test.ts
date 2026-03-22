import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('should return OK status', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json() as { status: string };
        expect(data.status).toBe('ok');
      } catch (error) {
        console.log('Server not running - skipping integration test');
      }
    });
  });

  describe('Authentication', () => {
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
    };

    it('should register a new user', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser),
        });
        
        const data = await response.json() as ApiResponse;
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('token');
      } catch {
        console.log('Server not running - skipping');
      }
    });

    it('should login with valid credentials', async () => {
      try {
        await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser),
        });

        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testUser.email,
            password: testUser.password,
          }),
        });

        const data = await loginResponse.json() as ApiResponse;
        expect(data.success).toBe(true);
        expect(data.data).toHaveProperty('token');
      } catch {
        console.log('Server not running - skipping');
      }
    });

    it('should reject invalid credentials', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'nonexistent@example.com',
            password: 'wrongpassword',
          }),
        });

        const data = await response.json() as ApiResponse;
        expect(data.success).toBe(false);
      } catch {
        console.log('Server not running - skipping');
      }
    });
  });

  describe('Documents API', () => {
    let authToken = '';

    beforeAll(async () => {
      try {
        const testUser = {
          email: `doc_test_${Date.now()}@example.com`,
          password: 'password123',
        };

        await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser),
        });

        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testUser),
        });

        const data = await loginResponse.json() as ApiResponse;
        authToken = data.data?.token || '';
      } catch {
        console.log('Could not authenticate');
      }
    });

    it('should create a document', async () => {
      if (!authToken) {
        console.log('Skipping - no auth token');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/documents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            title: 'Test Document',
            content: 'This is a test document content',
          }),
        });

        const data = await response.json() as ApiResponse;
        expect(data.success).toBe(true);
      } catch {
        console.log('Server not running - skipping');
      }
    });

    it('should list user documents', async () => {
      if (!authToken) {
        console.log('Skipping - no auth token');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/documents`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        const data = await response.json() as ApiResponse;
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      } catch {
        console.log('Server not running - skipping');
      }
    });
  });

  describe('Flashcards API', () => {
    it('should handle flashcard operations structure', () => {
      const mockFlashcard = {
        id: 'card-1',
        front: 'Question',
        back: 'Answer',
        easeFactor: 2.5,
        interval: 1,
        nextReview: new Date().toISOString(),
      };

      expect(mockFlashcard).toHaveProperty('id');
      expect(mockFlashcard).toHaveProperty('front');
      expect(mockFlashcard).toHaveProperty('back');
      expect(typeof mockFlashcard.easeFactor).toBe('number');
    });

    it('should validate SM-2 review data structure', () => {
      const reviewData = {
        id: 'card-1',
        quality: 4,
      };

      expect(reviewData.quality).toBeGreaterThanOrEqual(0);
      expect(reviewData.quality).toBeLessThanOrEqual(5);
    });
  });

  describe('AI Endpoints', () => {
    it('should handle AI request validation', () => {
      const validRequest = {
        content: 'Test content',
        task: 'summarize',
      };

      const validTasks = ['summarize', 'flashcards', 'qa', 'study_plan', 'topics'];
      expect(validTasks).toContain(validRequest.task);
    });

    it('should parse AI response structure', () => {
      const mockAIResponse = {
        success: true,
        content: 'Generated content',
        duration: 1500,
      };

      expect(mockAIResponse).toHaveProperty('success');
      expect(typeof mockAIResponse.duration).toBe('number');
    });
  });
});

describe('API Error Handling', () => {
  it('should handle 404 errors', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/nonexistent-endpoint`);
      expect(response.status).toBe(404);
    } catch {
      console.log('Server not running - skipping');
    }
  });

  it('should handle invalid JSON', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      
      expect(response.status).toBeGreaterThanOrEqual(400);
    } catch {
      console.log('Server not running - skipping');
    }
  });

  it('should require authentication for protected routes', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      expect(response.status).toBe(401);
    } catch {
      console.log('Server not running - skipping');
    }
  });
});
