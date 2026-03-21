export interface AiRequest {
  content: string;
  task: 'summarize' | 'qa' | 'flashcards' | 'study_plan' | 'extract_topics' | 'summarize_with_topics' | 'flashcards_with_topics' | 'learning_questions' | 'process_with_preferences' | 'buscar_temas_mep';
  context?: string;
}

export interface AiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export interface LearningPreferences {
  level: 'basico' | 'intermedio' | 'avanzado';
  style: 'practico' | 'teorico' | 'visual' | 'auditivo';
  examples: boolean;
  detail: 'breve' | 'moderado' | 'detallado';
}

export interface QuestionData {
  questions: Array<{
    id: string;
    question: string;
    options?: string[];
    type: 'single' | 'multiple' | 'text';
  }>;
}

export interface SummaryData {
  summary: string;
  keyPoints: string[];
  wordCount?: number;
}

export interface QAData {
  question: string;
  answer: string;
  confidence?: number;
}

export interface FlashcardData {
  flashcards: Array<{
    front: string;
    back: string;
    tags?: string[];
  }>;
}

export interface StudyPlanData {
  plan: Array<{
    topic: string;
    duration: string;
    activities: string[];
  }>;
  tips?: string[];
}

export interface TopicsData {
  topics: string[];
}
