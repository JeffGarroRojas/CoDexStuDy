#!/bin/bash
# Study-IA - Script de inicio rápido

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Study-IA Starter                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd "$(dirname "$0")/.."

# Verificar Docker
if ! sudo docker ps > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Docker no está corriendo. Intentando iniciar...${NC}"
    sudo systemctl start docker
    sleep 2
fi

# Verificar contenedores
echo -e "${YELLOW}📦 Verificando contenedores...${NC}"
if ! sudo docker ps | grep -q studyia-postgres; then
    echo "  → Iniciando PostgreSQL y Redis..."
    sudo docker compose up -d postgres redis
    sleep 10
fi

echo -e "${GREEN}✓ Contenedores corriendo${NC}"
echo ""

# Backend
echo -e "${YELLOW}🚀 Iniciando Backend...${NC}"
gnome-terminal -- bash -c "cd backend && npm run dev; exec bash" 2>/dev/null || \
xterm -e "cd backend && npm run dev" 2>/dev/null || \
(kterm -e "cd backend && npm run dev") 2>/dev/null || \
(echo "  Abre otra terminal y ejecuta: cd backend && npm run dev") &

sleep 2

# Frontend
echo -e "${YELLOW}🎨 Iniciando Frontend...${NC}"
gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash" 2>/dev/null || \
xterm -e "cd frontend && npm run dev" 2>/dev/null || \
(kterm -e "cd frontend && npm run dev") 2>/dev/null || \
(echo "  Abre otra terminal y ejecuta: cd frontend && npm run dev") &

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗"
echo "║                      ¡Listo!                                 ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000                          ║"
echo "║  Backend:   http://localhost:3001                          ║"
echo "║  API Docs:  http://localhost:3001/api/health                ║"
echo "╚════════════════════════════════════════════════════════════╝"
