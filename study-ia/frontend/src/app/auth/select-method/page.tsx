'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  FileText,
  Layers,
  HelpCircle,
  Calendar,
  Sparkles,
  Check,
  ArrowRight,
} from 'lucide-react';

type StudyMethod = 'resumen' | 'flashcards' | 'qa' | 'plan' | 'hibrido';

interface MethodOption {
  id: StudyMethod;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  features: string[];
}

const methods: MethodOption[] = [
  {
    id: 'resumen',
    title: 'Método de Resumen',
    description: 'Ideal para obtener una visión general rápida del material',
    icon: <FileText className="w-8 h-8" />,
    color: 'blue',
    features: [
      'Resúmenes automáticos del contenido',
      'Puntos clave destacados',
      'Perfecto para revisiones rápidas',
    ],
  },
  {
    id: 'flashcards',
    title: 'Método de Flashcards',
    description: 'Repaso con tarjetas de memoria y repetición espaciada',
    icon: <Layers className="w-8 h-8" />,
    color: 'green',
    features: [
      'Tarjetas de estudio generadas por IA',
      'Repetición espaciada (SM-2)',
      'Seguimiento de progreso',
    ],
  },
  {
    id: 'qa',
    title: 'Método de Preguntas',
    description: 'Aprende mediante preguntas y respuestas',
    icon: <HelpCircle className="w-8 h-8" />,
    color: 'purple',
    features: [
      'Generación automática de Q&A',
      'Evalúa tu comprensión',
      'Repaso interactivo',
    ],
  },
  {
    id: 'plan',
    title: 'Método de Plan de Estudio',
    description: 'Organiza tu estudio con un plan estructurado',
    icon: <Calendar className="w-8 h-8" />,
    color: 'orange',
    features: [
      'Planes personalizados por IA',
      'Organización por temas',
      'Consejos de estudio',
    ],
  },
  {
    id: 'hibrido',
    title: 'Método Híbrido',
    description: 'Combina todos los métodos para un aprendizaje completo',
    icon: <Sparkles className="w-8 h-8" />,
    color: 'gradient',
    features: [
      'Resumen + Flashcards + Q&A + Plan',
      'Experiencia de estudio completa',
      'Recomendado para máximo aprendizaje',
    ],
  },
];

const colorStyles: Record<string, string> = {
  blue: 'bg-blue-500 text-white border-blue-600',
  green: 'bg-green-500 text-white border-green-600',
  purple: 'bg-purple-500 text-white border-purple-600',
  orange: 'bg-orange-500 text-white border-orange-600',
  gradient: 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent',
};

const colorStylesHover: Record<string, string> = {
  blue: 'hover:bg-blue-600 border-blue-700',
  green: 'hover:bg-green-600 border-green-700',
  purple: 'hover:bg-purple-600 border-purple-700',
  orange: 'hover:bg-orange-600 border-orange-700',
  gradient: 'hover:opacity-90 border-transparent',
};

const colorBgHover: Record<string, string> = {
  blue: 'hover:bg-blue-50',
  green: 'hover:bg-green-50',
  purple: 'hover:bg-purple-50',
  orange: 'hover:bg-orange-50',
  gradient: 'hover:bg-purple-50',
};

export default function SelectMethodPage() {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod>('hibrido');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const pendingMethod = localStorage.getItem('pendingMethodSelection');
    
    if (!token || !pendingMethod) {
      router.push('/auth/register');
    }
  }, [router]);

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('pendingMethodSelection') || '{}');
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          studyMethod: selectedMethod,
        }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('token', data.data.token);
        localStorage.removeItem('pendingMethodSelection');
        router.push('/dashboard');
      } else {
        alert(data.error || 'Error al registrar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al conectar');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.removeItem('pendingMethodSelection');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <Brain className="w-10 h-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Study-IA</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            ¿Cómo quieres estudiar?
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Elige tu método de estudio preferido. Puedes cambiar esto después desde tu perfil.
            El método híbrido es el más recomendado para un aprendizaje completo.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                selectedMethod === method.id
                  ? `${colorStyles[method.color]} shadow-lg scale-[1.02]`
                  : `bg-white border-gray-200 ${colorBgHover[method.color]}`
              }`}
            >
              {selectedMethod === method.id && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              )}
              
              {method.id === 'hibrido' && (
                <div className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                  RECOMENDADO
                </div>
              )}

              <div className={`mb-4 mt-2 ${selectedMethod === method.id ? '' : 'text-blue-600'}`}>
                {method.icon}
              </div>
              
              <h3 className={`text-lg font-bold mb-2 ${
                selectedMethod === method.id ? 'text-white' : 'text-gray-900'
              }`}>
                {method.title}
              </h3>
              
              <p className={`text-sm mb-4 ${
                selectedMethod === method.id ? 'text-blue-100' : 'text-gray-600'
              }`}>
                {method.description}
              </p>

              <ul className="space-y-1">
                {method.features.map((feature, i) => (
                  <li key={i} className={`text-xs flex items-center gap-2 ${
                    selectedMethod === method.id ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    <Check className="w-3 h-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                Empezar con {methods.find(m => m.id === selectedMethod)?.title}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          
          <button
            onClick={handleSkip}
            className="px-8 py-4 text-gray-600 font-medium hover:text-gray-900 transition"
          >
            Omitir por ahora
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Podrás cambiar tu método de estudio en cualquier momento desde tu perfil.
        </p>
      </div>
    </div>
  );
}
