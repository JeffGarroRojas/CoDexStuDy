# AGENTS.md - CoDexStuDy

## 📋 Resumen del Proyecto

**CoDexStuDy** es una plataforma de estudio asistida por IA que transforma materiales en resúmenes, flashcards, y planes de estudio personalizados.

**Stack**: Next.js 16 + Express + PostgreSQL + Redis + Groq AI

---

## 🏗️ ARQUITECTURA DE SEGURIDAD (ELIMINACIÓN DE BUCLES)

Flujo de acceso lineal y seguro para evitar redirecciones infinitas:

```
1. Auth Separada: /registro (Email + Password)
         ↓
2. Verificación OTP: /verificar (Código maestro: 123456)
         ↓
3. Guardián de Rutas (Middleware - ProtectedRoute.tsx):
   - Si no hay login → /login
   - Si hay login pero no verificación → /verificar
   - Si está verificado pero no perfil → /bienvenida-coddy
   - Todo correcto → /inicio
```

---

## 🤖 EL ECOSISTEMA DE ESTUDIO (CODDY IA)

### Entrevista Inicial
- CoDDy charla con el usuario en `/bienvenida-coddy`
- Conoce: nombre, grado, métodos de estudio

### Refinamiento Humano
- En `/nuevo-estudio`, la IA propone temas basados en PDF/Texto
- Usuario puede corregir, añadir o eliminar temas antes de generar contenido

### Algoritmo SM-2 (Repaso Espaciado)
- Calcula automáticamente cuándo repasar según desempeño
- Parámetros: Repeticiones y Factor de Facilidad

---

## 🚀 Estado Actual (2026-03-22)

### ✅ Completado

#### Autenticación (Flujo Sin Bucle)
1. **Registro** (`/registro`) - Email + password → crea cuenta → `/verificar`
2. **Verificación** (`/verificar`) - OTP de 6 dígitos (código: 123456)
3. **Login** (`/login`) - Email + password → verifica → `/inicio` o `/bienvenida-coddy`
4. **Bienvenida CoDDy** (`/bienvenida-coddy`) - Entrevista: nombre → grado → método → estilo → objetivo

#### Rutas del Sistema
```
/ (landing)
/registro (crear cuenta)
/login (iniciar sesión)
/verificar (OTP - código: 123456)
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

#### Funciones Avanzadas
- ✅ **Semáforo de Retención**: Dashboard marca temas en Rojo (repaso urgente), Amarillo (próximo) o Verde (dominado) según nextReview
- ✅ **TTS (Texto a Voz)**: Botón para escuchar resúmenes en español (es-ES)
- ✅ **STT (Voz a Texto)**: Comandos de voz para interactuar con CoDDy ("CoDDy, crea un examen")
- ✅ **Exportación PDF**: Generar PDF profesional de resúmenes para imprimir
- ✅ **Gamificación**: Contador de Racha de Estudio y Gráfico de Radar por materia

#### PWA (Android)
- ✅ manifest.json configurado
- ✅ Service Workers registrados
- ✅ App instalable en Android

#### SEO
- ✅ Metadatos (Title, Description, Keywords) en layout.tsx
- ✅ Indexación en Google

---

## 🗂️ Estructura de Carpetas

```
codexstudy/
├── frontend/src/
│   ├── app/
│   │   ├── page.tsx                    # Landing
│   │   ├── layout.tsx                  # Layout principal + SEO
│   │   ├── login/page.tsx             # Login
│   │   ├── registro/page.tsx           # Registro (email + password)
│   │   ├── verificar/page.tsx          # Verificación OTP
│   │   ├── bienvenida-coddy/page.tsx  # Entrevista CoDDy
│   │   ├── inicio/page.tsx            # Dashboard
│   │   ├── nuevo-estudio/page.tsx     # Crear estudio con IA
│   │   ├── biblioteca/page.tsx        # Mis estudios
│   │   ├── chat/page.tsx              # Chat IA
│   │   └── offline/page.tsx           # PWA offline
│   ├── components/
│   │   ├── Transiciones.tsx          # Animaciones framer-motion
│   │   ├── CoddyChat.tsx              # Chat de CoDDy
│   │   ├── ProtectedRoute.tsx          # Guardián de rutas
│   │   ├── ServiceWorkerRegistration.tsx
│   │   └── ...
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
   └── → /verificar

3. Verificación (/verificar)
   ├── Ingresa código de 6 dígitos
   ├── Código maestro: 123456
   └── → /bienvenida-coddy (si es nuevo) o /inicio

4. Login (/login)
   ├── Ingresa email/password
   ├── Backend verifica credenciales
   └── Si tiene onboardingDone=true → /inicio
      Si onboardingDone=false → /bienvenida-coddy
      Si no está verificado → /verificar

5. Bienvenida CoDDy (/bienvenida-coddy)
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
POST /api/auth/verify          - Verificar OTP
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

### Flashcards (SM-2)
```
GET  /api/flashcards           - Obtener tarjetas pendientes
POST /api/flashcards           - Crear tarjeta
PUT  /api/flashcards/:id       - Actualizar (responder) - aplica SM-2
```

---

## 🧪 Comandos

```bash
# Backend
cd codexstudy/backend
npm run dev           # Desarrollo
npm test              # Tests
npx prisma db push    # Sincronizar schema
npx prisma generate   # Generar cliente

# Frontend
cd codexstudy/frontend
npm run dev           # Desarrollo
npm run build         # Build producción

# Verificar TypeScript
npx tsc --noEmit
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
   - `/verificar` - Verificación OTP
   - `/bienvenida-coddy` - Entrevista CoDDy
   - `/inicio` - Dashboard (NO /dashboard)
   - `/biblioteca` - Estudios guardados (NO /mis-estudios)
   - `/nuevo-estudio` - Crear estudio
   - `/chat` - Chat IA

8. **Flujo de seguridad**: Mantener el orden /registro → /verificar → /bienvenida-coddy → /inicio

---

## 🚧 Pendiente / Por Hacer

- [ ] Refinar interfaz visual del Dashboard (sombras, bordes redondeados, estilo premium)
- [ ] Asegurar que la IA nunca mienta sobre la implementación de funciones

---

_Ultima actualización: 2026-03-22_
