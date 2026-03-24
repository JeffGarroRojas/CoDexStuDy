# ANÁLISIS DE INTERFACES - CoDexStuDy

## FASE 2: DOCUMENTACIÓN Y AUDITORÍA

---

### 1. `/` - Landing Page
**Función Real:** Página de inicio pública con información del producto y CTA hacia registro.

**Importancia (1-10):** 4
- Útil para usuarios nuevos
- Ya existe onboarding claro

**Recomendación:** **MANTENER** (puede simplificarse)

---

### 2. `/onboarding` - Flujo de Registro
**Función Real:** Captura datos del usuario (nombre, grado, área, materias) y crea cuenta.

**Importancia (1-10):** 10
- **CRÍTICO** - Punto de entrada principal

**Problemas identificados:**
- Paso 4 actual (quiz de adaptación) no se usa efectivamente
- La IA no "moldea" nada todavía
- Registro va directo al dashboard

**Recomendación:** **REFORMULAR** - Transformar con flujo de CoDDy

---

### 3. `/dashboard` - Panel Principal
**Función Real:** Dashboard post-login con opciones de "Crear Estudio" y "Mis Estudios".

**Importancia (1-10):** 7
- Punto central después de login
- Da acceso rápido a funciones principales

**Problemas identificados:**
- Muy básico, solo 2 botones
- No muestra stats ni progreso
- Redundante con otras páginas

**Recomendación:** **MANTENER** (pero simplificar, puede fusionarse con la interfaz post-registro de CoDDy)

---

### 4. `/study` - Crear Estudio
**Función Real:** Escribir tema o subir archivo → Genera flashcards, resumen y examen con IA.

**Importancia (1-10):** 10
- **FUNCIÓN CORE** del producto
- Genera contenido de estudio

**Problemas identificados:**
- Mezcla entrada de datos con generación
- Usa endpoint `/ai/generar-contenido` que puede no existir
- Diseño anticuado vs upload

**Recomendación:** **REFORMULAR** - Separar entrada (CoDDy) de generación

---

### 5. `/upload` - Subir PDF
**Función Real:** Upload de PDF → Extrae texto → Confirma temas → Elige método → Procesa.

**Importancia (1-10):** 9
- Funcionalidad importante para procesar documentos
- Flujo de pasos bien definido

**Problemas identificados:**
- Flujo muy largo (4 pasos)
- Duplica funcionalidad de `/study`
- Al terminar redirige a `/documents` (que no existe)

**Recomendación:** **FUSIONAR con `/study`** - Unificar entrada de contenido

---

### 6. `/mis-estudios` - Estudios Guardados
**Función Real:** Lista de estudios guardados por el usuario para continuar.

**Importancia (1-10):** 8
- Permite continuar estudios previos
- Feature importante de UX

**Problemas identificados:**
- Funciona correctamente
- Enlace a `/study/${id}` que probablemente no existe

**Recomendación:** **MANTENER** - Solo necesita validación de rutas

---

### 7. `/chat` - Chat con IA
**Función Real:** Chat interactivo con IA para resolver dudas.

**Importancia (1-10):** 6
- Feature de soporte
- No es core del estudio

**Problemas identificados:**
- Usa `/ai/chat` que puede no existir
- UI correcta pero funcionalmente no probada

**Recomendación:** **MANTENER como opcional** - Puede integrarse en dashboard

---

### 8. `/offline` - Página Offline PWA
**Función Real:** Página mostrada cuando no hay conexión.

**Importancia (1-10):** 3
- Feature PWA
- No afecta flujo principal

**Recomendación:** **MANTENER** - PWA funcional

---

### 9. `/debug-ia` - Sandbox IA
**Función Real:** Entorno de pruebas para validar funciones de IA.

**Importancia (1-10):** 5
- Útil para debugging
- No es para usuarios finales

**Recomendación:** **MANTENER como herramienta de desarrollo**

---

## RESUMEN DE RECOMENDACIONES

| Ruta | Recomendación | Prioridad |
|------|---------------|-----------|
| `/` | Mantener (simplificar) | Baja |
| `/onboarding` | **REFORMULAR con CoDDy** | **ALTA** |
| `/dashboard` | Fusionar con post-registro | Media |
| `/study` | Reformular + fusionar con upload | **ALTA** |
| `/upload` | Fusionar con `/study` | **ALTA** |
| `/mis-estudios` | Mantener | Baja |
| `/chat` | Mantener como opcional | Baja |
| `/offline` | Mantener | Baja |
| `/debug-ia` | Mantener (dev) | Baja |

---

# DISEÑO: FLUJO DE CODY (FASE 1)

## Visión General

CoDDy es un asistente de IA que guía al usuario desde el registro hasta su primera experiencia de estudio, moldeando el sistema según sus preferencias.

---

## FLUJO PROPUESTO

```
ONBOARDING (3 pasos)
     │
     ├── Paso 1: Nombre
     ├── Paso 2: Grado
     ├── Paso 3: Área/Materias
     │
     ▼
  REGISTRO EN BD ✓
     │
     ▼
┌─────────────────────────────────────┐
│     CODY CHAT INTERVIEW             │
│  (5-6 preguntas adaptativas)        │
│                                     │
│  "¡Hola! Soy CoDDy. Para moldear    │
│   tu experiencia, necesito           │
│   conocerte mejor..."               │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│     CODY RECOMIENDA MÉTODO           │
│                                     │
│  "Basado en tus respuestas, te       │
│   recomiendo: FLASHCA RDS"           │
│                                     │
│  [Cambiar método] [Continuar]       │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│     PREGUNTA DECISIÓN               │
│                                     │
│  "¿Quieres empezar a estudiar       │
│   algo justo ahora?"                │
│                                     │
│  [Ahora] [Más tarde]               │
└─────────────────────────────────────┘
     │
     ├──→ "Ahora" → /nuevo-estudio
     │
     └──→ "Más tarde" → /dashboard
```

---

## PREGUNTAS DE CODY (Entrevista Adaptativa)

### Pregunta 1: Métodos de Estudio
```
"¿Qué métodos de estudio prefieres o te funcionan mejor?"
- 📇 Flashcards (repetición espaciada)
- 📝 Resúmenes y esquemas
- 📋 Exámenes tipo prueba
- 🔊 Escuchar/Audio
- ✍️ Tomar apuntes
```

### Pregunta 2: Objetivo Principal
```
"¿Cuál es tu objetivo principal al estudiar?"
- 📚 Aprender para clase
- 🎯 Aprobar un examen específico
- 📖 Entender un tema complejo
- 🌐 Aprender un idioma
- 📚 Resumir libros
```

### Pregunta 3: Estilo de Aprendizaje
```
"¿Cómo aprendes más fácil?"
- 👁️ Viendo (diagramas, mapas, videos)
- 👂 Escuchando (explicaciones, podcasts)
- 📖 Leyendo (textos, libros)
- ✋ Practicando (ejercicios, problemas)
```

### Pregunta 4: Tiempo Disponible
```
"¿Cuánto tiempo puedes dedicar al estudio?"
- 🟢 30 min/día
- 🟡 1-2 horas/día
- 🔴 2+ horas/día
```

### Pregunta 5: Formato de Material
```
"¿Qué formato prefieres para estudiar?"
- 📄 PDFs y documentos
- 📱 Apuntes digitales
- 🌐 Recursos web
- 📚 Todo un poco
```

### Pregunta 6 (Opcional): Desafíos
```
"¿Qué te cuesta más al estudiar?"
- 😴 Mantener la concentración
- 📝 Recordar lo estudiado
- 📋 Organizar el tiempo
- 😰 Los exámenes
```

---

## LÓGICA DE RECOMENDACIÓN

### Algoritmo de Selección

```
Inputs: [metodo_preferido, objetivo, estilo, tiempo, formato]

Si tiempo >= 2h Y estilo == "practico":
  → Recomendación: "PLAN_ESTRUCTURADO"
  
Si objetivo == "examen":
  → Recomendación: "EXAMEN_SIMULADO" (prioridad)
  
Si estilo == "auditivo":
  → Recomendación: "TTS_RESUMEN"
  
Si formato == "pdf" Y metodo == "flashcards":
  → Recomendación: "FLASHCARDS_SM2" (óptimo)
  
Si objetivo == "aprender" Y tiempo < 1h:
  → Recomendación: "RESUMENES_CORTOS"
  
DEFAULT:
  → Recomendación: "HIBRIDO" (flashcards + resumen)
```

---

## INTERFAZ POST-REGISTRO: `/nuevo-estudio`

Esta es la pantalla después de decir "Ahora" en CoDDy:

```
┌─────────────────────────────────────────┐
│  🔙  CoDDy                    [Usuario] │
├─────────────────────────────────────────┤
│                                         │
│  "¡Hola! ¿Qué quieres estudiar hoy?"    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  📝 Escribe tu tema aquí...     │   │
│  │                                  │   │
│  │  Ej: La fotosíntesis,           │   │
│  │  Independendia de Costa Rica,    │   │
│  │  Funciones matemáticas...        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○ ○   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │       📄 SUBIR PDF / IMAGEN     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Basado en tu perfil, te recomiendo:    │
│  📇 Flashcards                         │
│  [Cambiar método]                      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     ▶ GENERAR CON CODY          │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## ENDPOINTS API REQUERIDOS

### POST `/api/cody/interview`
```typescript
// Guardar respuestas de entrevista
Request: {
  userId: string,
  respuestas: {
    metodo_preferido: string,
    objetivo: string,
    estilo: string,
    tiempo: string,
    formato: string,
    desafios: string
  }
}
Response: {
  success: boolean,
  recomendacion: {
    metodo: 'flashcards' | 'resumen' | 'examen' | 'tts' | 'hibrido',
    razones: string[],
    configuracion: object
  }
}
```

### POST `/api/cody/recomendar`
```typescript
// Generar recomendación basada en respuestas
Request: {
  respuestas: RespuestasEntrevista
}
Response: {
  success: boolean,
  recomendacion: MetodoEstudio,
  mensaje_personalizado: string
}
```

---

## ESTADO DEL USUARIO EN BD

```prisma
model User {
  // ... campos existentes ...
  
  // Nuevos campos para CoDDy
  codyProfile: CoDDyProfile?
  studyPreferences: Json? // Método recomendado configurado
}

model CoDDyProfile {
  id: String @id
  userId: String @unique
  user: User @relation(...)
  
  metodoPreferido: String
  objetivo: String
  estiloAprendizaje: String
  tiempoDisponible: String
  formatoMaterial: String
  desafios: String[]
  
  respuestasCompletas: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

---

## MOCKUP DE PREGUNTAS CODY (Terminal)

```
═══════════════════════════════════════════
  🤖 CODY - Entrevista de Adaptación
═══════════════════════════════════════════

CoDDy: ¡Hola! Soy CoDDy, tu asistente de estudio.
      Para personalizar tu experiencia, necesito
      conocerte un poco mejor. ¡Son solo 5 preguntas!

═══════════════════════════════════════════

[1/5] ¿Qué métodos de estudio prefieres?

  [A] 📇 Flashcards (repetición espaciada)
  [B] 📝 Resúmenes y esquemas
  [C] 📋 Exámenes tipo prueba
  [D] 🔊 Escuchar/Audio
  [E] ✍️ Todos por igual

  > 

───────────────────────────────────────────

[2/5] ¿Cuál es tu objetivo principal?

  [A] 📚 Aprender para clase
  [B] 🎯 Aprobar un examen
  [C] 📖 Entender un tema
  [D] 🌐 Aprender un idioma

  > 

───────────────────────────────────────────

[3/5] ¿Cómo aprendes más fácil?

  [A] 👁️ Viendo (diagramas, videos)
  [B] 👂 Escuchando
  [C] 📖 Leyendo
  [D] ✋ Practicando

  > 

───────────────────────────────────────────

[4/5] ¿Cuánto tiempo puedes estudiar?

  [A] 🟢 ~30 min/día
  [B] 🟡 1-2 horas/día
  [C] 🔴 Más de 2 horas

  > 

───────────────────────────────────────────

[5/5] ¿Qué formato prefieres?

  [A] 📄 PDFs y documentos
  [B] 📱 Apuntes digitales
  [C] 🌐 Recursos web
  [D] 📚 De todo un poco

  > 

═══════════════════════════════════════════

CoDDy: ¡Perfecto! Analizando tus respuestas...

CoDDy: Basado en tu perfil:
      • Aprendes mejor Viendo 📊
      • Tienes ~1 hora diaria ⏰
      • Te preparas para exámenes 🎯

      Te recomiendo: 📇 FLASHCARDS
      Son ideales para ti porque combinan
      lo visual con la práctica.

      ¿Quieres cambiar el método?

      [1] Mantener Flashcards ✅
      [2] Cambiar a Resúmenes
      [3] Cambiar a Exámenes
      [4] Probar modo Híbrido

═══════════════════════════════════════════

CoDDy: ¿Quieres empezar a estudiar algo
      justo ahora o prefieres hacerlo más tarde?

      [AHORA] → Ir a crear estudio
      [MÁS TARDE] → Ir al dashboard

═══════════════════════════════════════════
```

---

## PRÓXIMOS PASOS (Pendientes de Decisión)

1. [ ] Aprobar análisis de interfaces
2. [ ] Decidir qué rutas eliminar/fusionar
3. [ ] Crear endpoint `/api/cody/interview`
4. [ ] Crear endpoint `/api/cody/recomendar`
5. [ ] Reformular `/onboarding` con CoDDy
6. [ ] Crear `/nuevo-estudio`
7. [ ] Actualizar schema de Prisma
8. [ ] Limpiar rutas obsoletas

---

_Análisis generado: 2026-03-23_
