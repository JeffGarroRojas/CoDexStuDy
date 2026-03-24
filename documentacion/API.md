# CoDexStuDy API Documentation

API REST completa para CoDexStuDy.

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.codexstudy.com/api
```

## Autenticación

Todas las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

## Response Format

### Success
```json
{
  "success": true,
  "data": { ... }
}
```

### Error
```json
{
  "success": false,
  "error": "Mensaje de error"
}
```

---

## Autenticación

### Register
Crear nueva cuenta de usuario.

**POST** `/auth/register`

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña123",
  "name": "Nombre Usuario"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "name": "Nombre Usuario"
    },
    "token": "jwt-token"
  }
}
```

---

### Login
Iniciar sesión.

**POST** `/auth/login`

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "name": "Nombre Usuario"
    },
    "token": "jwt-token"
  }
}
```

---

### Get Current User
Obtener usuario autenticado.

**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@email.com",
      "name": "Nombre Usuario",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

## Documentos

### List Documents
Obtener lista de documentos.

**GET** `/documents`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "uuid",
        "title": "Título del documento",
        "summary": "Resumen generado",
        "sourceType": "text",
        "wordCount": 1500,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "_count": {
          "flashcards": 10
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

---

### Create Document
Crear nuevo documento.

**POST** `/documents`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Título del documento",
  "content": "Contenido del texto...",
  "sourceType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "title": "Título del documento",
      "content": "Contenido...",
      "wordCount": 500,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

---

### Get Document
Obtener documento específico.

**GET** `/documents/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "uuid",
      "title": "Título",
      "content": "Contenido...",
      "summary": "Resumen...",
      "keyPoints": ["punto 1", "punto 2"],
      "wordCount": 1500,
      "flashcards": [
        {
          "id": "uuid",
          "front": "Pregunta",
          "back": "Respuesta"
        }
      ]
    }
  }
}
```

---

### Update Document
Actualizar documento.

**PUT** `/documents/:id`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "title": "Nuevo título",
  "content": "Nuevo contenido",
  "summary": "Nuevo resumen",
  "keyPoints": ["punto 1", "punto 2"]
}
```

---

### Delete Document
Eliminar documento.

**DELETE** `/documents/:id`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "message": "Document deleted"
}
```

---

## Flashcards

### List Flashcards
Obtener todas las flashcards.

**GET** `/flashcards`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `due` (boolean) - Solo tarjetas pendientes
- `documentId` (uuid) - Filtrar por documento
- `tags` (string) - Filtrar por tags
- `page` (number)
- `limit` (number)

---

### Get Due Flashcards
Obtener tarjetas pendientes de revisión.

**GET** `/flashcards/due`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `limit` (number, default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "flashcards": [...],
    "count": 15
  }
}
```

---

### Get Flashcard Stats
Estadísticas de flashcards.

**GET** `/flashcards/stats`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCards": 100,
    "dueCards": 25,
    "masteredCards": 50,
    "recentSessions": [...],
    "retention": 65
  }
}
```

---

### Create Flashcard
Crear flashcard manualmente.

**POST** `/flashcards`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "documentId": "uuid",
  "front": "¿Qué es la fotosíntesis?",
  "back": "Proceso por el cual las plantas convierten luz en energía",
  "tags": ["biología", "botánica"]
}
```

---

### Review Flashcard
Revisar flashcard (algoritmo SM-2).

**POST** `/flashcards/review`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "flashcardId": "uuid",
  "quality": 4
}
```

**Quality Scale:**
- 0: Fallo total
- 1: Fallo con pistas
- 2: Fallo cercano
- 3: Correcto con dificultad
- 4: Correcto
- 5: Perfecto

**Response:**
```json
{
  "success": true,
  "data": {
    "review": {
      "id": "uuid",
      "quality": 4,
      "responseTime": 2500
    },
    "flashcard": {
      "id": "uuid",
      "nextReview": "2024-01-08T00:00:00Z",
      "interval": 6,
      "repetitions": 2
    },
    "nextReview": "2024-01-08T00:00:00Z"
  }
}
```

---

## IA

### Get Providers Status
Estado de proveedores de IA.

**GET** `/ai/providers`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "providers": [
      { "name": "ollama", "available": true, "priority": 0 },
      { "name": "groq", "available": true, "priority": 1 }
    ],
    "active": "ollama"
  }
}
```

---

### Generate Summary
Generar resumen con IA.

**POST** `/ai/summarize`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Texto largo para resumir...",
  "documentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": "Resumen en párrafos...",
    "keyPoints": [
      "Punto clave 1",
      "Punto clave 2",
      "Punto clave 3"
    ],
    "wordCount": 150
  }
}
```

---

### Generate Q&A
Generar pregunta y respuesta.

**POST** `/ai/qa`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Contenido para generar Q&A...",
  "context": "Contexto adicional opcional",
  "documentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "¿Cuál es la pregunta?",
    "answer": "La respuesta completa...",
    "confidence": 0.95,
    "id": "uuid"
  }
}
```

---

### Generate Flashcards
Generar flashcards con IA.

**POST** `/ai/flashcards`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Contenido para generar flashcards...",
  "count": 5,
  "documentId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "flashcards": [
      {
        "id": "uuid",
        "front": "Pregunta 1",
        "back": "Respuesta 1",
        "tags": ["tag1", "tag2"]
      }
    ],
    "generated": 5
  }
}
```

---

### Generate Study Plan
Generar plan de estudio.

**POST** `/ai/study-plan`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "content": "Contenido del tema...",
  "timeAvailable": "2 horas"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": [
      {
        "topic": "Introducción",
        "duration": "30 min",
        "activities": ["Leer", "Tomar notas"]
      }
    ],
    "tips": [
      "Consejo 1",
      "Consejo 2"
    ]
  }
}
```

---

## Study Sessions

### List Sessions
Historial de sesiones de estudio.

**GET** `/study/sessions`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (number)
- `limit` (number)

---

### Start Session
Iniciar nueva sesión de estudio.

**POST** `/study/sessions/start`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "topic": "Biología - Capítulo 5"
}
```

---

### End Session
Terminar sesión de estudio.

**PUT** `/study/sessions/:id/end`

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "cardsStudied": 25,
  "cardsLearned": 20,
  "accuracy": 0.85
}
```

---

### Get Dashboard
Estadísticas generales del dashboard.

**GET** `/study/dashboard`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCards": 150,
    "dueCards": 30,
    "monthlySessions": 12,
    "weeklyMinutes": 180,
    "weeklyAccuracy": 87.5,
    "streak": 7,
    "recentActivity": [...]
  }
}
```

---

## Errores Comunes

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - Token inválido |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no existe |
| 500 | Server Error - Error interno |

---

## Rate Limits

| Endpoint | Límite |
|----------|--------|
| `/ai/*` | 30 requests/minuto |
| Otros | 100 requests/minuto |
