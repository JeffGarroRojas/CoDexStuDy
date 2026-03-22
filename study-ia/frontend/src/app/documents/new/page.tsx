'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/onboarding');
    }
  }, [router]);

  const handleCreate = async (generateAi: boolean) => {
    if (!title.trim() || !content.trim()) return;
    
    setCreating(true);
    setLoading(generateAi);

    try {
      const token = localStorage.getItem('token');
      
      const docRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      
      const docData = await docRes.json();
      
      if (!docData.success) {
        alert(docData.error || 'Error al crear documento');
        return;
      }

      const documentId = docData.data.document.id;

      if (generateAi) {
        const [summaryRes, flashcardsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/summarize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content, documentId }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/ai/flashcards`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content, count: 5, documentId }),
          }),
        ]);

        const summaryData = await summaryRes.json();
        const flashcardsData = await flashcardsRes.json();

        if (summaryData.success && flashcardsData.success) {
          router.push(`/documents/${documentId}`);
        } else {
          router.push(`/documents/${documentId}`);
        }
      } else {
        router.push(`/documents/${documentId}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar');
    } finally {
      setCreating(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/documents"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Nuevo Documento</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título del documento"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pega o escribe el texto que quieres estudiar..."
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition resize-none"
            />
            <p className="mt-2 text-sm text-gray-500">
              {content.split(/\s+/).filter(Boolean).length} palabras
            </p>
          </div>

          <button
            onClick={() => handleCreate(true)}
            disabled={!title.trim() || !content.trim() || creating}
            className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Procesando con IA...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generar con IA
              </>
            )}
          </button>

          <p className="text-sm text-gray-500 text-center">
            Al usar &quot;Generar con IA&quot;, se creará un resumen y flashcards automáticamente.
          </p>
        </div>
      </main>
    </div>
  );
}
