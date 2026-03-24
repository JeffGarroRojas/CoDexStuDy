# 1. Base estable con OpenSSL (CoDexStuDy Backend - Atomic Fix)
FROM node:18-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 2. Instalación de dependencias (ORDEN CRÍTICO)
FROM base AS deps
COPY package*.json ./
# Copiamos la carpeta prisma AQUÍ para que el postinstall de npm install funcione
COPY prisma ./prisma/ 
RUN npm install

# 3. Construcción
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma@5.22.0 generate
RUN npm run build

# 4. Runner de Producción
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copiamos los artefactos necesarios desde builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/Procfile ./

EXPOSE 3001
ENV PORT 3001

# Comando: Migrar base de datos en Neon y luego iniciar
CMD npx prisma migrate deploy && npm start
