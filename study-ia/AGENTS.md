# AGENTS.md - Guía para Agentes IA

Este documento proporciona contexto completo para que agentes de IA puedan trabajar efectivamente con el proyecto Study-IA sin necesidad de exploración adicional.

---

## Resumen del Proyecto

**Study-IA** es una plataforma de estudio asistida por IA que transforma documentos PDF/texto en:
- Resúmenes inteligentes
- Flashcards con repetición espaciada (algoritmo SM-2)
- Preguntas y respuestas
- Planes de estudio personalizados

**Stack**: Next.js 14 + Express + PostgreSQL + Redis + Ollama/Groq/HuggingFace

---

## Estado Actual

### ✅ Funcional
- TypeScript compilando sin errores (backend y frontend)
- API REST completa con autenticación JWT
- Base de datos PostgreSQL con Prisma ORM
- Generación de contenido con IA (3 proveedores)
- Algoritmo SM-2 implementado
- Docker Compose configurado

### ⚠️ Pendiente/Incompleto
1. **ESLint backend**: node_modules corrupto, reinstalar con `npm install`
2. **Docker**: Permiso denegado al socket (requiere `sudo usermod -aG docker $USER`)
3. **Tests**: Sin framework configurado
4. **PWA**: Funcionalidad incompleta
5. **Onboarding**: UI parcial

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
│   │   │   └── study.routes.ts
│   │   ├── services/ai/           # Lógica de IA
│   │   │   ├── AiService.ts       # Orquestador
│   │   │   ├── ai.types.ts        # Tipos TypeScript
│   │   │   └── providers/        # Ollama, Groq, HuggingFace
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # JWT validation
│   │   │   └── error.middleware.ts
│   │   └── utils/
│   │       └── pdfExtractor.ts    # Extracción de texto PDF
│   └── prisma/
│       └── schema.prisma           # Schema de BD
│
├── frontend/
│   ├── src/
│   │   ├── app/                   # App Router pages
│   │   │   ├── page.tsx           # Landing
│   │   │   ├── login.tsx
│   │   │   ├── registro.tsx
│   │   │   ├── dashboard/
│   │   │   └── documentos/
│   │   ├── componentes/           # Componentes React
│   │   ├── hooks/                # Custom hooks
│   │   └── lib/
│   │       └── api.ts            # Cliente API
│   └── .env.local
│
└── docker-compose.yml
```

### Puerto de Servicios
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

# Generar cliente Prisma
npm run prisma:generate

# Sincronizar schema con DB
npm run prisma:push

# Ver DB (si hay problemas)
npx prisma studio
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

---

## Base de Datos

### Modelos Principales

**User** → tiene muchos Documents, Flashcards, StudySessions

**Document** → tiene muchos Flashcards
- `content`: texto completo del documento
- `summary`: resumen generado por IA
- `keyPoints`: array de puntos clave

**Flashcard** → usa SM-2
- `easeFactor`: factor de facilidad (default 2.5)
- `interval`: días hasta próximo review
- `nextReview`: fecha del próximo review

**Review** → registro de cada revisión
- `quality`: 0-5 (qué tan bien recordaste)

### Queries Comunes
```sql
-- Flashcards pendientes de revisión
SELECT * FROM flashcards 
WHERE "nextReview" <= NOW() 
AND "userId" = $1;

-- Estadísticas de usuario
SELECT COUNT(*), AVG(accuracy) 
FROM study_sessions 
WHERE "userId" = $1;
```

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

## Troubleshooting

### Error: "Cannot find module"
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

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
```bash
docker-compose up -d redis
docker-compose logs redis
```

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

---

## Contacto / Contribuir

1. Fork el repositorio
2. Crear branch (`git checkout -b feature/nueva-funcion`)
3. Commit cambios (`git commit -m 'feat: agregar nueva función'`)
4. Push al branch
5. Abrir Pull Request

---

_Última actualización: 2026-03-19_
