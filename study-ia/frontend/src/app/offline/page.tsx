'use client';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <html lang="es">
      <head>
        <title>Offline - CoDexStuDy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
          }
          .container {
            text-align: center;
            max-width: 400px;
          }
          .icon {
            font-size: 4rem;
            margin-bottom: 1.5rem;
          }
          h1 {
            font-size: 1.75rem;
            margin-bottom: 1rem;
            color: #0ea5e9;
          }
          p {
            font-size: 1rem;
            color: #94a3b8;
            margin-bottom: 1.5rem;
            line-height: 1.6;
          }
          .button {
            background: #0ea5e9;
            color: white;
            border: none;
            padding: 0.875rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
          }
          .button:hover {
            background: #0284c7;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="icon">📡</div>
          <h1>Sin conexión</h1>
          <p>
            No hay conexión a internet. Verifica tu red y vuelve a intentarlo.
            <br /><br />
            Mientras tanto, puedes revisar las flashcards que ya descargaste.
          </p>
          <button className="button" onClick={handleRetry}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
