'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, Mail, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VerificarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email = typeof window !== 'undefined' ? localStorage.getItem('pendingEmail') || localStorage.getItem('userEmail') || '' : '';

  useEffect(() => {
    if (!email) {
      router.push('/registro');
    }
  }, [email, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      inputRefs.current[5]?.focus();
      verificarCodigo(newCode.join(''));
    }
  };

  const verificarCodigo = async (codigo?: string) => {
    const codigoFinal = codigo || code.join('');
    if (codigoFinal.length !== 6) {
      setError('Ingresa los 6 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codigoFinal }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Código incorrecto');
        return;
      }

      setSuccess(true);
      
      setTimeout(() => {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userId', data.data.user.id);
        localStorage.setItem('userEmail', data.data.user.email);
        localStorage.setItem('userName', data.data.user.name || '');
        localStorage.removeItem('pendingEmail');
        router.push('/bienvenida-coddy');
      }, 1500);
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const reenviarCodigo = async () => {
    if (countdown > 0) return;

    setResending(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (data.success) {
        setCountdown(60);
        setError(null);
      } else {
        setError(data.error || 'Error al reenviar');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Verifica tu correo</h1>
          <p className="text-gray-600 mt-2">
            Te enviamos un código de 6 dígitos a<br />
            <span className="font-semibold text-blue-600">{email}</span>
          </p>
        </motion.div>

        {success ? (
          <motion.div 
            className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.2 }}
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-xl font-bold text-green-800 mb-2">¡Correo verificado!</h2>
            <p className="text-green-600">Redirigiendo al perfil...</p>
          </motion.div>
        ) : (
          <motion.div 
            className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onFocus={() => inputRefs.current[index]?.select()}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition"
                />
              ))}
            </div>

            <button
              onClick={() => verificarCodigo()}
              disabled={loading || code.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Verificar código
                </>
              )}
            </button>

            <div className="mt-6 text-center">
              {countdown > 0 ? (
                <p className="text-gray-500 text-sm">
                  Podrás reenviar en {countdown} segundos
                </p>
              ) : (
                <button
                  onClick={reenviarCodigo}
                  disabled={resending}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {resending ? 'Enviando...' : '¿No recibiste el código? Reenviar'}
                </button>
              )}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </motion.div>
        )}

        <p className="text-center mt-6 text-gray-500 text-sm">
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Volver al login
          </button>
        </p>
      </motion.div>
    </div>
  );
}
