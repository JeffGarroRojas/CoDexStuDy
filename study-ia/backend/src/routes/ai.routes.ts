import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/ai';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const buscarTemasSchema = z.object({
  tema: z.string().min(1, 'El tema es requerido'),
  grado: z.string().min(1, 'El grado es requerido'),
  area: z.string().optional(),
});

router.post('/buscar-temas', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = buscarTemasSchema.parse(req.body);
    
    const prompt = `Eres un asistente de estudio especializado en el currículo del MEP de Costa Rica.
El usuario está en ${data.grado}° grado y quiere estudiar "${data.tema}".
${data.area ? `Área: ${data.area}` : ''}

Genera una lista de 5-8 subtemas específicos que un estudiante de ${data.grado}° debería conocer sobre "${data.tema}".
Para cada subtema incluye:
1. Nombre del subtema
2. Breve descripción (1 línea)
3. Un ejemplo concreto apropiado para ${data.grado}° grado

Responde SOLO en formato JSON válido:
{
  "subtopics": [
    {"subtema": "nombre", "descripcion": "descripción", "ejemplo": "ejemplo concreto"}
  ]
}

IMPORTANTE: Todo debe ser apropiado para estudiantes de ${data.grado}° grado de colegio en Costa Rica. NO-Level universitario.`;

    const result = await aiService.process({ 
      content: prompt, 
      task: 'buscar_temas_mep' 
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error en buscar-temas:', error);
    res.status(500).json({
      success: false,
      error: 'Error al buscar temas',
    });
  }
});

router.use(authenticate);

const summarizeSchema = z.object({
  content: z.string().min(10, 'Content must be at least 10 characters'),
  documentId: z.string().uuid().optional(),
});

const qaSchema = z.object({
  content: z.string().min(10),
  context: z.string().optional(),
  documentId: z.string().uuid().optional(),
});

const flashcardsSchema = z.object({
  content: z.string().min(10),
  count: z.number().min(1).max(20).optional().default(5),
  documentId: z.string().uuid().optional(),
});

const studyPlanSchema = z.object({
  content: z.string().min(10),
  timeAvailable: z.string().optional(),
});

router.get('/providers', async (req: AuthRequest, res: Response) => {
  try {
    const status = await aiService.checkProvidersStatus();
    const activeProvider = 'groq';
    
    res.json({
      success: true,
      data: {
        providers: status,
        active: activeProvider,
      },
    });
  } catch (error) {
    throw error;
  }
});

router.post('/summarize', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = summarizeSchema.parse(req.body);
    
    const result = await aiService.summarize(data.content);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    if (data.documentId) {
      await prisma.document.update({
        where: { id: data.documentId },
        data: {
          summary: result.data?.summary,
          keyPoints: result.data?.keyPoints || [],
        },
      });
    }
    
    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    throw error;
  }
});

router.post('/qa', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = qaSchema.parse(req.body);
    
    const result = await aiService.generateQA(data.content, data.context);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    let qaRecord = null;
    if (data.documentId) {
      qaRecord = await prisma.qA.create({
        data: {
          userId: req.userId!,
          documentId: data.documentId,
          question: result.data?.question || '',
          answer: result.data?.answer || '',
          confidence: result.data?.confidence,
        },
      });
    }
    
    res.json({
      success: true,
      data: {
        ...result.data,
        id: qaRecord?.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    throw error;
  }
});

router.post('/flashcards', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = flashcardsSchema.parse(req.body);
    
    const result = await aiService.generateFlashcards(data.content);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    const flashcards = result.data?.flashcards || [];
    const count = Math.min(data.count, flashcards.length);
    
    const createdFlashcards = await Promise.all(
      flashcards.slice(0, count).map((card: any) =>
        prisma.flashcard.create({
          data: {
            userId: req.userId!,
            documentId: data.documentId,
            front: card.front,
            back: card.back,
            tags: card.tags || [],
          },
        })
      )
    );
    
    res.json({
      success: true,
      data: {
        flashcards: createdFlashcards,
        generated: flashcards.length,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    throw error;
  }
});

router.post('/study-plan', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = studyPlanSchema.parse(req.body);
    
    const result = await aiService.generateStudyPlan(data.content, data.timeAvailable);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }
    
    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    throw error;
  }
});

const chatSchema = z.object({
  message: z.string().min(1, 'El mensaje es requerido'),
  grado: z.string().optional(),
  area: z.string().optional(),
});

router.post('/chat', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = chatSchema.parse(req.body);
    
    const topic = data.area || 'educación general';
    const grade = data.grado || '12';
    
    const prompt = `Eres un asistente de estudio para estudiantes costarricenses. 
Estudiante: ${grade}° grado, área: ${topic}

INSTRUCCIONES IMPORTANTES:
1. Responde SIEMPRE en español de forma conversacional y amigable
2. Usa texto plano, NUNCA devuelvas JSON ni estructuras de datos
3. Mantén las respuestas cortas (2-4 oraciones máximo) excepto si el estudiante pide detalles
4. Si la pregunta no es sobre estudios, redirige amablemente: "Soy tu asistente de estudio. ¿Tienes alguna duda sobre tus materias?"
5. Da ejemplos prácticos apropiados para su nivel

Pregunta del estudiante: ${data.message}

Respuesta:`;

    const result = await aiService.process({
      content: prompt,
      task: 'chat_response'
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error al generar respuesta',
      });
    }
    
    let responseText = '';
    const resultData = result.data;
    
    if (typeof resultData === 'string') {
      responseText = resultData;
    } else if (typeof resultData === 'object' && resultData !== null) {
      responseText = resultData.text || resultData.response || resultData.message || 
                     resultData.respuesta || JSON.stringify(resultData);
    } else {
      responseText = String(resultData);
    }
    
    if (responseText.includes('{') && responseText.includes('}')) {
      const lines = responseText.split('\n');
      responseText = lines.filter(line => !line.includes('{') && !line.includes('}') && !line.includes('"'))
        .join(' ').trim();
    }
    
    if (!responseText || responseText.length < 5) {
      responseText = 'Entiendo tu pregunta. ¿Podrías reformularla o preguntarme sobre algún tema de estudio?';
    }
    
    res.json({
      success: true,
      data: {
        response: responseText,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error en chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar el mensaje',
    });
  }
});

const generarContenidoSchema = z.object({
  tema: z.string().min(1, 'El tema es requerido'),
  grado: z.string().min(1, 'El grado es requerido'),
  area: z.string().optional(),
});

router.post('/generar-contenido', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = generarContenidoSchema.parse(req.body);
    
    const prompt = `Eres un asistente de estudio para estudiantes de ${data.grado}° grado de Costa Rica.
Tema: "${data.tema}"
${data.area ? `Área: ${data.area}` : ''}

Genera contenido educativo completo:

1. Crea 5 flashcards (tarjetas de estudio) con pregunta en el frente y respuesta en el reverso
2. Crea un resumen de 2-3 párrafos sobre el tema
3. Lista 5 puntos clave importantes
4. Crea 3 preguntas de examen tipo quiz con 4 opciones cada una (indica cuál es correcta)

Responde SOLO en JSON válido con este formato:
{
  "flashcards": [
    {"front": "pregunta", "back": "respuesta"}
  ],
  "summary": "texto del resumen",
  "keyPoints": ["punto 1", "punto 2", "punto 3", "punto 4", "punto 5"],
  "questions": [
    {"question": "pregunta", "options": ["opcion1", "opcion2", "opcion3", "opcion4"], "correctAnswer": 0}
  ]
}`;

    const result = await aiService.process({
      content: prompt,
      task: 'generar_contenido'
    });
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error al generar contenido',
      });
    }
    
    res.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    console.error('Error en generar-contenido:', error);
    res.status(500).json({
      success: false,
      error: 'Error al generar contenido',
    });
  }
});

const recomendarMetodoSchema = z.object({
  tema: z.string().min(1, 'El tema es requerido'),
  grado: z.string().min(1, 'El grado es requerido'),
  area: z.string().optional(),
  materias: z.array(z.string()).optional(),
});

router.post('/recomendar-metodo', aiLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const data = recomendarMetodoSchema.parse(req.body);
    
    const prompt = `Eres un asesor de estudio inteligente. Analiza el siguiente perfil de estudiante y recomienda el mejor método de estudio.

PERFIL DEL ESTUDIANTE:
- Tema que quiere estudiar: "${data.tema}"
- Grado: ${data.grado}° año de colegio en Costa Rica
- Área: ${data.area || 'No especificada'}
- Materias: ${data.materias?.join(', ') || 'No especificadas'}

MÉTODOS DISPONIBLES:
1. flashcards: Repetición espaciada (SM-2) - Ideal para memorizar definiciones, conceptos, vocabulario, fechas, fórmulas
2. resumen: Resúmenes con ejemplos - Ideal para entender conceptos complejos, teoría extensa, procesos
3. examen: Exámenes simulados - Ideal para prepararse para pruebas, practicar con preguntas tipo test
4. tts: Texto a voz (TTS) - Ideal para auditory learners, personas con dificultades de lectura

INSTRUCCIONES:
1. Analiza el tema y determina qué método es más efectivo
2. Considera el contexto (preparación para examen, tarea, curiosidad)
3. Da una recomendación clara con justificación
4. Sugiere UNA opción principal

Responde SOLO en JSON válido:
{
  "recomendacion": "Explicación breve de por qué este método es el mejor para este estudiante y tema (2-3 oraciones)",
  "metodoRecomendado": "flashcards|resumen|examen|tts"
}

IMPORTANTE: La respuesta debe ser en español, amigable y motivadora. Considera que el estudiante puede estar preparándose para exámenes del MEP.`;

    const result = await aiService.process({ 
      content: prompt, 
      task: 'recomendar_metodo' 
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error,
      });
    }

    let parsedData;
    try {
      parsedData = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
    } catch {
      parsedData = { 
        recomendacion: 'Basándome en tu tema, te recomiendo usar flashcards para memorizar los conceptos clave de forma eficiente.',
        metodoRecomendado: 'flashcards'
      };
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }
    throw error;
  }
});

export default router;
