# 🚀 Guía de Despliegue Público: CoDexStuDy (ADAMAN)

Este documento detalla los pasos para migrar **CoDexStuDy** desde el entorno local `ADAMAN-JFF008` hacia la nube (**Vercel + Railway/Supabase**) para habilitar el acceso multi-usuario de forma profesional.

---

## 🔐 1. Preparación de Seguridad (Paso Crítico)

Antes de cualquier `git push`, debemos asegurar las credenciales de alta seguridad.

### Rotación de Secretos
He generado un nuevo **JWT_SECRET** de alta entropía para vos:
`pJ5dOiWk5jSTuyJH8fwSHoE225OGI0ddFJEsWA0K5nM9sIj4gsGCnQkD87rFtxqW`

> [!IMPORTANT]
> **Tu nuevo JWT_SECRET:** 
> `pJ5dOiWk5jSTuyJH8fwSHoE225OGI0ddFJEsWA0K5nM9sIj4gsGCnQkD87rFtxqW`
> (Copia este valor y guárdalo en un lugar seguro. Solo lo usarás en el panel de Railway).

### Variables de Env (.env) en Producción
En la nube, **NUNCA** subas el archivo `.env`. Configura estas variables en los paneles de **Vercel** y **Railway**:

| Variable | Descripción | Destino |
| :--- | :--- | :--- |
| `DATABASE_URL` | URL de conexión de Postgres (Neon/Supabase) | Backend (Railway) |
| `JWT_SECRET` | El token de 64 caracteres generado arriba | Backend (Railway) |
| `GROQ_API_KEY` | Tu llave de Groq API | Backend (Railway) |
| `NEXT_PUBLIC_API_URL` | URL donde vivirá tu backend (ej: `https://api-codex.up.railway.app/api`) | Frontend (Vercel) |

---

## 🗄️ 2. Migración de Base de Datos (Postgres Cloud)

Como usas Docker local, los datos de `studyia-postgres` no son accesibles desde afuera.

1. Crear cuenta en [Neon.tech](https://neon.tech/) o [Supabase](https://supabase.com/).
2. Crear un proyecto llamado `codex-db` y obtener la **Connection String**.
3. **Ejecutar Migración:** Una vez configurado el `DATABASE_URL` en tu terminal local apuntando a la nube, corre:
   ```bash
   npx prisma migrate deploy
   ```

---

## ⚙️ 3. Despliegue del Servidor (Backend)

El servidor en `/servidor` debe estar encendido 24/7 para responder a tus amigos.

1. Sube la carpeta `/servidor` a un nuevo repositorio privado en GitHub.
2. Conecta tu cuenta de GitHub a **Railway.app**.
3. Selecciona el repositorio y la carpeta `/servidor`.
4. **CORS Check:** Ya configuré `server.ts` para que permita el dominio de Vercel. Asegúrate de que coincida con tu URL final.

---

## 🎨 4. Despliegue de la Interfaz (Frontend)

1. Conecta tu repositorio a **Vercel**.
2. Configura el **Root Directory** como `interfaz`. Vercel detectará automáticamente Next.js.
3. Asegúrate de que el soporte **PWA** esté activo en el build de producción.

---

## 👥 Manejo de Usuarios en CoDexStuDy

El sistema ya está blindado para ser multi-usuario nativo:
*   **Aislamiento:** Cada amigo que se registre tendrá su propio `UUID`.
*   **Privacidad:** Gracias a las relaciones de Prisma que implementamos, CoDDy solo mostrará a cada usuario sus propios documentos y flashcards.

---

## 🛠️ Comandos de Mantenimiento

He creado este alias para que monitorees la salud de tu app desde cualquier terminal:
```bash
alias codex-status='curl https://tu-api.up.railway.app/api/health'
```

---

> [!WARNING]
> Antes de subir a GitHub, borra las carpetas `node_modules` y `dist` para asegurar un push limpio. El `.gitignore` ya está configurado para ignorar archivos basura.
