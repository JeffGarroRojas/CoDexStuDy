'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  LogOut,
  Sparkles,
  Upload,
  FileText,
  Loader2,
  ArrowLeft,
  File,
  Volume2,
  VolumeX,
  AlertCircle,
  BookOpen,
  Layers,
  HelpCircle,
  Calendar,
  Check,
  Mic,
  MicOff,
  Play,
  Plus,
  X,
  Edit3,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PASOS_GENERACION = [
  'Analizando tu tema...',
  'Buscando información relevante...',
  'Generando flashcards...',
  'Creando resumen...',
  '¡Todo listo!',
];

const METODOS_VISUAL = {
  flashcards: { icon: <Layers className="w-5 h-5" />, label: 'Flashcards', color: 'green' },
  resumen: { icon: <FileText className="w-5 h-5" />, label: 'Resumen', color: 'blue' },
  examen: { icon: <HelpCircle className="w-5 h-5" />, label: 'Examen', color: 'orange' },
  hibrido: { icon: <Sparkles className="w-5 h-5" />, label: 'Híbrido', color: 'purple' },
};

function NuevoEstudioContent() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  
  const [tema, setTema] = useState('');
  const [temasAdicionales, setTemasAdicionales] = useState<string[]>([]);
  const [temaEditando, setTemaEditando] = useState(false);
  const [temaTemporal, setTemaTemporal] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [metodo, setMetodo] = useState('flashcards');
  const [generando, setGenerando] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [contenido, setContenido] = useState<any>(null);
  const [guardado, setGuardado] = useState(false);
  const [escuchandoVoz, setEscuchandoVoz] = useState(false);
  const [reproduciendoAudio, setReproduciendoAudio] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!token) {
      router.push('/login');
    }
  }, [token, router]);

  useEffect(() => {
    if (contenido && ttsEnabled && !guardado) {
      const utterance = new SpeechSynthesisUtterance('¡Contenido generado! Puedes escucharlo o guardarlo.');
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [contenido, ttsEnabled, guardado]);

  const iniciarReconocimientoVoz = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-CR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      if (transcript.includes('examen') || transcript.includes('crear examen')) {
        setMetodo('examen');
      }
      const temaMatch = transcript.match(/(?:crear|genera|estudiar|sobre|de)\s+(.+)/i);
      if (temaMatch) {
        setTema(temaMatch[1].replace(/^(crear|genera|estudiar|sobre|de)\s+/i, '').trim());
      } else {
        setTema(transcript);
      }
      setEscuchandoVoz(false);
    };

    recognition.onerror = () => {
      setEscuchandoVoz(false);
      setError('Error al reconocer voz. Intenta de nuevo.');
    };

    recognition.onend = () => {
      setEscuchandoVoz(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setEscuchandoVoz(true);
  };

  const detenerReconocimientoVoz = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setEscuchandoVoz(false);
    }
  };

  const agregarTemaAdicional = () => {
    if (temaTemporal.trim() && !temasAdicionales.includes(temaTemporal.trim())) {
      setTemasAdicionales([...temasAdicionales, temaTemporal.trim()]);
      setTemaTemporal('');
    }
  };

  const eliminarTemaAdicional = (t: string) => {
    setTemasAdicionales(temasAdicionales.filter(tema => tema !== t));
  };

  const guardarEdicionTema = () => {
    setTema(temaTemporal);
    setTemaEditando(false);
  };

  const reproducirResumen = () => {
    if (!contenido?.data?.summary) return;
    const texto = typeof contenido.data.summary === 'string' 
      ? contenido.data.summary 
      : contenido.data.summary.summary;
    
    if (reproduciendoAudio) {
      window.speechSynthesis.cancel();
      setReproduciendoAudio(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = 0.9;
    utterance.onend = () => setReproduciendoAudio(false);
    window.speechSynthesis.speak(utterance);
    setReproduciendoAudio(true);
  };

  const handleArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivo(file);
      setArchivoNombre(file.name);
      setTema(`Archivo: ${file.name}`);
    }
  };

  const generarContenido = useCallback(async (retryCount = 0) => {
    const temaFinal = temasAdicionales.length > 0 
      ? `${tema} (también incluye: ${temasAdicionales.join(', ')})`
      : tema;
    
    if (!temaFinal.trim() && !archivoNombre) {
      setError('Ingresa un tema o sube un archivo.');
      return;
    }
    
    setGenerando(true);
    setError(null);
    setContenido(null);
    setPasoActual(0);
    
    try {
      for (let i = 0; i < PASOS_GENERACION.length; i++) {
        setPasoActual(i + 1);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const endpoint = metodo === 'resumen' ? '/api/ai/summarize' : 
                       metodo === 'examen' ? '/api/ai/qa' : '/api/ai/flashcards';
      
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: temaFinal,
          count: metodo === 'flashcards' ? 10 : 5,
        }),
      });
      
      const data = await res.json();
      
      setContenido({
        tema: temaFinal,
        metodo,
        data: data.data || data || {},
        fecha: new Date().toISOString(),
      });
      
    } catch (err) {
      setContenido({
        tema: temaFinal,
        metodo,
        data: {},
        fecha: new Date().toISOString(),
      });
    } finally {
      setGenerando(false);
    }
  }, [tema, temasAdicionales, token, metodo]);

  const guardarYContinuar = async () => {
    if (!contenido || !token) return;
    
    try {
      const res = await fetch(`${API_URL}/api/study/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tema: contenido.tema,
          flashcards: contenido.data?.flashcards || [],
          summary: contenido.data?.summary || {},
          questions: contenido.data?.questions || [],
        }),
      });
      
      if (res.ok) {
        setGuardado(true);
        router.push('/biblioteca');
      } else {
        setError('No pude guardar. Intenta de nuevo.');
      }
    } catch {
      setError('Error de conexión.');
    }
  };

  const reiniciar = () => {
    setContenido(null);
    setTema('');
    setArchivo(null);
    setArchivoNombre(null);
    setError(null);
    setGuardado(false);
  };

  const renderMetodo = METODOS_VISUAL[metodo as keyof typeof METODOS_VISUAL] || METODOS_VISUAL.hibrido;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <header className="bg-white/5 backdrop-blur border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inicio" className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Brain className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold text-white">Nuevo Estudio</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTtsEnabled(!ttsEnabled)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            >
              {ttsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <span className="text-white text-sm">{user?.name}</span>
            </div>
            <button onClick={logout} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!contenido ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h1 className="text-2xl font-bold text-white">¿Qué quieres estudiar?</h1>
                <p className="text-blue-100 mt-1">Escribe tu tema o sube un archivo PDF</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                    archivoNombre
                      ? 'border-green-400 bg-green-500/10 text-green-400'
                      : 'border-white/20 hover:border-blue-400 hover:bg-blue-500/10'
                  }`}>
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">{archivoNombre || 'Subir PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleArchivo}
                      className="hidden"
                      disabled={generando}
                    />
                  </label>
                  
                  <div className="flex items-center justify-center gap-2 px-4 py-6 bg-white/5 rounded-xl border-2 border-dashed border-white/10">
                    <File className="w-5 h-5 text-white/50" />
                    <span className="text-white/50 text-sm">Imágenes (próximamente)</span>
                  </div>
                </div>

                <textarea
                  value={tema}
                  onChange={(e) => { setTema(e.target.value); if (e.target.value) setArchivoNombre(null); }}
                  placeholder="Ej: La fotosíntesis, Independencia de Costa Rica, Funciones matemáticas..."
                  className="w-full h-40 px-4 py-3 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 outline-none transition resize-none text-lg"
                  disabled={generando}
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setTemaTemporal(tema); setTemaEditando(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/80 rounded-lg hover:bg-white/20 transition"
                    disabled={generando || !tema}
                  >
                    <Edit3 className="w-4 h-4" />
                    Corregir tema
                  </button>
                  <button
                    onClick={escuchandoVoz ? detenerReconocimientoVoz : iniciarReconocimientoVoz}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                      escuchandoVoz 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                    disabled={generando}
                  >
                    {escuchandoVoz ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    {escuchandoVoz ? 'Detener' : 'Comando de voz'}
                  </button>
                </div>

                {temaEditando && (
                  <div className="bg-white/10 rounded-lg p-4 border border-blue-400">
                    <h4 className="text-white font-semibold mb-2">Editar tema antes de generar</h4>
                    <textarea
                      value={temaTemporal}
                      onChange={(e) => setTemaTemporal(e.target.value)}
                      placeholder="Edita tu tema aquí..."
                      className="w-full h-20 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:border-blue-400 outline-none resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={guardarEdicionTema}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                      >
                        Aplicar
                      </button>
                      <button
                        onClick={() => setTemaEditando(false)}
                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-white/70 text-sm">Agregar temas adicionales (opcional):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={temaTemporal}
                      onChange={(e) => setTemaTemporal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && agregarTemaAdicional()}
                      placeholder="Agregar tema..."
                      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/20 text-white placeholder-white/40 focus:border-blue-400 outline-none"
                    />
                    <button
                      onClick={agregarTemaAdicional}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {temasAdicionales.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {temasAdicionales.map((t, i) => (
                        <span key={i} className="flex items-center gap-1 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                          {t}
                          <button onClick={() => eliminarTemaAdicional(t)} className="hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3 flex items-center gap-2">
                  <span className="text-amber-400">💡</span>
                  <p className="text-amber-200 text-sm">Sé específico para mejores resultados</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 p-6">
              <h3 className="text-white font-semibold mb-4">Tu método de estudio</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(METODOS_VISUAL).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setMetodo(key)}
                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                      metodo === key
                        ? `border-${value.color}-500 bg-${value.color}-500/20 text-${value.color}-400`
                        : 'border-white/10 text-white/70 hover:border-white/30'
                    }`}
                  >
                    <div className={metodo === key ? `text-${value.color}-400` : 'text-white/70'}>
                      {value.icon}
                    </div>
                    <span className="text-sm font-medium">{value.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {generando ? (
              <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 p-8 text-center">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  {PASOS_GENERACION[pasoActual - 1] || 'Preparando...'}
                </h2>
                <div className="max-w-xs mx-auto bg-white/10 rounded-full h-3 overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 rounded-full"
                    style={{ width: `${(pasoActual / PASOS_GENERACION.length) * 100}%` }}
                  />
                </div>
                <p className="text-white/60">Paso {pasoActual} de {PASOS_GENERACION.length}</p>
              </div>
            ) : (
              <button
                onClick={() => generarContenido()}
                disabled={!tema.trim()}
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Sparkles className="w-6 h-6" />
                Generar con CoDDy
              </button>
            )}

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-500/20 rounded">
                  ✕
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-white/10 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6 text-white" />
                    <div>
                      <h1 className="text-xl font-bold text-white">¡Contenido generado!</h1>
                      <p className="text-green-100 text-sm">{contenido.tema}</p>
                    </div>
                  </div>
                  <button
                    onClick={reiniciar}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    Nuevo
                  </button>
                </div>
              </div>

              <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-sm font-medium rounded-full flex items-center gap-1">
                  {renderMetodo.icon}
                  {renderMetodo.label}
                </span>
                <span className="px-3 py-1 bg-white/10 text-white/60 text-sm rounded-full">
                  {new Date(contenido.fecha).toLocaleDateString('es-CR')}
                </span>
              </div>

              <div className="p-6">
                {contenido.data?.flashcards && (
                  <div className="mb-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-green-400" />
                      {contenido.data.flashcards.length} Flashcards generadas
                    </h3>
                    <div className="space-y-2">
                      {contenido.data.flashcards.slice(0, 3).map((card: any, i: number) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-yellow-400 text-sm font-medium">❓ {card.question || card.front}</p>
                          <p className="text-green-400 text-sm mt-1">💡 {card.answer || card.back}</p>
                        </div>
                      ))}
                      {contenido.data.flashcards.length > 3 && (
                        <p className="text-white/50 text-sm text-center">
                          +{contenido.data.flashcards.length - 3} más al guardar
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {contenido.data?.summary && (
                  <div className="mb-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      Resumen
                      <button
                        onClick={reproducirResumen}
                        className="ml-auto p-2 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/40 transition"
                        title="Escuchar resumen"
                      >
                        {reproduciendoAudio ? <VolumeX className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </h3>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white/80 leading-relaxed">
                        {contenido.data.summary.summary || contenido.data.summary}
                      </p>
                    </div>
                  </div>
                )}

                {contenido.data?.questions && (
                  <div className="mb-4">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-orange-400" />
                      {contenido.data.questions.length} Preguntas
                    </h3>
                    <div className="space-y-2">
                      {contenido.data.questions.slice(0, 3).map((q: any, i: number) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-yellow-400 text-sm">{i + 1}. {q.question}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 text-center">¿Qué quieres hacer?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={guardarYContinuar}
                  disabled={guardado}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg disabled:opacity-50"
                >
                  {guardado ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                  {guardado ? 'Guardando...' : 'Guardar y continuar'}
                </button>
                <button
                  onClick={reiniciar}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all border-2 border-white/30"
                >
                  <Sparkles className="w-5 h-5" />
                  Generar otro
                </button>
              </div>
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

export default function NuevoEstudioPage() {
  return (
    <ProtectedRoute>
      <NuevoEstudioContent />
    </ProtectedRoute>
  );
}
