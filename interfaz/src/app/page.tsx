import Link from 'next/link';
import { BookOpen, Brain, Layers, ChevronRight, Sparkles, Mic, FileText, Volume2, GraduationCap } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <section className="px-4 py-3 bg-blue-600 text-white text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="w-4 h-4" />
          <span>Proyecto Académico - Sección 12-2 - Departamento de Desarrollo de Aplicaciones Móviles</span>
        </div>
      </section>

      <header className="px-4 py-6 mx-auto max-w-6xl">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CoDexStuDy</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/registro"
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
            >
             Comenzar Ahora
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
          CoDexStuDy transforma tus materiales de estudio en resúmenes inteligentes,
          flashcards interactivas, preguntas y respuestas, y planes de estudio personalizados usando IA avanzada.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/registro"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/25"
          >
            Comenzar Ahora
            <ChevronRight className="w-5 h-5" />
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
            icon={<Mic className="w-6 h-6" />}
            title="Texto a Voz (TTS)"
            description="Escucha tus resúmenes y flashcards con síntesis de voz."
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6" />}
            title="Subir PDF"
            description="Sube tus PDFs y la IA extrae los temas automáticamente."
          />
          <FeatureCard
            icon={<Volume2 className="w-6 h-6" />}
            title="Validación de Temas"
            description="Confirma y corrige los temas detectados por la IA."
          />
          <FeatureCard
            icon={<Brain className="w-6 h-6" />}
            title="Aprendizaje Personalizado"
            description="La IA adapta las explicaciones a tu nivel y estilo de aprendizaje."
          />
        </div>
      </section>

      <section className="px-4 py-16 mx-auto max-w-6xl">
        <div className="p-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-3xl text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="mb-2 text-2xl font-bold">¿Listo para estudiar más inteligente?</h2>
              <p className="text-blue-100">Únete a miles de estudiantes que ya usan CoDexStuDy.</p>
            </div>
            <Link
              href="/registro"
              className="px-6 py-3 text-lg font-semibold text-blue-600 bg-white rounded-xl hover:bg-blue-50 transition"
            >
              Empezar Ahora
            </Link>
          </div>
        </div>
      </section>

      <section id="desarrollador" className="px-4 py-6 mx-auto max-w-4xl text-center">
        <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-gray-600 text-xs">
            Proyecto académico - Sección 12-2 - Departamento de Desarrollo de Aplicaciones Móviles
          </p>
        </div>
      </section>

            <footer className="px-4 py-6 mx-auto max-w-6xl text-center text-sm text-gray-500">
        <p>Hecho con ❤️ para estudiantes de Costa Rica.</p>
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
