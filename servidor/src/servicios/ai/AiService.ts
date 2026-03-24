import { AiRequest, AiResponse } from './ai.types';
import OllamaProvider from './providers/OllamaProvider';
import GroqProvider from './providers/GroqProvider';
import HuggingFaceProvider from './providers/HuggingFaceProvider';

type ProviderType = 'ollama' | 'groq' | 'huggingface';

interface ProviderStatus {
  name: ProviderType;
  available: boolean;
  priority: number;
  responseTime?: number;
}

interface ProviderResult {
  success: boolean;
  data?: any;
  provider: ProviderType;
  error?: string;
}

class AiService {
  private providers: Map<ProviderType, any>;
  private providerOrder: ProviderType[];

  constructor() {
    this.providers = new Map();
    this.providers.set('ollama', new OllamaProvider());
    this.providers.set('groq', new GroqProvider());
    this.providers.set('huggingface', new HuggingFaceProvider());

    this.providerOrder = ['ollama', 'groq', 'huggingface'];
  }

  async checkProvidersStatus(): Promise<ProviderStatus[]> {
    const status: ProviderStatus[] = [];

    for (const [name, provider] of this.providers) {
      const start = Date.now();
      const available = await provider.isAvailable().catch(() => false);
      const responseTime = Date.now() - start;

      status.push({
        name,
        available,
        priority: this.providerOrder.indexOf(name),
        responseTime,
      });
    }

    return status.sort((a, b) => a.priority - b.priority);
  }

  private async tryProvider(providerName: ProviderType, prompt: string): Promise<ProviderResult> {
    const provider = this.providers.get(providerName);
    if (!provider) return { success: false, provider: providerName, error: 'Provider not found' };

    try {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        return { success: false, provider: providerName, error: 'Provider not available' };
      }

      const startTime = Date.now();
      const response = await provider.generate(prompt);
      const duration = Date.now() - startTime;

      if (response) {
        return { success: true, provider: providerName, data: response };
      }

      return { success: false, provider: providerName, error: 'Empty response' };
    } catch (error: any) {
      return { success: false, provider: providerName, error: error.message };
    }
  }

  private buildPrompt(task: AiRequest): string {
    switch (task.task) {
      case 'summarize':
        return `Eres un asistente de estudio experto y analítico. Tu tarea es procesar el texto proveído y extraer una síntesis estructurada, profunda y absolutamente completa sin ser perezoso.
        
Para textos extensos, NO omitas detalles cruciales. Estructura el resumen de la siguiente forma:
1. Una introducción clara sobre el propósito del texto.
2. Desarrollo detallado de los conceptos principales (sin escatimar extensión).
3. Una conclusión lógica con el cierre del conocimiento.

Texto: ${task.content}

Responde SOLO en formato JSON válido (sin markdown de json ni caracteres extra) con el siguiente contrato estricto:
{"summary": "resumen extenso y bien hilado como se solicitó", "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3", "punto clave 4", "punto clave 5"], "wordCount": número}`;

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

      case 'learning_questions':
        return `Eres un asistente de estudio. Basándote en los temas que el usuario va a estudiar, genera 4-5 preguntas para entender su nivel y preferencias de aprendizaje.

Temas del usuario: ${task.content}

Responde SOLO en formato JSON válido con preguntas que ayudan a personalizar la enseñanza:
{"questions": [
  {"id": "nivel", "question": "¿Cuál es tu nivel de conocimiento sobre estos temas?", "options": ["Principiante (nunca he estudiado esto)", "Intermedio (conozco lo básico)", "Avanzado (tengo experiencia)"], "type": "single"},
  {"id": "estilo", "question": "¿Cómo prefieres aprender?", "options": ["Con ejemplos prácticos", "Con teoría detallada", "Con diagramas y visuales", "Con analogías"], "type": "single"},
  {"id": "ejemplos", "question": "¿Quieres muchos ejemplos?", "options": ["Sí, muchos ejemplos reales", "Solo algunos ejemplos", "Prefiero explicaciones directas"], "type": "single"},
  {"id": "detalle", "question": "¿Qué nivel de detalle prefieres?", "options": ["Breve y conciso", "Equilibrado", "Muy detallado"], "type": "single"},
  {"id": "objetivo", "question": "¿Cuál es tu objetivo principal?", "type": "text"}
]}`;

      case 'process_with_preferences':
        return `Eres un asistente de estudio especializado. Genera contenido educativo personalizado basado en las preferencias del usuario.

TEMAS: ${task.content}

PREFERENCIAS DEL USUARIO:
- Nivel: ${task.context}

Genera contenido adaptado a estas preferencias. Si es principiante, explica conceptos básicos primero.
Si quiere ejemplos, incluye muchos ejemplos prácticos.
Si quiere detalle, sé exhaustivo.

Responde SOLO en formato JSON válido:
{"summary": "resumen explicado según el nivel del usuario", "keyPoints": ["puntos clave con ejemplos"], "explanation": "explicación clara adaptada"}`;

      case 'buscar_temas_mep':
      case 'recomendar_metodo':
        return task.content;

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
      return {
        summary: response,
        keyPoints: [],
        wordCount: 0,
        raw: true
      };
    } catch (error) {
      console.error('JSON parse error fallido (Graceful Degradation Aplicada):', error);
      return {
        summary: response || "El modelo no смог generar una respuesta estructurada.",
        keyPoints: [],
        wordCount: 0,
        raw: true
      };
    }
  }

  // Helper Anti-429: Estrategia de Fragmentación Inteligente RAG
  public splitIntoChunks(text: string, maxTokens: number = 2500): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    const sentences = text.split(/(?<=[.?!])\s+/);

    for (const sentence of sentences) {
      if ((currentChunk.length + sentence.length) > (maxTokens * 4)) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence + ' ';
      } else {
        currentChunk += sentence + ' ';
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    return chunks;
  }

  // Interfaz Lógica pgvector (Memoria a Largo Plazo CoDDy RAG)
  async findSimilarContext(documentId: string, embedding: number[], limit: number = 3): Promise<string[]> {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Búsqueda de Similitud Coseno (<=>) nativa en Vector DB
      const result: any[] = await prisma.$queryRaw`
        SELECT "content", 1 - ("embedding" <=> ${embedding}::vector) as similarity
        FROM "vector_memories"
        WHERE "documentId" = ${documentId}
        ORDER BY "embedding" <=> ${embedding}::vector
        LIMIT ${limit};
      `;
      return result.map(row => row.content);
    } catch (error) {
      console.error('Error recuperando embeddings vectoriales RAG:', error);
      return [];
    }
  }

  async process(task: AiRequest): Promise<AiResponse> {
    const prompt = this.buildPrompt(task);

    for (const providerName of this.providerOrder) {
      const result = await this.tryProvider(providerName, prompt);

      if (result.success && result.data) {
        if (task.task === 'chat_response' || task.task === 'buscar_temas_mep' || task.task === 'recomendar_metodo') {
          return { success: true, data: result.data, provider: result.provider };
        }
        const data = this.parseJsonResponse(result.data);
        return { success: true, data, provider: result.provider };
      }
    }

    return {
      success: false,
      error: 'No hay proveedores de IA disponibles. Verifica la configuración.',
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

  async generateLearningQuestions(topics: string[]): Promise<AiResponse> {
    return this.process({ content: topics.join(', '), task: 'learning_questions' });
  }

  async processWithPreferences(topics: string[], preferences: string, content: string): Promise<AiResponse> {
    return this.process({
      content: topics.join(', '),
      task: 'process_with_preferences',
      context: preferences
    });
  }

  async generateFullContent(topics: string[], preferences: string, content: string): Promise<AiResponse> {
    const prompt = `Eres un asistente de estudio especializado en MAXIMIZAR el aprendizaje.

TEMAS: ${topics.join(', ')}

PREFERENCIAS DEL USUARIO: ${preferences}

INSTRUCCIONES: Genera contenido COMPLETO y EXHAUSTIVO para estos temas.

Debes incluir:
1. RESUMEN COMPLETO
2. PUNTOS CLAVE
3. EXPLICACIÓN DETALLADA
4. ANALOGÍAS
5. EJEMPLOS PRÁCTICOS
6. FLASHCARDS (mínimo 10)
7. PREGUNTAS FRECUENTES (5)
8. TIPS DE ESTUDIO
9. AUTOEXAMEN

Contenido original: ${content.substring(0, 10000)}

Responde SOLO en formato JSON válido:
{
  "summary": "resumen completo",
  "explanation": "explicación clara",
  "keyPoints": ["punto 1", "punto 2", "punto 3"],
  "analogies": ["analogía 1", "analogía 2"],
  "examples": ["ejemplo 1", "ejemplo 2"],
  "flashcards": [{"front": "pregunta", "back": "respuesta", "tags": ["tag"]}],
  "faq": [{"question": "pregunta", "answer": "respuesta"}],
  "tips": ["consejo 1", "consejo 2"],
  "selfTest": [{"question": "pregunta", "answer": "respuesta"}]
}`;

    return this.process({ content: prompt, task: 'summarize' });
  }
}

export const aiService = new AiService();
export default aiService;