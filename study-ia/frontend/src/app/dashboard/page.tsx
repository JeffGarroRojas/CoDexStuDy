'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  BookOpen,
  Layers,
  BarChart3,
  Plus,
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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    const isGuest = localStorage.getItem('isGuest');
    const token = localStorage.getItem('token');
    
    if (!token && !isGuest) {
      router.push('/onboarding');
      return;
    }

    if (token) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [router]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasData = stats && (stats.totalCards > 0 || stats.totalDocuments > 0 || stats.monthlySessions > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CoDexStuDy</span>
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {(() => {
          const userName = localStorage.getItem('userName') || 'Estudiante';
          const userGrado = localStorage.getItem('userGrado') || '';
          const userArea = localStorage.getItem('userArea') || '';
          const isGuest = localStorage.getItem('isGuest') === 'true';
          
          return (
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Hola, {userName}! 👋
              </h1>
              {userGrado && (
                <p className="text-gray-600">
                  Estás en {userGrado}° grado • Área: {userArea === 'cientifico' ? 'Científico' : userArea === 'letras' ? 'Letras' : userArea === 'sociales' ? 'Sociales' : userArea === 'tecnologia' ? 'Tecnología' : userArea === 'artes' ? 'Artes' : 'Educación Física'}
                  {isGuest && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Modo Invitado</span>}
                </p>
              )}
              {!userGrado && <p className="text-gray-600">Configura tu perfil para personalizar tu aprendizaje</p>}
            </div>
          );
        })()}

        {!hasData ? (
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
                title="Subir PDF"
                description="Sube un PDF y elige tu método de estudio"
                icon={<Upload className="w-6 h-6" />}
                href="/upload"
                color="purple"
              />
              <QuickActionCard
                title="Texto Directo"
                description="Escribe o pega texto para estudiar"
                icon={<FileText className="w-6 h-6" />}
                href="/documents/new"
                color="blue"
              />
              <QuickActionCard
                title="Estudiar"
                description="Repasa tus tarjetas con repetición espaciada"
                icon={<BarChart3 className="w-6 h-6" />}
                href="/study"
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

            {(stats?.difficultyBreakdown?.length || 0) > 0 && (
              <div className="grid gap-6 lg:grid-cols-2 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-green-600" />
                    Distribución por dificultad
                  </h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={stats?.difficultyBreakdown}
                        dataKey="count"
                        nameKey="difficulty"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {stats?.difficultyBreakdown?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    Resumen general
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Total de documentos</span>
                      <span className="font-bold text-gray-900">{stats?.totalDocuments || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Sesiones este mes</span>
                      <span className="font-bold text-gray-900">{stats?.monthlySessions || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Tarjetas dominadas</span>
                      <span className="font-bold text-green-600">{stats?.masteredCards || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Tiempo total estudiando</span>
                      <span className="font-bold text-blue-600">
                        {Math.round(stats?.weeklyProgress?.reduce((sum, w) => sum + w.minutes, 0) || 0)} min
                      </span>
                    </div>
                  </div>
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
