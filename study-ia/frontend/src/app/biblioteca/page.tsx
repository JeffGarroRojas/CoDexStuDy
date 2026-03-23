'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  LogOut,
  ArrowLeft,
  BookmarkCheck,
  Trash2,
  Play,
  Loader2,
  AlertCircle,
  Clock,
  Plus,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface SavedContent {
  id: string;
  tema: string;
  grado: string | null;
  area: string | null;
  flashcards: any[];
  summary: any | null;
  questions: any[];
  createdAt: string;
}

function SavedStudiesPage() {
  const { user, logout, token } = useAuth();
  const [contenidos, setContenidos] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchContenidos();
  }, [token]);

  const fetchContenidos = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Error al cargar');
      
      const data = await res.json();
      if (data.success) {
        setContenidos(data.data);
      }
    } catch (err) {
      setError('No pude cargar tus estudios guardados.');
    } finally {
      setLoading(false);
    }
  };

  const eliminarContenido = async (id: string) => {
    if (!token || !confirm('¿Eliminar este estudio?')) return;
    
    setDeletingId(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/saved/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setContenidos(prev => prev.filter(c => c.id !== id));
      }
    } catch (err) {
      setError('No pude eliminar el contenido.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const diffDays = Math.floor((hoy.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Mis Estudios</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/nuevo-estudio"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo</span>
            </Link>
            <button onClick={logout} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Tus Estudios</h1>
          <p className="text-gray-600 mt-1">Continúa estudiando donde lo dejaste</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto p-1 hover:bg-red-100 rounded">
              ✕
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : contenidos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No tienes estudios guardados</h2>
            <p className="text-gray-600 mb-6">Crea un nuevo estudio y aparecerán aquí</p>
            <Link
              href="/nuevo-estudio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
            >
              <Sparkles className="w-5 h-5" />
              Crear nuevo estudio
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {contenidos.map((contenido) => (
              <div
                key={contenido.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">{formatearFecha(contenido.createdAt)}</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{contenido.tema}</h3>
                      <div className="flex flex-wrap gap-2">
                        {contenido.grado && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                            {contenido.grado}°
                          </span>
                        )}
                        {contenido.area && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                            {contenido.area}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                          📇 {contenido.flashcards?.length || 0}
                        </span>
                        {contenido.questions?.length > 0 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                            📋 {contenido.questions.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarContenido(contenido.id)}
                      disabled={deletingId === contenido.id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      {deletingId === contenido.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-100">
                  <Link
                    href={`/nuevo-estudio?id=${contenido.id}`}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg hover:scale-105"
                  >
                    <Play className="w-5 h-5" />
                    Continuar estudiando
                  </Link>
                </div>
              </div>
            ))}
            
            <div className="mt-6 text-center">
              <Link
                href="/nuevo-estudio"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-dashed border-gray-300 text-gray-600 font-semibold rounded-xl hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <Plus className="w-5 h-5" />
                Crear otro estudio
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SavedStudiesWrapper() {
  return (
    <ProtectedRoute>
      <SavedStudiesPage />
    </ProtectedRoute>
  );
}
