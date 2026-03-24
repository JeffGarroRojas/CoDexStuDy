# TODO - CoDexStuDy

Lista de tareas pendientes y estado del proyecto.

---

## 🔴 Prioridad Alta

### node_modules Corrupto - Backend
- **Problema**: ESLint y dependencias de typescript-eslint no se instalaron correctamente
- **Solución**:
```bash
cd backend
rm -rf node_modules
npm install
```
- **Verificar**: `npx tsc --noEmit` y `npm run lint`

### Docker Socket Permission
- **Problema**: Permiso denegado a `/var/run/docker.sock`
- **Solución**:
```bash
sudo usermod -aG docker $USER
# Reiniciar sesión o logout/login
```

---

## 🟡 Prioridad Media

### ESLint Configuración
- **Estado**: Config creado (`eslint.config.mjs`) pero necesita reinstalación de dependencias
- **Dependencias**: `@eslint/js`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`
- **Versión**: Usar ESLint 9+ con flat config

### Testing Framework
- **Estado**: Script `test: jest` en package.json pero sin configurar
- **Necesario**: `jest.config.ts`, `@types/jest`, `ts-jest`
- **Archivos de test**: Crear `*.test.ts` o `*.spec.ts`

### PWA Configuración
- **Estado**: Incompleto
- **Necesario**: Configurar manifest.json, service worker, iconos

---

## 🟢 Prioridad Baja

### Onboarding Flow
- **Estado**: Parcialmente implementado en frontend
- **UI pendiente**: Más páginas de onboarding

### Tests de Integración
- **API endpoints**: Probar todos los endpoints
- **SM-2 Algorithm**: Verificar cálculos de repetición

### Documentación
- [x] README.md actualizado
- [x] AGENTS.md creado
- [ ] API.md actualizar con nuevos endpoints
- [ ] CHANGELOG.md actualizar

---

## ✅ Completado (2026-03-19)

### TypeScript
- [x] Backend compila sin errores
- [x] Frontend compila sin errores
- [x] Corregido `ai.types.ts` - tipos faltantes
- [x] Corregido `pdfExtractor.ts` - import path

### ESLint Frontend
- [x] Creado `.eslintrc.json` básico

### Documentación
- [x] README.md comprehensivo
- [x] AGENTS.md con instrucciones para IA

---

## Notas de Mantenimiento

### Para reiniciar el proyecto desde cero
```bash
cd codexstudy

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json .next
npm install
```

### Para verificar que todo funciona
```bash
# 1. TypeScript
cd backend && npx tsc --noEmit
cd ../frontend && npx tsc --noEmit

# 2. Docker
docker-compose up -d
docker-compose ps

# 3. Backend (test)
cd backend && npm run dev

# 4. Frontend (test)
cd frontend && npm run dev
```

---

## Ideas para Futuro

1. **Dark Mode** - Toggle de tema
2. **Exportar flashcards** - PDF, Anki, CSV
3. **Colaboración** - Múltiples usuarios, compartir documentos
4. **Analytics** - Gráficos de progreso más detallados
5. **Mobile App** - React Native o Flutter
6. **API pública** - Para terceros integrarse
7. **Webhooks** - Notificaciones externas
8. **Gamificación** - Puntos, logros, streak
