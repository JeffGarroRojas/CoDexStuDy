import '@/styles/globals.css'

export const metadata = {
  title: 'CoDexStuDy - Aprende más rápido con inteligencia artificial',
  description: 'CoDexStuDy transforma tus materiales de estudio en resúmenes inteligentes, flashcards interactivas, preguntas y respuestas, y planes de estudio personalizados usando IA avanzada.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
