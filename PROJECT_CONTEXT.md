# Contexto del Proyecto CoDexStuDy

Este documento contiene todo el contexto necesario para que una IA o desarrollador pueda continuar trabajando en el proyecto CoDexStuDy.

---

## Resumen del Proyecto

**CoDexStuDy** es una plataforma de estudio asistida por IA para estudiantes de Costa Rica (Sección 12-2, Departamento de Desarrollo de Aplicaciones Móviles).

### Funcionalidades Principales
- Subir PDFs y texto para estudio
- Generación automática de resúmenes con IA
- Flashcards con algoritmo SM-2 (repetición espaciada)
- Preguntas y respuestas generadas por IA
- Planes de estudio personalizados
- Text-to-speech para escuchar contenido
- PWA instalable como app móvil

### Stack Tecnológico
- **Frontend**: Next.js 15 (App Router), React 18, TailwindCSS, Zustand, NextAuth
- **Backend**: Express.js, TypeScript, Prisma ORM 5.22.0
- **Base de datos**: PostgreSQL (Render)
- **IA**: Groq API (actual), soporte para Ollama y HuggingFace
- **Deploy**: Render (backend desplegado)

---

## Estado Actual del Proyecto

### ✅ Completado y Funcionando
1. **Backend desplegado en Render**: https://codexstudy-r1mw.onrender.com
2. **API REST completa** con autenticación JWT
3. **Base de datos PostgreSQL** con Prisma
4. **204 tests en backend** (SM-2, IA, validación, integración)
5. **28 tests en frontend** (utilidades, componentes)
6. **PWA funcional** (service worker, manifest, offline)
7. **ESLint** configurado en ambos proyectos
8. **TypeScript** compilando sin errores

### ⚠️ Pendiente
1. **Frontend NO desplegado** - necesita su propio servicio en Render [URGENTE]
2. **Redis** - error de conexión (opcional, no afecta funcionalidad)
3. **Rate limiting** - no implementado
4. **Tests E2E browser** - no configurados

---

## URLs de Producción

| Servicio | URL | Estado |
|----------|-----|--------|
| Backend API | https://codexstudy-r1mw.onrender.com | ✅ Funcionando |
| Health Check | https://codexstudy-r1mw.onrender.com/api/health | ✅ Funcionando |
| Frontend | Por desplegar | ❌ Pendiente |

---

## Estructura del Proyecto

```
CoDexStuDy/
└── codexstudy/
    ├── backend/
    │   ├── src/
    │   │   ├── server.ts              # Entry point Express
    │   │   ├── routes/                # Rutas API
    │   │   │   ├── auth.routes.ts      # Registro, login
    │   │   │   ├── document.routes.ts  # CRUD documentos
    │   │   │   ├── flashcard.routes.ts # CRUD flashcards + review SM-2
    │   │   │   ├── ai.routes.ts       # Resumen, flashcards IA
    │   │   │   ├── study.routes.ts     # Sesiones de estudio
    │   │   │   ├── upload.routes.ts    # Upload PDF/texto
    │   │   │   └── admin.routes.ts     # Estadísticas
    │   │   ├── services/
    │   │   │   ├── ai/
    │   │   │   │   ├── AiService.ts   # Orquestador IA
    │   │   │   │   ├── ai.types.ts    # Tipos TypeScript
    │   │   │   │   └── providers/     # Ollama, Groq, HuggingFace
    │   │   │   └── sm2.ts             # Algoritmo SM-2
    │   │   ├── middleware/
    │   │   │   ├── auth.middleware.ts  # Validación JWT
    │   │   │   └── error.middleware.ts
    │   │   └── utils/
    │   │       └── pdfExtractor.ts     # Extracción texto PDF
    │   └── prisma/
    │       └── schema.prisma          # Schema de BD
    │
    ├── frontend/
    │   ├── src/
    │   │   ├── app/                   # App Router
    │   │   │   ├── page.tsx          # Landing page
    │   │   │   ├── onboarding/       # Flow de onboarding
    │   │   │   ├── dashboard/        # Dashboard principal
    │   │   │   ├── documents/        # Gestión documentos
    │   │   │   ├── study/            # Sesiones de estudio
    │   │   │   ├── upload/           # Subir archivos
    │   │   │   ├── offline/         # Página offline PWA
    │   │   │   └── api/auth/[...nextauth]/ # NextAuth handler
    │   │   ├── componentes/
    │   │   │   └── ServiceWorkerRegistration.tsx
    │   │   └── styles/
    │   │       └── globals.css
    │   └── public/
    │       ├── manifest.json         # PWA manifest
    │       └── sw.js                 # Service Worker
    │
    └── docker-compose.yml            # PostgreSQL + Redis local
```

---

## Modelos de Base de Datos (Prisma)

### User
- id, email, password, name
- studyMethod, level, learningStyle
- onboardingDone, wantsExamples, detailLevel
- grado, area, areasInteres

### Document
- id, userId, title, content
- summary, keyPoints[]
- sourceType, wordCount

### Flashcard
- id, userId, documentId
- front, back, tags[]
- difficulty, easeFactor (SM-2)
- interval, nextReview, repetitions

### Review
- id, flashcardId, quality (0-5), responseTime

### StudySession
- id, userId, topic, duration
- cardsStudied, cardsLearned, accuracy

### QA
- id, userId, documentId, question, answer, confidence

---

## API Endpoints

### Autenticación
```
POST /api/auth/register - { email, password, name? }
POST /api/auth/login   - { email, password } → { token, user }
GET  /api/auth/me      - Header: Authorization: Bearer <token>
```

### Documentos
```
GET    /api/documents         - Listar
POST   /api/documents         - Crear
GET    /api/documents/:id     - Ver uno
PUT    /api/documents/:id     - Actualizar
DELETE /api/documents/:id     - Eliminar
```

### Flashcards (SM-2)
```
GET  /api/flashcards           - Todas
GET  /api/flashcards/due       - Pendientes
POST /api/flashcards/review    - { id, quality: 0-5 }
```

### IA
```
POST /api/ai/summarize   - Generar resumen
POST /api/ai/flashcards  - Generar flashcards
POST /api/ai/qa          - Generar Q&A
POST /api/ai/study-plan  - Plan de estudio
POST /api/ai/topics      - Extraer temas
```

### Upload
```
POST /api/upload/pdf     - Subir PDF
POST /api/upload/text    - Subir texto
```

---

## Configuración de IA

### Groq (USANDO ACTUALMENTE)
```
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...  # Disponible en console.groq.com/keys
```

### Ollama (alternativa local)
```
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### HuggingFace (alternativa)
```
AI_PROVIDER=huggingface
HUGGINGFACE_TOKEN=hf_...
```

---

## Comandos Importantes

### Backend
```bash
cd codexstudy/backend

# Verificar TypeScript
npx tsc --noEmit

# Dev server
npm run dev

# Build para producción
npm run build

# Generar Prisma (importante para Render)
npx prisma@5.22.0 generate

# Sincronizar DB
npm run prisma:push
```

### Frontend
```bash
cd codexstudy/frontend

# Verificar TypeScript
npx tsc --noEmit

# Dev server
npm run dev

# Build
npm run build
```

---

## Deploy en Render

### Backend (YA DESPLAGADO)
- **URL**: https://codexstudy-r1mw.onrender.com
- **Root Directory**: codexstudy/backend
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Variables**:
  - DATABASE_URL=postgresql://...
  - JWT_SECRET=...
  - AI_PROVIDER=groq
  - GROQ_API_KEY=gsk_...
  - PORT=3001

### Frontend (POR DESPLAGAR)
1. Crear Web Service nuevo
2. Repository: GitHub repo
3. Root Directory: codexstudy/frontend
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Environment Variables:
   - NEXT_PUBLIC_API_URL=https://codexstudy-r1mw.onrender.com

---

## Problemas Conocidos y Soluciones

### 1. Prisma 7 incompatible con Render
- **Problema**: La CLI de Prisma global en Render usa v7 que cambió el schema
- **Solución**: Usar `npx prisma@5.22.0` explícitamente en todos los scripts

### 2. Redis connection refused
- **Problema**: Redis no está desplegado, el código intenta conectar
- **Solución**: El servidor funciona sin Redis (es opcional para cache)
- **Nota**: Los errores de Redis en logs son solo warnings

### 3. CORS blocked
- **Problema**: El frontend no puede comunicarse con el backend
- **Solución**: Agregar dominios de Render a CORS en server.ts:
  ```typescript
  'https://*.onrender.com'
  ```

### 4. TypeScript @types en production
- **Problema**: devDependencies no se instalan en Render
- **Solución**: Mover @types/* a dependencies

---

## Mejoras Sugeridas (Prioridad)

### 🔴 URGENTE: Desplegar Frontend en Render

El frontend necesita desplegarse para que los usuarios puedan acceder a la app.

**Pasos para desplegar frontend:**

1. En Render, crear nuevo Web Service
2. Repository: `https://github.com/JeffGarroRojas/CoDexStuDy`
3. Root Directory: `codexstudy/frontend`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://codexstudy-r1mw.onrender.com`

**Nota:** El archivo `.env.local` NO debe subirse a git. En Render se configura como variable de entorno.

### Alta Prioridad

1. **Rate Limiting**
   - Proteger API contra abuse
   - Groq tiene límites de uso

2. **Validación de Input**
   - Sanitizar archivos subidos
   - Limitar tamaño de PDFs
   - Validar contenido

### Media Prioridad
3. **Dashboard de Analytics**
4. **Sistema de Notificaciones** (email/push)
5. **Modo Offline Completo**
6. **Importar/Exportar** (CSV, Anki)

### Baja Prioridad
7. **Multi-idioma** (i18n)
8. **Gamificación** (XP, logros)
9. **Colaboración** (compartir mazos)
10. **Integración Calendar**

---

## Convenciones de Código

### TypeScript
- `interface` para tipos de objetos
- `type` para uniones y alias
- Strict mode habilitado
- camelCase para variables, PascalCase para componentes

### Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
refactor: refactorización
test: tests
chore: mantenimiento
```

---

## Testing

### Backend (204 tests)
```bash
cd codexstudy/backend && npm test
```

### Frontend (28 tests)
```bash
cd codexstudy/frontend && npm test -- --run
```

---

## Notas Importantes

1. **Prisma 5.22.0** es la versión compatible con Render
2. **Groq** es el proveedor de IA actual (gratuito con límites)
3. **JWT** se usa para autenticación (Authorization: Bearer <token>)
4. **PDFs** se procesan con pdfjs-dist en el backend
5. **Redis** es opcional, no afecta funcionalidad
6. **PWA** funciona offline con service worker

---

_Ultima actualizacion: 2026-03-21_
