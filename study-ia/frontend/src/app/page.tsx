import Link from 'next/link';
import { BookOpen, Brain, Layers, Zap, ChevronRight, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="px-4 py-6 mx-auto max-w-6xl">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Study-IA</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
            >
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      <section className="px-4 py-20 mx-auto max-w-6xl text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
          <Sparkles className="w-4 h-4" />
          Potenciado por IA
        </div>
        <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
          Aprende más rápido con{' '}
          <span className="text-blue-600">inteligencia artificial</span>
        </h1>
        <p className="max-w-2xl mx-auto mb-10 text-lg text-gray-600">
          Study-IA transforma tus materiales de estudio en resúmenes inteligentes,
          flashcards interactivas y planes de estudio personalizados usando IA avanzada.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
          >
            Comenzar Gratis
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            Ver Funciones
          </Link>
        </div>
      </section>

      <section className="px-4 py-16 mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<BookOpen className="w-6 h-6" />}
            title="Resúmenes Inteligentes"
            description="Transforma documentos largos en resúmenes claros y concisos con puntos clave."
          />
          <FeatureCard
            icon={<Layers className="w-6 h-6" />}
            title="Flashcards Automáticas"
            description="Genera tarjetas de estudio con IA y practica con repetición espaciada."
          />
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            title="Q&A Interactivo"
            description="Crea preguntas y respuestas para repasar cualquier tema."
          />
        </div>
      </section>

      <section className="px-4 py-16 mx-auto max-w-6xl">
        <div className="p-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="mb-2 text-2xl font-bold">¿Listo para estudiar más inteligente?</h2>
              <p className="text-blue-100">Únete a miles de estudiantes que ya usan Study-IA.</p>
            </div>
            <Link
              href="/auth/register"
              className="px-6 py-3 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition"
            >
              Empezar Ahora
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-4 py-8 mx-auto max-w-6xl text-center text-sm text-gray-500">
        <p>© 2026 Study-IA. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="inline-flex items-center justify-center w-12 h-12 mb-4 text-blue-600 bg-blue-100 rounded-xl">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
