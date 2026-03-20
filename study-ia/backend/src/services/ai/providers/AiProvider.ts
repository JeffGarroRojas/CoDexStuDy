import { Request, Response, NextFunction } from 'express';

export interface AiRequest {
  content: string;
  task: 'summarize' | 'qa' | 'flashcards' | 'study_plan';
  context?: string;
}

export interface AiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  wordCount: number;
}

export interface QAResponse {
  question: string;
  answer: string;
  confidence: number;
}

export interface FlashcardResponse {
  front: string;
  back: string;
  tags: string[];
}

abstract class AiProvider {
  abstract generate(prompt: string): Promise<string>;
  
  protected buildPrompt(task: AiRequest): string {
    switch (task.task) {
      case 'summarize':
        return `Eres un asistente de estudio. Resume el siguiente texto de manera clara y concisa.
        
Texto: ${task.content}

Responde en JSON con este formato:
{
  "summary": "resumen en 2-3 párrafos",
  "keyPoints": ["punto clave 1", "punto clave 2", "punto clave 3"],
  "wordCount": número de palabras del resumen
}`;

      case 'qa':
        return `Eres un asistente de estudio. Genera una pregunta y respuesta basada en el siguiente contenido.
        
Contenido: ${task.content}
${task.context ? `Contexto adicional: ${task.context}` : ''}

Responde en JSON:
{
  "question": "pregunta clara y específica",
  "answer": "respuesta completa y precisa",
  "confidence": 0.0-1.0
}`;

      case 'flashcards':
        return `Eres un asistente de estudio. Crea flashcards (tarjetas de estudio) basadas en el contenido.
        
Contenido: ${task.content}

Responde en JSON:
{
  "flashcards": [
    {"front": "pregunta/término", "back": "respuesta/definición", "tags": ["tag1", "tag2"]}
  ]
}`;

      case 'study_plan':
        return `Eres un asistente de estudio. Crea un plan de estudio basado en el contenido.
        
Contenido: ${task.content}
${task.context ? `Tiempo disponible: ${task.context}` : ''}

Responde en JSON:
{
  "plan": [
    {"topic": "tema", "duration": "30 min", "activities": ["actividad1", "actividad2"]}
  ],
  "tips": ["consejo1", "consejo2"]
}`;

      default:
        return task.content;
    }
  }
}

export default AiProvider;
