'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sparkles,
    Send,
    Loader2,
    User,
    CheckCircle2,
    ArrowRight,
    Mic,
    MicOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Message {
    role: 'assistant' | 'user';
    content: string;
}

export default function OnboardingPage() {
    const { user, token, refreshUser, updateLocalUser } = useAuth();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // AUDION Hooks
    const { isListening, toggleListening, stopListening } = useSpeechToText(setInput, 'es-CR');
    const { speak, stop, isSpeaking } = useTextToSpeech('es-CR');

    // Pasos del Onboarding
    const questions = [
        "¡Hola, Mae! Soy CoDDy, tu tutor personal de inteligencia artificial. ¡Me alegra mucho que estés aquí! Cuéntame, ¿cómo te llamas?",
        "¡Mucho gusto! Para personalizar tu experiencia, ¿en qué grado académico estás o qué estás estudiando actualmente?",
        "¡Excelente! Por último, ¿cuál es tu principal objetivo de estudio? (Ejemplo: pasar un examen, aprender un nuevo lenguaje, o simplemente repasar conceptos diarios).",
        "¡Perfecto! He configurado tu perfil. Estoy listo para ayudarte a dominar cualquier tema. ¡Vamos a empezar!"
    ];

    // Auto-Play de voz reactivo
    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'assistant') {
                const timer = setTimeout(() => speak(lastMsg.content), 300);
                return () => clearTimeout(timer);
            }
        }
    }, [messages, speak]);

    // Iniciar conversación
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{ role: 'assistant', content: questions[0] }]);
        }
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userText = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setInput('');
        stopListening();
        setLoading(true);

        // Lógica secuencial
        setTimeout(async () => {
            const nextStep = step + 1;
            setStep(nextStep);

            if (nextStep < questions.length) {
                setMessages(prev => [...prev, { role: 'assistant', content: questions[nextStep] }]);

                // Si es el último paso, guardar todo
                if (nextStep === questions.length - 1) {
                    await finalizeOnboarding();
                }
            }
            setLoading(false);
        }, 1000);
    };

    const finalizeOnboarding = async () => {
        try {
            // Extraer datos de la conversación (Simplificado para el demo)
            const nombre = messages.find(m => m.role === 'user')?.content || user?.name;
            const grado = messages.filter(m => m.role === 'user')[1]?.content || '12';
            const objetivo = messages.filter(m => m.role === 'user')[2]?.content || 'General';

            const res = await fetch(`${API_URL}/api/user/onboarding`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: nombre,
                    grado,
                    objective: objetivo
                })
            });

            if (res.ok) {
                updateLocalUser({ isFirstLogin: false, name: nombre || '', onboardingDone: true });
                // Dar tiempo para escuchar la última frase de CoDDy
            }
        } catch (error) {
            console.error("Error guardando onboarding:", error);
        }
    };

    const startApp = () => {
        router.push('/inicio');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">

                {/* Header Onboarding */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-purple-600/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold">Bienvenida CoDDy</h2>
                            <div className="flex gap-1 mt-1">
                                {[0, 1, 2, 3].map((s) => (
                                    <div key={s} className={`h-1 w-8 rounded-full ${s <= step ? 'bg-blue-500' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.map((ms, i) => (
                        <div key={i} className={`flex gap-4 ${ms.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                ${ms.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
                                {ms.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
                            </div>
                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed 
                ${ms.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-200 border border-white/10'}`}>
                                {ms.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-white/10" />
                            <div className="bg-white/5 h-12 w-32 rounded-2xl" />
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 border-t border-white/10 bg-black/20">
                    {step === questions.length - 1 ? (
                        <button
                            onClick={startApp}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2"
                        >
                            Comenzar mi aventura <ArrowRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={toggleListening}
                                className={`p-4 rounded-2xl border transition-all ${isListening ? 'bg-red-500/20 border-red-500 text-red-500 animate-pulse' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                            >
                                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Escribe tu respuesta..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 text-white outline-none focus:border-blue-500 transition"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || loading}
                                className="p-4 bg-blue-600 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
                            >
                                <Send className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
