# Dockerfile estandarizado para CoDexStuDy (Monorepo Node 18-slim)
FROM node:18-slim AS base

# Instalación de dependencias de sistema para Prisma y OpenSSL
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalación de dependencias (Contexto Servidor)
COPY servidor/package*.json ./
COPY servidor/prisma ./prisma/
RUN npm install

# Construcción de la aplicación
COPY servidor ./
RUN npx prisma generate
RUN npm run build

# Imagen de Producción (Runner)
FROM node:18-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copiar archivos compilados y dependencias necesarias
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma

EXPOSE 3000
ENV PORT 3000

# Script para ejecutar migraciones antes de iniciar
CMD npx prisma migrate deploy && npm start
