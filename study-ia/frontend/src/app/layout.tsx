import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'CoDexStuDy - Tu Asistente de Estudio con IA',
    template: '%s | CoDexStuDy',
  },
  description: 'Plataforma de estudio asistida por IA para estudiantes costarricenses. Transforma materiales en resúmenes, flashcards y planes personalizados.',
  keywords: [
    'estudio',
    'IA',
    'inteligencia artificial',
    'educación',
    'Costa Rica',
    'flashcards',
    'resúmenes',
    'MEP',
    'secundaria',
    'preparatoria',
    'bachillerato',
    'estudiante',
    'aprender',
    'estudiar',
    'colegio',
    'tecnológico',
    'tecnologia educativa'
  ],
  authors: [{ name: 'Jeff Garro', url: 'https://github.com/JeffGarroRojas' }],
  creator: 'Jeff Garro - Desarrollo de Aplicaciones Móviles',
  publisher: 'CoDexStuDy',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CoDexStuDy',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'es_CR',
    url: 'https://codexstudy.com',
    siteName: 'CoDexStuDy',
    title: 'CoDexStuDy - Tu Asistente de Estudio con IA',
    description: 'Transforma materiales de estudio en resúmenes inteligentes, flashcards interactivas y planes personalizados usando IA.',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'CoDexStuDy - Asistente de Estudio con IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CoDexStuDy - Tu Asistente de Estudio con IA',
    description: 'Plataforma de estudio asistida por IA para estudiantes costarricenses.',
    images: ['/icon-512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CoDexStuDy" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192.png" />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
