'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  Layers,
  BookOpen,
  HelpCircle,
  Calendar,
  Check,
  ArrowLeft,
  File,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type StudyMethod = 'resumen' | 'flashcards' | 'qa' | 'plan' | 'hibrido';

interface MethodOption {
  id: StudyMethod;
  title: string;
  icon: React.ReactNode;
  color: string;
}

const methods: MethodOption[] = [
  { id: 'resumen', title: 'Resumen', icon: <FileText className="w-5 h-5" />, color: 'blue' },
  { id: 'flashcards', title: 'Flashcards', icon: <Layers className="w-5 h-5" />, color: 'green' },
  { id: 'qa', title: 'Q&A', icon: <HelpCircle className="w-5 h-5" />, color: 'purple' },
  { id: 'plan', title: 'Plan', icon: <Calendar className="w-5 h-5" />, color: 'orange' },
  { id: 'hibrido', title: 'Híbrido', icon: <Sparkles className="w-5 h-5" />, color: 'gradient' },
];

type Step = 'upload' | 'topics' | 'method' | 'processing';

function UploadContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<StudyMethod>('hibrido');
  const [flashcardCount, setFlashcardCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/onboarding');
    }
  }, [token, router]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Solo se permiten archivos PDF');
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Solo se permiten archivos PDF');
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !token) return;
    
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      
      if (data.success) {
        setExtractedData(data.data);
        setStep('topics');
        extractTopics(data.data.text);
      } else {
        setError(data.error || 'Error al procesar PDF');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al subir archivo');
    } finally {
      setLoading(false);
    }
  };

  const extractTopics = async (text: string) => {
    if (!token) return;
    setLoadingTopics(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/extract-topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      
      if (data.success && data.data.topics) {
        setTopics(data.data.topics);
      }
    } catch (err) {
      console.error('Error extracting topics:', err);
    } finally {
      setLoadingTopics(false);
    }
  };

  const addTopic = () => {
    const trimmedTopic = newTopic.trim();
    if (trimmedTopic && !topics.includes(trimmedTopic)) {
      setTopics([...topics, trimmedTopic]);
      setNewTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setTopics(topics.filter(t => t !== topicToRemove));
  };

  const handleProcess = async () => {
    if (!extractedData || topics.length === 0 || !token) return;
    
    setStep('processing');
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: extractedData.text,
          title: extractedData.title,
          filename: extractedData.filename,
          method: selectedMethod,
          flashcardCount,
          topics,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        alert('¡Documento procesado exitosamente!');
        router.push('/documents');
      } else {
        setError(data.error || 'Error al procesar');
        setStep('method');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al procesar');
      setStep('method');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return renderUploadStep();
      case 'topics':
        return renderTopicsStep();
      case 'method':
        return renderMethodStep();
      case 'processing':
        return renderProcessingStep();
      default:
        return null;
    }
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {file ? (
          <div className="flex flex-col items-center">
            <File className="w-16 h-16 text-blue-600 mb-4" />
            <p className="text-lg font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <>
            <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arrastra tu PDF aquí o haz clic para seleccionar
            </p>
            <p className="text-sm text-gray-500">
              Solo archivos PDF, máximo 10MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {file && (
        <button
          onClick={handleUpload}
          disabled={loading}
          className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Extrayendo texto...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Analizar PDF
            </>
          )}
        </button>
      )}
    </div>
  );

  const renderTopicsStep = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <File className="w-8 h-8 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{extractedData?.title}</h3>
            <p className="text-sm text-gray-500">
              {extractedData?.pages} páginas • {extractedData?.wordCount?.toLocaleString()} palabras
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Temas detectados</h3>
          {loadingTopics && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          La IA ha detectado los siguientes temas en tu documento. 
          Confirma los que son correctos, elimina los incorrectos y agrega los que falten.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {topics.map((topic, index) => (
            <div
              key={index}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              <Check className="w-3 h-3" />
              <span>{topic}</span>
              <button
                onClick={() => removeTopic(topic)}
                className="ml-1 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {topics.length === 0 && !loadingTopics && (
            <p className="text-gray-500 text-sm">No hay temas detectados</p>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTopic()}
            placeholder="Agregar tema..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
          />
          <button
            onClick={addTopic}
            disabled={!newTopic.trim()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      <button
        onClick={() => topics.length > 0 && setStep('method')}
        disabled={topics.length === 0}
        className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        Continuar con {topics.length} tema{topics.length !== 1 ? 's' : ''}
        <Check className="w-5 h-5" />
      </button>
    </div>
  );

  const renderMethodStep = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Temas confirmados</h3>
        <div className="flex flex-wrap gap-2">
          {topics.map((topic, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
            >
              {topic}
            </span>
          ))}
        </div>
        <button
          onClick={() => setStep('topics')}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Editar temas
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">¿Qué quieres generar?</h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`p-4 rounded-xl border-2 text-left transition flex items-center gap-3 ${
                selectedMethod === method.id
                  ? method.color === 'gradient'
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50'
                    : `border-${method.color}-500 bg-${method.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${
                selectedMethod === method.id
                  ? method.color === 'gradient'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : `bg-${method.color}-500 text-white`
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {method.icon}
              </div>
              <span className="font-medium">{method.title}</span>
              {selectedMethod === method.id && <Check className="w-5 h-5 text-blue-600 ml-auto" />}
            </button>
          ))}
        </div>

        {(selectedMethod === 'flashcards' || selectedMethod === 'hibrido') && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de flashcards: {flashcardCount}
            </label>
            <input
              type="range"
              min="3"
              max="20"
              value={flashcardCount}
              onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>
        )}
      </div>

      <button
        onClick={handleProcess}
        disabled={loading}
        className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Procesando con IA...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Procesar con IA
          </>
        )}
      </button>
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center py-12">
      <div className="inline-flex p-4 bg-blue-100 rounded-full mb-6">
        <Sparkles className="w-12 h-12 text-blue-600 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Procesando tu documento...
      </h2>
      <p className="text-gray-600 mb-4">
        La IA está generando contenido basado en los temas que confirmaste.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {topics.map((topic, i) => (
          <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
            {topic}
          </span>
        ))}
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mt-8" />
    </div>
  );

  const stepLabels = {
    upload: '1. Subir PDF',
    topics: '2. Confirmar Temas',
    method: '3. Elegir Método',
    processing: '4. Procesando',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Brain className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">Subir PDF</span>
        </div>
        
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="flex items-center gap-2 text-sm">
            {Object.entries(stepLabels).map(([key, label], index) => (
              <div key={key} className="flex items-center">
                <div className={`px-2 py-1 rounded ${
                  step === key ? 'bg-blue-600 text-white' : 
                  Object.keys(stepLabels).indexOf(step) > index ? 'bg-green-100 text-green-700' : 
                  'bg-gray-100 text-gray-500'
                }`}>
                  {label}
                </div>
                {index < 3 && <div className="w-4 h-0.5 bg-gray-300 mx-1" />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'upload' && 'Sube tu PDF'}
            {step === 'topics' && 'Confirma los temas'}
            {step === 'method' && 'Elige tu método'}
            {step === 'processing' && 'Procesando...'}
          </h1>
          <p className="text-gray-600">
            {step === 'upload' && 'Arrastra o selecciona un archivo PDF para analizar'}
            {step === 'topics' && 'Revisa y corrige los temas detectados por la IA'}
            {step === 'method' && 'Selecciona qué quieres generar con IA'}
            {step === 'processing' && 'Esto puede tomar unos segundos'}
          </p>
        </div>

        {renderStep()}
      </main>
    </div>
  );
}

export default function UploadPDFPage() {
  return (
    <ProtectedRoute>
      <UploadContent />
    </ProtectedRoute>
  );
}
