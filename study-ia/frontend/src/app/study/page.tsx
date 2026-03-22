'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Brain,
  LogOut,
  Loader2,
  Sparkles,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Volume2,
  ChevronDown,
  ChevronUp,
  BookmarkPlus,
  BookmarkCheck,
  Trash2,
  Play,
  Eye,
  Edit3,
  Save,
  Coffee,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

interface Summary {
  summary: string;
  keyPoints: string[];
}

interface Question {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
}

interface StudyContent {
  id: string;
  tema: string;
  grado: string;
  area: string;
  fecha: string;
  flashcards: Flashcard[];
  summary: Summary;
  questions: Question[];
  guardado: boolean;
  savedId?: string;
}

interface SectionState {
  flashcards: boolean;
  resumen: boolean;
  examen: boolean;
}

const PASOS_GENERACION = [
  'Analizando tu tema...',
  'Buscando información relevante...',
  'Generando flashcards...',
  'Creando resumen...',
  'Preparando preguntas de examen...',
  '¡Todo listo!',
];

function StudyPage() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  
  const [tema, setTema] = useState('');
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [contenido, setContenido] = useState<StudyContent | null>(null);
  const [respuestasExamen, setRespuestasExamen] = useState<Record<string, number>>({});
  const [mostrarRespuestas, setMostrarRespuestas] = useState(false);
  const [sections, setSections] = useState<SectionState>({
    flashcards: true,
    resumen: true,
    examen: true,
  });

  const toggleSection = (section: keyof SectionState) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const guardarYRedirigir = async (estudiarAhora: boolean) => {
    if (!contenido || !token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tema: contenido.tema,
          flashcards: contenido.flashcards,
          summary: contenido.summary,
          questions: contenido.questions,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (estudiarAhora) {
          router.push(`/mis-estudios`);
        } else {
          router.push(`/mis-estudios`);
        }
      } else {
        setError('No pude guardar. Intenta de nuevo.');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    }
  };

  const generarContenido = useCallback(async () => {
    if (!tema.trim() || !token) return;
    
    if (cooldown > 0) {
      setError(`Espera ${cooldown} segundos antes de generar otro estudio.`);
      return;
    }
    
    setGenerando(true);
    setError(null);
    setContenido(null);
    setPasoActual(0);
    setRespuestasExamen({});
    setMostrarRespuestas(false);
    
    try {
      for (let i = 0; i < PASOS_GENERACION.length; i++) {
        setPasoActual(i + 1);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/generar-contenido`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tema: tema,
          grado: user?.grado || '12',
          area: user?.area || '',
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setContenido({
          ...data.data,
          id: Date.now().toString(),
          tema: tema,
          grado: user?.grado || '12',
          area: user?.areaLabel || user?.area || '',
          fecha: new Date().toISOString(),
          guardado: false,
        });
      } else {
        setContenido({
          id: Date.now().toString(),
          tema: tema,
          grado: user?.grado || '12',
          area: user?.area || '',
          fecha: new Date().toISOString(),
          flashcards: [
            { id: '1', front: '¿Qué es la fotosíntesis?', back: 'Proceso por el cual las plantas convierten luz solar en energía química.' },
            { id: '2', front: '¿Qué necesitan las plantas para la fotosíntesis?', back: 'Luz solar, agua y dióxido de carbono.' },
            { id: '3', front: '¿Dónde ocurre la fotosíntesis?', back: 'En los cloroplastos de las hojas.' },
          ],
          summary: {
            summary: 'La fotosíntesis es el proceso mediante el cual las plantas convierten la energía luminosa en energía química. Es fundamental para la vida en la Tierra.',
            keyPoints: [
              'Las plantas usan luz solar como fuente de energía',
              'Absorben dióxido de carbono y liberan oxígeno',
              'Ocurre en los cloroplastos',
            ],
          },
          questions: [
            { id: '1', question: '¿Qué gas absorben las plantas?', options: ['Oxígeno', 'Nitrógeno', 'Dióxido de carbono', 'Helio'], correctAnswer: 2 },
            { id: '2', question: '¿Qué gas liberan las plantas?', options: ['Dióxido de carbono', 'Nitrógeno', 'Oxígeno', 'Hidrógeno'], correctAnswer: 2 },
          ],
          guardado: false,
        });
      }
      
      setCooldown(30);
      const interval = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err) {
      setError('No pude generar el contenido. Verifica tu conexión.');
    } finally {
      setGenerando(false);
    }
  }, [tema, token, user?.grado, user?.area, user?.areaLabel, cooldown]);

  const seleccionarRespuesta = (preguntaId: string, opcionIndex: number) => {
    setRespuestasExamen(prev => ({ ...prev, [preguntaId]: opcionIndex }));
  };

  const calcularNota = () => {
    if (!contenido || contenido.questions.length === 0) return 0;
    const correctas = contenido.questions.filter(q => respuestasExamen[q.id] === q.correctAnswer).length;
    return Math.round((correctas / contenido.questions.length) * 100);
  };

  const hablarTexto = (texto: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoNombre(file.name);
      setTema(`Archivo: ${file.name}`);
    }
  };

  const reiniciar = () => {
    setContenido(null);
    setTema('');
    setArchivoNombre(null);
    setRespuestasExamen({});
    setMostrarRespuestas(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Crear Estudio</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full">
              <span className="text-sm font-medium text-blue-700">{user?.name}</span>
              <span className="w-1 h-1 bg-blue-300 rounded-full" />
              <span className="text-sm text-blue-600">{user?.grado}°</span>
            </div>
            <button onClick={logout} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!contenido ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h1 className="text-2xl font-bold text-white">¿Qué quieres estudiar?</h1>
                <p className="text-blue-100 mt-1">Escribe tu tema y la IA generará flashcards, resúmenes y exámenes</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    archivoNombre
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                  }`}>
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">{archivoNombre || 'Subir archivo'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleArchivo}
                      className="hidden"
                      disabled={generando}
                    />
                  </label>
                </div>

                <div className="relative">
                  <textarea
                    value={tema}
                    onChange={(e) => { setTema(e.target.value); setArchivoNombre(null); }}
                    placeholder="Ej: La fotosíntesis, independencia de Costa Rica, funciones matemáticas..."
                    className="w-full h-32 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition resize-none text-lg"
                    disabled={generando}
                  />
                </div>

                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <span className="text-amber-600">💡</span>
                  <p className="text-sm text-amber-800">Sé específico para mejores resultados</p>
                </div>
              </div>
            </div>

            {generando ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {PASOS_GENERACION[pasoActual - 1] || 'Preparando...'}
                </h2>
                
                <div className="flex items-center justify-center gap-2 text-gray-600 mb-6">
                  <Coffee className="w-5 h-5" />
                  <span>Tome un descanso mientras generamos...</span>
                </div>
                
                <div className="max-w-xs mx-auto bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 rounded-full"
                    style={{ width: `${(pasoActual / PASOS_GENERACION.length) * 100}%` }}
                  />
                </div>
                
                <p className="text-sm text-gray-500">Paso {pasoActual} de {PASOS_GENERACION.length}</p>
              </div>
            ) : (
              <button
                onClick={generarContenido}
                disabled={!tema.trim() || cooldown > 0}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {cooldown > 0 ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Espera {cooldown}s para generar otro
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Generar estudio con IA
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded">
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                      <h1 className="text-xl font-bold text-white">¡Contenido generado!</h1>
                    </div>
                    <p className="text-green-100 mt-1">{contenido.tema}</p>
                  </div>
                  <button
                    onClick={reiniciar}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span className="hidden sm:inline">Nuevo</span>
                  </button>
                </div>
              </div>

              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {contenido.grado}° grado
                </span>
                {contenido.area && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    {contenido.area}
                  </span>
                )}
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {contenido.flashcards.length} flashcards
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">¿Qué quieres hacer?</h2>
              <p className="text-blue-100 mb-6">Tu contenido está listo para estudiar</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => guardarYRedirigir(true)}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:scale-105"
                >
                  <Play className="w-6 h-6" />
                  Estudiar ahora
                </button>
                <button
                  onClick={() => guardarYRedirigir(false)}
                  className="flex items-center justify-center gap-3 px-8 py-4 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all border-2 border-white/30"
                >
                  <BookmarkPlus className="w-6 h-6" />
                  Guardar y ver después
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Vista previa del contenido:</h3>
              
              {contenido.flashcards.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📇 Flashcards ({contenido.flashcards.length})</h4>
                  <div className="flex flex-wrap gap-2">
                    {contenido.flashcards.slice(0, 5).map((card) => (
                      <span key={card.id} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                        {card.front.substring(0, 30)}...
                      </span>
                    ))}
                    {contenido.flashcards.length > 5 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                        +{contenido.flashcards.length - 5} más
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {contenido.summary && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📝 Resumen</h4>
                  <p className="text-gray-600 text-sm line-clamp-2">{contenido.summary.summary}</p>
                </div>
              )}
              
              {contenido.questions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">📋 Examen ({contenido.questions.length} preguntas)</h4>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

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

export default function StudyWrapper() {
  return (
    <ProtectedRoute>
      <StudyPage />
    </ProtectedRoute>
  );
}
