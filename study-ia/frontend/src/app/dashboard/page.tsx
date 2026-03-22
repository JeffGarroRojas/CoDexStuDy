'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  BookOpen,
  Layers,
  BarChart3,
  LogOut,
  ChevronRight,
  Flame,
  Clock,
  Target,
  Upload,
  FileText,
  TrendingUp,
  Award,
  Zap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface DashboardStats {
  totalCards: number;
  dueCards: number;
  masteredCards: number;
  totalDocuments: number;
  monthlySessions: number;
  weeklyMinutes: number;
  weeklyAccuracy: number;
  streak: number;
  reviewsThisWeek: number;
  dailyStats: Array<{
    date: string;
    minutes: number;
    cardsStudied: number;
    avgAccuracy: number;
  }>;
  difficultyBreakdown: Array<{
    difficulty: string;
    count: number;
  }>;
  weeklyProgress: Array<{
    week: string;
    sessions: number;
    minutes: number;
    cards: number;
  }>;
  recentActivity: any[];
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'];

function DashboardContent() {
  const { user, logout, token, refreshUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!token) return;
    
    try {
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          logout();
          return;
        }
        throw new Error('Error al cargar estadísticas');
      }
      
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('No se pudieron cargar las estadísticas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleLogout = () => {
    logout();
  };

  const handleRetry = () => {
    setLoading(true);
    refreshUser();
    fetchStats();
  };

  const areaLabels: Record<string, string> = {
    cientifico: 'Científico',
    letras: 'Letras',
    sociales: 'Sociales',
    tecnologia: 'Tecnología',
    artes: 'Artes',
    talleres: 'Talleres',
  };

  const hasData = stats && (stats.totalCards > 0 || stats.totalDocuments > 0 || stats.monthlySessions > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CoDexStuDy</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.name || 'Usuario'}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Hola, {user?.name || 'Usuario'}! 👋
          </h1>
          {user?.grado && (
            <p className="text-gray-600">
              Estás en {user.grado}° grado • Área: {areaLabels[user.area || ''] || user.area}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 flex-1">{error}</p>
            <button
              onClick={handleRetry}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
              title="Reintentar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        )}

        {!hasData && !loading && !error ? (
          <EmptyState />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <StatCard
                icon={<Flame className="w-5 h-5" />}
                label="Racha actual"
                value={`${stats?.streak || 0} días`}
                subtext="🔥 ¡Sigue así!"
                color="orange"
              />
              <StatCard
                icon={<BookOpen className="w-5 h-5" />}
                label="Total de tarjetas"
                value={stats?.totalCards || 0}
                subtext={`${stats?.masteredCards || 0} dominadas`}
                color="blue"
              />
              <StatCard
                icon={<Target className="w-5 h-5" />}
                label="Tarjetas por repasar"
                value={stats?.dueCards || 0}
                subtext={`${stats?.reviewsThisWeek || 0} repasadas esta semana`}
                color="red"
              />
              <StatCard
                icon={<Clock className="w-5 h-5" />}
                label="Minutos esta semana"
                value={stats?.weeklyMinutes || 0}
                subtext={`Precisión: ${Math.round((stats?.weeklyAccuracy || 0) * 100)}%`}
                color="green"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-3 mb-8">
              <QuickActionCard
                title="Crear Estudio"
                description="Escribe un tema y genera contenido con IA"
                icon={<Sparkles className="w-6 h-6" />}
                href="/study"
                color="blue"
              />
              <QuickActionCard
                title="Subir PDF"
                description="Sube un PDF y elige tu método de estudio"
                icon={<Upload className="w-6 h-6" />}
                href="/upload"
                color="purple"
              />
              <QuickActionCard
                title="Mis Estudios"
                description="Continúa donde lo dejaste"
                icon={<BookOpen className="w-6 h-6" />}
                href="/mis-estudios"
                color="green"
              />
            </div>

            {(stats?.dailyStats?.length || 0) > 0 && (
              <div className="grid gap-6 lg:grid-cols-2 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Actividad de los últimos 7 días
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={stats?.dailyStats?.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('es', { weekday: 'short' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('es', { weekday: 'long', day: 'numeric' })}
                      />
                      <Bar dataKey="cardsStudied" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tarjetas" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    Progreso por semana
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stats?.weeklyProgress}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                      <Legend />
                      <Line type="monotone" dataKey="minutes" stroke="#22c55e" strokeWidth={2} name="Minutos" />
                      <Line type="monotone" dataKey="cards" stroke="#3b82f6" strokeWidth={2} name="Tarjetas" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}

        {(stats?.recentActivity?.length ?? 0) > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {stats?.recentActivity?.slice(0, 5).map((session: any) => (
                <div key={session.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{session.topic}</p>
                    <p className="text-sm text-gray-500">
                      {session.duration} min • {session.cardsStudied} tarjetas • {Math.round((session.accuracy || 0) * 100)}% precisión
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex p-4 rounded-full bg-blue-100 mb-6">
        <Sparkles className="w-12 h-12 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        ¡Comienza tu viaje de aprendizaje!
      </h2>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Sube un PDF o pega texto para generar flashcards automáticas con IA y empezar a estudiar de manera inteligente.
      </p>
      
      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
        <Link
          href="/upload"
          className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition group"
        >
          <Upload className="w-6 h-6" />
          <div className="text-left">
            <p className="font-semibold">Subir PDF</p>
            <p className="text-sm text-blue-100">Documentos escaneados o libros</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition" />
        </Link>
        
        <Link
          href="/documents/new"
          className="flex items-center justify-center gap-3 p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition group"
        >
          <FileText className="w-6 h-6" />
          <div className="text-left">
            <p className="font-semibold">Texto Directo</p>
            <p className="text-sm text-purple-100">Pega tus apuntes</p>
          </div>
          <ArrowRight className="w-5 h-5 ml-auto group-hover:translate-x-1 transition" />
        </Link>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-3xl mx-auto text-left">
        <FeatureCard
          icon={<Brain className="w-8 h-8 text-blue-600" />}
          title="IA Inteligente"
          description="Genera flashcards automáticamente desde cualquier contenido"
        />
        <FeatureCard
          icon={<Layers className="w-8 h-8 text-green-600" />}
          title="Repetición Espaciada"
          description="Optimiza tu memoria con el algoritmo SM-2"
        />
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8 text-purple-600" />}
          title="Seguimiento"
          description="Visualiza tu progreso y mantén tu racha"
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100">
      <div className={`inline-flex p-2 rounded-xl ${colors[color]} mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  href,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'blue' | 'green' | 'purple';
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <Link
      href={href}
      className="block p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-md transition group"
    >
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${colors[color]} text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition">
        {title}
      </h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
