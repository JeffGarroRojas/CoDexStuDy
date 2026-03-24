#!/bin/bash

echo "🔄 Deteniendo túneles anteriores..."
pkill -f "cloudflared" 2>/dev/null
pkill -f "next dev" 2>/dev/null
sleep 2

echo "🚀 Iniciando backend..."
cd /home/jeff/CoDexStuDy/codexstudy/backend
nohup npm run dev > /tmp/backend.log 2>&1 &
sleep 3

echo "🚀 Iniciando frontend..."
cd /home/jeff/CoDexStuDy/codexstudy/frontend
rm -rf .next
nohup npm run dev -- -p 3002 > /tmp/frontend.log 2>&1 &
sleep 8

echo "🌐 Creando túneles de Cloudflare..."
cloudflared tunnel --url http://localhost:3002 > /tmp/frontend-tunnel.log 2>&1 &
FRONTEND_PID=$!

cloudflared tunnel --url http://localhost:3001 > /tmp/backend-tunnel.log 2>&1 &
BACKEND_PID=$!

sleep 8

echo ""
echo "========================================"
echo "🎉 ¡Túneles activos!"
echo "========================================"
echo ""
echo "📱 Frontend (URL para compartir):"
grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/frontend-tunnel.log 2>/dev/null || cat /tmp/frontend-tunnel.log | grep "Your quick Tunnel"
echo ""
echo "🔧 Backend:"
grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/backend-tunnel.log 2>/dev/null || cat /tmp/backend-tunnel.log | grep "Your quick Tunnel"
echo ""
echo "========================================"
echo "Presiona Ctrl+C para detener"
echo "========================================"

wait
