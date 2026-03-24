# Dockerfile v3 Estandarizado (Contexto Monorepo CoDexStuDy)
# Base image
FROM node:18-slim AS base

# Install openssl and other prisma dependencies
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Sincronizamos con la carpeta /servidor del monorepo
COPY servidor/package*.json ./
COPY servidor/prisma ./prisma/
RUN npm install

# Build the application (asume que servidor tiene scripts build y start)
COPY servidor ./
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:18-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copiamos los artefactos desde la etapa de base
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/Procfile ./

# Railway utiliza el puerto que se le asigne, pero exponemos 3001 por defecto
EXPOSE 3001
ENV PORT 3001

# Script para ejecutar migraciones antes de iniciar (Protocolo v3)
CMD npx prisma migrate deploy && npm start
