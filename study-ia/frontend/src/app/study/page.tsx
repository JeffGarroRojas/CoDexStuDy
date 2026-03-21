'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  ArrowLeft,
  Loader2,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Flame,
  HelpCircle,
  Sparkles,
  BookOpen,
} from 'lucide-react';

type Card = {
  id: string;
  front: string;
  back: string;
  tags: string[];
  document?: { title: string };
};

export default function StudyPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ studied: 0, correct: 0 });
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/onboarding');
      return;
    }
    fetchDueCards();
  }, [router]);

  const fetchDueCards = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flashcards/due`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data.flashcards.length > 0) {
        setCards(shuffleArray(data.data.flashcards));
        startSession();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/study/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ topic: 'Study Session' }),
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.data.session.id);
        setSessionStarted(true);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleExplain = async () => {
    const currentCard = cards[currentIndex];
    setShowExplanation(true);
    setLoadingExplanation(true);
    setExplanation('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flashcards/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ flashcardId: currentCard.id }),
      });
      const data = await res.json();
      if (data.success) {
        setExplanation(data.data.explanation);
      } else {
        setExplanation('No se pudo generar la explicación. Intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      setExplanation('Error de conexión. Verifica tu internet.');
    } finally {
      setLoadingExplanation(false);
    }
  };

  const closeExplanation = () => {
    setShowExplanation(false);
    setExplanation('');
  };

  const handleAnswer = async (quality: number) => {
    const currentCard = cards[currentIndex];
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/flashcards/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          flashcardId: currentCard.id,
          quality,
        }),
      });
    } catch (error) {
      console.error('Error saving review:', error);
    }

    setSessionStats((prev) => ({
      studied: prev.studied + 1,
      correct: quality >= 3 ? prev.correct + 1 : prev.correct,
    }));

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    } else {
      setCards([]);
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight' && isFlipped) {
        handleAnswer(4);
      } else if (e.code === 'ArrowLeft' && isFlipped) {
        handleAnswer(1);
      }
    },
    [isFlipped, currentIndex, cards]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Estudiar</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Todo al día!</h2>
          <p className="text-gray-600 mb-6">
            No tienes tarjetas pendientes por repasar.
          </p>
          <Link
            href="/documents"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            Crear más tarjetas
          </Link>
        </main>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Estudiar</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-orange-600">
              <Flame className="w-5 h-5" />
              <span className="font-semibold">{sessionStats.studied}</span>
            </div>
            <span className="text-gray-600">
              {currentIndex + 1} / {cards.length}
            </span>
          </div>
        </div>
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {currentCard.document && (
            <p className="text-center text-sm text-gray-500 mb-4">
              {currentCard.document.title}
            </p>
          )}

          <div
            onClick={handleFlip}
            className="flashcard cursor-pointer w-full aspect-[3/2] mb-8"
          >
            <div className={`flashcard-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>
              <div className="flashcard-front absolute w-full h-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex items-center justify-center">
                <p className="text-xl font-semibold text-gray-900 text-center">
                  {currentCard.front}
                </p>
              </div>
              <div className="flashcard-back absolute w-full h-full bg-blue-600 rounded-2xl shadow-lg p-8 flex items-center justify-center">
                <p className="text-xl font-semibold text-white text-center">
                  {currentCard.back}
                </p>
              </div>
            </div>
          </div>

          {!isFlipped ? (
            <div className="text-center">
              <p className="text-gray-500 mb-4">Toca la tarjeta para ver la respuesta</p>
              <button
                onClick={handleFlip}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
              >
                Mostrar Respuesta
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleAnswer(1)}
                  className="flex-1 py-4 px-6 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  <span>Otra vez</span>
                </button>
                <button
                  onClick={() => handleAnswer(3)}
                  className="flex-1 py-4 px-6 bg-yellow-100 text-yellow-700 rounded-xl hover:bg-yellow-200 transition flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Difícil</span>
                </button>
                <button
                  onClick={() => handleAnswer(4)}
                  className="flex-1 py-4 px-6 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Correcto</span>
                </button>
              </div>

              <button
                onClick={handleExplain}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition flex items-center justify-center gap-2 font-medium"
              >
                <HelpCircle className="w-5 h-5" />
                <span>¿Por qué es esta la respuesta?</span>
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => {
                setCurrentIndex(Math.max(0, currentIndex - 1));
                setIsFlipped(false);
              }}
              disabled={currentIndex === 0}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => {
                setCurrentIndex(Math.min(cards.length - 1, currentIndex + 1));
                setIsFlipped(false);
              }}
              disabled={currentIndex === cards.length - 1}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </main>

      {showExplanation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-t-2xl">
              <div className="flex items-center gap-3 text-white">
                <BookOpen className="w-6 h-6" />
                <h3 className="text-lg font-bold">Explicación Paso a Paso</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 rounded-xl p-4 mb-4">
                <p className="font-semibold text-gray-900 mb-1">Pregunta:</p>
                <p className="text-gray-700">{cards[currentIndex]?.front}</p>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4 mb-4">
                <p className="font-semibold text-green-800 mb-1">Respuesta Correcta:</p>
                <p className="text-green-700">{cards[currentIndex]?.back}</p>
              </div>

              <div className="border-t pt-4">
                <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Explicación de la IA:
                </p>
                
                {loadingExplanation ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-600">Generando explicación...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {explanation}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 p-4 rounded-b-2xl border-t">
              <button
                onClick={closeExplanation}
                className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
