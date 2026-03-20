# Study-IA

Plataforma de estudio asistida por inteligencia artificial para crear resúmenes, flashcards, preguntas y respuestas, y planes de estudio personalizados.

![Study-IA](https://img.shields.io/badge/Study-IA-0ea5e9?style=for-the-badge)

## Características

- 📝 **Resúmenes Inteligentes**: Transforma documentos largos en resúmenes claros
- 🃏 **Flashcards Automáticas**: Genera tarjetas de estudio con IA
- ❓ **Q&A Interactivo**: Crea preguntas y respuestas para repasar
- 📅 **Repetición Espaciada**: Algoritmo SM-2 para optimizar el aprendizaje
- 📊 **Dashboard**: Estadísticas y seguimiento del progreso
- 📱 **Responsive**: Funciona en móvil y escritorio (PWA)
- 💻 **App de Escritorio**: Genera ejecutable .exe para Windows con Tauri

## Stack Tecnológico

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js
- TanStack Query
- Zustand

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis

### IA
- **Ollama** (local, gratuito)
- **Groq** (API gratuita)
- **Hugging Face** (modelos open source)

## Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- PostgreSQL 16+ (o contenedor Docker)
- Redis 7+ (o contenedor Docker)
- Rust (para Tauri, solo para build de escritorio)

### Opcional: Ollama (IA local)
```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Windows
winget install Ollama.Ollama

# Descargar modelo
ollama pull llama3.2
```

## Instalación Rápida

```bash
# Clonar o entrar al directorio
cd study-ia

# Hacer ejecutable el script
chmod +x scripts/setup.sh

# Ejecutar configuración automática
./scripts/setup.sh
```

## Instalación Manual

### 1. Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma
npx prisma generate

# Crear base de datos
npx prisma db push

# Iniciar servidor de desarrollo
npm run dev
```

### 2. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Docker (Alternativa)

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## Configuración de IA

### Opción 1: Ollama (Recomendado - Gratuito)

```bash
# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo
ollama pull llama3.2

# En backend/.env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Opción 2: Groq (Gratuito con límites)

```bash
# Obtener API key en https://console.groq.com/keys

# En backend/.env
AI_PROVIDER=groq
GROQ_API_KEY=tu-api-key
```

### Opción 3: Hugging Face

```bash
# Obtener token en https://huggingface.co/settings/tokens

# En backend/.env
AI_PROVIDER=huggingface
HUGGINGFACE_TOKEN=tu-token
```

## Desarrollo Desktop (Windows)

```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build de producción
cd study-ia
npm run tauri build

# El ejecutable estará en:
# src-tauri/target/release/study-ia.exe
```

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual

### Documentos
- `GET /api/documents` - Listar documentos
- `POST /api/documents` - Crear documento
- `GET /api/documents/:id` - Ver documento
- `PUT /api/documents/:id` - Actualizar
- `DELETE /api/documents/:id` - Eliminar

### Flashcards
- `GET /api/flashcards` - Listar tarjetas
- `GET /api/flashcards/due` - Tarjetas pendientes
- `POST /api/flashcards` - Crear tarjeta
- `POST /api/flashcards/review` - Revisar (SM-2)
- `GET /api/flashcards/stats` - Estadísticas

### IA
- `GET /api/ai/providers` - Estado de proveedores
- `POST /api/ai/summarize` - Generar resumen
- `POST /api/ai/flashcards` - Generar flashcards
- `POST /api/ai/qa` - Generar Q&A
- `POST /api/ai/study-plan` - Generar plan de estudio

### Estudio
- `GET /api/study/sessions` - Historial de sesiones
- `POST /api/study/sessions/start` - Iniciar sesión
- `PUT /api/study/sessions/:id/end` - Terminar sesión
- `GET /api/study/dashboard` - Dashboard

Ver [API.md](./docs/API.md) para documentación completa.

## Estructura del Proyecto

```
study-ia/
├── frontend/                 # Next.js 14
│   ├── src/
│   │   ├── app/             # App Router
│   │   ├── components/      # Componentes
│   │   ├── lib/            # Utilidades
│   │   └── styles/         # CSS
│   └── public/              # Assets estáticos
├── backend/                  # Express + Prisma
│   ├── src/
│   │   ├── routes/         # Rutas API
│   │   ├── services/       # Lógica de negocio
│   │   └── middleware/     # Auth, errores
│   └── prisma/             # Schema de BD
├── src-tauri/               # Tauri (Windows)
├── scripts/                 # Scripts automatización
├── docs/                    # Documentación
└── docker-compose.yml      # Contenedores
```

## Variables de Entorno

### Backend (.env)

```env
DATABASE_URL=postgresql://studyia:studyia123@localhost:5432/studyia
REDIS_URL=redis://localhost:6379
JWT_SECRET=tu-secret-muy-largo
PORT=3001
NODE_ENV=development

# IA (elegir uno)
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
# GROQ_API_KEY=tu-key
# HUGGINGFACE_TOKEN=tu-token
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-muy-largo
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Frontend
npm run dev:backend   # Backend

# Build
npm run build         # Frontend production
npm run tauri build   # Windows .exe

# Base de datos
npm run prisma:generate   # Generar cliente
npm run prisma:migrate     # Migraciones
npm run prisma:push        # Sincronizar schema

# Docker
docker-compose up -d      # Iniciar
docker-compose down       # Detener
docker-compose logs -f     # Ver logs
```

## Licencia

MIT License - ver [LICENSE](LICENSE)

## Contribuir

1. Fork el repositorio
2. Crear branch (`git checkout -b feature/nueva-funcion`)
3. Commit cambios (`git commit -m 'Agregar nueva función'`)
4. Push al branch (`git push origin feature/nueva-funcion`)
5. Abrir Pull Request

---

Hecho con ❤️ para estudiantes de todo el mundo.
