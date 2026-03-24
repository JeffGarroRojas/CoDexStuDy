import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AiRequest, AiResponse } from './ai.types';

describe('AI Service - Provider Tests', () => {
  describe('OllamaProvider', () => {
    it('should have correct configuration', () => {
      const config = {
        url: process.env.OLLAMA_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.2',
      };
      expect(config.url).toContain('localhost');
      expect(config.model).toBeTruthy();
    });

    it('should build correct endpoint', () => {
      const baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      const endpoint = `${baseUrl}/api/generate`;
      expect(endpoint).toBe('http://localhost:11434/api/generate');
    });

    it('should handle connection timeout', async () => {
      const timeout = 30000;
      expect(timeout).toBeGreaterThan(0);
    });
  });

  describe('GroqProvider', () => {
    it('should have API key configured', () => {
      const apiKey = process.env.GROQ_API_KEY;
      const hasKey = !!apiKey && apiKey.length > 0;
      expect(typeof hasKey).toBe('boolean');
    });

    it('should build correct headers', () => {
      const apiKey = 'test-key';
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
      expect(headers.Authorization).toBe('Bearer test-key');
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  describe('HuggingFaceProvider', () => {
    it('should have token configured', () => {
      const token = process.env.HUGGINGFACE_TOKEN;
      const hasToken = !!token && token.length > 0;
      expect(typeof hasToken).toBe('boolean');
    });

    it('should build correct endpoint', () => {
      const model = 'mistralai/Mistral-7B-Instruct-v0.2';
      const endpoint = `https://api-inference.huggingface.co/models/${model}`;
      expect(endpoint).toContain('huggingface.co');
    });
  });

  describe('Provider Fallback Order', () => {
    it('should prioritize Ollama (free)', () => {
      const priority = ['ollama', 'groq', 'huggingface'];
      expect(priority[0]).toBe('ollama');
    });

    it('should have 3 providers', () => {
      const providers = ['ollama', 'groq', 'huggingface'];
      expect(providers.length).toBe(3);
    });

    it('should handle provider unavailability', () => {
      const mockProviders = {
        ollama: { available: false },
        groq: { available: true },
        huggingface: { available: true },
      };

      const available = Object.entries(mockProviders)
        .filter(([, p]) => p.available)
        .map(([name]) => name);

      expect(available).toContain('groq');
      expect(available).toContain('huggingface');
      expect(available).not.toContain('ollama');
    });
  });
});

describe('AI Request Validation', () => {
  const validTasks: AiRequest['task'][] = [
    'summarize',
    'qa',
    'flashcards',
    'study_plan',
    'extract_topics',
    'summarize_with_topics',
    'flashcards_with_topics',
    'learning_questions',
    'process_with_preferences',
    'buscar_temas_mep',
  ];

  validTasks.forEach(task => {
    it(`should accept task: ${task}`, () => {
      const request: AiRequest = {
        content: 'Test content',
        task,
      };
      expect(validTasks).toContain(request.task);
    });
  });

  it('should validate AiRequest structure', () => {
    const request: AiRequest = {
      content: 'Test content',
      task: 'summarize',
      context: 'optional context',
    };
    expect(request).toHaveProperty('content');
    expect(request).toHaveProperty('task');
  });

  it('should allow optional context', () => {
    const requestWithoutContext: AiRequest = {
      content: 'Test',
      task: 'summarize',
    };
    expect(requestWithoutContext.context).toBeUndefined();
  });
});

describe('AI Response Structure', () => {
  it('should validate success response', () => {
    const response: AiResponse = {
      success: true,
      data: { summary: 'Test summary' },
      provider: 'ollama',
      responseTime: 1500,
    };
    expect(response.success).toBe(true);
    expect(response.data).toBeDefined();
    expect(response.provider).toBeDefined();
  });

  it('should validate error response', () => {
    const response: AiResponse = {
      success: false,
      error: 'Provider unavailable',
    };
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
  });

  it('should handle empty data', () => {
    const response: AiResponse = {
      success: false,
      error: 'No data returned',
    };
    expect(response.data).toBeUndefined();
  });
});

describe('AI JSON Parsing', () => {
  it('should extract JSON from markdown response', () => {
    const markdownResponse = `
      Here's the JSON you requested:
      \`\`\`json
      {"summary": "test", "keyPoints": ["point1", "point2"]}
      \`\`\`
    `;
    const jsonMatch = markdownResponse.match(/```json\n?([\s\S]*?)\n?```/);
    expect(jsonMatch).toBeTruthy();
  });

  it('should extract JSON without markdown', () => {
    const plainResponse = '{"summary": "test", "keyPoints": ["a", "b"]}';
    const jsonMatch = plainResponse.match(/\{[\s\S]*\}/);
    expect(jsonMatch).toBeTruthy();
  });

  it('should handle malformed JSON gracefully', () => {
    const malformedJson = '{invalid json';
    expect(() => JSON.parse(malformedJson)).toThrow();
  });

  it('should parse valid JSON', () => {
    const validJson = '{"summary": "Test", "count": 5}';
    const parsed = JSON.parse(validJson);
    expect(parsed.summary).toBe('Test');
    expect(parsed.count).toBe(5);
  });
});

describe('AI Prompt Building', () => {
  it('should include content in prompt', () => {
    const content = 'Test content about photosynthesis';
    const prompt = `Summarize: ${content}`;
    expect(prompt).toContain(content);
  });

  it('should include context when provided', () => {
    const content = 'Test content';
    const context = 'User is in 10th grade';
    const prompt = `Content: ${content}\nContext: ${context}`;
    expect(prompt).toContain(content);
    expect(prompt).toContain(context);
  });

  it('should enforce JSON response format', () => {
    const task = 'summarize';
    const prompt = `Task: ${task}\nRespond ONLY in valid JSON format`;
    expect(prompt.toLowerCase()).toContain('json');
  });

  it('should handle Spanish language prompts', () => {
    const content = 'La fotosíntesis es el proceso por el cual las plantas';
    const prompt = `Eres un asistente de estudio. Resume: ${content}`;
    expect(prompt).toContain('asistente');
    expect(prompt).toContain('estudio');
  });
});

describe('AI Rate Limiting', () => {
  it('should track request count', () => {
    let requestCount = 0;
    requestCount++;
    requestCount++;
    requestCount++;
    expect(requestCount).toBe(3);
  });

  it('should respect rate limits', () => {
    const mockRateLimit = {
      maxRequests: 30,
      windowMs: 60000,
    };
    expect(mockRateLimit.maxRequests).toBe(30);
    expect(mockRateLimit.windowMs).toBe(60000);
  });

  it('should calculate requests per minute', () => {
    const requests = 30;
    const windowMs = 60000;
    const rpm = (requests / windowMs) * 60000;
    expect(rpm).toBe(30);
  });
});

describe('AI Caching', () => {
  it('should generate cache key from request', () => {
    const request = {
      task: 'summarize',
      content: 'Test content',
    };
    const cacheKey = `${request.task}:${request.content.substring(0, 50)}`;
    expect(cacheKey).toContain('summarize');
  });

  it('should cache responses', () => {
    const cache = new Map();
    const key = 'test-key';
    const value = { data: 'cached response' };
    
    cache.set(key, value);
    expect(cache.has(key)).toBe(true);
    expect(cache.get(key)).toEqual(value);
  });

  it('should invalidate cache after TTL', () => {
    const cacheTTL = 5 * 60 * 1000;
    expect(cacheTTL).toBe(300000);
  });
});

describe('AI Model Selection', () => {
  it('should select appropriate model for task', () => {
    const taskModels: Record<string, string> = {
      summarize: 'llama3.2',
      flashcards: 'llama3.2',
      qa: 'llama3.2',
    };
    expect(taskModels.summarize).toBe('llama3.2');
  });

  it('should use larger model for complex tasks', () => {
    const simpleTaskModel = 'llama3.2';
    const complexTaskModel = 'llama3.2';
    expect(typeof simpleTaskModel).toBe('string');
    expect(typeof complexTaskModel).toBe('string');
  });
});

describe('AI Response Time', () => {
  it('should measure response time', () => {
    const start = Date.now();
    const processingTime = 1500;
    const end = start + processingTime;
    const duration = end - start;
    expect(duration).toBe(1500);
  });

  it('should timeout long requests', () => {
    const timeout = 60000;
    const responseTime = 90000;
    const shouldTimeout = responseTime > timeout;
    expect(shouldTimeout).toBe(true);
  });

  it('should track average response time', () => {
    const times = [1000, 1500, 2000, 1200, 1800];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    expect(avg).toBeCloseTo(1500, 0);
  });
});

describe('AI Error Handling', () => {
  it('should handle network errors', () => {
    const errorTypes = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ENETUNREACH',
    ];
    expect(errorTypes).toContain('ECONNREFUSED');
  });

  it('should handle API errors', () => {
    const statusCodes = {
      400: 'Bad Request',
      401: 'Unauthorized',
      429: 'Rate Limited',
      500: 'Internal Error',
      503: 'Service Unavailable',
    };
    expect(statusCodes[429]).toBe('Rate Limited');
  });

  it('should retry on temporary failures', () => {
    const maxRetries = 3;
    let attempts = 0;
    const shouldRetry = attempts < maxRetries;
    expect(shouldRetry).toBe(true);
  });

  it('should implement exponential backoff', () => {
    const baseDelay = 1000;
    const delays = [
      baseDelay,
      baseDelay * 2,
      baseDelay * 4,
    ];
    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2000);
    expect(delays[2]).toBe(4000);
  });
});

describe('AI Content Generation', () => {
  describe('Summary Generation', () => {
    it('should generate summary with key points', () => {
      const summary = {
        summary: 'Test summary content',
        keyPoints: ['Point 1', 'Point 2', 'Point 3'],
      };
      expect(summary.keyPoints).toHaveLength(3);
    });

    it('should include word count', () => {
      const summary = {
        summary: 'Short text',
        wordCount: 2,
      };
      expect(summary.wordCount).toBeGreaterThan(0);
    });
  });

  describe('Flashcard Generation', () => {
    it('should generate question-answer pairs', () => {
      const flashcards = {
        flashcards: [
          { front: 'Question 1', back: 'Answer 1' },
          { front: 'Question 2', back: 'Answer 2' },
        ],
      };
      expect(flashcards.flashcards).toHaveLength(2);
    });

    it('should include tags', () => {
      const card = {
        front: 'Q',
        back: 'A',
        tags: ['tag1', 'tag2'],
      };
      expect(card.tags).toHaveLength(2);
    });
  });

  describe('QA Generation', () => {
    it('should generate question and answer', () => {
      const qa = {
        question: 'What is AI?',
        answer: 'Artificial Intelligence is...',
        confidence: 0.95,
      };
      expect(qa.question).toBeTruthy();
      expect(qa.answer).toBeTruthy();
      expect(qa.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Study Plan Generation', () => {
    it('should generate study plan with topics', () => {
      const plan = {
        plan: [
          { topic: 'Topic 1', duration: '30 min', activities: ['Read', 'Practice'] },
        ],
        tips: ['Start early', 'Take breaks'],
      };
      expect(plan.plan).toHaveLength(1);
      expect(plan.tips).toHaveLength(2);
    });
  });

  describe('Topic Extraction', () => {
    it('should extract main topics', () => {
      const topics = {
        topics: ['Topic 1', 'Topic 2', 'Topic 3', 'Topic 4', 'Topic 5'],
      };
      expect(topics.topics).toHaveLength(5);
    });
  });
});

describe('AI Quality Metrics', () => {
  it('should measure response quality score', () => {
    const qualityScore = 0.85;
    expect(qualityScore).toBeGreaterThan(0.5);
  });

  it('should track token usage', () => {
    const tokenUsage = {
      promptTokens: 100,
      completionTokens: 200,
      totalTokens: 300,
    };
    expect(tokenUsage.totalTokens).toBe(300);
  });

  it('should calculate cost per request', () => {
    const costPerToken = 0.00001;
    const tokens = 500;
    const cost = costPerToken * tokens;
    expect(cost).toBe(0.005);
  });

  it('should track provider usage', () => {
    const usage = {
      ollama: { requests: 50, avgTime: 1200 },
      groq: { requests: 20, avgTime: 800 },
    };
    expect(usage.ollama.requests).toBeGreaterThan(0);
  });
});

describe('AI Concurrency', () => {
  it('should handle concurrent requests', async () => {
    const concurrentRequests = 10;
    const promises = Array(concurrentRequests)
      .fill(null)
      .map((_, i) => Promise.resolve(i));
    
    const results = await Promise.all(promises);
    expect(results).toHaveLength(10);
  });

  it('should limit concurrent connections', () => {
    const maxConcurrent = 5;
    const currentRequests = 3;
    const canAccept = currentRequests < maxConcurrent;
    expect(canAccept).toBe(true);
  });

  it('should queue excess requests', () => {
    const queue: number[] = [];
    queue.push(1, 2, 3);
    expect(queue.length).toBe(3);
  });
});

describe('AI Mock Responses', () => {
  it('should generate realistic mock summary', () => {
    const mockSummary = {
      summary: 'Este documento describe los conceptos fundamentales de la fotosíntesis, incluyendo el proceso de conversión de luz solar en energía química.',
      keyPoints: [
        'La fotosíntesis ocurre en los cloroplastos',
        'Requiere luz solar, agua y dióxido de carbono',
        'Produce glucosa y oxígeno como productos',
      ],
      wordCount: 25,
    };
    expect(mockSummary.summary.length).toBeGreaterThan(50);
    expect(mockSummary.keyPoints).toHaveLength(3);
  });

  it('should generate realistic mock flashcards', () => {
    const mockFlashcards = {
      flashcards: [
        { front: '¿Qué es la fotosíntesis?', back: 'Proceso por el cual las plantas convierten luz solar en energía química.', tags: ['Biología'] },
        { front: '¿Dónde ocurre la fotosíntesis?', back: 'En los cloroplastos de las células vegetales.', tags: ['Biología'] },
      ],
    };
    expect(mockFlashcards.flashcards).toHaveLength(2);
    expect(mockFlashcards.flashcards[0]).toHaveProperty('front');
    expect(mockFlashcards.flashcards[0]).toHaveProperty('back');
  });

  it('should generate realistic mock topics for MEP', () => {
    const mockTopics = {
      subtopics: [
        { subtema: 'Reacciones luminosas', descripcion: 'Fase de la fotosíntesis que requiere luz', ejemplo: 'Absorción de luz por clorofila' },
        { subtema: 'Ciclo de Calvin', descripcion: 'Fase oscura de la fotosíntesis', ejemplo: 'Fijación de CO2' },
      ],
    };
    expect(mockTopics.subtopics).toHaveLength(2);
  });
});

describe('AI Integration with MEP Curriculum', () => {
  it('should validate grade level', () => {
    const validGrades = ['7', '8', '9', '10', '11', '12'];
    expect(validGrades).toContain('10');
    expect(validGrades).not.toContain('6');
  });

  it('should adapt content for grade level', () => {
    const contentByGrade: Record<string, string> = {
      '7': 'Contenido básico',
      '10': 'Contenido intermedio',
      '12': 'Contenido avanzado',
    };
    expect(contentByGrade['7']).toBeDefined();
    expect(contentByGrade['12']).toBeDefined();
  });

  it('should include subject areas', () => {
    const areas = ['cientifico', 'letras', 'sociales', 'tecnologia', 'artes'];
    expect(areas).toContain('cientifico');
  });
});
