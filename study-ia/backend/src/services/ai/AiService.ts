import { AiRequest, AiResponse } from './ai.types';
import OllamaProvider from './providers/OllamaProvider';
import GroqProvider from './providers/GroqProvider';
import HuggingFaceProvider from './providers/HuggingFaceProvider';

type ProviderType = 'ollama' | 'groq' | 'huggingface';

interface ProviderStatus {
  name: ProviderType;
  available: boolean;
  priority: number;
}

class AiService {
  private providers: Map<ProviderType, any> = new Map();
  private activeProvider: ProviderType;
  private fallbackProvider: ProviderType;

  constructor() {
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('groq', new GroqProvider());
    this.providers.set('huggingface', new HuggingFaceProvider());
    
    this.activeProvider = (process.env.AI_PROVIDER as ProviderType) || 'ollama';
    this.fallbackProvider = 'ollama';
  }

  async checkProvidersStatus(): Promise<ProviderStatus[]> {
    const status: ProviderStatus[] = [];

    for (const [name, provider] of this.providers) {
      const available = await provider.isAvailable();
      status.push({
        name,
        available,
        priority: name === this.activeProvider ? 0 : 1,
      });
    }

    return status.sort((a, b) => a.priority - b.priority);
  }

  private buildPrompt(task: AiRequest): string {
    switch (task.task) {
      case 'summarize':
        return `Eres un asistente de estudio especializado. Resume el siguiente texto de manera clara y concisa.
        
Texto: ${task.content}

Responde SOLO en formato JSON válido (sin markdown, sin código, solo el objeto JSON):
{"summary": "resumen en 2-3 párrafos", "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"], "wordCount": número}`;

      case 'qa':
        return `Eres un asistente de estudio. Basado en el contenido, genera una pregunta útil para aprender y su respuesta.
        
Contenido: ${task.content}
${task.context ? `Contexto: ${task.context}` : ''}

Responde SOLO en formato JSON válido:
{"question": "pregunta clara", "answer": "respuesta completa", "confidence": 0.95}`;

      case 'flashcards':
        return `Eres un asistente de estudio. Crea flashcards (tarjetas de estudio) basadas en el contenido.
        
Contenido: ${task.content}

Responde SOLO en formato JSON válido:
{"flashcards": [{"front": "pregunta", "back": "respuesta", "tags": ["tag1"]}]}`;

      case 'study_plan':
        return `Eres un asistente de estudio. Crea un plan de estudio efectivo basado en el contenido.
        
Contenido: ${task.content}
${task.context ? `Tiempo disponible: ${task.context}` : ''}

Responde SOLO en formato JSON válido:
{"plan": [{"topic": "tema", "duration": "30 min", "activities": ["actividad"]}], "tips": ["consejo"]}`;

      case 'extract_topics':
        return `Analiza el siguiente texto y extrae los TEMAS PRINCIPALES o SUBTEMAS que coversa. 
Devuelve SOLO los nombres de los temas sin descripciones, en una lista simple.

Texto: ${task.content}

Responde SOLO en formato JSON válido:
{"topics": ["tema 1", "tema 2", "tema 3", "tema 4", "tema 5"]}

Sé específico y usa nombres de temas cortos y claros (máximo 4-6 palabras por tema).`;

      case 'summarize_with_topics':
        return `Eres un asistente de estudio especializado. Basándote en los temas validados y el contenido, genera un resumen estructurado.
        
Temas validados: ${task.context}
Contenido: ${task.content}

Responde SOLO en formato JSON válido:
{"summary": "resumen en 2-3 párrafos", "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"]}`;

      case 'flashcards_with_topics':
        return `Eres un asistente de estudio. Crea flashcards basadas en los temas y contenido proporcionados.
        
Temas validados: ${task.context}
Contenido: ${task.content}

Responde SOLO en formato JSON válido:
{"flashcards": [{"front": "pregunta sobre tema", "back": "respuesta", "tags": ["nombre del tema"]}]}`;

      default:
        return task.content;
    }
  }

  private parseJsonResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('JSON parse error:', error);
      return { raw: response };
    }
  }

  async process(task: AiRequest): Promise<AiResponse> {
    const prompt = this.buildPrompt(task);
    const errors: string[] = [];

    const providerOrder: ProviderType[] = [this.activeProvider, 'ollama', 'groq', 'huggingface'];
    const usedProviders = new Set<ProviderType>();

    for (const providerName of providerOrder) {
      if (usedProviders.has(providerName)) continue;
      usedProviders.add(providerName);

      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        const isAvailable = await provider.isAvailable();
        if (!isAvailable) {
          errors.push(`${providerName}: not configured`);
          continue;
        }

        const response = await provider.generate(prompt);
        const data = this.parseJsonResponse(response);

        return {
          success: true,
          data,
        };
      } catch (error: any) {
        errors.push(`${providerName}: ${error.message}`);
        console.warn(`Provider ${providerName} failed, trying next...`);
      }
    }

    return {
      success: false,
      error: `All providers failed: ${errors.join('; ')}`,
    };
  }

  async summarize(content: string): Promise<AiResponse> {
    return this.process({ content, task: 'summarize' });
  }

  async generateQA(content: string, context?: string): Promise<AiResponse> {
    return this.process({ content, task: 'qa', context });
  }

  async generateFlashcards(content: string): Promise<AiResponse> {
    return this.process({ content, task: 'flashcards' });
  }

  async generateStudyPlan(content: string, timeAvailable?: string): Promise<AiResponse> {
    return this.process({ content, task: 'study_plan', context: timeAvailable });
  }

  async extractTopics(content: string): Promise<AiResponse> {
    return this.process({ content, task: 'extract_topics' });
  }

  async summarizeWithTopics(topics: string[], content: string): Promise<AiResponse> {
    return this.process({ content, task: 'summarize_with_topics', context: topics.join(', ') });
  }

  async generateFlashcardsWithTopics(topics: string[], content: string): Promise<AiResponse> {
    return this.process({ content, task: 'flashcards_with_topics', context: topics.join(', ') });
  }
}

export const aiService = new AiService();
export default aiService;
