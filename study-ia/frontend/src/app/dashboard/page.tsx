'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  LogOut,
  Sparkles,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function DashboardContent() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const areaLabels: Record<string, string> = {
    cientifico: 'Ciencias',
    matematicas: 'Matemáticas',
    espanol: 'Español',
    civica: 'Cívica',
    sociales: 'Estudios Sociales',
    especialidad: 'Especialidad',
    talleres: 'Talleres',
  };

  useEffect(() => {
    if (user) {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 15 + 5;
        if (p >= 100) {
          p = 100;
          setProgress(100);
          clearInterval(interval);
          setTimeout(() => setLoading(false), 300);
        } else {
          setProgress(Math.min(p, 95));
        }
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [user]);

  if (loading && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-8 animate-pulse">
            <Brain className="w-14 h-14 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">
            ¡Bienvenido, {user.name}!
          </h1>
          
          <p className="text-blue-100 mb-8 animate-fade-in">
            Cargando tu perfil...
          </p>
          
          <div className="w-80 mx-auto bg-white/20 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-white/60 text-sm mt-4 animate-pulse">
            {progress < 50 ? 'Preparando tu espacio de estudio...' : 
             progress < 80 ? 'Cargando estadísticas...' : 
             '¡Casi listo!'}
          </p>
        </div>
        
        <style jsx global>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CoDexStuDy</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.name || 'Usuario'}
            </span>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Hola, {user?.name || 'Usuario'}! 👋
          </h1>
          {user?.grado && (
            <p className="text-gray-600">
              {user.grado}° grado • {areaLabels[user.area || ''] || user.area}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
          <Link
            href="/study"
            className="flex-1 flex items-center justify-center gap-4 p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl transition group"
          >
            <Sparkles className="w-8 h-8" />
            <div className="text-left">
              <p className="font-bold text-xl">Crear Estudio</p>
              <p className="text-blue-100">Generar con IA</p>
            </div>
            <ArrowRight className="w-6 h-6 ml-auto group-hover:translate-x-1 transition" />
          </Link>
          
          <Link
            href="/mis-estudios"
            className="flex-1 flex items-center justify-center gap-4 p-8 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition group"
          >
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="text-left">
              <p className="font-bold text-xl">Mis Estudios</p>
              <p className="text-gray-500">Continuar</p>
            </div>
            <ArrowRight className="w-6 h-6 ml-auto group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
