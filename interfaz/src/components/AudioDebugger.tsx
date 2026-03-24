"use client";

import React from 'react';
import { Volume2, Square, Info } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

export default function AudioDebugger() {
    const { speak, stop, isSpeaking, supported } = useTextToSpeech('es-CR');

    const testMessage = "¡Hola, Mae! Soy CoDDy. Estoy configurado a una velocidad de uno punto cero cinco para sonar más natural. Ahora mismo estoy ignorando este bloque de código: const x = 10;. ¿Cómo me escuchas? ¿Listo para estudiar?";

    if (!supported) return null;

    return (
        <div className="fixed bottom-24 right-6 z-50 animate-bounce-slow">
            <div className="bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 max-w-[280px] backdrop-blur-md">
                <div className="flex items-center gap-2 text-indigo-500">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Test de Narración AUDION</span>
                </div>

                <p className="text-[10px] text-slate-400 leading-tight">
                    Presiona la bocina para validar la limpieza de código y la naturalidad 1.05x.
                </p>

                <button
                    onClick={() => isSpeaking ? stop() : speak(testMessage)}
                    className={`w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 shadow-lg
            ${isSpeaking
                            ? 'bg-red-100 text-red-600 border border-red-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 active:scale-95'}`}
                >
                    {isSpeaking ? (
                        <>
                            <Square className="w-5 h-5 fill-current" />
                            <span className="font-bold">DETENER</span>
                        </>
                    ) : (
                        <>
                            <Volume2 className="w-5 h-5" />
                            <span className="font-bold uppercase italic">FORZAR AUDIO</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
