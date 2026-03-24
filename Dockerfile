# Dockerfile Reparado (Sincronización Prisma & LibSSL - d8818506)
FROM node:18-slim AS base
RUN apt-get update && apt-get install -y openssl libssl-dev ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS deps
# Sincronizamos con las rutas del monorepo (/servidor)
COPY servidor/package*.json ./
COPY servidor/prisma ./prisma/
RUN npm install

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copiamos el código del servidor
COPY servidor ./
RUN npx prisma@5.22.0 generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
# Nota: Si este servidor usara Next.js, copiaríamos .next, pero CoDexStuDy Backend usa Express
# Sin embargo, mantenemos la estructura solicitada para compatibilidad de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/Procfile ./

EXPOSE 3001
ENV PORT 3001

# Comando de inicio: Migración automática en Neon antes del encendido
CMD npx prisma migrate deploy && npm start
