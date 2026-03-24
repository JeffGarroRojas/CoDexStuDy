#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CoDexStuDy - Script de Configuración Automática        ║"
echo "╚════════════════════════════════════════════════════════════╝"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 no está instalado. Por favor instálalo primero."
        exit 1
    fi
    echo "✓ $1 encontrado"
}

echo ""
echo "📋 Verificando dependencias..."
check_command node
check_command npm
check_command docker
check_command cargo

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Se requiere Node.js 18+. Versión actual: $(node -v)"
    exit 1
fi

echo ""
echo "⚙️  Configurando variables de entorno..."

env_file_backend="$PROJECT_DIR/backend/.env"
env_file_frontend="$PROJECT_DIR/frontend/.env.local"

if [ ! -f "$env_file_backend" ]; then
    cat > "$env_file_backend" << 'EOF'
DATABASE_URL="postgresql://codexstudy:codexstudy123@localhost:5432/codexstudy?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-this-to-a-secure-random-string"
CLAUDE_API_KEY="your-claude-api-key-here"
PORT=3001
NODE_ENV=development
EOF
    echo "✓ backend/.env creado"
fi

if [ ! -f "$env_file_frontend" ]; then
    cat > "$env_file_frontend" << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="change-this-to-a-secure-random-string"
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✓ frontend/.env.local creado"
fi

echo ""
echo "📦 Instalando dependencias del backend..."
cd "$PROJECT_DIR/backend"
npm init -y > /dev/null 2>&1
npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken @prisma/client ioredis uuid zod
npm install -D typescript @types/node @types/express @types/cors @types/morgan @types/bcryptjs @types/jsonwebtoken @types/uuid ts-node ts-node-dev prisma

echo "📦 Instalando dependencias del frontend..."
cd "$PROJECT_DIR/frontend"
npm init -y > /dev/null 2>&1
npm install next@14 react react-dom next-auth@beta @next-auth/prisma-adapter @tanstack/react-query zustand clsx tailwind-merge lucide-react
npm install -D typescript @types/react @types/react-dom tailwindcss postcss autoprefixer

echo ""
echo "🗄️  Configurando Prisma..."
cd "$PROJECT_DIR/backend"
npx prisma init --datasource-provider postgresql 2>/dev/null || true

echo ""
echo "🎨 Configurando Tailwind..."
cd "$PROJECT_DIR/frontend"
npx tailwindcss init -p 2>/dev/null || true

echo ""
echo "🔧 Configurando TypeScript..."
cd "$PROJECT_DIR/backend"
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

echo ""
echo "🔧 Configurando Tauri..."
cd "$PROJECT_DIR"
npm create tauri-app@latest frontend-tauri -- --template next-ts --manager npm -y 2>/dev/null || true
if [ -d "frontend-tauri" ]; then
    mv frontend-tauri/* . 2>/dev/null || true
    mv frontend-tauri/.* . 2>/dev/null || true
    rm -rf frontend-tauri
fi

echo ""
echo "🐳 Verificando Docker..."
if ! docker ps &> /dev/null; then
    echo "⚠️  Docker no está corriendo. Inícialo con: sudo systemctl start docker"
else
    echo "✓ Docker está corriendo"
fi

echo ""
echo "📁 Creando archivos de estructura..."
touch "$PROJECT_DIR/backend/src/routes/.gitkeep"
touch "$PROJECT_DIR/backend/src/controllers/.gitkeep"
touch "$PROJECT_DIR/backend/src/services/.gitkeep"
touch "$PROJECT_DIR/backend/src/models/.gitkeep"
touch "$PROJECT_DIR/backend/src/middleware/.gitkeep"
touch "$PROJECT_DIR/backend/src/config/.gitkeep"
touch "$PROJECT_DIR/backend/src/utils/.gitkeep"
touch "$PROJECT_DIR/docs/.gitkeep"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    CONFIGURACIÓN COMPLETA                   ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Para iniciar el proyecto:                                  ║"
echo "║                                                             ║"
echo "║  1. Iniciar contenedores:                                  ║"
echo "║     docker-compose up -d                                   ║"
echo "║                                                             ║"
echo "║  2. Backend (desarrollo):                                   ║"
echo "║     cd backend && npm run dev                              ║"
echo "║                                                             ║"
echo "║  3. Frontend (desarrollo):                                  ║"
echo "║     cd frontend && npm run dev                             ║"
echo "║                                                             ║"
echo "║  4. Desktop Windows:                                        ║"
echo "║     npm run tauri dev                                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
