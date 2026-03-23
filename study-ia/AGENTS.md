# AGENTS.md - CoDexStuDy

## 📋 Resumen del Proyecto

**CoDexStuDy** es una plataforma de estudio asistida por IA que transforma materiales en resúmenes, flashcards, y planes de estudio personalizados.

**Stack**: Next.js 16 + Express + PostgreSQL + Redis + Groq AI

---

## 🚀 Estado Actual (2026-03-22)

### ✅ Completado

#### Autenticación
- **Login** (`/login`) - Página de inicio de sesión con email/password
- **Registro** (`/registro`) - Registro con verificación de código por email
- **Bienvenida CoDDy** (`/bienvenida-coddy`) - Entrevista de perfilamiento con IA
- Flujo de autenticación completo sin bucles infinitos
- Historial de chat guardado en base de datos

#### Rutas del Sistema
- `/` - Landing page
- `/login` - Inicio de sesión
- `/registro` - Registro con verificación de email
- `/bienvenida-coddy` - Entrevista con CoDDy (nuevos usuarios)
- `/inicio` - Dashboard principal
- `/nuevo-estudio` - Crear nuevo estudio
- `/biblioteca` - Mis estudios
- `/chat` - Chat con IA
- `/offline` - Página offline PWA

#### Chat IA (CoDDy)
- Respuestas conversacionales en español
- Filtra contenido inapropiado
- Responde sobre quién lo creó (Jeff del DAM)
- Historial persistente por usuario
- Transiciones animadas con framer-motion

#### Transiciones y Animaciones
- Componente `Transiciones.tsx` con:
  - `PaginaTransicion` - Animación de entrada de página
  - `TarjetaAnimada` - Tarjetas con hover
  - `BotonAnimado` - Botones con feedback táctil
  - `ListaTransicion` - Elementos de lista animados
  - `Cargando` - Indicador de carga animado

### 🔧 En Progreso

- Reorganización de estructura de carpetas
- Estandarización de textos a español
- Eliminación de código duplicado

---

## 🗂️ Estructura de Carpetas (Actual)

```
study-ia/
├── frontend/src/
│   ├── app/
│   │   ├── page.tsx                    # Landing
│   │   ├── layout.tsx                  # Layout principal
│   │   ├── login/page.tsx             # Login
│   │   ├── registro/page.tsx           # Registro con verificación
│   │   ├── bienvenida-coddy/page.tsx  # Entrevista CoDDy
│   │   ├── inicio/page.tsx            # Dashboard
│   │   ├── nuevo-estudio/page.tsx     # Nuevo estudio
│   │   ├── biblioteca/page.tsx        # Mis estudios
│   │   ├── chat/page.tsx              # Chat IA
│   │   ├── offline/page.tsx            # PWA offline
│   │   └── api/auth/[...nextauth]/    # NextAuth route
│   ├── components/
│   │   ├── Transiciones.tsx          # Animaciones (framer-motion)
│   │   ├── CoddyChat.tsx              # Chat de CoDDy
│   │   ├── ProtectedRoute.tsx          # Ruta protegida
│   │   ├── ServiceWorkerRegistration.tsx
│   │   └── ui/                        # Componentes UI
│   ├── contexts/
│   │   └── AuthContext.tsx            # Contexto de autenticación
│   ├── lib/
│   │   ├── auth.ts                    # Helpers de auth
│   │   └── providers.tsx              # Providers
│   ├── styles/
│   │   └── globals.css                # Estilos globales
│   └── test/
│       └── *.test.ts                  # Tests
│
├── backend/
│   ├── src/
│   │   ├── server.ts                  # Entry point Express
│   │   ├── routes/
│   │   │   ├── auth.routes.ts         # Auth (login, register, update)
│   │   │   ├── verify.routes.ts       # Verificación de email
│   │   │   ├── chat.routes.ts         # Historial de chat
│   │   │   ├── coddy.routes.ts        # CoDDy perfilamiento
│   │   │   ├── ai.routes.ts          # IA (chat, summarize, etc)
│   │   │   ├── flashcard.routes.ts    # Flashcards SM-2
│   │   │   ├── document.routes.ts     # Documentos
│   │   │   ├── study.routes.ts       # Sesiones de estudio
│   │   │   ├── upload.routes.ts      # Upload PDF
│   │   │   ├── admin.routes.ts        # Admin
│   │   │   ├── notification.routes.ts # Notificaciones
│   │   │   └── export.routes.ts       # Import/Export
│   │   ├── services/
│   │   │   ├── ai/
│   │   │   │   ├── AiService.ts      # Orquestador IA
│   │   │   │   ├── ai.types.ts       # Tipos
│   │   │   │   └── providers/         # Ollama, Groq, HuggingFace
│   │   │   ├── email.service.ts      # Envío de emails
│   │   │   └── sm2.ts                # Algoritmo SM-2
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts    # JWT validation
│   │   │   ├── error.middleware.ts   # Error handler
│   │   │   └── rateLimit.middleware.ts
│   │   └── utils/
│   │       └── pdfExtractor.ts        # Extracción PDF
│   └── prisma/
│       └── schema.prisma              # Schema de BD
│
└── docker-compose.yml
```

---

## 🗄️ Base de Datos (Prisma)

### Modelos Principales

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  name          String?
  studyMethod   String    @default("hibrido")
  level         String    @default("intermedio")
  learningStyle String    @default("practico")
  grado         String?   @default("8")
  area          String?   @default("cientifico")
  onboardingDone Boolean  @default(false)
  
  documents     Document[]
  flashcards    Flashcard[]
  chatMessages  ChatMessage[]
  coddyProfile  CoDDyProfile?
}

model ChatMessage {
  id          String   @id @default(uuid())
  userId      String
  role        String   # "user" o "assistant"
  content     String
  createdAt   DateTime @default(now())
}

model EmailVerification {
  id          String   @id @default(uuid())
  email       String
  code        String
  name        String?
  password    String?  # Hash de la contraseña temporal
  expiresAt   DateTime
}

model CoDDyProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  metodoPreferido String   @default("hibrido")
  objetivo        String?
  estiloAprendizaje String @default("practico")
}

model Flashcard {
  id          String   @id @default(uuid())
  front       String
  back        String
  easeFactor  Float    @default(2.5)
  interval    Int      @default(1)
  nextReview  DateTime @default(now())
  repetitions Int      @default(0)
}
```

---

## 🔐 Flujo de Autenticación

```
1. Usuario accede a /
   ↓
2. ¿Tiene token?
   ├── NO → Ir a /login
   └── SÍ → Ir a /inicio (si tiene perfil) o /bienvenida-coddy (si no tiene)
   
3. Login (/login)
   ├── Ingresa email/password
   ├── Backend verifica credenciales
   ├── Si tiene studyMethod y name → /inicio
   └── Si NO tiene → /bienvenida-coddy

4. Registro (/registro)
   ├── Ingresa datos + email
   ├── Backend envía código de 6 dígitos al email
   ├── Usuario ingresa código
   ├── Backend verifica y crea usuario
   └── → /bienvenida-coddy

5. Bienvenida CoDDy (/bienvenida-coddy)
   ├── CoDDy pregunta: nombre, grado, método, estilo, objetivo
   ├── Guarda respuestas en DB
   └── → /inicio
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

### Manejo de Respuestas
- Para `chat_response`, `buscar_temas_mep`, `recomendar_metodo`: NO se parsea JSON
- Para otras tareas: Se parsea JSON normalmente

---

## 🎨 Transiciones y Animaciones

### Componente Transiciones.tsx

```tsx
import { Transicion, PaginaTransicion, TarjetaAnimada, BotonAnimado } from '@/components/Transiciones';

// Uso:
<PaginaTransicion>
  <Contenido />
</PaginaTransicion>

<TarjetaAnimada delay={0.1}>
  <Tarjeta />
</TarjetaAnimada>

<BotonAnimado onClick={handler}>
  Botón
</BotonAnimado>
```

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register    - Registro directo
POST /api/auth/login       - Login
PUT  /api/auth/update-profile - Actualizar perfil
GET  /api/auth/me          - Usuario actual
```

### Verificación
```
POST /api/verify/send-code    - Enviar código
POST /api/verify/verify-code   - Verificar código
```

### Chat
```
POST /api/chat    - Guardar mensaje
GET  /api/chat    - Obtener historial
DELETE /api/chat - Limpiar historial
```

### IA
```
POST /api/ai/chat              - Chat conversacional
POST /api/ai/summarize         - Resumir texto
POST /api/ai/flashcards        - Generar flashcards
POST /api/ai/buscar-temas      - Buscar temas MEP
POST /api/ai/recomendar-metodo - Recomendar método
```

### CoDDy
```
POST /api/coddy/entrevista - Entrevista de perfilamiento
GET  /api/coddy/perfil     - Obtener perfil
PUT  /api/coddy/perfil     - Actualizar perfil
```

---

## 🔧 Configuración

### Variables de Entorno (Backend)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=tu-secret
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu@email.com
SMTP_PASS=tu-password
```

### Variables de Entorno (Frontend)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
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
npm run dev           # Desarrollo (--no-turbopack si hay errores)
npm run build         # Build producción
npm test -- --run     # Tests
```

---

## 📝 Reglas para Agentes

1. **SIEMPRE subir a git**: Después de cada cambio `git add . && git commit -m "descripción" && git push`

2. **Verificar TypeScript**: `npx tsc --noEmit` antes de commitear

3. **Traducir al español**: Todos los textos de UI, mensajes de error, comentarios

4. **No romper la DB**: No cambiar nombres de campos de Prisma que afecten datos existentes

5. **Usar transiciones**: Agregar `PaginaTransicion`, `TarjetaAnimada`, `BotonAnimado` para mejorar UX

6. **Mantener agents.md actualizado**: Documentar cambios conforme se hacen

---

## 🚧 Pendiente / Por Hacer

- [ ] Reorganizar carpetas legacy (estudios, documents, etc)
- [ ] Terminar de traducir todos los mensajes de error
- [ ] Tests E2E actualizados
- [ ] Documentar componentes UI

---

_Ultima actualización: 2026-03-23_
