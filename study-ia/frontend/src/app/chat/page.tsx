'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  LogOut,
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  User,
  Trash2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

function ChatPage() {
  const { user, logout, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `¡Hola! Soy tu asistente de estudio con IA. Puedo ayudarte con:

• Explicarte temas de cualquier materia
• Resolver dudas sobre tus apuntes
• Ayudarte a entender conceptos difíciles
• Prepararte para exámenes

¿En qué puedo ayudarte hoy?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (token) {
      loadHistory();
    }
  }, [token]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const loadedMessages: Message[] = data.data.map((msg: any, index: number) => ({
          id: `loaded-${index}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        }));
        if (loadedMessages.length > 0) {
          setMessages(loadedMessages);
        }
      }
    } catch (err) {
      // Silenciosamente ignorar errores de red
    }
  };

  const saveMessage = async (role: string, content: string) => {
    try {
      await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ role, content }),
      });
    } catch (err) {
      // Silenciosamente ignorar errores de red
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    saveMessage('user', userMessage.content);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: input.trim(),
          grado: user?.grado || '12',
          area: user?.area || '',
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        let assistantResponse = '';
        
        try {
          const rawData = data.data;
          
          if (typeof rawData === 'string') {
            assistantResponse = rawData;
          } else if (typeof rawData === 'object' && rawData !== null) {
            const innerData = rawData.response || rawData.message || rawData.content || rawData.mensaje || rawData;
            
            if (typeof innerData === 'string') {
              assistantResponse = innerData;
            } else if (typeof innerData === 'object') {
              assistantResponse = innerData.mensaje || innerData.text || innerData.response || JSON.stringify(innerData);
            } else {
              assistantResponse = String(innerData);
            }
          } else {
            assistantResponse = String(rawData);
          }
        } catch (e) {
          console.error('Error parsing response:', e);
          assistantResponse = 'Entendí tu pregunta. ¿Podrías reformularla?';
        }
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: assistantResponse,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        saveMessage('assistant', assistantResponse);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.error || 'Lo siento, tuve un problema al responder. ¿Podrías intentar de nuevo?',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        saveMessage('assistant', errorMessage.content);
      }
    } catch (error) {
      console.error('Error en chat:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Error de conexión. Verifica tu internet e intenta de nuevo.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      saveMessage('assistant', errorMessage.content);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch(`${API_URL}/api/chat`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (err) {
      console.error('Error limpiando historial:', err);
    }
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: `¡Hola! Soy tu asistente de estudio con IA. ¿En qué puedo ayudarte hoy?`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/inicio" className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">Asistente IA</span>
              <p className="text-xs text-gray-500">CoDexStuDy</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Nuevo chat"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user'
                    ? 'bg-blue-600'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Sparkles className="w-5 h-5 text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('es', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Escribiendo...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu pregunta..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            La IA puede cometer errores. Verifica información importante.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatWrapper() {
  return (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  );
}
