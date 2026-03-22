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
  const [loading, setLoading] = useState(false);

  const areaLabels: Record<string, string> = {
    cientifico: 'Ciencias',
    matematicas: 'Matemáticas',
    espanol: 'Español',
    civica: 'Cívica',
    sociales: 'Estudios Sociales',
    especialidad: 'Especialidad',
    talleres: 'Talleres',
  };

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
