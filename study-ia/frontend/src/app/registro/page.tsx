'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const codeInputRefs: HTMLInputElement[] = [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      codeInputRefs[index + 1]?.focus();
    }

    if (newCode.every(digit => digit) && newCode.join('').length === 6) {
      verifyCode(newCode.join(''));
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);

    if (pastedData.length === 6) {
      verifyCode(pastedData);
    }
  };

  const validateForm = () => {
    if (formData.name.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Ingresa un correo electrónico válido');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const sendVerificationCode = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/verify/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Error al enviar el código');
        return;
      }

      setMaskedEmail(data.email || formData.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'));
      setStep('verify');
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (fullCode: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/verify/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          code: fullCode,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Código incorrecto');
        setCode(['', '', '', '', '', '']);
        return;
      }

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userId', data.data.user.id);
      localStorage.setItem('userEmail', data.data.user.email);
      localStorage.setItem('userName', data.data.user.name);

      router.push('/onboarding');
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setLoading(true);
    setError(null);
    setCode(['', '', '', '', '', '']);

    try {
      const res = await fetch(`${API_URL}/api/verify/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Error al reenviar el código');
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'form' ? 'Crear Cuenta' : 'Verificar Email'}
          </h1>
          <p className="text-gray-600 mt-2">
            {step === 'form' 
              ? 'Ingresa tus datos para registrarte' 
              : `Enviamos un código a ${maskedEmail}`
            }
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'form' ? (
            <form onSubmit={(e) => { e.preventDefault(); sendVerificationCode(); }} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Ej: juan@ejemplo.com"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite la contraseña"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-6">
                  Ingresa el código de 6 dígitos que recibiste en tu correo
                </p>
                
                <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { if (el) codeInputRefs[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <button
                  onClick={resendCode}
                  className="w-full py-3 text-blue-600 hover:text-blue-700 font-medium text-center"
                >
                  Reenviar código
                </button>
              )}

              <button
                onClick={() => setStep('form')}
                className="w-full py-3 text-gray-600 hover:text-gray-700 font-medium text-center"
              >
                Cambiar correo
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}
