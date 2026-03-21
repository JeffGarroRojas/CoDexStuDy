import { AiRequest, AiResponse } from './ai.types';
import GroqProvider from './providers/GroqProvider';
import HuggingFaceProvider from './providers/HuggingFaceProvider';

type ProviderType = 'groq' | 'huggingface';

interface ProviderStatus {
  name: ProviderType;
  available: boolean;
  priority: number;
}

class AiService {
  private groqProvider: GroqProvider;
  private huggingFaceProvider: HuggingFaceProvider;

  constructor() {
    this.groqProvider = new GroqProvider();
    this.huggingFaceProvider = new HuggingFaceProvider();
  }

  async checkProvidersStatus(): Promise<ProviderStatus[]> {
    const status: ProviderStatus[] = [];

    const groqAvailable = await this.groqProvider.isAvailable();
    status.push({ name: 'groq', available: groqAvailable, priority: 0 });

    const hfAvailable = await this.huggingFaceProvider.isAvailable();
    status.push({ name: 'huggingface', available: hfAvailable, priority: 1 });

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
      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('JSON parse error:', error);
      return { raw: response };
    }
  }

  async process(task: AiRequest): Promise<AiResponse> {
    const prompt = this.buildPrompt(task);

    // Try Groq first (primary provider)
    try {
      const isAvailable = await this.groqProvider.isAvailable();
      if (isAvailable) {
        const response = await this.groqProvider.generate(prompt);
        const data = this.parseJsonResponse(response);
        return { success: true, data };
      }
    } catch (error: any) {
      console.warn('Groq failed:', error.message);
    }

    // Try HuggingFace as fallback
    try {
      const isAvailable = await this.huggingFaceProvider.isAvailable();
      if (isAvailable) {
        const response = await this.huggingFaceProvider.generate(prompt);
        const data = this.parseJsonResponse(response);
        return { success: true, data };
      }
    } catch (error: any) {
      console.warn('HuggingFace failed:', error.message);
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