'use client';

import { WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="bg-red-100 p-4 rounded-full inline-block mb-6 shadow-sm">
          <WifiOff className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sin Conexión</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Parece que has perdido la conexión a internet. CoDexStuDy requiere una conexión de red activa para sincronizar tus estudios con la Inteligencia Artificial.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-blue-700 transition"
        >
          Reintentar conexión
        </button>
        <div className="mt-4">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
