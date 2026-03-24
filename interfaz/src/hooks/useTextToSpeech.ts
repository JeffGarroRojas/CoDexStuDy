import { useState, useEffect, useCallback } from 'react';

export function useTextToSpeech(lang: string = 'es-CR') {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            setSupported(true);
            // Detener cualquier audio previo al recargar la ventana
            window.speechSynthesis.cancel();
        }
    }, []);

    const speak = useCallback((text: string) => {
        if (!supported) return;

        // Limpieza ULTRA-AGRESIVA de Markdown y Bloques de Código para locución fluida
        const cleanText = text
            .replace(/```[\s\S]*?```/g, '') // Eliminar bloques de código
            .replace(/`[^`]*`/g, '')        // Eliminar código inline
            .replace(/[*#_~]/g, '')         // Eliminar formatos markdown
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Reemplazar links con texto
            .replace(/(\r\n|\n|\r)/gm, " ")  // Unificar líneas
            .replace(/\s+/g, ' ')            // Colapsar espacios
            .trim();

        if (!cleanText) return;

        window.speechSynthesis.cancel(); // Abortar locución previa inmediatamente

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const voices = window.speechSynthesis.getVoices();

        // Priorización de Voces de Alta Calidad (Google o Microsoft) en Español
        const preferredVoice = voices.find(v =>
            (v.name.includes('Google') || v.name.includes('Microsoft')) &&
            (v.lang.startsWith('es'))
        ) || voices.find(v => v.lang.startsWith('es'));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
            console.log(`🎙️ CoDDy Voice Engine: [${preferredVoice.name}] seleccionado.`);
        }

        utterance.lang = lang;
        utterance.rate = 1.05;  // Velocidad ágil (Mae)
        utterance.pitch = 1.0;  // Tono neutro/estudio

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, [supported, lang]);

    const stop = useCallback(() => {
        if (supported) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    }, [supported]);

    // Asegurar que las voces carguen y auditarlas en la consola
    useEffect(() => {
        if (supported) {
            const logVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    console.log("📑 Catálogo de Voces de ADAMAN-JFF008:");
                    console.table(voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));
                    console.log("%c🎙️ SISTEMA AUDION LISTO - ESPERANDO CLIC DE USUARIO", "color: #818cf8; font-weight: bold; font-size: 14px;");
                }
            };

            logVoices();
            window.speechSynthesis.onvoiceschanged = logVoices;
        }
    }, [supported]);

    return { isSpeaking, speak, stop, supported };
}
