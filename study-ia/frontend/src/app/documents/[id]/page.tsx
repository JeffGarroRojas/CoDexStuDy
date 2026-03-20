'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  Loader2,
  FileText,
  Sparkles,
  Layers,
  BookOpen,
} from 'lucide-react';

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchDocument();
  }, [router, params.id]);

  const fetchDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocument(data.data.document);
      } else {
        router.push('/documents');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    setAiLoading('summary');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: document.content, documentId: document.id }),
      });
      const data = await res.json();
      if (data.success) {
        setDocument({ ...document, summary: data.data.summary, keyPoints: data.data.keyPoints });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setAiLoading(null);
    }
  };

  const generateFlashcards = async () => {
    setAiLoading('flashcards');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: document.content, count: 5, documentId: document.id }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDocument();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setAiLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!document) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/documents"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Documento</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{document.title}</h1>
          <p className="text-gray-600">{document.wordCount} palabras</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{document.content}</p>
            </div>

            {document.flashcards && document.flashcards.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Flashcards ({document.flashcards.length})
                </h2>
                <div className="space-y-3">
                  {document.flashcards.map((card: any) => (
                    <div key={card.id} className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900 mb-1">{card.front}</p>
                      <p className="text-gray-600">{card.back}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/study"
                  className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <BookOpen className="w-4 h-4" />
                  Estudiar ahora
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Acciones con IA</h3>
              <div className="space-y-3">
                <button
                  onClick={generateSummary}
                  disabled={aiLoading === 'summary'}
                  className="w-full flex items-center gap-3 p-3 text-left bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition disabled:opacity-50"
                >
                  {aiLoading === 'summary' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  <div>
                    <p className="font-medium">Generar Resumen</p>
                    <p className="text-xs opacity-75">Resumen + puntos clave</p>
                  </div>
                </button>
                <button
                  onClick={generateFlashcards}
                  disabled={aiLoading === 'flashcards'}
                  className="w-full flex items-center gap-3 p-3 text-left bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition disabled:opacity-50"
                >
                  {aiLoading === 'flashcards' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Layers className="w-5 h-5" />
                  )}
                  <div>
                    <p className="font-medium">Generar Flashcards</p>
                    <p className="text-xs opacity-75">5 tarjetas de estudio</p>
                  </div>
                </button>
              </div>
            </div>

            {document.summary && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-4">Resumen</h3>
                <p className="text-gray-700 text-sm mb-4">{document.summary}</p>
                {document.keyPoints && document.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Puntos Clave</h4>
                    <ul className="space-y-1">
                      {document.keyPoints.map((point: string, i: number) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
