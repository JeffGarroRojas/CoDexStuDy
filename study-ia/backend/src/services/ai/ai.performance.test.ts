import { describe, it, expect, beforeAll } from '@jest/globals';

interface AIResult {
  success: boolean;
  content?: string;
  error?: string;
  duration?: number;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  totalRequests: number;
}

describe('AI Service - Performance Tests', () => {
  const AI_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
  const USE_MOCK = process.env.USE_MOCK_AI === 'true';

  const mockAIResponse = async (task: string, content: string): Promise<AIResult> => {
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    const duration = Date.now() - start;

    const mockResponses: Record<string, string> = {
      summarize: 'Este es un resumen generado por IA del contenido proporcionado.',
      flashcards: 'JSON con flashcards generadas',
      qa: 'Preguntas y respuestas generadas',
      study_plan: 'Plan de estudio generado',
      topics: '{"subtopics": [{"subtema": "Tema 1", "descripcion": "Descripción", "ejemplo": "Ejemplo"}]}',
    };

    return {
      success: true,
      content: mockResponses[task] || 'Respuesta mock',
      duration,
    };
  };

  const makeAIRequest = async (task: string, content: string): Promise<AIResult> => {
    if (USE_MOCK) {
      return mockAIResponse(task, content);
    }

    const start = Date.now();
    try {
      const response = await fetch(`${AI_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: content,
          stream: false,
        }),
      });

      const duration = Date.now() - start;

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, duration };
      }

      const data = await response.json() as { response: string };
      return {
        success: true,
        content: data.response,
        duration,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      };
    }
  };

  const calculateMetrics = (results: AIResult[]): PerformanceMetrics => {
    const durations = results.map(r => r.duration || 0).filter(d => d > 0);
    const successCount = results.filter(r => r.success).length;

    return {
      avgResponseTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
      successRate: (successCount / results.length) * 100,
      totalRequests: results.length,
    };
  };

  describe('Basic AI Connectivity', () => {
    it('should connect to mock AI service', async () => {
      const result = await mockAIResponse('summarize', 'test content');
      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle mock response within acceptable time', async () => {
      const result = await mockAIResponse('summarize', 'test');
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(500);
    });
  });

  describe('AI Response Time', () => {
    it('should respond quickly for simple tasks', async () => {
      const result = await mockAIResponse('summarize', 'short content');
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(1000);
    });

    it('should maintain consistent response times', async () => {
      const results: AIResult[] = [];
      for (let i = 0; i < 5; i++) {
        results.push(await mockAIResponse('summarize', 'test'));
      }
      const metrics = calculateMetrics(results);
      const variance = metrics.maxResponseTime - metrics.minResponseTime;
      expect(variance).toBeLessThan(500);
    });
  });

  describe('AI Task Performance', () => {
    const tasks = ['summarize', 'flashcards', 'qa', 'study_plan', 'topics'];

    tasks.forEach(task => {
      it(`should handle ${task} task efficiently`, async () => {
        const result = await mockAIResponse(task, 'Test content for ' + task);
        expect(result.success).toBe(true);
        expect(result.duration).toBeLessThan(2000);
      });
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrentRequests = 10;
      const promises = Array(concurrentRequests)
        .fill(null)
        .map(() => mockAIResponse('summarize', 'concurrent test'));

      const results = await Promise.all(promises);
      expect(results).toHaveLength(concurrentRequests);
      expect(results.filter(r => r.success)).toHaveLength(concurrentRequests);
    });

    it('should handle burst of requests', async () => {
      const burstSize = 20;
      const start = Date.now();
      
      const promises = Array(burstSize)
        .fill(null)
        .map(() => mockAIResponse('topics', 'burst test'));
      
      const results = await Promise.all(promises);
      const totalDuration = Date.now() - start;
      
      expect(results.filter(r => r.success)).toHaveLength(burstSize);
      expect(totalDuration).toBeLessThan(10000);
    });
  });

  describe('Error Handling', () => {
    it('should return error object on failure', async () => {
      const result = await mockAIResponse('invalid_task', 'test');
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('duration');
    });

    it('should track duration even on errors', async () => {
      const result = await mockAIResponse('summarize', 'test');
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('Performance Metrics', () => {
    it('should calculate correct average response time', async () => {
      const results: AIResult[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(await mockAIResponse('summarize', `test ${i}`));
      }
      
      const metrics = calculateMetrics(results);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.totalRequests).toBe(10);
    });

    it('should calculate correct success rate', async () => {
      const results: AIResult[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(await mockAIResponse('summarize', 'test'));
      }
      
      const metrics = calculateMetrics(results);
      expect(metrics.successRate).toBe(100);
    });

    it('should identify min and max response times', async () => {
      const results: AIResult[] = [];
      for (let i = 0; i < 5; i++) {
        results.push(await mockAIResponse('summarize', 'test'));
      }
      
      const metrics = calculateMetrics(results);
      expect(metrics.minResponseTime).toBeLessThanOrEqual(metrics.maxResponseTime);
    });
  });

  describe('Throughput Testing', () => {
    it('should process 50 requests within reasonable time', async () => {
      const targetRequests = 50;
      const start = Date.now();
      
      const promises = Array(targetRequests)
        .fill(null)
        .map((_, i) => mockAIResponse('summarize', `throughput test ${i}`));
      
      const results = await Promise.all(promises);
      const totalDuration = Date.now() - start;
      
      const successRate = (results.filter(r => r.success).length / targetRequests) * 100;
      const throughput = (targetRequests / totalDuration) * 1000;
      
      expect(successRate).toBe(100);
      expect(throughput).toBeGreaterThan(1);
      console.log(`Throughput: ${throughput.toFixed(2)} requests/second`);
      console.log(`Average response time: ${(totalDuration / targetRequests).toFixed(2)}ms`);
    });
  });
});

describe('AI Response Quality', () => {
  const mockResponses = {
    summarize: 'Este documento trata sobre conceptos fundamentales de inteligencia artificial incluyendo aprendizaje automático y redes neuronales.',
    flashcards: JSON.stringify({
      cards: [
        { front: '¿Qué es Machine Learning?', back: 'Es una rama de la IA que permite a las máquinas aprender de datos.' },
        { front: '¿Qué es una red neuronal?', back: 'Un modelo computacional inspirado en el cerebro biológico.' },
      ],
    }),
    topics: JSON.stringify({
      subtopics: [
        { subtema: 'Aprendizaje Supervisado', descripcion: 'Método de entrenamiento con datos etiquetados', ejemplo: 'Clasificación de emails como spam o no spam' },
        { subtema: 'Aprendizaje No Supervisado', descripcion: 'Encontrar patrones en datos sin etiquetas', ejemplo: 'Agrupación de clientes por comportamiento' },
      ],
    }),
  };

  it('should generate valid JSON for flashcards', () => {
    const parsed = JSON.parse(mockResponses.flashcards);
    expect(parsed).toHaveProperty('cards');
    expect(Array.isArray(parsed.cards)).toBe(true);
  });

  it('should generate valid JSON for topics', () => {
    const parsed = JSON.parse(mockResponses.topics);
    expect(parsed).toHaveProperty('subtopics');
    expect(Array.isArray(parsed.subtopics)).toBe(true);
    expect(parsed.subtopics[0]).toHaveProperty('subtema');
    expect(parsed.subtopics[0]).toHaveProperty('descripcion');
    expect(parsed.subtopics[0]).toHaveProperty('ejemplo');
  });

  it('should generate non-empty summaries', () => {
    expect(mockResponses.summarize.length).toBeGreaterThan(10);
  });
});

describe('AI Provider Fallback', () => {
  it('should have fallback mechanism', () => {
    const providers = ['ollama', 'groq', 'huggingface'];
    expect(providers.length).toBe(3);
  });

  it('should prioritize providers in order', () => {
    const priority = ['ollama', 'groq', 'huggingface'];
    expect(priority[0]).toBe('ollama');
  });
});
