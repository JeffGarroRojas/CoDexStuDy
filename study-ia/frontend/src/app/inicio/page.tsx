'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  LogOut,
  Sparkles,
  BookOpen,
  ArrowRight,
  Upload,
  FileText,
  Clock,
  Layers,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Loader2,
  Flame,
  TrendingUp,
  Target,
  CircleDot,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface StudySession {
  id: string;
  tema: string;
  createdAt: string;
  flashcardsCount: number;
}

interface CoDDyProfile {
  metodoPreferido?: string;
  objetivo?: string;
  estiloAprendizaje?: string;
  tiempoDisponible?: string;
}

interface PendingReview {
  count: number;
  topics: string[];
}

interface DashboardStats {
  streak: number;
  totalMinutes: number;
  totalCards: number;
  masteredCards: number;
  dueCards: number;
  areaStats: { area: string; percentage: number }[];
  reviewStats: { red: number; yellow: number; green: number };
}

const SALUDOS = [
  '¡Hola! ¿Qué tal tu día de estudio? 🌟',
  '¡Qué bueno verte de nuevo! 📚',
  '¡Bienvenido de vuelta! ¿Listo para aprender? 🚀',
  '¡Hey! Tu sesión de estudio te está esperando 💪',
];

const METODOS_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  flashcards: { icon: '📇', label: 'Flashcards', color: 'green' },
  resumen: { icon: '📝', label: 'Resúmenes', color: 'blue' },
  examen: { icon: '📋', label: 'Exámenes', color: 'orange' },
  hibrido: { icon: '🔄', label: 'Híbrido', color: 'purple' },
};

function DashboardContent() {
  const { user, logout, token, refreshUser } = useAuth();
  const [saludo, setSaludo] = useState('');
  const [recentStudies, setRecentStudies] = useState<StudySession[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview | null>(null);
  const [coddyProfile, setCoddyProfile] = useState<CoDDyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    refreshUser();
    setSaludo(SALUDOS[Math.floor(Math.random() * SALUDOS.length)]);
  }, []);

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const [studiesRes, coddyRes, flashcardsRes, dashboardRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/study/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/coddy/perfil`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/flashcards/due`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/study/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (studiesRes.status === 'fulfilled' && studiesRes.value.ok) {
        try {
          const studiesData = await studiesRes.value.json();
          if (studiesData.success && Array.isArray(studiesData.data)) {
            setRecentStudies(studiesData.data.slice(0, 3));
          }
        } catch {}
      }

      if (coddyRes.status === 'fulfilled' && coddyRes.value.ok) {
        try {
          const coddyData = await coddyRes.value.json();
          if (coddyData.success && coddyData.data?.perfil) {
            setCoddyProfile(coddyData.data.perfil);
          }
        } catch {}
      }

      if (flashcardsRes.status === 'fulfilled' && flashcardsRes.value.ok) {
        try {
          const flashcardsData = await flashcardsRes.value.json();
          if (flashcardsData.success && Array.isArray(flashcardsData.data)) {
            const dueCards = flashcardsData.data;
            if (dueCards.length > 0) {
              setPendingReviews({
                count: dueCards.length,
                topics: dueCards.slice(0, 3).map((c: any) => c.front?.substring(0, 30) || 'Tarjeta'),
              });
            }
          }
        } catch {}
      }

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        try {
          const dashboardData = await dashboardRes.value.json();
          if (dashboardData.success && dashboardData.data) {
            const d = dashboardData.data;
            setStats({
              streak: d.streak || 0,
              totalMinutes: d.weeklyMinutes || 0,
              totalCards: d.totalCards || 0,
              masteredCards: d.masteredCards || 0,
              dueCards: d.dueCards || 0,
              areaStats: [],
              reviewStats: {
                red: d.dueCards || 0,
                yellow: Math.floor((d.totalCards || 0) * 0.2),
                green: d.masteredCards || 0,
              },
            });
          }
        } catch {}
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const metodoActual = coddyProfile?.metodoPreferido || 'hibrido';
  const metodo = METODOS_LABELS[metodoActual] || METODOS_LABELS.hibrido;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">CoDexStuDy</span>
              <p className="text-xs text-blue-300">Aprende más rápido</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <span className="text-white font-medium">{user?.name || 'Usuario'}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span className="text-white/70 text-sm">{metodo.icon} Método: {metodo.label}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {saludo}
          </h1>
          <p className="text-lg text-blue-200">
            {user?.grado && `${user.grado}° grado`} 
            {user?.area && ` • ${user.area}`}
          </p>
        </div>

        {pendingReviews && pendingReviews.count > 0 && (
          <div className="mb-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1">
                  ¡Tienes {pendingReviews.count} tarjetas por repasar! 📇
                </h3>
                <p className="text-amber-200 mb-4">
                  Es momento de practicar con repetición espaciada para no olvidar lo aprendido.
                </p>
                <Link
                  href="/nuevo-estudio"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:from-amber-600 hover:to-orange-600 transition shadow-lg"
                >
                  <Layers className="w-5 h-5" />
                  Repasar ahora
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/nuevo-estudio"
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 shadow-xl shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/40"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Upload className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Subir Material</h2>
              <p className="text-blue-100 mb-4">PDF o imagen para analizar</p>
              <div className="flex items-center gap-2 text-white/80">
                <span>Comenzar</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition" />
              </div>
            </div>
          </Link>

          <Link
            href="/nuevo-estudio?type=text"
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-8 shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/40"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Escribir Tema</h2>
              <p className="text-emerald-100 mb-4">Describe lo que quieres estudiar</p>
              <div className="flex items-center gap-2 text-white/80">
                <span>Comenzar</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition" />
              </div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-3">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stats?.streak || 0}</p>
            <p className="text-white/60 text-sm">Días de racha</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-3">
              <Target className="w-7 h-7 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stats?.masteredCards || 0}</p>
            <p className="text-white/60 text-sm">Tarjetas dominadas</p>
          </div>
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 text-center">
            <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-3">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <p className="text-3xl font-bold text-white">{stats?.totalMinutes || 0}</p>
            <p className="text-white/60 text-sm">Minutos esta semana</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <CircleDot className="w-5 h-5" />
              Semáforo de Repaso (SM-2)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
                <div className="w-4 h-4 bg-red-500 rounded-full" />
                <span className="text-red-300 flex-1">Por olvidar (urgente)</span>
                <span className="text-white font-bold">{stats?.reviewStats?.red || 0}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-500/20 border border-yellow-500/40 rounded-xl">
                <div className="w-4 h-4 bg-yellow-500 rounded-full" />
                <span className="text-yellow-300 flex-1">Repaso pronto</span>
                <span className="text-white font-bold">{stats?.reviewStats?.yellow || 0}</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-500/20 border border-green-500/40 rounded-xl">
                <div className="w-4 h-4 bg-green-500 rounded-full" />
                <span className="text-green-300 flex-1">Dominadas</span>
                <span className="text-white font-bold">{stats?.reviewStats?.green || 0}</span>
              </div>
            </div>
            <Link
              href="/nuevo-estudio"
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm"
            >
              <Layers className="w-4 h-4" />
              Ver todas las tarjetas
            </Link>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tu Progreso
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Total de tarjetas</span>
                  <span className="text-white font-medium">{stats?.totalCards || 0}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Dominadas</span>
                  <span className="text-green-400 font-medium">{stats?.masteredCards || 0}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full" 
                    style={{ width: `${stats?.totalCards ? (stats.masteredCards / stats.totalCards * 100) : 0}%` }} 
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Por repasar</span>
                  <span className="text-amber-400 font-medium">{stats?.dueCards || 0}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${stats?.totalCards ? (stats.dueCards / stats.totalCards * 100) : 0}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-white/60" />
                <h2 className="text-xl font-bold text-white">Actividad Reciente</h2>
              </div>
              <Link href="/biblioteca" className="text-blue-400 hover:text-blue-300 text-sm">
                Ver todos →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin mx-auto" />
            </div>
          ) : recentStudies.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-white/50" />
              </div>
              <p className="text-white/60 mb-4">No tienes estudios guardados todavía</p>
              <Link
                href="/nuevo-estudio"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
              >
                <Sparkles className="w-5 h-5" />
                Crear tu primer estudio
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {recentStudies.map((study) => (
                <div key={study.id} className="p-4 hover:bg-white/5 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium truncate">{study.tema}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          {study.flashcardsCount || 0} tarjetas
                        </span>
                        <span>{formatDate(study.createdAt)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/study/${study.id}`}
                      className="ml-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition text-sm"
                    >
                      Continuar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 p-6 bg-white/5 backdrop-blur border border-white/10 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Tu perfil con CoDDy</h3>
              <p className="text-white/60 text-sm">Personalizado según tus respuestas</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Método</p>
              <p className="text-white font-medium">{metodo.icon} {metodo.label}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Objetivo</p>
              <p className="text-white font-medium capitalize">{coddyProfile?.objetivo || 'No definido'}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Estilo</p>
              <p className="text-white font-medium capitalize">{coddyProfile?.estiloAprendizaje || 'No definido'}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/60 text-xs mb-1">Tiempo</p>
              <p className="text-white font-medium capitalize">{coddyProfile?.tiempoDisponible || 'No definido'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
