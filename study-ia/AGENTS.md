# AGENTS.md - Guía para Agentes IA

Este documento proporciona contexto completo para que agentes de IA puedan trabajar efectivamente con el proyecto CoDexStuDy sin necesidad de exploración adicional.

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
- PWA funcional e instalable en móvil (manifest, service worker, iconos)
- Framework de tests configurado (Jest + Vitest)
- Build de producción exitoso
- **204 tests en backend** (SM-2, validación, IA, integración, E2E)
- **28 tests en frontend** (utilidades, componentes)
- **Tests E2E API completos** (simulan usuario real end-to-end)
- **Tests E2E Browser** (Playwright - ~50 tests)
- **Rate Limiting** implementado (auth, AI, upload, general)
- **Dashboard Analytics** con gráficos (recharts)
- **Notificaciones** (push/email reminders)
- **Import/Export** (CSV, Anki, JSON)
- **Deploy en Render** (Backend + Frontend)

### 🔧 Configuración Actual
- **Backend ESLint**: ESLint 9.x con TypeScript parser (flat config)
- **Frontend ESLint**: ESLint 9.x con flat config
- **Prisma**: 5.22.0 (compatible con Render)
- **Tests Backend**: Jest + ts-jest (204+ tests)
- **Tests Frontend**: Vitest + jsdom (28 tests)
- **Tests E2E Browser**: Playwright (@playwright/test)
- **AI Providers**: Ollama (local), Groq (cloud), HuggingFace (fallback)
- **Rate Limiting**: express-rate-limit (auth: 10/15min, AI: 10/min, upload: 20/hr, general: 100/15min)

### ⚠️ Pendiente/Incompleto
1. **Redis**: Error de conexión en Render (opcional, no afecta funcionalidad)
2. **Gamificación**: XP, niveles, logros, streaks (pendiente)

> **Nota Deploy Frontend**: Start Command debe usar `npm run start:local` o `node .next/standalone/server.js` (no `npm start` por warning de standalone)

---

## URLs de Producción

| Servicio | URL |
|----------|-----|
| Backend API | https://codexstudy-r1mw.onrender.com |
| Health Check | https://codexstudy-r1mw.onrender.com/api/health |
| Frontend | https://codexstudyf.onrender.com |

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

### Rate Limiting
- **General**: 100 requests / 15 minutos
- **Auth** (login/register): 10 requests / 15 minutos
- **AI** (summarize, flashcards, qa, etc.): 10 requests / minuto
- **Upload** (pdf, extract-topics, process): 20 requests / hora

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

# Frontend: iniciar dev server (usar --no-turbopack si hay errores)
cd study-ia/frontend
npx next dev --no-turbopack -H 0.0.0.0
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

### Notificaciones
```bash
GET  /api/notifications/settings     # Obtener configuración
PUT  /api/notifications/settings     # Actualizar configuración
POST /api/notifications/test-push   # Enviar notificación de prueba
GET  /api/notifications/due-reminder # Ver recordatorios pendientes
```

### Import/Export
```bash
GET  /api/export/flashcards    # Exportar flashcards (json|csv|anki)
POST /api/export/flashcards    # Importar flashcards
GET  /api/export/documents     # Exportar todos los documentos
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

**IDIOMA**: SIEMPRE responder en español. Toda comunicación, explicaciones, código y comentarios deben ser en español. No importa en qué idioma escriba el usuario, la IA debe responder en español siempre.

**FLUJO DE TRABAJO OBLIGATORIO**: Después de CADA cambio de código:
1. Verificar TypeScript: `npx tsc --noEmit`
2. Verificar que el código compila/sin errores
3. Hacer tests si están disponibles: `npm test`
4. Iniciar servidores y probar en Brave
5. Subir a git: `git add . && git commit -m "descripción" && git push`
6. NUNCA dejar al usuario sin verificar que funciona

1. **SIEMPRE subir cambios a git inmediatamente**: Después de cada cambio de código, hacer `git add . && git commit -m "descripción" && git push`. Render usa código del repositorio remoto, no local.

2. **SIEMPRE hacer tests después de cada cambio**: Después de cada modificación de código, ejecutar tests completos para verificar estabilidad:
   ```bash
   # Backend
   cd study-ia/backend && npm test
   
   # Frontend (unit tests)
   cd study-ia/frontend && npm test -- --run
   
   # Frontend (E2E browser)
   cd study-ia/frontend && npm run e2e
   ```
   
   **Validar:**
   - TypeScript compila sin errores (`npx tsc --noEmit`)
   - Todos los tests pasan
   - El sistema funciona correctamente simulando un usuario real
   - Ninguna funcionalidad existente se rompe

3. **SIEMPRE verificar que el onboarding cree usuario real con token**: El onboarding DEBE registrar un usuario en el backend y guardar el token JWT. Si solo guarda en localStorage sin crear usuario, las rutas protegidas fallarán.

4. **Todas las rutas protegidas deben verificar token**: Cada página con `/documents`, `/upload`, `/study` debe verificar que existe un token válido en localStorage y redirigir al onboarding si no existe.

5. **Probar en Brave después de tests**: Después de verificar que todo funcione con tests, abrir en Brave para pruebas manuales:
   ```bash
   # 1. Verificar TypeScript
   cd study-ia/frontend && npx tsc --noEmit
   cd study-ia/backend && npx tsc --noEmit
   
   # 2. Correr tests
   cd study-ia/backend && npm test
   cd study-ia/frontend && npm test -- --run
   
   # 3. Si todo pasa, iniciar servidores
   cd study-ia/backend && npm run dev  # Terminal 1
   cd study-ia/frontend && npm run dev  # Terminal 2
   
   # 4. Abrir en Brave
   # Navegador: http://localhost:3000
   # Probar flujo completo:
   # - Onboarding → Crear usuario → Verificar token
   # - Subir PDF → Verificar que no redirige
   # - Texto Directo → Crear documento → Verificar acceso
   # - Dashboard → Ver gráficos → Ver estadísticas
   # - Flashcards → Estudiar → Revisar
   ```

6. **Siempre verificar TypeScript** antes de hacer cambios: `npx tsc --noEmit`

7. **Docker puede requerir sudo** si hay problemas de permisos

8. **DIAGNÓSTICO PROACTIVO - NO DEPENDER DEL USUARIO**: Cuando hay errores, NO pedir al usuario que abra la consola o ejecute comandos. En su lugar:
   - Revisar los logs automáticamente: `cat .next/dev/logs/next-development.log`
   - Verificar estado de puertos: `netstat -ano | findstr ":300"`
   - Verificar dependencias: `ls node_modules/.bin/` 
   - Verificar HTTP status: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
   - Revisar logs del backend: `docker-compose logs backend`
   - Verificar node_modules: `ls node_modules/ | head -20`
   - Verificar TypeScript: `npx tsc --noEmit`

9. **FLUJO DE DIAGNÓSTICO AUTOMÁTICO** cuando algo falla:
   ```bash
   # 1. Ver si el servidor está corriendo
   netstat -ano | findstr ":300"
   
   # 2. Verificar status HTTP
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   
   # 3. Revisar logs de Next.js
   cat .next/dev/logs/next-development.log
   
   # 4. Verificar que dependencias están instaladas
   ls node_modules/.bin/next
   
   # 5. Verificar TypeScript
   npx tsc --noEmit
   
   # 6. Hacer diagnóstico completo del sistema
   netstat -ano | findstr ":300" && curl -s http://localhost:3000 | head -5
   ```

10. **VERIFICACIÓN AUTOMÁTICA DESPUÉS DE INICIAR SERVIDORES**:
   ```bash
   # Siempre verificar que los servidores estén corriendo
   sleep 5 && netstat -ano | findstr ":300" | findstr LISTENING
   
   # Verificar que responda
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
   curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health
   ```

---

## Errores Comunes y Lecciones Aprendidas

### Error: Onboarding no crea usuario real
**Problema**: El onboarding guardaba datos en localStorage pero NO creaba un usuario en el backend, causando que no hubiera token y todas las rutas protegidas redirigieran al onboarding.

**Solución**: El onboarding debe:
```typescript
// 1. Registrar usuario en el backend
const response = await fetch('/api/auth/register', {...});
// 2. Guardar el token devuelto
localStorage.setItem('token', response.data.token);
// 3. Guardar datos del usuario
localStorage.setItem('userName', data.name);
```

### Error: Rutas protegidas redirigen sin verificar token
**Problema**: Las páginas `/upload`, `/documents`, etc. solo verificaban `if (!token)` pero no verificaban si el token era válido o estaba vacío.

**Solución**: Verificar tanto existencia como contenido:
```typescript
const token = localStorage.getItem('token');
if (!token || token === 'undefined' || token === 'null') {
  router.push('/onboarding');
}
```

### Error: CSS @import en posición incorrecta
**Problema**: `@import url(...)` debe estar al inicio absoluto del archivo CSS, antes de cualquier otra regla.

**Solución**: Mover fuentes a `<link>` en el HTML head, no usar @import en CSS.

### Error: Turbopack crash con PostCSS (0xc0000142)
**Problema**: En Windows, cuando se mata incorrectamente el proceso Node.js (Ctrl+C forzado), Turbopack y PostCSS se corrompen y el proceso hijo de PostCSS falla con el código de error `0xc0000142`.

**Síntomas**:
- Error "An unexpected Turbopack error occurred"
- Error "creating new process - node process exited before we could connect to it with exit code: 0xc0000142"
- La página muestra "Failed to write app endpoint /page"
- `curl http://localhost:3000` devuelve 500

**Solución completa**:
```bash
# 1. Matar TODOS los procesos Node de forma limpia
taskkill /F /IM node.exe

# 2. Esperar a que terminen completamente
sleep 5

# 3. Eliminar cache de Next.js COMPLETAMENTE
cd study-ia/frontend
rm -rf .next
rm -rf node_modules/.cache

# 4. Reiniciar servicios
cd study-ia/backend && npm run dev &
cd study-ia/frontend && npm run dev &
```

**Prevención**:
- SIEMPRE esperar a que los procesos terminen antes de matar
- Usar `npm run dev` en lugar de `npx next dev` directamente
- Si hay problemas, usar `--no-turbopack` en el comando: `npx next dev --no-turbopack`
- Configurar en package.json: `"dev": "next dev --no-turbopack -H 0.0.0.0"`

**Nota**: El error 0xc0000142 es un código de Windows que indica que el proceso se terminó de forma abrupta. No es un problema de código, sino del sistema operativo.

### Error: Render usa código cacheado
**Problema**: Los cambios locales no se reflejan en Render porque usa código del repositorio.

**Solución**: Siempre hacer `git push` después de cambios, y en Render usar "Clear build cache & deploy".

### Error: Prisma no regenerado después de cambiar schema
**Problema**: Se añadieron campos al schema de User pero no se ejecutó `prisma generate`, causando errores de TypeScript.

**Solución**: Después de cambiar `schema.prisma`:
```bash
cd study-ia/backend
npx prisma@5.22.0 generate
npm run prisma:push  # Solo en desarrollo
```

5. **El backend usa CommonJS** (TypeScript target: ES2020, module: commonjs)

6. **El frontend usa ESM** (Next.js con App Router)

7. **JWT en headers**: `Authorization: Bearer <token>`

8. **Redis es optional** pero mejora rendimiento del dashboard

9. **PDFs se procesan con pdfjs-dist** en el backend

10. **Onboarding es opcional** - usuarios pueden usar la app sin hacerlo

10. **Prisma 5.22.0** es la versión compatible con Render - usar siempre `npx prisma@5.22.0` en scripts

11. **Backend ya desplegado en**: https://codexstudy-r1mw.onrender.com

12. **Frontend**: Preparado en `study-ia/frontend`, requiere push a git + deploy en Render

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
- `src/routes/routes.e2e.test.ts` - Tests E2E completos de rutas (simulan usuario real)

### Tests E2E Browser (Frontend - Playwright)
```bash
cd study-ia/frontend
npm run e2e          # Ejecutar tests
npm run e2e:ui       # Ejecutar con UI
npm run e2e:debug    # Depurar
```

Archivos de tests:
- `e2e/complete.e2e.spec.ts` - Tests E2E completos del navegador (registro, documentos, flashcards, estudio, IA, validación, PWA)

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

---

## Sistema de Autenticación Centralizado (MEJORADO)

### Arquitectura
```
src/
├── contexts/
│   └── AuthContext.tsx    # Provider global de auth
├── components/
│   └── ProtectedRoute.tsx  # Componente para rutas protegidas
└── lib/
    └── auth.ts            # Helpers de autenticación
```

### Uso del AuthContext
```typescript
// 1. En layout.tsx (ya configurado automáticamente)
import { AuthProvider } from '@/contexts/AuthContext';

// 2. En cualquier componente
import { useAuth } from '@/contexts/AuthContext';

function MiComponente() {
  const { user, token, isAuthenticated, login, register, logout } = useAuth();
  // ...
}
```

### Rutas Protegidas (PÁGINAS)
```typescript
// En cada página protegida usar ProtectedRoute
import { ProtectedRoute } from '@/components/ProtectedRoute';

function DashboardContent() { /* contenido */ }

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### Rutas actualizadas con el sistema centralizado:
- `/dashboard` ✅
- `/documents` ✅
- `/upload` ✅
- `/study` ✅ (pendiente actualizar)
- `/documents/new` ✅

### Onboarding (Registro con AuthContext)
```typescript
const { register } = useAuth();

const handleSubmit = async () => {
  const result = await register({
    email: 'user@example.com',
    password: 'password123',
    name: 'Usuario',
  });
  
  if (result.success) {
    // Token guardado automáticamente
    router.push('/dashboard');
  } else {
    setError(result.error);
  }
};
```

### Errores Arreglados con este Sistema:
1. ✅ Onboarding ya NO crea usuarios falsos (guarda en localStorage sin token)
2. ✅ Rutas protegidas ya NO fallan silenciosamente
3. ✅ Errores claros visibles en UI
4. ✅ Token se verifica automáticamente en todas las páginas
5. ✅ Logout limpia todo correctamente

_Ultima actualizacion: 2026-03-22_

_Ultima actualizacion errores: 2026-03-22_
