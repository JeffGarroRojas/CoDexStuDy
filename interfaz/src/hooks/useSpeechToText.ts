import { useState, useEffect, useRef } from 'react';

export function useSpeechToText(onTranscript: (text: string | ((prev: string) => string)) => void, lang: string = 'es-CR') {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const onTranscriptRef = useRef(onTranscript);

    // Mantener ref siempre actualizado con el último lambda (evitar infinity loops)
    useEffect(() => {
        onTranscriptRef.current = onTranscript;
    }, [onTranscript]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = lang;

                recognition.onresult = (event: any) => {
                    let temporaryTranscript = '';
                    let finalTranscript = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            temporaryTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (finalTranscript !== '') {
                        onTranscriptRef.current((prev: string) => prev + (prev ? ' ' : '') + finalTranscript);
                    }
                };

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onerror = (e: any) => {
                    console.error("Micrófono Error:", e.error);
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, [lang]);

    const startListening = () => {
        try { recognitionRef.current?.start(); } catch (e) { }
    };

    const stopListening = () => {
        try { recognitionRef.current?.stop(); } catch (e) { }
    };

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return { isListening, startListening, stopListening, toggleListening };
}
