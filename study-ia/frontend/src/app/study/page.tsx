'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
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
  
  const [tema, setTema] = useState('');
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [generando, setGenerando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  const generarContenido = useCallback(async () => {
    if (!tema.trim() || !token) return;
    
    setGenerando(true);
    setError(null);
    setContenido(null);
    setPasoActual(0);
    setRespuestasExamen({});
    setMostrarRespuestas(false);
    
    try {
      for (let i = 0; i < PASOS_GENERACION.length; i++) {
        setPasoActual(i + 1);
        await new Promise(resolve => setTimeout(resolve, 700));
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
    } catch (err) {
      setError('No pude generar el contenido. Verifica tu conexión.');
    } finally {
      setGenerando(false);
    }
  }, [tema, token, user?.grado, user?.area, user?.areaLabel]);

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

  const toggleGuardado = async () => {
    if (!contenido || !token) return;
    
    const nuevoEstado = !contenido.guardado;
    setContenido(prev => prev ? { ...prev, guardado: nuevoEstado } : null);

    if (nuevoEstado) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/save`, {
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

  const toggleGuardadoInline = async () => {
    if (!contenido || !token) return;
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/save`, {
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
      
      setContenido(prev => prev ? { ...prev, guardado: true } : null);
    } catch (err) {
      setError('No pude guardar. Intenta de nuevo.');
    }
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
                <p className="text-blue-100 mt-1">Escribe o sube tu material y la IA generará todo automáticamente</p>
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
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                
                <p className="text-xl font-semibold text-gray-900 mb-4 animate-pulse">
                  {PASOS_GENERACION[pasoActual - 1] || 'Preparando...'}
                </p>
                
                <div className="max-w-xs mx-auto bg-gray-100 rounded-full h-2 overflow-hidden mb-4">
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
                disabled={!tema.trim()}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Sparkles className="w-6 h-6" />
                Generar estudio con IA
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
                  <div className="flex gap-2">
                    <button
                      onClick={toggleGuardadoInline}
                      disabled={contenido.guardado}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        contenido.guardado
                          ? 'bg-green-400 text-white cursor-default'
                          : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                      title={contenido.guardado ? 'Ya guardado' : 'Guardar para después'}
                    >
                      {contenido.guardado ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                      <span className="hidden sm:inline">{contenido.guardado ? 'Guardado' : 'Guardar'}</span>
                    </button>
                    <button
                      onClick={reiniciar}
                      className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span className="hidden sm:inline">Nuevo</span>
                    </button>
                  </div>
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
                  {new Date(contenido.fecha).toLocaleDateString('es-CR')}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <p className="text-center text-gray-600 mb-4">¿Qué quieres hacer con este contenido?</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => toggleSection('flashcards')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Estudiar ahora
                </button>
                <button
                  onClick={toggleGuardadoInline}
                  disabled={contenido.guardado}
                  className={`flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border-2 transition-all ${
                    contenido.guardado
                      ? 'border-green-400 bg-green-50 text-green-700 cursor-default'
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  {contenido.guardado ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
                  {contenido.guardado ? 'Guardado' : 'Estudiar más tarde'}
                </button>
                <button
                  onClick={reiniciar}
                  className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 text-gray-700 transition-all"
                >
                  <Edit3 className="w-5 h-5" />
                  Agregar más temas
                </button>
              </div>
            </div>

            {contenido.flashcards.length > 0 && (
              <SectionCard
                title="📇 Flashcards"
                count={contenido.flashcards.length}
                icon={<Volume2 className="w-4 h-4" />}
                isOpen={sections.flashcards}
                onToggle={() => toggleSection('flashcards')}
                onAudio={() => hablarTexto(contenido.flashcards.map(c => c.front + '. ' + c.back).join(' '))}
              >
                <div className="grid gap-3 md:grid-cols-2">
                  {contenido.flashcards.map((card) => (
                    <div
                      key={card.id}
                      className="p-4 rounded-xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900 group-hover:text-blue-700 flex-1">{card.front}</p>
                        <button
                          onClick={() => hablarTexto(card.front + '. ' + card.back)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          title="Escuchar"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-gray-600 text-sm">{card.back}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {contenido.summary && (
              <SectionCard
                title="📝 Resumen"
                icon={<Volume2 className="w-4 h-4" />}
                isOpen={sections.resumen}
                onToggle={() => toggleSection('resumen')}
                onAudio={() => hablarTexto(contenido.summary.summary + '. ' + contenido.summary.keyPoints.join('. '))}
              >
                <div className="p-4 bg-blue-50 rounded-xl mb-4">
                  <p className="text-gray-800 leading-relaxed">{contenido.summary.summary}</p>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-gray-900">Puntos clave:</p>
                  {contenido.summary.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 text-gray-700">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {contenido.questions.length > 0 && (
              <SectionCard
                title="📋 Examen"
                count={contenido.questions.length}
                icon={<Eye className="w-4 h-4" />}
                isOpen={sections.examen}
                onToggle={() => toggleSection('examen')}
                extra={
                  Object.keys(respuestasExamen).length === contenido.questions.length && !mostrarRespuestas && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Nota: {calcularNota()}%
                    </span>
                  )
                }
              >
                {Object.keys(respuestasExamen).length === contenido.questions.length && !mostrarRespuestas && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
                    <p className="font-semibold text-green-700">🎉 ¡Terminaste el examen!</p>
                    <p className="text-green-600">Tu nota: <strong>{calcularNota()}%</strong></p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {contenido.questions.map((q, i) => (
                    <div key={q.id} className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50">
                      <p className="font-medium text-gray-900 mb-3">
                        {i + 1}. {q.question}
                      </p>
                      <div className="space-y-2">
                        {q.options?.map((opt, optIdx) => {
                          const esCorrecta = mostrarRespuestas && optIdx === q.correctAnswer;
                          const esSeleccionada = respuestasExamen[q.id] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              onClick={() => !mostrarRespuestas && seleccionarRespuesta(q.id, optIdx)}
                              disabled={mostrarRespuestas}
                              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                                esCorrecta
                                  ? 'border-green-500 bg-green-100 text-green-700'
                                  : esSeleccionada && !mostrarRespuestas
                                  ? 'border-blue-500 bg-blue-100'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              } ${mostrarRespuestas ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                              {opt}
                              {esCorrecta && <span className="ml-2 font-medium">✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setMostrarRespuestas(!mostrarRespuestas)}
                  className="mt-4 flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Eye className="w-4 h-4" />
                  {mostrarRespuestas ? 'Ocultar respuestas' : 'Ver respuestas correctas'}
                </button>
              </SectionCard>
            )}
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

function SectionCard({
  title,
  count,
  icon,
  children,
  isOpen,
  onToggle,
  onAudio,
  extra,
}: {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  onAudio?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gray-900">{title}</span>
          {count !== undefined && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {count}
            </span>
          )}
          {extra}
        </div>
        <div className="flex items-center gap-2">
          {onAudio && (
            <button
              onClick={(e) => { e.stopPropagation(); onAudio(); }}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Escuchar todo"
            >
              {icon}
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
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
