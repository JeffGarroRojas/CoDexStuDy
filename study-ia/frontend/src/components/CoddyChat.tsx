'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, Check, Loader2, ChevronRight, Volume2, VolumeX, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  options?: { value: string; label: string; desc?: string }[];
  isQuestion?: boolean;
}

interface CoDDyProfile {
  metodoPreferido?: string;
  objetivo?: string;
  estiloAprendizaje?: string;
  tiempoDisponible?: string;
  formatoMaterial?: string;
}

const SALUDOS = [
  '¡Hola! Soy CoDDy, tu asistente de estudio. 🎓',
  '¡Bienvenido! Soy CoDDy, estoy aquí para conocerte mejor. 💡',
  '¡Qué alegría tenerte aquí! Soy CoDDy, tu guía de estudio. 📖',
];

const PREGUNTAS_CODDY: Message[] = [
  {
    id: '0',
    role: 'assistant',
    content: '¡Hola! Soy CoDDy, tu asistente de estudio. 🎓\n\nPara moldear tu experiencia y darte el mejor contenido posible, necesito conocerte un poco mejor.\n\nSon solo 5 preguntas rápidas y estaré listo para ayudarte.',
    options: [
      { value: 'ok', label: '¡Vamos! 🚀' },
    ],
  },
  {
    id: '1',
    role: 'assistant',
    content: 'Perfecto! Empecemos. 💪\n\n📚 Primera pregunta:\n\n¿Qué métodos de estudio prefieres o te funcionan mejor?',
    isQuestion: true,
    options: [
      { value: 'flashcards', label: '📇 Flashcards', desc: 'Repetición espaciada para memorizar' },
      { value: 'resumen', label: '📝 Resúmenes', desc: 'Esquemas y puntos clave' },
      { value: 'examen_tipo', label: '📋 Exámenes', desc: 'Preguntas tipo prueba' },
      { value: 'tts', label: '🔊 Audio', desc: 'Escuchar y aprender' },
      { value: 'hibrido', label: '🔄 Todo por igual', desc: 'Combino varios métodos' },
    ],
  },
  {
    id: '2',
    role: 'assistant',
    content: 'Genial! 👍\n\n🎯 Segunda pregunta:\n\n¿Cuál es tu objetivo principal al estudiar?',
    isQuestion: true,
    options: [
      { value: 'aprender', label: '📚 Aprender para clase', desc: 'Adquirir conocimientos' },
      { value: 'examen', label: '🎯 Aprobar un examen', desc: 'Prepararme específicamente' },
      { value: 'entender', label: '📖 Entender un tema', desc: 'Comprender conceptos' },
      { value: 'idioma', label: '🌐 Aprender un idioma', desc: 'Nuevo idioma' },
      { value: 'resumir', label: '📚 Resumir libros', desc: 'Extraer lo importante' },
    ],
  },
  {
    id: '3',
    role: 'assistant',
    content: '¡Excelente! Ya voy entendiendo tu estilo. 🎯\n\n👁️ Tercera pregunta:\n\n¿Cómo aprendes más fácil?',
    isQuestion: true,
    options: [
      { value: 'visual', label: '👁️ Viendo', desc: 'Diagramas, mapas, videos' },
      { value: 'auditivo', label: '👂 Escuchando', desc: 'Explicaciones, podcasts' },
      { value: 'lectura', label: '📖 Leyendo', desc: 'Textos, libros' },
      { value: 'practico', label: '✋ Practicando', desc: 'Ejercicios, problemas' },
    ],
  },
  {
    id: '4',
    role: 'assistant',
    content: '¡Casi llegamos! ✨\n\n⏰ Cuarta pregunta:\n\n¿Cuánto tiempo puedes dedicar al estudio?',
    isQuestion: true,
    options: [
      { value: 'ligero', label: '🟢 ~30 min/día', desc: 'Poco tiempo disponible' },
      { value: 'moderado', label: '🟡 1-2 horas/día', desc: 'Tiempo regular' },
      { value: 'intensivo', label: '🔴 Más de 2 horas', desc: 'Mucho tiempo disponible' },
    ],
  },
  {
    id: '5',
    role: 'assistant',
    content: '¡Una más! Almost there... 🎉\n\n📄 Última pregunta:\n\n¿Qué formato prefieres para estudiar?',
    isQuestion: true,
    options: [
      { value: 'pdf', label: '📄 PDFs', desc: 'Documentos y libros' },
      { value: 'apuntes', label: '📱 Apuntes', desc: 'Notas digitales' },
      { value: 'web', label: '🌐 Web', desc: 'Recursos en línea' },
      { value: 'mixto', label: '📚 De todo', desc: 'Varios formatos' },
    ],
  },
];

const METODOS_LABELS: Record<string, { icon: string; nombre: string; desc: string }> = {
  flashcards: { icon: '📇', nombre: 'Flashcards', desc: 'Tarjetas de memoria con repetición espaciada' },
  resumen: { icon: '📝', nombre: 'Resúmenes', desc: 'Esquemas y puntos clave' },
  examen: { icon: '📋', nombre: 'Exámenes', desc: 'Preguntas tipo prueba' },
  hibrido: { icon: '🔄', nombre: 'Híbrido', desc: 'Combinación de métodos' },
};

export default function CoddyChat() {
  const router = useRouter();
  const { token, user, isLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [profile, setProfile] = useState<CoDDyProfile>({});
  const [isTyping, setIsTyping] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [recommendation, setRecommendation] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/onboarding');
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length === 0 && token) {
      const saludo = SALUDOS[Math.floor(Math.random() * SALUDOS.length)];
      setMessages([
        {
          id: 'init',
          role: 'assistant',
          content: `${saludo}\n\nEstoy aquí para ayudarte a estudiar de la mejor manera posible. Respondiendo unas preguntas, puedo personalizar todo para ti.\n\n¿Listo para comenzar?`,
          options: [{ value: 'start', label: '¡Sí, empecemos! 🚀' }],
        },
      ]);
    }
  }, [token, isLoading]);

  const speak = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const sendToBackend = async (field: string, value: string) => {
    try {
      await fetch(`${API_URL}/api/coddy/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleOptionClick = async (option: { value: string; label: string }) => {
    const currentMsg = messages[messages.length - 1];
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: option.label,
    }]);

    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    if (option.value === 'start' || option.value === 'ok') {
      setIsTyping(false);
      setMessages(prev => [...prev, PREGUNTAS_CODDY[1]]);
      return;
    }

  const fieldMap: Record<string, keyof CoDDyProfile> = {
    flashcards: 'metodoPreferido',
    resumen: 'metodoPreferido',
    examen_tipo: 'metodoPreferido',
    tts: 'metodoPreferido',
    hibrido: 'metodoPreferido',
    aprender: 'objetivo',
    examen: 'objetivo',
    entender: 'objetivo',
    idioma: 'objetivo',
    resumir: 'objetivo',
    visual: 'estiloAprendizaje',
    auditivo: 'estiloAprendizaje',
    lectura: 'estiloAprendizaje',
    practico: 'estiloAprendizaje',
    ligero: 'tiempoDisponible',
    moderado: 'tiempoDisponible',
    intensivo: 'tiempoDisponible',
    pdf: 'formatoMaterial',
    apuntes: 'formatoMaterial',
    web: 'formatoMaterial',
    mixto: 'formatoMaterial',
  };

    const field = fieldMap[option.value];
    if (field) {
      setProfile(prev => ({ ...prev, [field]: option.value }));
      await sendToBackend(field, option.value);
    }

    setIsTyping(false);

    const nextQuestionIndex = currentQuestionIndex + 1;

    if (nextQuestionIndex < PREGUNTAS_CODDY.length) {
      setMessages(prev => [...prev, PREGUNTAS_CODDY[nextQuestionIndex]]);
      setCurrentQuestionIndex(nextQuestionIndex);
    } else {
      await finishInterview();
    }
  };

  const finishInterview = async () => {
    setLoadingRecommendation(true);
    setMessages(prev => [...prev, {
      id: 'loading',
      role: 'assistant',
      content: '🤔 Déjame analizar tus respuestas...',
    }]);

    try {
      const res = await fetch(`${API_URL}/api/coddy/entrevista`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ respuestas: profile }),
      });

      const data = await res.json();

      const loadingMsgIndex = messages.findIndex(m => m.id === 'loading');
      const updatedMessages = [...messages];
      if (loadingMsgIndex > -1) {
        updatedMessages.splice(loadingMsgIndex, 1);
      }
      setMessages(updatedMessages);

      if (data.success) {
        setRecommendation(data.data.recomendacion);
        
        const metodo = METODOS_LABELS[data.data.recomendacion.metodo] || METODOS_LABELS.hibrido;
        
        setMessages(prev => [
          ...prev,
          {
            id: 'result',
            role: 'assistant',
            content: `🎉 ¡Listo, ${user?.name || 'estudiante'}!\n\nHe analizado tu perfil y encontré el método perfecto para ti:\n\n${metodo.icon} **${metodo.nombre}**\n\n${metodo.desc}\n\n${data.data.recomendacion.mensajePersonalizado || '¿Qué quieres hacer ahora?'}`,
            options: [
              { value: 'ahora', label: '🚀 ¡Empezar a estudiar ahora!' },
              { value: 'despues', label: '⏰ Lo haré más tarde' },
            ],
          },
        ]);
        
        speak(data.data.recomendacion.mensajePersonalizado || '¡Listo! ¿Qué quieres hacer ahora?');
        setShowRecommendation(true);
      }
    } catch (err) {
      console.error('Error finishing interview:', err);
      setMessages(prev => [...prev, {
        id: 'error',
        role: 'assistant',
        content: 'Tuve un problema al procesar tus respuestas. ¿Quieres intentarlo de nuevo?',
        options: [{ value: 'retry', label: '🔄 Intentarlo de nuevo' }],
      }]);
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const handleFinalDecision = async (option: string) => {
    if (option === 'ahora') {
      router.push('/nuevo-estudio');
    } else if (option === 'despues') {
      router.push('/dashboard');
    } else if (option === 'retry') {
      setMessages([]);
      setProfile({});
      setCurrentQuestionIndex(0);
      setShowRecommendation(false);
    }
  };

  if (isLoading || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/50">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CoDDy</h1>
              <p className="text-purple-200 text-sm flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                Entrevista de Adaptación
              </p>
            </div>
          </div>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition"
            title={ttsEnabled ? 'Silenciar' : 'Activar voz'}
          >
            {ttsEnabled ? (
              <Volume2 className="w-6 h-6 text-white" />
            ) : (
              <VolumeX className="w-6 h-6 text-white/50" />
            )}
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
          <div className="p-4 bg-white/5 border-b border-white/10 flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <div className="w-3 h-3 bg-green-500 rounded-full" />
            </div>
            <span className="text-white/60 text-sm">Conversación con CoDDy</span>
          </div>

          <div className="h-[60vh] overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-white/10 border border-white/20 text-white'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-300 font-medium">CoDDy</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  
                  {message.options && message.options.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {message.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            if (showRecommendation) {
                              handleFinalDecision(option.value);
                            } else if (option.value === 'start' || option.value === 'ok') {
                              handleOptionClick(option);
                            } else {
                              handleOptionClick(option);
                            }
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                            message.role === 'user'
                              ? 'bg-white/20 hover:bg-white/30 text-white'
                              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                          }`}
                        >
                          <span className="font-medium">{option.label}</span>
                          {option.desc && (
                            <p className="text-sm text-white/70 mt-1">{option.desc}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-white/70 text-sm">CoDDy está escribiendo...</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loadingRecommendation && (
              <div className="flex justify-start">
                <div className="bg-white/10 border border-white/20 rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                    <span className="text-white/70">Analizando tu perfil...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {!showRecommendation && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
            <div className="p-4 bg-white/5 border-t border-white/10">
              <p className="text-center text-white/50 text-sm">
                Selecciona una opción para continuar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
