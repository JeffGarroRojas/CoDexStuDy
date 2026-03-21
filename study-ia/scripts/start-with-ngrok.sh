#!/bin/bash

echo "
╔═══════════════════════════════════════════════════════════╗
║              Study-IA - Script de Inicio                 ║
╚═══════════════════════════════════════════════════════════╝
"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && cd .. && pwd)"

echo "[1/5] Verificando servicios..."
if ! pgrep -x "postgres" > /dev/null; then
    echo "❌ PostgreSQL no está corriendo"
    exit 1
fi
echo "✓ PostgreSQL"

if ! pgrep -x "redis-server" > /dev/null; then
    echo "❌ Redis no está corriendo"
    exit 1
fi
echo "✓ Redis"

echo ""
echo "[2/5] Verificando TypeScript..."
cd "$ROOT_DIR/backend" && npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript tiene errores"
    exit 1
fi
echo "✓ TypeScript OK"

cd "$ROOT_DIR/frontend" && npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript frontend tiene errores"
    exit 1
fi
echo "✓ TypeScript Frontend OK"

echo ""
echo "[3/5] Verificando Prisma..."
cd "$ROOT_DIR/backend"
npx prisma generate --no-engine
if [ $? -ne 0 ]; then
    echo "⚠️ Prisma generate falló, intentando continuar..."
fi

echo ""
echo "[4/5] Iniciando Backend en puerto 3001..."
cd "$ROOT_DIR/backend"
npm run dev &
BACKEND_PID=$!
echo "✓ Backend PID: $BACKEND_PID"

sleep 5

echo ""
echo "[5/5] Iniciando Frontend en puerto 3000..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo "✓ Frontend PID: $FRONTEND_PID"

sleep 5

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "Iniciando ngrok para exponer el backend..."
echo "═══════════════════════════════════════════════════════════"

echo ""
echo "Esperando que el backend esté listo..."
sleep 3

curl -s http://localhost:3001/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Backend responde en http://localhost:3001"
else
    echo "⚠️ Backend no responde, esperando más..."
    sleep 5
fi

echo ""
echo "Iniciando ngrok HTTP en puerto 3001..."
ngrok http 3001 --log=stdout > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo "✓ ngrok PID: $NGROK_PID"

sleep 5

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "LINKS DE ACCESO:"
echo "═══════════════════════════════════════════════════════════"
echo ""

FRONTEND_URL=$(grep -o 'https://[a-z0-9-]*\.ngrok-free\.app' /tmp/ngrok.log 2>/dev/null | head -1)
if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(grep -o 'https://[a-z0-9-]*\.ngrok\.io' /tmp/ngrok.log 2>/dev/null | head -1)
fi

NGROK_API_URL="http://localhost:4040/api/tunnels"
if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL=$(curl -s "$NGROK_API_URL" 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
fi

if [ -n "$FRONTEND_URL" ]; then
    echo "🌐 Frontend (ngrok): $FRONTEND_URL"
    echo "🔗 API Backend (ngrok): ${FRONTEND_URL%/*}:3001/api"
    echo ""
    
    echo "📝 Actualizando frontend .env.local..."
    cd "$ROOT_DIR/frontend"
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=${FRONTEND_URL}/api
NEXTAUTH_URL=$FRONTEND_URL
NEXTAUTH_SECRET=study-ia-secret-key-2024-production
EOF
    echo "✓ Configuración actualizada"
    
    echo ""
    echo "🔄 Reiniciando frontend con nueva configuración..."
    kill $FRONTEND_PID 2>/dev/null
    sleep 2
    npm run dev &
    FRONTEND_PID=$!
    sleep 5
    
    echo ""
    echo "═══════════════════════════════════════════════════════════"
    echo "✅ ACCESO PÚBLICO:"
    echo "═══════════════════════════════════════════════════════════"
    echo ""
    echo "🌐 App: $FRONTEND_URL"
    echo "🔗 API: ${FRONTEND_URL}/api"
    echo "❤️  Health: ${FRONTEND_URL}/api/health"
    echo ""
else
    echo "❌ No se pudo obtener URL de ngrok"
    echo "Revisa los logs en: /tmp/ngrok.log"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "PROCESOS CORRIENDO:"
echo "═══════════════════════════════════════════════════════════"
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "ngrok:    /tmp/ngrok.log"
echo ""
echo "Para detener: Ctrl+C o kill $BACKEND_PID $FRONTEND_PID $NGROK_PID"
echo ""

wait
