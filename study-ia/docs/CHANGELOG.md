# Changelog

Todos los cambios notables de Study-IA serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [1.0.0] - 2026-03-19

### Added
- **Frontend Next.js 14**
  - Páginas de autenticación (login/register)
  - Dashboard con estadísticas
  - Gestión de documentos (crear, ver, editar, eliminar)
  - Sistema de estudio con flashcards
  - Diseño responsive mobile-first
  - PWA con service worker
  - Soporte para notificaciones push

- **Backend Express**
  - API REST completa
  - Sistema de autenticación JWT
  - Gestión de usuarios
  - CRUD de documentos
  - Sistema de flashcards con algoritmo SM-2
  - Repetición espaciada
  - Historial de sesiones de estudio

- **Integración IA**
  - Proveedor Ollama (local, gratuito)
  - Proveedor Groq (API gratuita)
  - Proveedor Hugging Face
  - Generación de resúmenes
  - Creación de flashcards automáticas
  - Generación de Q&A
  - Creación de planes de estudio
  - Sistema de fallback automático entre proveedores

- **Base de Datos**
  - Schema Prisma para PostgreSQL
  - Modelos: User, Document, Flashcard, Review, StudySession, QA
  - Índices optimizados
  - Soporte para Redis (caché)

- **Desktop App**
  - Configuración Tauri
  - Build para Windows (.exe)
  - Ventana redimensionable
  - Instalación local

- **DevOps**
  - Docker Compose completo
  - Scripts de automatización (setup.sh)
  - Configuración para desarrollo

### Infrastructure
- PostgreSQL 16 (contenedor)
- Redis 7 (contenedor)
- Node.js 20
- TypeScript 5
- Node.js + Express backend

### Documentation
- README.md completo
- API.md con todos los endpoints
- CHANGELOG.md

### Security
- Helmet.js para headers HTTP
- CORS configurado
- JWT para autenticación
- Contraseñas hasheadas con bcrypt
- Validación con Zod

---

## Próximos Pasos

### [1.1.0] - Planned
- [ ] Editor de texto enriquecido para documentos
- [ ] Importación de PDFs
- [ ] Exportación a Anki
- [ ] Modo oscuro
- [ ] Sincronización entre dispositivos
- [ ] Importación desde URL

### [1.2.0] - Planned
- [ ] Sistema de gamificación
- [ ] Logros y badges
- [ ] Calendario de estudio
- [ ] Recordatorios de estudio
- [ ] Análisis de progreso detallado

### [2.0.0] - Future
- [ ] App móvil nativa (iOS/Android)
- [ ] Modo offline completo
- [ ] Colaboración en tiempo real
- [ ] Integración con LMS (Moodle, Canvas)
