# Study-IA

Plataforma de estudio asistida por inteligencia artificial que transforma documentos en resúmenes, flashcards, preguntas y planes de estudio personalizados usando repetición espaciada (SM-2).

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estado del Proyecto](#estado-del-proyecto)
- [Requisitos](#requisitos)
- [Instalación Rápida](#instalación-rápida)
- [Configuración](#configuración)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Variables de Entorno](#variables-de-entorno)
- [Docker](#docker)
- [Desarrollo Desktop](#desarrollo-desktop)
- [Resolución de Problemas](#resolución-de-problemas)

---

## Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand
- **Data Fetching**: TanStack Query
- **Auth**: NextAuth.js v5 (beta)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de Datos**: PostgreSQL 16
- **Cache**: Redis 7
- **Validación**: Zod

### AI
- **Ollama** (local, gratuito)
- **Groq** (API con tier gratuito)
- **Hugging Face** (modelos open source)

### Desktop
- **Tauri** v2 (Rust)

---

## Arquitectura

```
study-ia/
├── frontend/              # Next.js 14 (puerto 3000)
│   └── src/
│       ├── app/          # App Router (páginas)
│       ├── componentes/   # Componentes React
│       ├── hooks/         # Custom hooks
│       ├── lib/          # Utilidades
│       └── types/        # Definiciones TypeScript
├── backend/              # Express API (puerto 3001)
│   └── src/
│       ├── routes/       # Rutas API
│       ├── middleware/   # Auth, errores
│       ├── services/    # Lógica de negocio
│       │   └── ai/      # Servicios de IA
│       └── utils/       # Utilidades
├── prisma/
│   └── schema.prisma     # Schema de base de datos
├── src-tauri/           # Tauri desktop app
├── scripts/             # Scripts de automatización
└── docker-compose.yml   # Contenedores
```

---

## Estado del Proyecto

### ✅ Funcional
- TypeScript compilando sin errores (backend y frontend)
- API de autenticación (registro, login, JWT)
- CRUD de documentos
- Generación de flashcards con IA
- Algoritmo SM-2 de repetición espaciada
- Múltiples proveedores de IA (Ollama, Groq, HuggingFace)
- Dashboard con estadísticas
- Docker Compose configurado

### ⚠️ Pendiente/Incompleto
- **node_modules del backend**: Instalación corrupta (ESLint)
- **Docker**: Permiso denegado al socket
- **ESLint**: Configuración incompleta
- **Tests**: Sin framework configurado
- **Onboarding flow**: Parcialmente implementado
- **PWA**: Configuración incompleta

---

## Requisitos

- Node.js 18+
- Docker y Docker Compose
- PostgreSQL 16+ (o contenedor Docker)
- Redis 7+ (o contenedor Docker)
- Rust (solo para build de Tauri)

### Opcional: Ollama (IA local gratuita)
```bash
# Linux/macOS
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelo
ollama pull llama3.2
```

---

## Instalación Rápida

### 1. Clonar y entrar al directorio
```bash
cd study-ia
```

### 2. Backend
```bash
cd backend

# Instalar dependencias (si node_modules está corrupto)
rm -rf node_modules
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Generar cliente Prisma
npm run prisma:generate

# Crear/sincronizar base de datos
npm run prisma:push

# Iniciar servidor de desarrollo
npm run dev
```

### 3. Frontend (en otra terminal)
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

### 4. Docker (alternativa completa)
```bash
docker-compose up -d
```

---

## Configuración

### Backend (.env)
```env
# Base de datos
DATABASE_URL=postgresql://studyia:studyia123@localhost:5432/studyia

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=tu-secret-muy-largo-y-seguro
PORT=3001
NODE_ENV=development

# IA (elegir uno de estos)
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# O usar Groq:
# AI_PROVIDER=groq
# GROQ_API_KEY=tu-api-key

# O usar Hugging Face:
# AI_PROVIDER=huggingface
# HUGGINGFACE_TOKEN=tu-token
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-muy-largo-y-seguro
```

---

## Scripts Disponibles

### Backend
```bash
cd backend

npm run dev              # Desarrollo (ts-node-dev)
npm run build            # Build producción (tsc)
npm run start            # Iniciar producción
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Migraciones
npm run prisma:push      # Sincronizar schema
npm run lint             # Linting (⚠️ requiere reinstalación)
```

### Frontend
```bash
cd frontend

npm run dev      # Desarrollo
npm run build    # Build producción
npm run start    # Iniciar producción
npm run lint     # Linting con Next.js
npm run tauri    # Abrir Tauri CLI
```

### Docker
```bash
docker-compose up -d       # Iniciar todos los servicios
docker-compose down        # Detener
docker-compose logs -f     # Ver logs
docker-compose logs -f backend  # Logs del backend
```

---

## Estructura del Proyecto

### Backend - Rutas API

| Ruta | Método | Descripción |
|------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/auth/register` | POST | Registro de usuario |
| `/api/auth/login` | POST | Login (retorna JWT) |
| `/api/auth/me` | GET | Usuario actual |
| `/api/auth/preferences` | PUT | Actualizar preferencias |
| `/api/documents` | GET | Listar documentos |
| `/api/documents` | POST | Crear documento |
| `/api/documents/:id` | GET | Ver documento |
| `/api/documents/:id` | PUT | Actualizar |
| `/api/documents/:id` | DELETE | Eliminar |
| `/api/flashcards` | GET | Listar flashcards |
| `/api/flashcards/due` | GET | Flashcards pendientes |
| `/api/flashcards` | POST | Crear flashcard |
| `/api/flashcards/review` | POST | Revisar (SM-2) |
| `/api/flashcards/stats` | GET | Estadísticas |
| `/api/ai/providers` | GET | Estado de IA |
| `/api/ai/summarize` | POST | Generar resumen |
| `/api/ai/flashcards` | POST | Generar flashcards |
| `/api/ai/qa` | POST | Generar Q&A |
| `/api/ai/study-plan` | POST | Generar plan |
| `/api/ai/topics` | POST | Extraer temas |
| `/api/study/sessions` | GET | Historial sesiones |
| `/api/study/sessions/start` | POST | Iniciar sesión |
| `/api/study/sessions/:id/end` | PUT | Terminar sesión |
| `/api/study/dashboard` | GET | Dashboard stats |
| `/api/upload` | POST | Subir archivos |

### Base de Datos - Modelos

**User**
- `id`, `email`, `password`, `name`
- Preferencias: `studyMethod`, `level`, `learningStyle`, `wantsExamples`, `detailLevel`, `objective`
- Relaciones: `documents`, `flashcards`, `studySessions`

**Document**
- `id`, `userId`, `title`, `content`, `summary`, `keyPoints[]`
- `sourceType`, `sourceUrl`, `wordCount`
- Relaciones: `user`, `flashcards`

**Flashcard**
- Campos SM-2: `difficulty`, `easeFactor`, `interval`, `nextReview`, `repetitions`
- Relaciones: `user`, `document`, `reviews`

**Review**
- `id`, `flashcardId`, `quality`, `responseTime`
- Relación: `flashcard`

**StudySession**
- `id`, `userId`, `topic`, `duration`, `cardsStudied`, `cardsLearned`, `accuracy`

**QA**
- `id`, `userId`, `documentId`, `question`, `answer`, `confidence`

---

## Variables de Entorno

### Backend (.env)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | postgresql://... |
| `REDIS_URL` | URL de Redis | redis://localhost:6379 |
| `JWT_SECRET` | Secret para JWT | - |
| `PORT` | Puerto del servidor | 3001 |
| `NODE_ENV` | Entorno | development |
| `AI_PROVIDER` | Proveedor de IA | ollama |
| `OLLAMA_URL` | URL de Ollama | http://localhost:11434 |
| `OLLAMA_MODEL` | Modelo Ollama | llama3.2 |
| `GROQ_API_KEY` | API key de Groq | - |
| `HUGGINGFACE_TOKEN` | Token de Hugging Face | - |

### Frontend (.env.local)

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL del backend API | http://localhost:3001/api |
| `NEXTAUTH_URL` | URL de la app | http://localhost:3000 |
| `NEXTAUTH_SECRET` | Secret para NextAuth | - |

---

## Docker

### Servicios
- `postgres`: PostgreSQL 16 (puerto 5432)
- `redis`: Redis 7 (puerto 6379)
- `backend`: API Express (puerto 3001)
- `frontend`: Next.js (puerto 3000)

### Uso
```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs de un servicio
docker-compose logs -f backend

# Reconstruir y reiniciar
docker-compose up -d --build

# Detener y eliminar
docker-compose down
```

---

## Desarrollo Desktop (Windows)

```bash
# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build de producción
npm run tauri build

# El ejecutable estará en:
# src-tauri/target/release/study-ia.exe
```

---

## Resolución de Problemas

### "Cannot find module" en backend
```bash
cd backend
rm -rf node_modules
npm install
```

### Errores de Prisma
```bash
cd backend
npm run prisma:generate
npm run prisma:push
```

### Docker permission denied
```bash
sudo usermod -aG docker $USER
# Reiniciar sesión
```

### Ollama no responde
```bash
# Verificar que Ollama está corriendo
ollama list

# Descargar modelo si no existe
ollama pull llama3.2
```

---

## Licencia

MIT License

---

Hecho con ❤️ para estudiantes de todo el mundo.
