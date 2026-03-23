'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getToken } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type AIProvider = 'auto' | 'ollama' | 'groq' | 'huggingface';

interface Flashcard {
  id?: string;
  question: string;
  answer: string;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  nextReview?: string;
}

interface QA {
  id?: string;
  question: string;
  answer: string;
  confidence?: number;
}

interface StudyPlan {
  topic: string;
  duration: string;
  activities: string[];
}

interface LogEntry {
  timestamp: Date;
  functionName: string;
  status: 'loading' | 'success' | 'error';
  responseTime: number;
  response: unknown;
  error?: string;
}

const SAMPLE_TEXT = `La fotosíntesis es el proceso mediante el cual las plantas convierten la luz solar en energía química. 
Este proceso ocurre en los cloroplastos de las células vegetales. 
La ecuación general de la fotosíntesis es: 6CO2 + 6H2O + luz solar → C6H12O6 + 6O2.
Las hojas contienen pigmentos como la clorofila que absorben la luz azul y roja.
La fotosíntesis se divide en dos etapas: las reacciones luminosas y el ciclo de Calvin.
En las reacciones luminosas, la clorofila captura la energía luminosa.
En el ciclo de Calvin, el CO2 se convierte en glucosa usando ATP y NADPH.
La tasa de fotosíntesis depende de factores como la intensidad luminosa, la concentración de CO2 y la temperatura.`;

export default function AIDebuggerPage() {
  const [content, setContent] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('auto');
  const [currentResult, setCurrentResult] = useState<{
    type: string;
    data: unknown;
  } | null>(null);
  const [thinkingMessages, setThinkingMessages] = useState<string[]>([
    'Consultando a la IA...',
    'Procesando texto...',
    'Generando contenido...',
    'Analizando estructura...',
    'Casi listo...'
  ]);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const thinkingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, 'timestamp'>) => {
    setLogs(prev => [{ ...entry, timestamp: new Date() }, ...prev].slice(0, 50));
  }, []);

  const speakText = useCallback((text: string) => {
    if (!ttsEnabled || typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1;
    utterance.pitch = 1;
    
    utterance.onstart = () => setSpeakingText(text.substring(0, 50) + '...');
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = () => setSpeakingText(null);
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled]);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.cancel();
      setSpeakingText(null);
    }
  }, []);

  const startThinkingAnimation = useCallback((message: string) => {
    setLoadingMessage(message);
    setThinkingIndex(0);
    thinkingIntervalRef.current = setInterval(() => {
      setThinkingIndex(prev => (prev + 1) % thinkingMessages.length);
    }, 2000);
  }, [thinkingMessages.length]);

  const stopThinkingAnimation = useCallback(() => {
    if (thinkingIntervalRef.current) {
      clearInterval(thinkingIntervalRef.current);
      thinkingIntervalRef.current = null;
    }
    setLoadingMessage('');
  }, []);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result;
          if (!arrayBuffer) {
            reject(new Error('No se pudo leer el archivo'));
            return;
          }

          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: unknown) => {
                const textItem = item as { str?: string };
                return textItem.str || '';
              })
              .join(' ');
            fullText += pageText + '\n';
          }
          
          resolve(fullText);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setPdfFile(file);
      addLog({
        functionName: 'PDF Upload',
        status: 'loading',
        responseTime: 0,
        response: null,
      });

      const startTime = Date.now();
      try {
        const text = await extractTextFromPDF(file);
        setContent(text);
        const responseTime = Date.now() - startTime;
        addLog({
          functionName: 'PDF Upload',
          status: 'success',
          responseTime,
          response: { success: true, textLength: text.length, preview: text.substring(0, 200) },
        });
      } catch (err) {
        addLog({
          functionName: 'PDF Upload',
          status: 'error',
          responseTime: Date.now() - startTime,
          response: null,
          error: err instanceof Error ? err.message : 'Error al procesar PDF',
        });
      }
    } else {
      addLog({
        functionName: 'File Type Error',
        status: 'error',
        responseTime: 0,
        response: null,
        error: 'Solo se aceptan archivos PDF',
      });
    }
  };

  const executeAIFunction = async (funcName: string, endpoint: string) => {
    if (!token) {
      addLog({
        functionName: funcName,
        status: 'error',
        responseTime: 0,
        response: null,
        error: 'No hay token de autenticación',
      });
      return;
    }

    const currentContent = content || SAMPLE_TEXT;
    
    if (!currentContent.trim()) {
      addLog({
        functionName: funcName,
        status: 'error',
        responseTime: 0,
        response: null,
        error: 'No hay contenido para procesar',
      });
      return;
    }

    setLoading(funcName);
    setCurrentResult(null);
    startThinkingAnimation(`Ejecutando ${funcName}...`);
    
    const startTime = Date.now();

    try {
      const body: Record<string, unknown> = {
        content: currentContent,
      };

      if (selectedProvider !== 'auto') {
        body.provider = selectedProvider;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();

      stopThinkingAnimation();

      if (response.ok && data.success) {
        addLog({
          functionName: `${funcName} (${selectedProvider === 'auto' ? 'auto' : selectedProvider})`,
          status: 'success',
          responseTime,
          response: data,
        });

        setCurrentResult({ type: funcName, data: data.data });

        if (ttsEnabled && data.data) {
          let textToSpeak = '';
          if (data.data.summary) textToSpeak = data.data.summary;
          else if (data.data.flashcards) textToSpeak = JSON.stringify(data.data.flashcards);
          else if (data.data.questions) textToSpeak = JSON.stringify(data.data.questions);
          else if (data.data.plan) textToSpeak = JSON.stringify(data.data.plan);
          else if (data.data.topics) textToSpeak = JSON.stringify(data.data.topics);
          
          if (textToSpeak) {
            speakText(textToSpeak.substring(0, 500));
          }
        }
      } else {
        addLog({
          functionName: funcName,
          status: 'error',
          responseTime,
          response: data,
          error: data.error || 'Error en la respuesta',
        });
        setCurrentResult({ type: funcName, data: { error: data.error || 'Error desconocido' } });
      }
    } catch (err) {
      stopThinkingAnimation();
      addLog({
        functionName: funcName,
        status: 'error',
        responseTime: Date.now() - startTime,
        response: null,
        error: err instanceof Error ? err.message : 'Error de conexión',
      });
      setCurrentResult({ type: funcName, data: { error: err instanceof Error ? err.message : 'Error de conexión' } });
    } finally {
      setLoading(null);
    }
  };

  const renderReadableResult = (type: string, data: unknown) => {
    if (!data || typeof data !== 'object') {
      return <pre className="text-gray-300">{JSON.stringify(data, null, 2)}</pre>;
    }

    const dataObj = data as Record<string, unknown>;

    if (type === 'Summarize' && dataObj.summary) {
      const keyPointsArray = dataObj.keyPoints as string[] | undefined;
      const showKeyPoints = keyPointsArray && Array.isArray(keyPointsArray) && keyPointsArray.every(p => typeof p === 'string');
      
      return (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-500 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-2">📝 Resumen</h3>
            <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
              {dataObj.summary as string}
            </p>
          </div>
          {showKeyPoints && (
            <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2">🔑 Puntos Clave</h3>
              <ul className="list-disc list-inside text-gray-200 space-y-1">
                {keyPointsArray?.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    if (type === 'Flashcards' && dataObj.flashcards) {
      const flashcards = dataObj.flashcards as Flashcard[];
      return (
        <div className="space-y-4">
          <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-4">
            <h3 className="text-purple-400 font-semibold mb-2">🃏 Flashcards ({flashcards.length})</h3>
            <p className="text-gray-400 text-sm mb-4">
              Algoritmo SM-2: interval, easeFactor, repetitions
            </p>
          </div>
          <div className="grid gap-3">
            {flashcards.map((card, i) => (
              <div key={i} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-yellow-400 font-medium mb-2">
                      ❓ {card.question}
                    </p>
                    <p className="text-green-400">
                      💡 {card.answer}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1 text-right min-w-[100px]">
                    <p>⏱️ {card.interval ?? 'N/A'} días</p>
                    <p>📊 EF: {card.easeFactor?.toFixed(2) ?? 'N/A'}</p>
                    <p>🔁 {card.repetitions ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'Q&A (Simulacro)' && dataObj.questions) {
      const questions = dataObj.questions as QA[];
      return (
        <div className="space-y-4">
          <div className="bg-orange-900/30 border border-orange-500 rounded-lg p-4">
            <h3 className="text-orange-400 font-semibold mb-2">📋 Examen Simulado ({questions.length} preguntas)</h3>
          </div>
          <div className="grid gap-3">
            {questions.map((qa, i) => (
              <div key={i} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                <p className="text-yellow-400 font-medium mb-2">
                  {i + 1}. {qa.question}
                </p>
                <div className="ml-4 pl-4 border-l-2 border-green-600">
                  <p className="text-green-400">
                    ✅ {qa.answer}
                  </p>
                  {qa.confidence && (
                    <p className="text-gray-500 text-xs mt-1">
                      Confianza: {(qa.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'Study Plan' && dataObj.plan) {
      const plan = dataObj.plan as StudyPlan | StudyPlan[];
      const plans = Array.isArray(plan) ? plan : [plan];
      
      return (
        <div className="space-y-4">
          <div className="bg-cyan-900/30 border border-cyan-500 rounded-lg p-4">
            <h3 className="text-cyan-400 font-semibold mb-2">📅 Plan de Estudio</h3>
          </div>
          {plans.map((p, i) => (
            <div key={i} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-cyan-600 text-white px-3 py-1 rounded-full text-sm">
                  📚 {p.topic}
                </span>
                <span className="text-gray-400 text-sm">
                  ⏱️ {p.duration}
                </span>
              </div>
              {p.activities && (
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  {p.activities.map((act, j) => (
                    <li key={j}>{act}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (type === 'Extract Topics' && dataObj.topics) {
      const topics = dataObj.topics as string[] | { topics: string[] };
      const topicList = Array.isArray(topics) ? topics : topics.topics || [];
      
      return (
        <div className="space-y-4">
          <div className="bg-pink-900/30 border border-pink-500 rounded-lg p-4">
            <h3 className="text-pink-400 font-semibold mb-2">🏷️ Temas Extraídos ({topicList.length})</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {topicList.map((topic, i) => (
              <span key={i} className="bg-pink-900/50 border border-pink-500 px-3 py-1 rounded-full text-pink-300 text-sm">
                {topic}
              </span>
            ))}
          </div>
        </div>
      );
    }

    return <pre className="text-gray-300">{JSON.stringify(data, null, 2)}</pre>;
  };

  const aiFunctions = [
    { name: 'Summarize', endpoint: '/api/ai/summarize' },
    { name: 'Flashcards', endpoint: '/api/ai/flashcards' },
    { name: 'Q&A (Simulacro)', endpoint: '/api/ai/qa' },
    { name: 'Study Plan', endpoint: '/api/ai/study-plan' },
    { name: 'Extract Topics', endpoint: '/api/ai/topics' },
  ];

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-pulse text-xl">Verificando autenticación...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="bg-red-900/50 border-2 border-red-500 rounded-xl p-8 max-w-lg w-full text-center">
          <div className="text-red-400 text-7xl mb-6">🔐</div>
          <h1 className="text-3xl font-bold mb-4 text-red-400">Error de Autenticación</h1>
          <p className="text-gray-300 mb-4">
            No se detectó un token de autenticación válido en localStorage.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-left text-sm mb-6">
            <p className="text-gray-400 mb-2">Para solucionarlo:</p>
            <ol className="list-decimal list-inside text-gray-300 space-y-1">
              <li>Ve a <a href="/onboarding" className="text-blue-400 underline">/onboarding</a></li>
              <li>Regístrate o inicia sesión</li>
              <li>Después vuelve a esta página</li>
            </ol>
          </div>
          <a
            href="/onboarding"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-lg font-bold text-lg transition-colors"
          >
            Ir al Onboarding
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-400">🔬 AI Debugger - Sandbox</h1>
            <p className="text-gray-400 text-sm mt-1">
              Laboratorio de pruebas para validar funciones de IA
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-gray-800 rounded-lg px-4 py-2">
              <label className="text-xs text-gray-400 block mb-1">Proveedor IA</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as AIProvider)}
                className="bg-gray-700 text-white rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">🔄 Auto (Fallback)</option>
                <option value="ollama">🦙 Ollama (Local)</option>
                <option value="groq">⚡ Groq (Cloud)</option>
                <option value="huggingface">🤗 HuggingFace</option>
              </select>
            </div>
            <label className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ttsEnabled}
                onChange={(e) => setTtsEnabled(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm">🔊 TTS</span>
            </label>
            {speakingText && (
              <button
                onClick={stopSpeaking}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ⏹️ Detener
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">📄 Entrada de Contenido</h2>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg mb-4 transition-colors flex items-center justify-center gap-2"
              >
                📎 {pdfFile ? 'Cambiar PDF' : 'Subir PDF'}
              </button>
              
              {pdfFile && (
                <div className="bg-purple-900/30 border border-purple-500 rounded p-3 mb-4">
                  <p className="text-purple-300 text-sm">
                    📄 {pdfFile.name}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {(pdfFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Pega texto aquí para que la IA lo procese..."
                className="w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white resize-none focus:outline-none focus:border-blue-500"
              />
              
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => setContent(SAMPLE_TEXT)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  📝 Usar texto de prueba
                </button>
                <button
                  onClick={() => setContent('')}
                  className="text-sm text-red-400 hover:text-red-300"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">🤖 Acciones de Estudio</h2>
              <div className="grid grid-cols-1 gap-2">
                {aiFunctions.map((func) => (
                  <button
                    key={func.name}
                    onClick={() => executeAIFunction(func.name, func.endpoint)}
                    disabled={loading !== null}
                    className={`px-4 py-4 rounded-lg font-medium transition-all flex items-center justify-between ${
                      loading === func.name
                        ? 'bg-yellow-600 cursor-wait'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-blue-500/25'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {loading === func.name ? '⏳' : '▶️'} {func.name}
                    </span>
                    {loading === func.name && (
                      <span className="text-xs animate-pulse">
                        {thinkingMessages[thinkingIndex]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">📋 Logs de Ejecución</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Ejecuta una función para ver los logs
                  </p>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        log.status === 'success'
                          ? 'bg-green-900/30 border-green-600'
                          : log.status === 'error'
                          ? 'bg-red-900/30 border-red-600'
                          : 'bg-yellow-900/30 border-yellow-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{log.functionName}</span>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded ${
                            log.status === 'success' ? 'bg-green-600' :
                            log.status === 'error' ? 'bg-red-600' : 'bg-yellow-600'
                          }`}>
                            {log.status === 'success' ? '✓' : log.status === 'error' ? '✗' : '⏳'}
                          </span>
                          <span className="text-gray-400">{log.responseTime}ms</span>
                        </div>
                      </div>
                      {log.error && (
                        <p className="text-red-400 text-xs mt-1">❌ {log.error}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {loading && (
              <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 border-2 border-yellow-500 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4 animate-bounce">🤔</div>
                <h3 className="text-xl font-bold text-yellow-400 mb-2">
                  La IA está pensando...
                </h3>
                <p className="text-yellow-300 animate-pulse">
                  {thinkingMessages[thinkingIndex]}
                </p>
              </div>
            )}

            {currentResult && !loading && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">📖 Resultado: {currentResult.type}</h2>
                  <button
                    onClick={() => setCurrentResult(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                {renderReadableResult(currentResult.type, currentResult.data)}
              </div>
            )}

            {!currentResult && !loading && (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="text-6xl mb-4 opacity-50">📚</div>
                <p className="text-gray-400">
                  Ejecuta una función de IA para ver los resultados aquí
                </p>
              </div>
            )}

            <div className="bg-gray-800 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">🔧 Info de Debug</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-700 rounded p-2">
                  <span className="text-gray-400">Token:</span>
                  <span className="text-green-400 font-mono block truncate">
                    {token?.substring(0, 15)}...
                  </span>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <span className="text-gray-400">API:</span>
                  <span className="text-blue-400 font-mono block truncate">
                    {API_URL}
                  </span>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <span className="text-gray-400">Proveedor:</span>
                  <span className="text-purple-400 block">
                    {selectedProvider === 'auto' ? 'Auto' : selectedProvider}
                  </span>
                </div>
                <div className="bg-gray-700 rounded p-2">
                  <span className="text-gray-400">TTS:</span>
                  <span className={ttsEnabled ? 'text-green-400' : 'text-red-400'}>
                    {ttsEnabled ? 'Activado' : 'Desactivado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
