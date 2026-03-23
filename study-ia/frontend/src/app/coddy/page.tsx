'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, Check, Loader2, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Pregunta {
  id: number;
  pregunta: string;
  opciones: { value: string; label: string; desc: string }[];
  campo: string;
}

interface Respuestas {
  metodoPreferido?: string;
  objetivo?: string;
  estiloAprendizaje?: string;
  tiempoDisponible?: string;
  formatoMaterial?: string;
}

const PREGUNTAS: Pregunta[] = [
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

const SALUDOS = [
  '¡Hola! Soy CoDDy, tu asistente de estudio. 🎓',
  '¡Bienvenido! Soy CoDDy, estoy aquí para conocerte mejor. 💡',
  '¡Qué alegría tenerte aquí! Soy CoDDy, tu guía de estudio. 📖',
];

const METODOS_LABELS: Record<string, { icon: string; desc: string }> = {
  flashcards: { icon: '📇', desc: 'Flashcards con repetición espaciada' },
  resumen: { icon: '📝', desc: 'Resúmenes y esquemas' },
  examen: { icon: '📋', desc: 'Exámenes tipo prueba' },
  tts: { icon: '🔊', desc: 'Audio y escucha' },
  hibrido: { icon: '🔄', desc: 'Combinación de métodos' },
};

export default function CoDDyPage() {
  const router = useRouter();
  const { token, user, isLoading } = useAuth();
  const [paso, setPaso] = useState<'saludo' | 'pregunta' | 'resultado' | 'decision' | 'loading'>('saludo');
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [recomendacion, setRecomendacion] = useState<any>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsHablando, setTtsHablando] = useState(false);
  const [saludo, setSaludo] = useState('');
  const mensajesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/onboarding');
    }
  }, [isLoading, token, router]);

  useEffect(() => {
    if (ttsEnabled && ttsHablando && typeof window !== 'undefined') {
      const utterance = new SpeechSynthesisUtterance(saludo);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      utterance.onstart = () => setTtsHablando(true);
      utterance.onend = () => setTtsHablando(false);
      window.speechSynthesis.speak(utterance);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, [saludo, ttsEnabled]);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [paso, preguntaActual]);

  const comenzarEntrevista = () => {
    setSaludo(SALUDOS[Math.floor(Math.random() * SALUDOS.length)]);
    setTtsHablando(true);
    setTimeout(() => setTtsHablando(false), 2000);
    setPaso('pregunta');
  };

  const seleccionarOpcion = (campo: string, value: string) => {
    setRespuestas(prev => ({ ...prev, [campo]: value }));
  };

  const siguientePregunta = async () => {
    if (preguntaActual < PREGUNTAS.length - 1) {
      setPreguntaActual(prev => prev + 1);
    } else {
      await enviarRespuestas();
    }
  };

  const enviarRespuestas = async () => {
    setPaso('loading');
    
    try {
      const res = await fetch(`${API_URL}/api/coddy/entrevista`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ respuestas }),
      });

      const data = await res.json();

      if (data.success) {
        setRecomendacion(data.data.recomendacion);
        setPaso('resultado');
      } else {
        setPaso('pregunta');
        alert('Error al procesar. Intenta de nuevo.');
      }
    } catch {
      setPaso('pregunta');
      alert('Error de conexión. Intenta de nuevo.');
    }
  };

  const cambiarMetodo = async (nuevoMetodo: string) => {
    try {
      await fetch(`${API_URL}/api/coddy/metodo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ metodo: nuevoMetodo }),
      });
      setRecomendacion((prev: any) => ({ ...prev, metodo: nuevoMetodo }));
    } catch {
      console.error('Error al cambiar método');
    }
  };

  const irAEstudiar = () => {
    router.push('/nuevo-estudio');
  };

  const irADashboard = () => {
    router.push('/dashboard');
  };

  const pregunta = PREGUNTAS[preguntaActual];
  const opcionSeleccionada = pregunta ? respuestas[pregunta.campo as keyof Respuestas] : undefined;

  if (isLoading || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">CoDDy</h1>
              <p className="text-purple-200 text-sm">Entrevista de Adaptación</p>
            </div>
          </div>
          <button
            onClick={() => setTtsEnabled(!ttsEnabled)}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition"
            title={ttsEnabled ? 'Desactivar audio' : 'Activar audio'}
          >
            {ttsEnabled ? (
              <Volume2 className="w-5 h-5 text-white" />
            ) : (
              <VolumeX className="w-5 h-5 text-white/50" />
            )}
          </button>
        </div>

        <div ref={mensajesRef} className="space-y-6 min-h-[60vh]">
          {paso === 'saludo' && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white text-lg leading-relaxed mb-4">
                    ¡Hola {user?.name || 'estudiante'}! 👋
                  </p>
                  <p className="text-purple-200 text-lg leading-relaxed mb-4">
                    Soy <span className="text-white font-semibold">CoDDy</span>, tu asistente de estudio. Para moldear tu experiencia y darte el mejor contenido posible, necesito conocerte un poco mejor.
                  </p>
                  <p className="text-purple-200 text-lg leading-relaxed mb-6">
                    Son solo <span className="text-yellow-300 font-semibold">5 preguntas rápidas</span> y estaré listo para ayudarte.
                  </p>
                  <button
                    onClick={comenzarEntrevista}
                    className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all hover:scale-105 shadow-lg"
                  >
                    ¡Comenzar! <ChevronRight className="inline w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {paso === 'pregunta' && pregunta && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-purple-300 text-sm">
                  Pregunta {preguntaActual + 1} de {PREGUNTAS.length}
                </span>
                <div className="flex-1 h-1 bg-white/20 rounded-full ml-4">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                    style={{ width: `${((preguntaActual + 1) / PREGUNTAS.length) * 100}%` }}
                  />
                </div>
              </div>

              <h2 className="text-white text-xl font-semibold mb-6">
                {pregunta.pregunta}
              </h2>

              <div className="space-y-3">
                {pregunta.opciones.map((opcion) => (
                  <button
                    key={opcion.value}
                    onClick={() => seleccionarOpcion(pregunta.campo, opcion.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      opcionSeleccionada === opcion.value
                        ? 'bg-purple-500 border-2 border-purple-300'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-white font-medium">{opcion.label}</span>
                        <p className="text-purple-200 text-sm">{opcion.desc}</p>
                      </div>
                      {opcionSeleccionada === opcion.value && (
                        <Check className="w-6 h-6 text-green-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={siguientePregunta}
                disabled={!opcionSeleccionada}
                className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {preguntaActual < PREGUNTAS.length - 1 ? (
                  <>Siguiente <ChevronRight className="inline w-5 h-5" /></>
                ) : (
                  <>Finalizar <Sparkles className="inline w-5 h-5" /></>
                )}
              </button>
            </div>
          )}

          {paso === 'loading' && (
            <div className="bg-white/10 backdrop-blur rounded-2xl p-8 text-center animate-fade-in">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">Analizando tu perfil...</h2>
              <p className="text-purple-200">CoDDy está creando tu plan personalizado</p>
              <div className="flex justify-center gap-2 mt-4">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {paso === 'resultado' && recomendacion && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-white text-xl font-semibold mb-2">¡Listo, {user?.name || 'estudiante'}! 🎉</p>
                    <p className="text-purple-200 text-lg">
                      He analizado tus respuestas y encontré el método perfecto para ti.
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-xl p-6 mb-6">
                  <div className="text-center">
                    <span className="text-5xl mb-4 block">
                      {METODOS_LABELS[recomendacion.metodo]?.icon || '📚'}
                    </span>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {recomendacion.metodo.toUpperCase()}
                    </h3>
                    <p className="text-purple-200">
                      {METODOS_LABELS[recomendacion.metodo]?.desc}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <p className="text-white font-medium">¿Por qué te lo recomiendo?</p>
                  {recomendacion.razones?.map((razon: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-purple-200">
                      <span>{razon}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <p className="text-white font-medium mb-2">¿Quieres cambiar el método?</p>
                  <div className="flex flex-wrap gap-2">
                    {['flashcards', 'resumen', 'examen', 'hibrido'].map((metodo) => (
                      <button
                        key={metodo}
                        onClick={() => cambiarMetodo(metodo)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all ${
                          recomendacion.metodo === metodo
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-purple-200 hover:bg-white/20'
                        }`}
                      >
                        {METODOS_LABELS[metodo]?.icon} {metodo}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-purple-200 text-center mb-4">
                  {recomendacion.mensajePersonalizado}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4 text-center">¿Qué quieres hacer ahora?</h3>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={irAEstudiar}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    ¡Empezar a estudiar ahora!
                  </button>
                  <button
                    onClick={irADashboard}
                    className="w-full py-4 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Brain className="w-5 h-5" />
                    Lo haré más tarde
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
}
