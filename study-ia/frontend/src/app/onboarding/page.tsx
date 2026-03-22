'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Loader2, ChevronRight, ChevronLeft, Upload, FileText, Sparkles, Check, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingData {
  name: string;
  grado: string;
  area: string;
  areaLabel: string;
  materias: string[];
  materialType: 'text' | 'file' | null;
  texto: string;
  metodoEstudio: string;
  perfilEstudio: string;
  intensidad: string;
}

const GRADOS_MEP = [
  { value: '7', label: '7° Séptimo' },
  { value: '8', label: '8° Octavo' },
  { value: '9', label: '9° Noveno' },
  { value: '10', label: '10° Décimo' },
  { value: '11', label: '11° Undécimo' },
  { value: '12', label: '12° Duodécimo' },
];

const AREAS_MEP = [
  { value: 'cientifico', label: 'Ciencias', icon: '🔬', materias: ['Física', 'Química', 'Biología', 'Educación Ambiental', 'Estadística', 'Computación', 'Tecnología'] },
  { value: 'matematicas', label: 'Matemáticas', icon: '📐', materias: ['Aritmética', 'Álgebra', 'Geometría', 'Trigonometría', 'Probabilidad y Estadística', 'Cálculo Diferencial', 'Cálculo Integral', 'Matemática Financiera', 'Lógica Matemática', 'Matrices y Vectores'] },
  { value: 'espanol', label: 'Español', icon: '📚', materias: ['Gramática', 'Ortografía', 'Redacción', 'Comprensión Lectora', 'Literacidad Crítica', 'Expresión Oral', 'Literatura Costarricense', 'Literatura Universal'] },
  { value: 'civica', label: 'Cívica', icon: '🏛️', materias: ['Derechos Humanos', 'Constitución Política', 'Democracia', 'Ciudadanía', 'Participación Ciudadana', 'Organización Social', 'Legislación Juvenil', 'Valores Cívicos'] },
  { value: 'sociales', label: 'Estudios Sociales', icon: '🌍', materias: ['Historia de Costa Rica', 'Historia Universal', 'Geografía de Costa Rica', 'Geografía Universal', 'Economía', 'Filosofía', 'Psicología', 'Sociología', 'Educación Ambiental'] },
  { value: 'especialidad', label: 'Especialidad', icon: '⚙️', materias: ['Informática', 'Contabilidad', 'Ejecutivo', 'Ecoturismo', 'Agroecología'] },
  { value: 'talleres', label: 'Talleres', icon: '🔧', materias: [] },
];

const METODOS_ESTUDIO = [
  { value: 'flashcards', label: 'Flashcards', icon: '📇', description: 'Repetición espaciada (SM-2) para memorizar conceptos.' },
  { value: 'resumen', label: 'Resúmenes', icon: '📝', description: 'Resúmenes con ejemplos prácticos de cada tema.' },
  { value: 'examen', label: 'Exámenes Simulados', icon: '📋', description: 'Preguntas tipo prueba para practicar.' },
  { value: 'tts', label: 'Texto a Voz', icon: '🔊', description: 'Escucha el contenido de forma auditiva.' },
];

const PERFIL_ESTUDIO = [
  { value: 'visual', label: 'Viendo', icon: '👁️' },
  { value: 'auditivo', label: 'Escuchando', icon: '👂' },
  { value: 'lectura', label: 'Leyendo', icon: '📖' },
  { value: 'practico', label: 'Practicando', icon: '✍️' },
];

const INTENSIDAD = [
  { value: 'ligera', label: 'Ligera', description: '1-2h/semana' },
  { value: 'moderada', label: 'Moderada', description: '3-5h/semana' },
  { value: 'intensiva', label: 'Intensiva', description: '6+h/semana' },
];

export default function Onboarding() {
  const router = useRouter();
  const { register, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recomendacionIA, setRecomendacionIA] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [animatingStep, setAnimatingStep] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    grado: '',
    area: '',
    areaLabel: '',
    materias: [],
    materialType: null,
    texto: '',
    metodoEstudio: '',
    perfilEstudio: '',
    intensidad: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [mounted, authLoading, isAuthenticated, router]);

  const getAreaActual = useMemo(() => {
    return AREAS_MEP.find(a => a.value === data.area);
  }, [data.area]);

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return data.name.trim().length >= 2;
      case 2: return data.grado !== '';
      case 3: return data.area !== '' && data.materias.length > 0;
      case 4: return true; // El paso 4 es opcional - puede ser texto o solo materias
      default: return true;
    }
  }, [step, data, fileName]);

  const toggleMateria = useCallback((materia: string) => {
    setData(prev => ({
      ...prev,
      materias: prev.materias.includes(materia)
        ? prev.materias.filter(m => m !== materia)
        : [...prev.materias, materia]
    }));
  }, []);

  const setAreaYMetodos = useCallback((areaValue: string) => {
    const area = AREAS_MEP.find(a => a.value === areaValue);
    setData(prev => ({
      ...prev,
      area: areaValue,
      areaLabel: area?.label || '',
      materias: [],
    }));
  }, []);

  const analizarConIA = useCallback(async () => {
    if (!data.texto.trim()) return;
    
    setAnalizando(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/recomendar-metodo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: data.texto,
          grado: data.grado,
          area: data.areaLabel,
          materias: data.materias,
        }),
      });
      
      const result = await response.json();
      if (result.success && result.data?.recomendacion) {
        setRecomendacionIA(result.data.recomendacion);
        if (result.data.metodoRecomendado) {
          setData(prev => ({ ...prev, metodoEstudio: result.data.metodoRecomendado }));
        }
      }
    } catch {
      setError('No pude conectar con la IA. Puedes elegir manualmente.');
    } finally {
      setAnalizando(false);
    }
  }, [data.texto, data.grado, data.areaLabel, data.materias]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setData(prev => ({ ...prev, materialType: 'file', texto: `Archivo: ${file.name}` }));
  }, []);

  const handleNextStep = () => {
    if (canProceed && step < 4) {
      setAnimatingStep(true);
      setTimeout(() => {
        setStep(s => s + 1);
        setAnimatingStep(false);
      }, 150);
    }
  };

  const handlePrevStep = () => {
    setAnimatingStep(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimatingStep(false);
    }, 150);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Registrar usuario
      const registerRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `${data.name.toLowerCase().replace(/\s/g, '')}${Date.now()}@codexstudy.app`,
          password: `temp_${Date.now()}`,
          name: data.name,
        }),
      });
      
      const registerData = await registerRes.json();
      
      if (!registerData.success) {
        setError(registerData.error || 'Error al crear la cuenta');
        setLoading(false);
        return;
      }
      
      // Guardar token
      const token = registerData.data?.token || registerData.token;
      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('userName', data.name);
        localStorage.setItem('userGrado', data.grado);
        localStorage.setItem('userArea', data.area);
      }
      
      // Ir al dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="text-center">
          <Brain className="w-16 h-16 text-blue-600 animate-pulse mx-auto mb-4" />
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 flex flex-col">
      <header className="p-4">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600 animate-bounce" />
          <span className="text-xl font-bold text-gray-900">CoDexStuDy</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i < step ? 'bg-green-500 w-8' : i === step ? 'bg-blue-600 w-10' : 'bg-gray-200 w-8'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-500 animate-pulse">Paso {step} de 4</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-2 animate-shake">
              <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className={`transition-all duration-300 ${animatingStep ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
            {step === 1 && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Hola! 👋</h1>
                <p className="text-gray-600">¿Cómo te llamas?</p>
                
                <div className="relative">
                  <input
                    type="text"
                    value={data.name}
                    onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Escribe tu nombre..."
                    className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-lg"
                    autoFocus
                  />
                  {data.name && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-bounce">
                      <Check className="w-6 h-6 text-green-500" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">¿Qué grado estás? 🎓</h1>
                <p className="text-gray-600">Selecciona tu nivel según el MEP.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {GRADOS_MEP.map((grado, idx) => (
                    <button
                      key={grado.value}
                      onClick={() => setData(prev => ({ ...prev, grado: grado.value }))}
                      className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 hover:scale-105 ${
                        data.grado === grado.value
                          ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/25'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <span className="text-lg font-bold">{grado.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {!data.area ? (
                  <>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">¿Cuál es tu área? 📚</h1>
                    <p className="text-gray-600">Selecciona tu especialización.</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {AREAS_MEP.map((area, idx) => (
                        <button
                          key={area.value}
                          onClick={() => setAreaYMetodos(area.value)}
                          className="p-4 rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 hover:scale-105 text-left animate-fade-in"
                          style={{ animationDelay: `${idx * 75}ms` }}
                        >
                          <span className="text-3xl">{area.icon}</span>
                          <span className="block mt-2 font-semibold text-gray-900">{area.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setData(prev => ({ ...prev, area: '', areaLabel: '', materias: [] }))}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Cambiar área
                    </button>
                    
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl p-4 text-white animate-pulse">
                      <span className="text-3xl">{getAreaActual?.icon}</span>
                      <span className="ml-3 font-bold text-lg">{data.areaLabel}</span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900">Selecciona tus materias:</h3>
                    <div className="flex flex-wrap gap-2">
                      {getAreaActual?.materias.map((materia, idx) => (
                        <button
                          key={materia}
                          onClick={() => toggleMateria(materia)}
                          className={`px-4 py-2 rounded-full border-2 transition-all duration-200 hover:scale-105 ${
                            data.materias.includes(materia)
                              ? 'border-blue-500 bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                              : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                          style={{ animationDelay: `${idx * 30}ms` }}
                        >
                          {data.materias.includes(materia) && <Check className="w-4 h-4 inline mr-1" />}
                          {materia}
                        </button>
                      ))}
                    </div>
                    
                    {data.materias.length > 0 && (
                      <p className="text-sm text-blue-600 font-medium animate-bounce">
                        ✓ {data.materias.length} materia{data.materias.length > 1 ? 's' : ''} seleccionada{data.materias.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">¿Qué quieres estudiar? 📖</h1>
                <p className="text-gray-600">Sube un archivo o escribe el tema.</p>
                
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 animate-pulse">
                  <p className="text-sm text-amber-800">
                    <strong>Formatos:</strong> PDF, Word, imágenes. Estamos mejorando.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setData(prev => ({ ...prev, materialType: 'text' }))}
                    className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 hover:scale-105 ${
                      data.materialType === 'text'
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/25'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    <FileText className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                    <span className="font-semibold">Escribir tema</span>
                  </button>
                  
                  <label
                    className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 hover:scale-105 cursor-pointer ${
                      data.materialType === 'file'
                        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/25'
                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50/50'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-10 h-10 mx-auto mb-2 text-blue-500" />
                    <span className="font-semibold">Subir archivo</span>
                    {fileName && <p className="text-xs text-gray-500 mt-1 truncate">{fileName}</p>}
                  </label>
                </div>
                
                {data.materialType === 'text' && (
                  <div className="space-y-3 animate-fade-in">
                    <textarea
                      value={data.texto}
                      onChange={(e) => setData(prev => ({ ...prev, texto: e.target.value }))}
                      placeholder="Escribe el tema que quieres estudiar..."
                      className="w-full h-32 px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all resize-none"
                    />
                    
                    {data.texto.length > 10 && !recomendacionIA && (
                      <button
                        onClick={analizarConIA}
                        disabled={analizando}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-lg shadow-purple-500/25 disabled:opacity-50"
                      >
                        {analizando ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                        Analizar con IA
                      </button>
                    )}
                    
                    {analizando && (
                      <div className="flex items-center gap-2 text-purple-600 animate-pulse">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">La IA está analizando tu tema...</span>
                      </div>
                    )}
                  </div>
                )}
                
                {!data.materialType && (
                  <p className="text-center text-gray-400 text-sm">
                    Sin material? Escribe el tema directamente arriba
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-8 pt-4">
            {step > 1 ? (
              <button
                onClick={handlePrevStep}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="w-5 h-5" />
                Atrás
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={handleNextStep}
                disabled={!canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !canProceed}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 hover:scale-105 shadow-lg shadow-green-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    Comenzar a estudiar
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}
