import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

const respuestasSchema = z.object({
  metodoPreferido: z.enum(['flashcards', 'resumen', 'examen', 'tts', 'hibrido']),
  objetivo: z.enum(['aprender', 'examen', 'entender', 'idioma', 'resumir']),
  estiloAprendizaje: z.enum(['visual', 'auditivo', 'lectura', 'practico']),
  tiempoDisponible: z.enum(['ligero', 'moderado', 'intensivo']),
  formatoMaterial: z.enum(['pdf', 'apuntes', 'web', 'mixto']),
  desafios: z.array(z.string()).optional(),
});

const preguntas = [
  {
    id: 1,
    pregunta: '¿Qué métodos de estudio prefieres o te funcionan mejor?',
    opciones: [
      { value: 'flashcards', label: '📇 Flashcards', desc: 'Repetición espaciada para memorizar' },
      { value: 'resumen', label: '📝 Resúmenes', desc: 'Esquemas y puntos clave' },
      { value: 'examen', label: '📋 Exámenes', desc: 'Preguntas tipo prueba' },
      { value: 'tts', label: '🔊 Audio', desc: 'Escuchar y aprender' },
      { value: 'hibrido', label: '✍️ Todo por igual', desc: 'Combino varios métodos' },
    ],
    campo: 'metodoPreferido',
  },
  {
    id: 2,
    pregunta: '¿Cuál es tu objetivo principal al estudiar?',
    opciones: [
      { value: 'aprender', label: '📚 Aprender para clase', desc: 'Adquirir conocimientos' },
      { value: 'examen', label: '🎯 Aprobar un examen', desc: 'Prepararme específicamente' },
      { value: 'entender', label: '📖 Entender un tema', desc: 'Comprender conceptos' },
      { value: 'idioma', label: '🌐 Aprender un idioma', desc: 'Nuevo idioma' },
      { value: 'resumir', label: '📚 Resumir libros', desc: 'Extraer lo importante' },
    ],
    campo: 'objetivo',
  },
  {
    id: 3,
    pregunta: '¿Cómo aprendes más fácil?',
    opciones: [
      { value: 'visual', label: '👁️ Viendo', desc: 'Diagramas, mapas, videos' },
      { value: 'auditivo', label: '👂 Escuchando', desc: 'Explicaciones, podcasts' },
      { value: 'lectura', label: '📖 Leyendo', desc: 'Textos, libros' },
      { value: 'practico', label: '✋ Practicando', desc: 'Ejercicios, problemas' },
    ],
    campo: 'estiloAprendizaje',
  },
  {
    id: 4,
    pregunta: '¿Cuánto tiempo puedes dedicar al estudio?',
    opciones: [
      { value: 'ligero', label: '🟢 ~30 min/día', desc: 'Poco tiempo disponible' },
      { value: 'moderado', label: '🟡 1-2 horas/día', desc: 'Tiempo regular' },
      { value: 'intensivo', label: '🔴 Más de 2 horas', desc: 'Mucho tiempo disponible' },
    ],
    campo: 'tiempoDisponible',
  },
  {
    id: 5,
    pregunta: '¿Qué formato prefieres para estudiar?',
    opciones: [
      { value: 'pdf', label: '📄 PDFs', desc: 'Documentos y libros' },
      { value: 'apuntes', label: '📱 Apuntes', desc: 'Notas digitales' },
      { value: 'web', label: '🌐 Web', desc: 'Recursos en línea' },
      { value: 'mixto', label: '📚 De todo', desc: 'Varios formatos' },
    ],
    campo: 'formatoMaterial',
  },
];

const respuestasCompletasSchema = z.object({
  respuestas: respuestasSchema,
});

const generarRecomendacion = (respuestas: z.infer<typeof respuestasSchema>) => {
  const { metodoPreferido, objetivo, estiloAprendizaje, tiempoDisponible } = respuestas;
  
  let metodo = metodoPreferido;
  let razones: string[] = [];
  let configuracion: Record<string, unknown> = {};

  if (objetivo === 'examen') {
    metodo = 'examen';
    razones.push('🎯 Tu objetivo es aprobar un examen, el simulacro te preparará mejor');
  }

  if (estiloAprendizaje === 'auditivo') {
    if (metodo === 'flashcards' || metodo === 'resumen') {
      razones.push('🔊 Como aprendes mejor escuchando, añadiré audio a tu contenido');
      configuracion.incluirTTS = true;
    }
  }

  if (estiloAprendizaje === 'visual') {
    razones.push('📊 Incluiré diagramas y esquemas en tu contenido');
    configuracion.incluirDiagramas = true;
  }

  if (tiempoDisponible === 'ligero') {
    configuracion.cantidadFlashcards = 5;
    configuracion.resumenCorto = true;
    razones.push('⏰ Como tienes poco tiempo, generaré contenido conciso');
  } else if (tiempoDisponible === 'intensivo') {
    configuracion.cantidadFlashcards = 15;
    configuracion.resumenCompleto = true;
    razones.push('📚 Tienes tiempo disponible, generaré contenido completo');
  } else {
    configuracion.cantidadFlashcards = 10;
    razones.push('⏱️ Contenido equilibrado para tu tiempo disponible');
  }

  if (metodo === 'hibrido') {
    razones.push('🔄 Usaré un enfoque híbrido combinando flashcards y resúmenes');
  }

  return {
    metodo,
    razones,
    configuracion,
    mensaje: `Basado en tu perfil, te recomiendo: ${metodo.toUpperCase()}`,
  };
};

const saludos = [
  '¡Hola! Soy CoDDy, tu asistente de estudio. 🎓',
  '¡Bienvenido! Soy CoDDy, estoy aquí para conocerte mejor. 💡',
  '¡Qué alegría tenerte aquí! Soy CoDDy, tu guía de estudio. 📖',
];

const getSaludoInicial = () => {
  return saludos[Math.floor(Math.random() * saludos.length)];
};

router.get('/preguntas', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      preguntas,
      saludoInicial: getSaludoInicial(),
      totalPreguntas: preguntas.length,
    },
  });
});

router.post('/entrevista', aiLimiter, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token requerido',
      });
    }

    const validatedData = respuestasCompletasSchema.parse(req.body);
    const { respuestas } = validatedData;

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET || 'secret');
    const userId = decoded.userId;

    const recomendacion = generarRecomendacion(respuestas);

    const perfil = await prisma.coDDyProfile.upsert({
      where: { userId },
      update: {
        metodoPreferido: recomendacion.metodo,
        objetivo: respuestas.objetivo,
        estiloAprendizaje: respuestas.estiloAprendizaje,
        tiempoDisponible: respuestas.tiempoDisponible,
        formatoMaterial: respuestas.formatoMaterial,
        desafios: respuestas.desafios || [],
        respuestasCompletas: true,
        configuracion: recomendacion.configuracion as object,
        updatedAt: new Date(),
      },
      create: {
        userId,
        metodoPreferido: recomendacion.metodo,
        objetivo: respuestas.objetivo,
        estiloAprendizaje: respuestas.estiloAprendizaje,
        tiempoDisponible: respuestas.tiempoDisponible,
        formatoMaterial: respuestas.formatoMaterial,
        desafios: respuestas.desafios || [],
        respuestasCompletas: true,
        configuracion: recomendacion.configuracion as object,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { studyMethod: recomendacion.metodo },
    });

    const mensajeDespedida = [
      '¡Perfecto! Ya me moldeé a tu estilo. ¿Quieres empezar a estudiar algo justo ahora o prefieres hacerlo más tarde?',
      '¡Genial! Conozco tu estilo de aprendizaje. ¿Listo para comenzar o lo dejamos para después?',
      '¡Listo! He adaptado el sistema a tus necesidades. ¿Empezamos a estudiar ahora o más tarde?',
    ];

    res.json({
      success: true,
      data: {
        perfil,
        recomendacion: {
          ...recomendacion,
          mensajePersonalizado: mensajeDespedida[Math.floor(Math.random() * mensajeDespedida.length)],
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      });
    }
    console.error('Error en /coddy/entrevista:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar la entrevista',
    });
  }
});

router.get('/perfil', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const perfil = await prisma.coDDyProfile.findUnique({
      where: { userId },
    });

    if (!perfil) {
      return res.json({
        success: true,
        data: {
          completo: false,
          preguntas,
          saludoInicial: getSaludoInicial(),
        },
      });
    }

    res.json({
      success: true,
      data: {
        completo: true,
        perfil,
        metodoActual: perfil.metodoPreferido,
      },
    });
  } catch (error) {
    console.error('Error en /coddy/perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener el perfil',
    });
  }
});

router.put('/metodo', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { metodo } = req.body;

    if (!['flashcards', 'resumen', 'examen', 'tts', 'hibrido'].includes(metodo)) {
      return res.status(400).json({
        success: false,
        error: 'Método inválido',
      });
    }

    await prisma.coDDyProfile.update({
      where: { userId },
      data: { metodoPreferido: metodo },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { studyMethod: metodo },
    });

    res.json({
      success: true,
      data: { metodoActualizado: metodo },
    });
  } catch (error) {
    console.error('Error en /coddy/metodo:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar el método',
    });
  }
});

export default router;
