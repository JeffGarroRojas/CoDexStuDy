'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Loader2, ChevronRight, ChevronLeft, Search, Check, X, Plus, Trash2 } from 'lucide-react';

interface OnboardingData {
  name: string;
  grado: string;
  area: string;
  materias: string[];
  temaBuscar: string;
  subtemasSeleccionados: string[];
  temaPersonalizado: string;
  tallerNombre: string;
  interes: string;
}

interface SubtopicResult {
  subtema: string;
  descripcion: string;
  ejemplo: string;
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
  { value: 'cientifico', label: 'Científico', icon: '🔬', materias: ['Matemáticas', 'Física', 'Química', 'Biología', 'Educación Ambiental'] },
  { value: 'letras', label: 'Letras', icon: '📚', materias: ['Español', 'Literatura', 'Inglés', 'Francés'] },
  { value: 'sociales', label: 'Estudios Sociales', icon: '🌍', materias: ['Historia', 'Geografía', 'Cívica', 'Economía', 'Filosofía'] },
  { value: 'tecnologia', label: 'Tecnología', icon: '💻', materias: ['Informática', 'Programación', 'Robótica', 'Electrónica'] },
  { value: 'artes', label: 'Artes', icon: '🎨', materias: ['Dibujo', 'Música', 'Teatro', 'Danza', 'Artesanía'] },
  { value: 'talleres', label: 'Talleres', icon: '🔧', materias: [], hasCustomInput: true },
];

const INTERESES = ['Exámenes', 'Tareas', 'Concursos', 'Trabajo', 'Curiosidad personal'];

const TEMAS_EJEMPLO: Record<string, string[]> = {
  '7': ['Números enteros', 'Fracciones', 'Geometría básica', 'Célula', 'Ecosistemas'],
  '8': ['Ecuaciones de primer grado', 'Números racionales', 'Teorema de Pitágoras', 'Materia y energía', 'Herencia'],
  '9': ['Radicales', 'Sistemas de ecuaciones', 'Semejanza', 'Genética', 'Química básica'],
  '10': ['Funciones', 'Trigonometría', 'Círculo', 'Química orgánica', 'Fuerza y movimiento'],
  '11': ['Límites', 'Derivadas', 'Estadística', 'Genética avanzada', 'Electromagnetismo'],
  '12': ['Integrales', 'Probabilidad', 'Historia de Costa Rica', 'Economía nacional', 'Bioquímica'],
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [buscandoTema, setBuscandoTema] = useState(false);
  const [subtopicResults, setSubtopicResults] = useState<SubtopicResult[]>([]);
  const [customSubtopic, setCustomSubtopic] = useState('');
  
  const [data, setData] = useState<OnboardingData>({
    name: '',
    grado: '',
    area: '',
    materias: [],
    temaBuscar: '',
    subtemasSeleccionados: [],
    temaPersonalizado: '',
    tallerNombre: '',
    interes: '',
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Verificar si el onboarding ya está completo
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      router.push('/dashboard');
      return;
    }

    // Cargar datos guardados si existen
    const savedData = localStorage.getItem('onboardingData');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setData(parsed);
        
        // Si ya tenía datos guardados, ir al paso 4 (tema)
        if (parsed.name && parsed.grado && parsed.area && parsed.materias?.length > 0) {
          setStep(5);
        }
      } catch {
        // Si hay error, empezar desde cero
      }
    }
  }, [mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const toggleMateria = (materia: string) => {
    setData(prev => ({
      ...prev,
      materias: prev.materias.includes(materia)
        ? prev.materias.filter(m => m !== materia)
        : [...prev.materias, materia]
    }));
  };

  const buscarSubtemas = async () => {
    if (!data.temaBuscar || !data.grado) return;
    
    setBuscandoTema(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/buscar-temas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tema: data.temaBuscar,
          grado: data.grado,
          area: data.area,
        }),
      });
      
      const result = await response.json();
      if (result.success && result.data?.subtopics) {
        setSubtopicResults(result.data.subtopics);
      } else {
        setSubtopicResults([]);
        setError('No se encontraron subtemas. Puedes agregar los tuyos.');
      }
    } catch {
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setSubtopicResults([]);
    } finally {
      setBuscandoTema(false);
    }
  };

  const toggleSubtopic = (subtopic: string) => {
    setData(prev => ({
      ...prev,
      subtemasSeleccionados: prev.subtemasSeleccionados.includes(subtopic)
        ? prev.subtemasSeleccionados.filter(s => s !== subtopic)
        : [...prev.subtemasSeleccionados, subtopic]
    }));
  };

  const agregarSubtemaPersonalizado = () => {
    if (customSubtopic.trim() && !data.subtemasSeleccionados.includes(customSubtopic.trim())) {
      setData(prev => ({
        ...prev,
        subtemasSeleccionados: [...prev.subtemasSeleccionados, customSubtopic.trim()]
      }));
      setCustomSubtopic('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Guardar todos los datos en un solo objeto
      localStorage.setItem('onboardingData', JSON.stringify(data));
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('isGuest', 'true');
      
      router.push('/dashboard');
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return data.name.trim().length > 0;
      case 2: return data.grado !== '';
      case 3: return data.area !== '' && (data.area !== 'talleres' || data.tallerNombre.trim().length > 0);
      case 4: return data.materias.length > 0;
      case 5: return data.temaBuscar.trim().length > 0;
      case 6: return data.subtemasSeleccionados.length > 0;
      case 7: return data.interes !== '';
      default: return true;
    }
  };

  const getMateriasArea = () => {
    const area = AREAS_MEP.find(a => a.value === data.area);
    return area ? area.materias : [];
  };

  const getTemasGrado = () => {
    return TEMAS_EJEMPLO[data.grado] || [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
      <header className="p-4">
        <div className="flex items-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">CoDexStuDy</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div
                  key={i}
                  className={`w-10 h-2 rounded-full transition-colors ${
                    i <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-center text-gray-500">
              Paso {step} de 7
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            {step === 1 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Cómo te llamas?</h1>
                <p className="text-gray-600 mb-6">Tu nombre para personalizar tu experiencia.</p>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-lg"
                  autoFocus
                />
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Qué grado cursas?</h1>
                <p className="text-gray-600 mb-6">Según el plan de estudios del MEP Costa Rica.</p>
                <div className="grid grid-cols-2 gap-3">
                  {GRADOS_MEP.map(grado => (
                    <button
                      key={grado.value}
                      onClick={() => setData(prev => ({ ...prev, grado: grado.value, subtemasSeleccionados: [], temaBuscar: '' }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.grado === grado.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg font-semibold">{grado.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Cuál es tu área?</h1>
                <p className="text-gray-600 mb-6">Tu especialización según el MEP.</p>
                <div className="grid grid-cols-2 gap-3">
                  {AREAS_MEP.map(area => (
                    <button
                      key={area.value}
                      onClick={() => {
                        if (area.value === 'talleres') {
                          setData(prev => ({ 
                            ...prev, 
                            area: area.value, 
                            materias: [],
                            tallerNombre: prev.tallerNombre || ''
                          }));
                        } else {
                          setData(prev => ({ 
                            ...prev, 
                            area: area.value, 
                            materias: [],
                            tallerNombre: ''
                          }));
                        }
                      }}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.area === area.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mr-2">{area.icon}</span>
                      <span className="font-semibold">{area.label}</span>
                    </button>
                  ))}
                </div>
                
                {data.area === 'talleres' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ¿Cómo se llama el taller?
                    </label>
                    <input
                      type="text"
                      value={data.tallerNombre}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setData(prev => ({ 
                          ...prev, 
                          tallerNombre: newName,
                          // Si escribe el nombre del taller, agregarlo automáticamente como materia
                          materias: newName.trim() ? [newName.trim()] : []
                        }));
                      }}
                      placeholder="Ej: Soldadura, Carpintería, Cocina, Electricidad..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-lg"
                      autoFocus
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Escribe el nombre del taller para que la IA pueda investigar qué temas se ven.
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Qué materias te interesan?</h1>
                <p className="text-gray-600 mb-6">Selecciona las materias de tu área.</p>
                <div className="space-y-2">
                  {data.area === 'talleres' ? (
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-blue-700 font-medium">
                        Taller: {data.tallerNombre || 'Sin especificar'}
                      </p>
                      <p className="text-sm text-blue-600 mt-2">
                        La IA investigará los temas de este taller para crear contenido personalizado.
                      </p>
                      <button
                        onClick={() => toggleMateria(data.tallerNombre || 'Taller general')}
                        className={`mt-4 px-6 py-2 rounded-xl border-2 transition-all ${
                          data.materias.includes(data.tallerNombre || 'Taller general')
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        {data.materias.includes(data.tallerNombre || 'Taller general') ? '✓ Seleccionado' : 'Seleccionar taller'}
                      </button>
                    </div>
                  ) : data.area ? (
                    getMateriasArea().map(materia => (
                      <button
                        key={materia}
                        onClick={() => toggleMateria(materia)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          data.materias.includes(materia)
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {materia}
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">Selecciona un área primero</p>
                  )}
                </div>
                {data.materias.length > 0 && (
                  <p className="mt-4 text-sm text-blue-600">
                    {data.materias.length} materia{data.materias.length > 1 ? 's' : ''} seleccionada{data.materias.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}

            {step === 5 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Qué tema quieres estudiar?</h1>
                <p className="text-gray-600 mb-4">
                  Escribe el tema que deseas aprender. La IA lo adaptará a tu nivel de {data.grado}° grado.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema que quieres estudiar:
                  </label>
                  <input
                    type="text"
                    value={data.temaBuscar}
                    onChange={(e) => setData(prev => ({ ...prev, temaBuscar: e.target.value }))}
                    placeholder="Ej: Funciones, Fotosíntesis, Historia de Costa Rica..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
                  />
                </div>

                {data.grado && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <p className="text-sm font-medium text-blue-700 mb-2">Temas típicos de {data.grado}°:</p>
                    <div className="flex flex-wrap gap-2">
                      {getTemasGrado().map((tema, i) => (
                        <button
                          key={i}
                          onClick={() => setData(prev => ({ ...prev, temaBuscar: tema }))}
                          className="px-3 py-1 text-xs bg-white text-blue-600 rounded-full border border-blue-200 hover:border-blue-400 transition"
                        >
                          {tema}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                    {error}
                  </div>
                )}

                <button
                  onClick={buscarSubtemas}
                  disabled={!data.temaBuscar || buscandoTema}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {buscandoTema ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                  Buscar subtemas en {data.grado}°
                </button>
              </div>
            )}

            {step === 6 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Selecciona los subtemas</h1>
                <p className="text-gray-600 mb-4">
                  La IA encontró estos subtemas para &quot;{data.temaBuscar}&quot; en {data.grado}°. 
                  Selecciona los que quieres estudiar o agrega los tuyos.
                </p>

                {subtopicResults.length > 0 ? (
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                    {subtopicResults.map((result, i) => (
                      <div 
                        key={i}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          data.subtemasSeleccionados.includes(result.subtema)
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <button
                          onClick={() => toggleSubtopic(result.subtema)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  data.subtemasSeleccionados.includes(result.subtema)
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-gray-300'
                                }`}>
                                  {data.subtemasSeleccionados.includes(result.subtema) && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </span>
                                <span className="font-semibold text-gray-900">{result.subtema}</span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1 ml-7">{result.descripcion}</p>
                              {result.ejemplo && (
                                <div className="mt-2 ml-7 p-2 bg-yellow-50 rounded-lg">
                                  <p className="text-xs text-yellow-700"><strong>Ejemplo:</strong> {result.ejemplo}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center text-gray-500">
                    <p>No se encontraron subtemas. ¡Agrega los tuyos!</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={customSubtopic}
                    onChange={(e) => setCustomSubtopic(e.target.value)}
                    placeholder="Agregar subtema personalizado..."
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition"
                    onKeyDown={(e) => e.key === 'Enter' && agregarSubtemaPersonalizado()}
                  />
                  <button
                    onClick={agregarSubtemaPersonalizado}
                    disabled={!customSubtopic.trim()}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {data.subtemasSeleccionados.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-blue-700 mb-2">Subtemas seleccionados:</p>
                    <div className="flex flex-wrap gap-2">
                      {data.subtemasSeleccionados.map((sub, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full flex items-center gap-1">
                          {sub}
                          <button onClick={() => toggleSubtopic(sub)} className="hover:text-red-200">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 7 && (
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">¿Cuál es tu objetivo?</h1>
                <p className="text-gray-600 mb-6">¿Por qué quieres usar CoDexStuDy?</p>
                <div className="space-y-3">
                  {INTERESES.map(interes => (
                    <button
                      key={interes}
                      onClick={() => setData(prev => ({ ...prev, interes }))}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        data.interes === interes
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {interes}
                    </button>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-semibold text-gray-900 mb-2">Resumen de tu configuración:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Nombre: <strong>{data.name}</strong></p>
                    <p>• Grado: <strong>{data.grado}°</strong></p>
                    <p>• Área: <strong>{data.area}</strong></p>
                    <p>• Materias: <strong>{data.materias.join(', ')}</strong></p>
                    <p>• Tema: <strong>{data.temaBuscar}</strong></p>
                    <p>• Subtemas: <strong>{data.subtemasSeleccionados.length}</strong> seleccionados</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Atrás
                </button>
              ) : (
                <div />
              )}

              {step < 7 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading || !canProceed()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Comenzar
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}