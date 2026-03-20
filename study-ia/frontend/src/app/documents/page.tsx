'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  Plus,
  FileText,
  Search,
  MoreVertical,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchDocuments();
  }, [router]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data.documents);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('¿Eliminar este documento?')) return;
    
    setDeleting(id);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(documents.filter((d) => d.id !== id));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDeleting(null);
    }
  };

  const filteredDocuments = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Study-IA</span>
            </Link>
            <Link
              href="/documents/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
            <p className="text-gray-600">{documents.length} documentos</p>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {search ? 'Sin resultados' : 'Sin documentos'}
            </h3>
            <p className="text-gray-600 mb-4">
              {search ? 'Intenta con otra búsqueda' : 'Crea tu primer documento para empezar'}
            </p>
            {!search && (
              <Link
                href="/documents/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                Crear Documento
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      disabled={deleting === doc.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Link href={`/documents/${doc.id}`}>
                  <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition line-clamp-2">
                    {doc.title}
                  </h3>
                </Link>
                {doc.summary && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{doc.summary}</p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{doc.wordCount} palabras</span>
                  <span>{doc._count?.flashcards || 0} flashcards</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
