# AGENTS.md - CoDexStuDy

## 📋 Resumen del Proyecto

**CoDexStuDy** es una plataforma de estudio asistida por IA que transforma materiales en resúmenes, flashcards, y planes de estudio personalizados.

**Stack**: Next.js 16 + Express + PostgreSQL + Redis + Groq AI

---

## 🚀 Estado Actual (2026-03-23)

### ✅ Completado

#### Autenticación (Flujo Sin Bucle)
1. **Registro** (`/registro`) - Solo email + password → crea cuenta → `/bienvenida-coddy`
2. **Login** (`/login`) - Email + password → verifica perfil → `/inicio` o `/bienvenida-coddy`
3. **Bienvenida CoDDy** (`/bienvenida-coddy`) - Entrevista: nombre → grado → método → estilo → objetivo

#### Rutas del Sistema (Actual)
```
/ (landing)
/registro (crear cuenta)
/login (iniciar sesión)
/bienvenida-coddy (entrevista de perfilamiento)
/inicio (dashboard principal)
/nuevo-estudio (crear estudio con IA)
/biblioteca (mis estudios guardados)
/chat (asistente IA CoDDy)
/offline (PWA offline)
```

#### Navegación
- ✅ Todos los enlaces verificados
- ✅ Cero errores 404 garantizados
- ✅ Redirecciones automáticas correctas

#### Chat IA (CoDDy)
- ✅ Respuestas conversacionales en español
- ✅ Filtra contenido inapropiado
- ✅ Responde sobre quién lo creó (Jeff del DAM)
- ✅ Historial persistente por usuario
- ✅ Manejo robusto de errores de red

#### Generación de Contenido
- ✅ Reintento automático (hasta 3 intentos)
- ✅ Mensajes de error amigables
- ✅ Estados de carga visuales

---

## 🗂️ Estructura de Carpetas

```
study-ia/
├── frontend/src/
│   ├── app/
│   │   ├── page.tsx                    # Landing
│   │   ├── layout.tsx                  # Layout principal
│   │   ├── login/page.tsx             # Login
│   │   ├── registro/page.tsx           # Registro (email + password)
│   │   ├── bienvenida-coddy/page.tsx  # Entrevista CoDDy
│   │   ├── inicio/page.tsx            # Dashboard
│   │   ├── nuevo-estudio/page.tsx     # Crear estudio con IA
│   │   ├── biblioteca/page.tsx        # Mis estudios
│   │   ├── chat/page.tsx              # Chat IA
│   │   └── offline/page.tsx           # PWA offline
│   ├── components/
│   │   ├── Transiciones.tsx          # Animaciones framer-motion
│   │   ├── CoddyChat.tsx              # Chat de CoDDy
│   │   ├── ProtectedRoute.tsx          # Rutas protegidas
│   │   └── ServiceWorkerRegistration.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx            # Contexto de autenticación
│   └── lib/
│       ├── auth.ts                    # Helpers de auth
│       └── providers.tsx               # Providers
│
├── backend/
│   ├── src/
│   │   ├── server.ts                  # Entry point Express
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # Auth (login, register, update)
│   │   │   ├── chat.routes.ts         # Historial de chat
│   │   │   ├── coddy.routes.ts        # CoDDy perfilamiento
│   │   │   ├── ai.routes.ts           # IA (chat, summarize, flashcards)
│   │   │   ├── flashcard.routes.ts     # Flashcards SM-2
│   │   │   ├── document.routes.ts      # Documentos
│   │   │   ├── study.routes.ts         # Sesiones de estudio
│   │   │   ├── upload.routes.ts        # Upload PDF
│   │   │   ├── admin.routes.ts         # Admin
│   │   │   ├── notification.routes.ts  # Notificaciones
│   │   │   └── export.routes.ts         # Import/Export
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── AiService.ts       # Orquestador IA
│   │   │   │   └── providers/         # Ollama, Groq, HuggingFace
│   │   │   └── sm2.ts                 # Algoritmo SM-2
│   │   └── middleware/
│   │       ├── auth.middleware.ts      # JWT validation
│   │       └── rateLimit.middleware.ts
│   └── prisma/
│       └── schema.prisma               # Schema de BD
│
└── docker-compose.yml
```

---

## 🔐 Flujo de Autenticación

```
1. Landing (/)
   └── "Comenzar" → /registro
           
2. Registro (/registro)
   ├── Ingresa email + password
   ├── Backend crea usuario
   └── → /bienvenida-coddy (si es nuevo)
       → /inicio (si ya tiene perfil)

3. Login (/login)
   ├── Ingresa email/password
   ├── Backend verifica credenciales
   └── Si tiene onboardingDone=true → /inicio
      Si onboardingDone=false → /bienvenida-coddy

4. Bienvenida CoDDy (/bienvenida-coddy)
   ├── CoDDy pregunta: nombre, grado, método, estilo, objetivo
   ├── Guarda en DB: PUT /api/auth/update-profile
   └── → /inicio (marca onboardingDone=true)
```

---

## 🤖 Chat IA - CoDDy

### Prompt del Chat (en ai.routes.ts)

```typescript
const prompt = `Eres CoDy, el asistente de estudio de CoDexStuDy.
Fui creado por Jeff del Desarrollo de Aplicaciones Móviles.
Ayudo a estudiantes costarricenses de ${grade}° grado.

Responde de manera:
- Conversacional y amigable
- En español claro y simple
- Corta y directa (máximo 3 oraciones)
- Solo texto plano, sin JSON

Si preguntan quién te creó: "¡En serio! Fui creado por Jeff del Desarrollo de Aplicaciones Móviles."
`;
```

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register        - Registro (email, password)
POST /api/auth/login           - Login (email, password)
PUT  /api/auth/update-profile  - Actualizar perfil + marcar onboardingDone
GET  /api/auth/me             - Usuario actual
```

### Chat
```
POST /api/chat     - Guardar mensaje
GET  /api/chat     - Obtener historial
DELETE /api/chat   - Limpiar historial
```

### IA
```
POST /api/ai/chat              - Chat conversacional
POST /api/ai/summarize          - Resumir texto
POST /api/ai/flashcards         - Generar flashcards
POST /api/ai/qa                 - Generar preguntas
POST /api/ai/buscar-temas       - Buscar temas MEP
POST /api/ai/recomendar-metodo   - Recomendar método
```

---

## 🧪 Comandos

```bash
# Backend
cd study-ia/backend
npm run dev           # Desarrollo
npm test              # Tests
npx prisma db push    # Sincronizar schema
npx prisma generate   # Generar cliente

# Frontend
cd study-ia/frontend
npm run dev           # Desarrollo
npm run build         # Build producción
```

---

## 📝 Reglas para Agentes

1. **SIEMPRE subir a git**: `git add . && git commit -m "descripción" && git push`

2. **Verificar TypeScript**: `npx tsc --noEmit` antes de commitear

3. **Traducir al español**: Todos los textos de UI, mensajes de error, comentarios

4. **No romper la DB**: No cambiar nombres de campos de Prisma

5. **Usar transiciones**: Agregar animaciones con framer-motion

6. **Manejo de errores**: Siempre try-catch en fetch, con reintentos para IA

7. **Rutas correctas**:
   - `/registro` - Registro
   - `/login` - Login  
   - `/bienvenida-coddy` - Entrevista CoDDy
   - `/inicio` - Dashboard (NO /dashboard)
   - `/biblioteca` - Estudios guardados (NO /mis-estudios)
   - `/nuevo-estudio` - Crear estudio
   - `/chat` - Chat IA

---

## 🚧 Pendiente / Por Hacer

- [ ] PWA: Configurar manifest.json para Android
- [ ] PWA: Botón "Instalar en Android"
- [ ] Validación de temas: Permitir añadir temas manualmente
- [ ] Profundidad: Opción de explicar temas complejos más a fondo

---

_Ultima actualización: 2026-03-23_
