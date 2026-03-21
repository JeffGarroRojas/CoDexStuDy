# AGENTS.md - Guía para Agentes IA

Este documento proporciona contexto completo para que agentes de IA puedan trabajar efectivamente con el proyecto Study-IA sin necesidad de exploración adicional.

---

## Resumen del Proyecto

**CoDexStuDy** es una plataforma de estudio asistida por IA que transforma documentos PDF/texto en:
- Resúmenes inteligentes
- Flashcards con repetición espaciada (algoritmo SM-2)
- Preguntas y respuestas
- Planes de estudio personalizados

**Stack**: Next.js 15 + Express + PostgreSQL + Redis + Ollama/Groq/HuggingFace

---

## Estado Actual

### ✅ Funcional
- TypeScript compilando sin errores (backend y frontend)
- API REST completa con autenticación JWT
- Base de datos PostgreSQL con Prisma ORM (v5.22.0)
- Generación de contenido con IA (3 proveedores con fallback automático)
- Algoritmo SM-2 implementado y con tests exhaustivos
- Docker Compose configurado
- ESLint funcionando (backend y frontend)
- PWA funcional (service worker, manifest, offline page)
- Framework de tests configurado (Jest + Vitest)
- Build de producción exitoso
- **204 tests en backend** (SM-2, validación, IA, integración, E2E)
- **28 tests en frontend** (utilidades, componentes)
- **Deploy en Render** (Backend: https://codexstudy-r1mw.onrender.com)

### 🔧 Configuración Actual
- **Backend ESLint**: ESLint 9.x con TypeScript parser (flat config)
- **Frontend ESLint**: ESLint 9.x con flat config
- **Prisma**: 5.22.0 (compatible con Render)
- **Tests Backend**: Jest + ts-jest (204 tests)
- **Tests Frontend**: Vitest + jsdom (28 tests)
- **AI Providers**: Ollama (local), Groq (cloud), HuggingFace (fallback)

### ⚠️ Pendiente/Incompleto
1. **Frontend en Render**: No desplegado aún
2. **Redis**: Error de conexión en Render (opcional, no afecta funcionalidad)
3. **Tests E2E (browser)**: No configurados aún

---

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Backend API | https://codexstudy-r1mw.onrender.com |
| Health Check | https://codexstudy-r1mw.onrender.com/api/health |
| Frontend | Por desplegar |

---

## Ubicaciones Clave

### Archivos Importantes
```
study-ia/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Entry point Express
│   │   ├── routes/                # Todas las rutas API
│   │   │   ├── auth.routes.ts
│   │   │   ├── document.routes.ts
│   │   │   ├── flashcard.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── study.routes.ts
│   │   │   ├── upload.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── ai/                # Lógica de IA
│   │   │   │   ├── AiService.ts   # Orquestador
│   │   │   │   ├── ai.types.ts    # Tipos TypeScript
│   │   │   │   └── providers/     # Ollama, Groq, HuggingFace
│   │   │   └── sm2.ts             # Algoritmo SM-2
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT validation
│   │   │   └── error.middleware.ts
│   │   └── utils/
│   │       └── pdfExtractor.ts    # Extracción de texto PDF
│   └── prisma/
│       └── schema.prisma          # Schema de BD
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # App Router pages
│   │   │   ├── page.tsx           # Landing
│   │   │   ├── onboarding/        # Onboarding flow
│   │   │   ├── dashboard/
│   │   │   ├── documents/
│   │   │   ├── study/
│   │   │   ├── upload/
│   │   │   ├── offline/           # PWA offline page
│   │   │   └── api/auth/[...nextauth]/  # NextAuth route
│   │   ├── componentes/
│   │   │   └── ServiceWorkerRegistration.tsx
│   │   └── styles/
│   │       └── globals.css
│   └── public/
│       ├── manifest.json          # PWA manifest
│       └── sw.js                  # Service Worker
│
└── docker-compose.yml
```

### Puerto de Servicios (Local)
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

---

## Comandos de Verificación

### Antes de trabajar en código
```bash
# Backend: verificar TypeScript
cd study-ia/backend
npx tsc --noEmit

# Frontend: verificar TypeScript
cd study-ia/frontend
npx tsc --noEmit

# Backend: iniciar dev server
cd study-ia/backend
npm run dev

# Frontend: iniciar dev server
cd study-ia/frontend
npm run dev
```

### Comandos de Base de Datos
```bash
cd study-ia/backend

# Generar cliente Prisma (v5.22.0)
npm run prisma:generate

# Sincronizar schema con DB
npm run prisma:push

# Ver DB (si hay problemas)
npx prisma@5.22.0 studio
```

### Docker
```bash
cd study-ia

# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Reiniciar backend
docker-compose restart backend
```

### Render Deploy
```bash
cd study-ia/backend
npm run build     # tsc + prisma generate
npm start         # db push + node server
```

---

## Mejoras Sugeridas para el Proyecto

### 🔴 Alta Prioridad

1. **Desplegar Frontend en Render**
   - Crear nuevo Web Service para frontend
   - Configurar `NEXT_PUBLIC_API_URL` con URL del backend
   - Agregar dominio personalizado

2. **Configurar Rate Limiting**
   - Implementar rate limiting en API routes
   - Proteger contra abuse de IA (Groq tiene límites)

3. **Agregar Validación de Input**
   - Sanitizar PDFs subidos
   - Limitar tamaño de archivos
   - Validar contenido de texto

### 🟡 Media Prioridad

4. **Dashboard de Analytics**
   - Gráficos de progreso de estudio
   - Estadísticas de uso de IA
   - Historial de sesiones

5. **Sistema de Notificaciones**
   - Email para recordar study sessions
   - Push notifications (PWA)
   - Recordatorios diarios

6. **Modo Offline Completo**
   - Cachear flashcards para offline
   - Sincronizar cuando reconnecte
   - Indicador de modo offline en UI

7. **Importar/Exportar Datos**
   - Exportar flashcards como CSV/JSON
   - Importar desde Anki
   - Backup de cuenta

### 🟢 Baja Prioridad (Nice to Have)

8. **Multi-idioma**
   - Soporte para inglés
   - UI i18n con next-intl

9. **Gamificación**
   - XP y niveles
   - Logros/medallas
   - Streaks de estudio

10. **Colaboración**
    - Compartir mazos de flashcards
    - Desafíos entre amigos
    - Leaderboards

11. **Text-to-Speech mejorado**
    - Más voces disponibles
    - Control de velocidad
    - Guardar audio

12. **Integración con Calendar**
    - Sincronizar con Google Calendar
    - Planificador de estudio automático

---

## Convenciones de Código

### TypeScript
- Usar `interface` para tipos de objetos
- Usar `type` para uniones y alias
- Strict mode habilitado
- Nombres: camelCase para variables, PascalCase para tipos/componentes

### Backend
```typescript
// Tipos de respuesta API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Middleware de auth
// Usa Authorization: Bearer <token>

// Validación con Zod
// Schemas en el mismo archivo que las rutas
```

### Frontend
```typescript
// Rutas API
// NEXT_PUBLIC_API_URL + /api/...

// Hooks de React
// use前缀 para hooks personalizados

// Estado con Zustand
// Stores en /lib/stores/
```

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

## API Reference Rápida

### Autenticación
```bash
# Registro
POST /api/auth/register
Body: { email, password, name? }

# Login
POST /api/auth/login
Body: { email, password }
Response: { token, user }

# Usuario actual
GET /api/auth/me
Header: Authorization: Bearer <token>
```

### Documentos
```bash
GET    /api/documents           # Listar
POST   /api/documents           # Crear
GET    /api/documents/:id       # Ver uno
PUT    /api/documents/:id       # Actualizar
DELETE /api/documents/:id       # Eliminar
```

### Flashcards (SM-2)
```bash
GET  /api/flashcards            # Todas
GET  /api/flashcards/due        # Pendientes
POST /api/flashcards/review     # Revisar
Body: { id, quality: 0-5 }

# quality: 0=no recuerdo, 5=perfecto
# El sistema calcula próximo review automáticamente
```

### IA
```bash
POST /api/ai/summarize      # Resumen
POST /api/ai/flashcards     # Generar flashcards
POST /api/ai/qa            # Generar Q&A
POST /api/ai/study-plan    # Plan de estudio
POST /api/ai/topics        # Extraer temas
```

### Upload
```bash
POST /api/upload/pdf        # Subir PDF
POST /api/upload/text       # Subir texto
```

### Admin
```bash
GET /api/admin/stats        # Estadísticas del sistema
```

---

## Base de Datos

### Modelos Principales

**User** → tiene muchos Documents, Flashcards, StudySessions
- `email`: email único
- `password`: hash bcrypt
- `studyMethod`: "hibrido", "visual", "auditivo", "lectura"
- `level`: "principiante", "intermedio", "avanzado"
- `onboardingDone`: boolean

**Document** → tiene muchos Flashcards
- `content`: texto completo del documento
- `summary`: resumen generado por IA
- `keyPoints`: array de puntos clave
- `sourceType`: "text" o "pdf"
- `wordCount`: contador de palabras

**Flashcard** → usa SM-2
- `easeFactor`: factor de facilidad (default 2.5)
- `interval`: días hasta próximo review
- `nextReview`: fecha del próximo review
- `repetitions`: número de repeticiones exitosas

**Review** → registro de cada revisión
- `quality`: 0-5 (qué tan bien recordaste)
- `responseTime`: tiempo de respuesta en ms

**StudySession** → sesión de estudio
- `topic`: tema estudiado
- `duration`: duración en segundos
- `cardsStudied`: tarjetas estudiadas
- `accuracy`: precisión del estudio

**QA** → preguntas y respuestas
- `question`: pregunta
- `answer`: respuesta
- `confidence`: confianza de la IA

---

## Configuración de IA

### Ollama (Recomendado - Gratuito)
```bash
# Instalar
curl -fsSL https://ollama.com/install.sh | sh

# Modelo
ollama pull llama3.2

# .env
AI_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Groq (Gratuito con límites)
```bash
# .env
AI_PROVIDER=groq
GROQ_API_KEY=gsk_xxxx
```

### Hugging Face
```bash
# .env
AI_PROVIDER=huggingface
HUGGINGFACE_TOKEN=hf_xxxx
```

---

## PWA (Progressive Web App)

### Estructura
- `frontend/public/manifest.json` - Configuración PWA
- `frontend/public/sw.js` - Service Worker
- `frontend/src/componentes/ServiceWorkerRegistration.tsx` - Registro
- `frontend/src/app/offline/page.tsx` - Página offline

### Funcionalidades
- Instalable como app nativa
- Funciona offline con contenido en caché
- Notificaciones push (futuro)

---

## Render Deployment

### Backend (ya desplegado)
- **URL**: https://codexstudy-r1mw.onrender.com
- **Root Directory**: study-ia/backend
- **Build Command**: npm install && npm run build
- **Start Command**: npm start

### Variables de Entorno en Render
```
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret-fuerte
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
PORT=3001
```

### Frontend (por desplegar)
1. Crear nuevo Web Service
2. Repository: study-ia/frontend (o configurar root directory)
3. Build Command: npm install && npm run build
4. Start Command: npm start
5. Environment Variables:
   - `NEXT_PUBLIC_API_URL=https://codexstudy-r1mw.onrender.com`

---

## Troubleshooting

### Error: "Cannot find module"
```bash
cd study-ia/backend
rm -rf node_modules package-lock.json
npm install
```

### Error: "Prisma schema validation" en Render
- Verificar que Prisma 5.22.0 esté configurado en package.json
- Scripts deben usar `npx prisma@5.22.0`
- Ejecutar `npm install` localmente para regenerar package-lock.json

### Error: "Connection refused" en PostgreSQL
```bash
# Verificar que Docker esté corriendo
docker ps

# Ver logs de postgres
docker-compose logs postgres
```

### Error: "Module not found: pdfjs-dist"
```bash
cd backend
npm install pdfjs-dist
npm run prisma:generate
```

### Error: "Redis connection refused"
- Redis es opcional, no afecta funcionalidad
- El servidor funciona sin Redis

---

## Notas Importantes para Agentes

1. **Siempre verificar TypeScript** antes de hacer cambios: `npx tsc --noEmit`

2. **Docker puede requerir sudo** si hay problemas de permisos

3. **El backend usa CommonJS** (TypeScript target: ES2020, module: commonjs)

4. **El frontend usa ESM** (Next.js con App Router)

5. **JWT en headers**: `Authorization: Bearer <token>`

6. **Redis es optional** pero mejora rendimiento del dashboard

7. **PDFs se procesan con pdfjs-dist** en el backend

8. **Onboarding es opcional** - usuarios pueden usar la app sin hacerlo

9. **Prisma 5.22.0** es la versión compatible con Render - usar siempre `npx prisma@5.22.0` en scripts

10. **Backend ya desplegado en**: https://codexstudy-r1mw.onrender.com

---

## Contacto / Contribuir

1. Fork el repositorio
2. Crear branch (`git checkout -b feature/nueva-funcion`)
3. Commit cambios (`git commit -m 'feat: agregar nueva función'`)
4. Push al branch
5. Abrir Pull Request

---

_Ultima actualizacion: 2026-03-21_

## Testing

### Tests Backend (204 tests)
```bash
cd study-ia/backend
npm test
```

Archivos de tests:
- `src/services/sm2.test.ts` - Tests del algoritmo SM-2 (27 tests)
- `src/utils/pdfExtractor.test.ts` - Tests de utilidades PDF
- `src/utils/validation.test.ts` - Tests de validación Zod
- `src/services/ai/ai.performance.test.ts` - Tests de rendimiento IA (34 tests)
- `src/services/ai/ai.providers.test.ts` - Tests de proveedores IA (91 tests)
- `src/services/ai/ai.e2e.test.ts` - Tests E2E de IA (42 tests)
- `src/services/api.integration.test.ts` - Tests de integración API

### Tests Frontend (28 tests)
```bash
cd study-ia/frontend
npm test -- --run
```

Archivos de tests:
- `src/test/basic.test.ts` - Tests básicos (9 tests)
- `src/test/utilities.test.ts` - Tests de utilidades (19 tests)

### Cobertura de Tests
- **SM-2 Algorithm**: 100% (casos límite, edge cases, rendimiento)
- **Validación**: Zod schemas para todos los modelos
- **IA Providers**: Tests de Ollama, Groq, HuggingFace
- **IA Fallback**: Tests de fallback automático entre proveedores
- **IA E2E**: Flujos completos de estudio
- **IA Performance**: Concurrencia, throughput, rate limiting
- **IA Quality**: Validación de respuestas generadas
- **API**: Integración y manejo de errores
- **Frontend**: Utilidades, transformación de datos, validación
