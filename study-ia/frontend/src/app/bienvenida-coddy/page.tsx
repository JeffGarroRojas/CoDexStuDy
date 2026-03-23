'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Send, User, Sparkles, GraduationCap, BookOpen, Target, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let idCounter = 0;
const generateId = () => {
  idCounter += 1;
  return `msg-${Date.now()}-${idCounter}`;
};

interface Opcion {
  valor: string;
  etiqueta: string;
  descripcion?: string;
}

interface PasoEntrevista {
  id: string;
  pregunta: string;
  campo: string;
  tipo: 'texto' | 'opciones';
  opciones?: Opcion[];
}

interface Mensaje {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  opciones?: Opcion[];
}

const PASOS_ENTREVISTA: PasoEntrevista[] = [
  {
    id: 'nombre',
    pregunta: '¡Hola! Soy CoDDy, tu asistente de estudio. ¿Cómo te llamas?',
    campo: 'name',
    tipo: 'texto',
  },
  {
    id: 'grado',
    pregunta: '¿En qué grado estás? (7° a 12°)',
    campo: 'grado',
    tipo: 'opciones',
    opciones: [
      { valor: '7', etiqueta: '7° Séptimo' },
      { valor: '8', etiqueta: '8° Octavo' },
      { valor: '9', etiqueta: '9° Noveno' },
      { valor: '10', etiqueta: '10° Décimo' },
      { valor: '11', etiqueta: '11° Undécimo' },
      { valor: '12', etiqueta: '12° Duodécimo' },
    ],
  },
  {
    id: 'metodo',
    pregunta: '¿Cómo te gusta estudiar más?',
    campo: 'studyMethod',
    tipo: 'opciones',
    opciones: [
      { valor: 'flashcards', etiqueta: '📇 Flashcards', descripcion: 'Tarjetas para memorizar' },
      { valor: 'resumen', etiqueta: '📝 Resúmenes', descripcion: 'Apuntes organizados' },
      { valor: 'examen', etiqueta: '📋 Exámenes', descripcion: 'Practicar con pruebas' },
      { valor: 'tts', etiqueta: '🔊 Escuchar', descripcion: 'Texto a voz' },
    ],
  },
  {
    id: 'estilo',
    pregunta: '¿Cómo aprendes mejor?',
    campo: 'learningStyle',
    tipo: 'opciones',
    opciones: [
      { valor: 'visual', etiqueta: '👁️ Viendo', descripcion: 'Con imágenes y diagramas' },
      { valor: 'auditivo', etiqueta: '👂 Escuchando', descripcion: 'Escuchando explicaciones' },
      { valor: 'lectura', etiqueta: '📖 Leyendo', descripcion: 'Leyendo y subrayando' },
      { valor: 'practico', etiqueta: '✍️ Practicando', descripcion: 'Haciendo ejercicios' },
    ],
  },
  {
    id: 'objetivo',
    pregunta: '¿Cuál es tu objetivo principal?',
    campo: 'objective',
    tipo: 'texto',
  },
];

export default function BienvenidaCoddyPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [pasoActual, setPasoActual] = useState(0);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [datosUsuario, setDatosUsuario] = useState({
    name: '',
    grado: '',
    studyMethod: '',
    learningStyle: '',
    objective: '',
  });
  const mensajesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (mensajes.length === 0 && pasoActual === 0) {
      setMensajes([{
        id: '1',
        role: 'assistant',
        content: PASOS_ENTREVISTA[0].pregunta,
      }]);
    }
  }, []);

  useEffect(() => {
    mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const agregarMensaje = useCallback((role: 'assistant' | 'user', content: string, opciones?: { valor: string; etiqueta: string }[]) => {
    const newMsg = {
      id: generateId(),
      role,
      content,
      opciones,
    };
    setMensajes(prev => [...prev, newMsg]);
    return newMsg.id;
  }, []);

  const seleccionarOpcion = async (valor: string, etiqueta: string) => {
    agregarMensaje('user', etiqueta);
    
    const paso = PASOS_ENTREVISTA[pasoActual];
    setDatosUsuario(prev => ({ ...prev, [paso.campo]: valor }));

    setLoading(true);
    
    setTimeout(() => {
      const siguientePaso = pasoActual + 1;
      
      if (siguientePaso < PASOS_ENTREVISTA.length) {
        setPasoActual(siguientePaso);
        agregarMensaje('assistant', PASOS_ENTREVISTA[siguientePaso].pregunta);
        
        if (PASOS_ENTREVISTA[siguientePaso].tipo === 'opciones') {
          agregarMensaje('assistant', '', PASOS_ENTREVISTA[siguientePaso].opciones);
        }
      } else {
        guardarPerfil();
      }
      
      setLoading(false);
    }, 800);
  };

  const enviarRespuestaTexto = () => {
    if (!input.trim()) return;
    
    agregarMensaje('user', input);
    const paso = PASOS_ENTREVISTA[pasoActual];
    setDatosUsuario(prev => ({ ...prev, [paso.campo]: input }));
    setInput('');

    setLoading(true);
    
    setTimeout(() => {
      const siguientePaso = pasoActual + 1;
      
      if (siguientePaso < PASOS_ENTREVISTA.length) {
        setPasoActual(siguientePaso);
        agregarMensaje('assistant', PASOS_ENTREVISTA[siguientePaso].pregunta);
        
        if (PASOS_ENTREVISTA[siguientePaso].tipo === 'opciones') {
          agregarMensaje('assistant', '', PASOS_ENTREVISTA[siguientePaso].opciones);
        }
      } else {
        guardarPerfil();
      }
      
      setLoading(false);
    }, 800);
  };

  const guardarPerfil = async () => {
    setGuardando(true);
    
    try {
      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: datosUsuario.name,
          grado: datosUsuario.grado,
          studyMethod: datosUsuario.studyMethod,
          learningStyle: datosUsuario.learningStyle,
          objective: datosUsuario.objective,
        }),
      });

      if (res.ok) {
        localStorage.setItem('userName', datosUsuario.name);
        localStorage.setItem('userGrado', datosUsuario.grado);
        
        agregarMensaje('assistant', '¡Perfecto! He guardado tu perfil. ¡Estás listo para comenzar tu viaje de aprendizaje!');
        setCompletado(true);
        
        setTimeout(() => {
          router.push('/inicio');
        }, 2000);
      }
    } catch (error) {
      console.error('Error guardando perfil:', error);
    } finally {
      setGuardando(false);
    }
  };

  const paso = PASOS_ENTREVISTA[pasoActual];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b px-4 py-4"
      >
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">CoDDy te conoce</h1>
            <p className="text-sm text-gray-500">Configurando tu perfil de estudio</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {PASOS_ENTREVISTA.map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`w-2 h-2 rounded-full ${
                  i < pasoActual ? 'bg-green-500' : 
                  i === pasoActual ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.header>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {mensajes.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index === mensajes.length - 1 ? 0 : 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600' 
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}>
                  {msg.role === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Opciones */}
          {paso?.tipo === 'opciones' && !loading && !completado && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3 mt-4"
            >
              {paso.opciones?.map((opcion, i) => (
                <motion.button
                  key={opcion.valor}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => seleccionarOpcion(opcion.valor, opcion.etiqueta)}
                  className="p-4 bg-white border border-gray-200 rounded-xl text-left hover:border-blue-400 hover:shadow-md transition-all"
                >
                  <span className="text-lg">{opcion.etiqueta}</span>
                  {opcion.descripcion && (
                    <p className="text-sm text-gray-500 mt-1">{opcion.descripcion}</p>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Loading */}
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Completado */}
          {completado && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-500" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900">¡Perfil completado!</h2>
              <p className="text-gray-500 mt-2">Redirigiendo a tu dashboard...</p>
            </motion.div>
          )}

          <div ref={mensajesEndRef} />
        </div>
      </div>

      {/* Input para texto */}
      {paso?.tipo === 'texto' && !loading && !completado && (
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white border-t p-4"
        >
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && enviarRespuestaTexto()}
              placeholder="Escribe tu respuesta..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={enviarRespuestaTexto}
              disabled={!input.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
