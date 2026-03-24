# AUDITORÍA DE INTERFACES: MAPEO Y LIMPIEZA
## CoDexStuDy - Fase 1-B

---

## RESUMEN EJECUTIVO

### Acciones de Limpieza Inmediata:

| # | Acción | Prioridad | Complejidad |
|---|--------|-----------|-------------|
| 1 | **ELIMINAR** `/documents` | Alta | Baja |
| 2 | **FUSIONAR** `/study` + `/upload` | Alta | Media |
| 3 | **REFORMULAR** `/onboarding` con CoDDy | Crítica | Alta |
| 4 | **CREAR** `/nuevo-estudio` | Crítica | Media |
| 5 | **MANTENER** `/dashboard` (simplificado) | Media | Baja |
| 6 | **MANTENER** `/mis-estudios` | Media | Baja |
| 7 | **MANTENER** `/chat` | Baja | Baja |
| 8 | **MANTINER** `/offline` | Baja | Baja |
| 9 | **ELIMINAR** `/debug-ia` (post-producción) | Baja | Baja |

---

## ANÁLISIS DETALLADO POR INTERFAZ

---

### 1. `/` (Landing Page)

**¿QUÉ HACE?**
Página pública de inicio con información del producto, características y CTA hacia registro.

**FLUJO ACTUAL:**
```
Landing → /onboarding → /dashboard
```

**IMPORTANCIA (1-10):** 4

**ESTADO PROPUESTO:** MANTENER (simplificar)

**JUSTIFICACIÓN:**
- Útil para usuarios nuevos que llegan al sitio
- Sirve como carta de presentación
- El CTA es correcto (redirige a onboarding)
- NO estorba en el flujo de CoDDy porque está ANTES del registro

**ACCIÓN:** Reducir secciones innecesarias, mantener solo hero + features + CTA

---

### 2. `/onboarding` (Registro)

**¿QUÉ HACE?**
Captura datos del usuario (nombre, grado, área, materias) en 4 pasos y crea cuenta.

**FLUJO ACTUAL:**
```
/onboarding → /dashboard
```

**IMPORTANCIA (1-10):** 10 (CRÍTICA)

**ESTADO PROPUESTO:** **REFORMULAR COMPLETAMENTE**

**JUSTIFICACIÓN:**
- **ESTORBA:** Paso 4 actual (quiz de adaptación) no se usa efectivamente
- La IA no "moldea" nada todavía
- Redirige directo al dashboard sin usar la adaptación
- **PROBLEMA:** Después de register, el usuario NO habla con CoDDy

**ACCIÓN:**
```
MANTENER: Pasos 1-3 (nombre, grado, área)
NUEVO: Al terminar paso 3 → REGISTRAR USUARIO → IR A /coddy
ELIMINAR: Paso 4 actual
```

---

### 3. `/coddy` (NUEVO - Entrevista CoDDy)

**¿QUÉ HACE?**
Chat interactivo con CoDDy para adaptar el sistema al usuario mediante preguntas dinámicas.

**FLUJO PROPUESTO:**
```
/onboarding → /coddy → /nuevo-estudio (o /dashboard)
```

**IMPORTANCIA (1-10):** 10 (CRÍTICA - NUEVA)

**ESTADO PROPUESTO:** **CREAR** (Nueva interfaz)

**JUSTIFICACIÓN:**
- Punto de diferenciación del producto
- Personaliza la experiencia desde el inicio
- Captura preferencias que afectan todo el sistema
- **NO EXISTE actualmente** - necesita ser creada

**ACCIÓN:** Implementar interfaz de chat con preguntas secuenciales de CoDDy

---

### 4. `/dashboard` (Panel Principal)

**¿QUÉ HACE?**
Dashboard post-login con opciones de "Crear Estudio" y "Mis Estudios".

**FLUJO ACTUAL:**
```
/onboarding → /dashboard → /study / /mis-estudios
```

**IMPORTANCIA (1-10):** 6

**ESTADO PROPUESTO:** **MANTENER (simplificar)**

**JUSTIFICACIÓN:**
- Sirve como "home" para usuarios que regresan
- Útil para usuarios que dicen "más tarde" en CoDDy
- Solo tiene 2 botones, puede simplificarse más
- **POSIBLE FUSIÓN:** Con `/nuevo-estudio` si el usuario siempre va a crear estudio

**ACCIÓN:** 
- Mantener si usuario elige "más tarde" en CoDDy
- Simplificar a 1 botón principal ("Continuar estudiando")

---

### 5. `/study` (Crear Estudio)

**¿QUÉ HACE?**
Permite escribir tema o subir archivo → Genera flashcards, resumen y examen con IA.

**FLUJO ACTUAL:**
```
/dashboard → /study → Genera contenido → /mis-estudios
```

**IMPORTANCIA (1-10):** 9

**ESTADO PROPUESTO:** **FUSIONAR con `/upload`**

**JUSTIFICACIÓN:**
- **REDUNDANCIA CRÍTICA:** `/study` y `/upload` hacen cosas similares
- `/study` permite escribir texto
- `/upload` permite subir PDF
- Ambos generan contenido con IA
- **CONFUNDE AL USUARIO:** ¿Cuál uso? ¿Cuál es diferente?

**ACCIÓN:**
```
FUSIONAR en /nuevo-estudio:
  - Campo de texto (como /study)
  - Botón de upload PDF (como /upload)
  - Selección de método (recibido de CoDDy)
  - Un solo flujo hacia generación
```

---

### 6. `/upload` (Subir PDF)

**¿QUÉ HACE?**
Upload de PDF → Extrae texto → Confirma temas → Elige método → Procesa.

**FLUJO ACTUAL:**
```
/dashboard → /upload → ... → /documents (¡ROTA!)
```

**IMPORTANCIA (1-10):** 8

**ESTADO PROPUESTO:** **FUSIONAR con `/study`**

**JUSTIFICACIÓN:**
- Funcionalidad IMPORTANTE (procesar PDFs)
- **PROBLEMA:** Flujo roto (termina en `/documents` que no existe)
- **REDUNDANCIA:** Duplica funcionalidad de `/study`
- **PASOS EXCESIVOS:** 4 pasos para algo que debería ser 1-2

**ACCIÓN:**
```
ELIMINAR como página independiente
FUSIONAR funcionalidad en /nuevo-estudio:
  - Drag & drop PDF
  - Preview del contenido extraído
  - Botón "Procesar con CoDDy"
```

---

### 7. `/documents` (Lista de Documentos)

**¿QUÉ HACE?**
Lista documentos del usuario. **¡NO EXISTE COMO PÁGINA!**

**FLUJO ESPERADO:**
```
/upload → /documents (¡RUTA ROTA!)
```

**IMPORTANCIA (1-10):** 3

**ESTADO PROPUESTO:** **ELIMINAR**

**JUSTIFICACIÓN:**
- **NO EXISTE:** La ruta `/documents` no tiene página
- `/upload` redirige a `/documents` pero la página no existe
- **CONFUSIÓN:** Genera errores 404
- Los documentos deberían listarse en `/mis-estudios`

**ACCIÓN:**
```
ELIMINAR: La referencia en /upload
FUSIONAR: Lista de documentos en /mis-estudios
```

---

### 8. `/mis-estudios` (Estudios Guardados)

**¿QUÉ HACE?**
Lista de estudios guardados por el usuario para continuar/revisar.

**FLUJO ACTUAL:**
```
/dashboard → /mis-estudios → /study/${id}
```

**IMPORTANCIA (1-10):** 7

**ESTADO PROPUESTO:** **MANTENER**

**JUSTIFICACIÓN:**
- Feature importante de UX
- Permite continuar estudios previos
- Tiene sentido después de "más tarde" en CoDDy
- **PEQUEÑO PROBLEMA:** Enlace a `/study/${id}` que no existe

**ACCIÓN:**
- Mantener
- Corregir enlace para que vaya a una página de revisión
- O crear `/mis-estudios/${id}` para continuar estudio

---

### 9. `/chat` (Chat con IA)

**¿QUÉ HACE?**
Chat interactivo con IA para resolver dudas generales.

**FLUJO ACTUAL:**
```
/dashboard → /chat
```

**IMPORTANCIA (1-10):** 5

**ESTADO PROPUESTO:** **MANTENER (pero mover a sidebar)**

**JUSTIFICACIÓN:**
- Feature de soporte/ayuda
- NO es core del flujo de estudio
- Puede integrarse como botón flotante
- **POSIBLE PROBLEMA:** Endpoint `/ai/chat` puede no existir

**ACCIÓN:**
- Mantener como página opcional
- Considerar como botón flotante en `/nuevo-estudio`
- Verificar que `/ai/chat` exista en backend

---

### 10. `/offline` (Página Offline PWA)

**¿QUÉ HACE?**
Página mostrada cuando no hay conexión a internet.

**FLUJO ACTUAL:**
```
PWA → Sin conexión → /offline
```

**IMPORTANCIA (1-10):** 3

**ESTADO PROPUESTO:** **MANTENER**

**JUSTIFICACIÓN:**
- Feature PWA necesaria
- No afecta flujo principal
- Ya funciona correctamente

**ACCIÓN:** Ninguna, mantener como está

---

### 11. `/debug-ia` (Sandbox IA)

**¿QUÉ HACE?**
Entorno de pruebas para validar funciones de IA (acabamos de crear).

**FLUJO ACTUAL:**
```
Acceso directo → /debug-ia
```

**IMPORTANCIA (1-10):** 4

**ESTADO PROPUESTO:** **MANTENER (dev) → ELIMINAR (producción)**

**JUSTIFICACIÓN:**
- Útil para debugging durante desarrollo
- **NO es para usuarios finales**
- Debe eliminarse antes de deploy a producción

**ACCIÓN:**
- Mantener durante desarrollo
- Eliminar antes de producción (o proteger con env)

---

### 12. `/study/${id}` (Continuar Estudio)

**¿QUÉ HACE?**
Página para continuar/revisar un estudio específico. **NO EXISTE.**

**FLUJO ESPERADO:**
```
/mis-estudios → /study/${id}
```

**IMPORTANCIA (1-10):** 5

**ESTADO PROPUESTO:** **CREAR (minimalista) o ELIMINAR referencia**

**JUSTIFICACIÓN:**
- La referencia existe en `/mis-estudios`
- La página NO existe
- Genera errores 404

**ACCIÓN:**
```
OPCIÓN A: Crear página mínima que permita revisar flashcards/resumen
OPCIÓN B: Eliminar enlace de /mis-estudios y redirigir a /nuevo-estudio
```

---

## MATRIZ DE DECISIÓN FINAL

| Ruta | Estado | Razón Principal |
|------|--------|-----------------|
| `/` | ✅ MANTENER | Landing válido |
| `/onboarding` | 🔄 REFOMAR | No usa CoDDy |
| `/coddy` | 🆕 CREAR | No existe aún |
| `/dashboard` | ✅ MANTENER | Home post-login |
| `/study` | 🔀 FUSIONAR | Duplica `/upload` |
| `/upload` | 🔀 FUSIONAR | Funcionalidad duplicada |
| `/documents` | ❌ ELIMINAR | No existe, rota |
| `/mis-estudios` | ✅ MANTENER | Lista de estudios |
| `/chat` | ✅ MANTENER | Feature de soporte |
| `/offline` | ✅ MANTENER | PWA funcional |
| `/debug-ia` | ⏸️ MANTENER (dev) | Debugging |
| `/study/${id}` | ❓ CREAR/ELIMINAR | No existe |

---

## FLUJO PROPUESTO FINAL

```
                    ┌─────────────┐
                    │     /       │ (Landing)
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ /onboarding  │ (3 pasos)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    REGISTRO  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   /coddy    │ 🆕 NUEVO
                    │  Entrevista  │
                    └──────┬──────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌─────────────┐          ┌─────────────┐
       │ AHORA       │          │ MÁS TARDE   │
       └──────┬──────┘          └──────┬──────┘
              │                        │
              ▼                        ▼
       ┌─────────────┐          ┌─────────────┐
       │/nuevo-estudio│         │  /dashboard  │
       │   (FUSIÓN)   │          └──────┬──────┘
       └──────┬──────┘                 │
              │                        ▼
              │                 ┌─────────────┐
              │                 │/mis-estudios│
              │                 └─────────────┘
              ▼
       ┌─────────────┐
       │  GENERACIÓN  │
       │   CON IA     │
       └─────────────┘
```

---

## ARCHIVOS A ELIMINAR

```bash
# Rutas que referencian páginas inexistentes
# (Eliminar referencias, no archivos)

# En /upload/page.tsx:
# - Eliminar: router.push('/documents')

# En /mis-estudios/page.tsx:
# - Cambiar: href={`/study/${contenido.id}`} 
#   Por: href={`/nuevo-estudio?id=${contenido.id}`}
```

---

## PRÓXIMOS PASOS (Post-Aprobación)

1. [ ] Aprobar auditoría
2. [ ] Crear `/coddy` (entrevista CoDDy)
3. [ ] Reformular `/onboarding`
4. [ ] Crear `/nuevo-estudio` (fusión)
5. [ ] Eliminar `/study` y `/upload` (como páginas independientes)
6. [ ] Corregir `/mis-estudios`
7. [ ] Limpiar referencias huérfanas
8. [ ] Eliminar `/debug-ia` en producción

---

_Auditoría completada: 2026-03-23_
