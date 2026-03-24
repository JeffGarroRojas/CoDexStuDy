#!/usr/bin/env bash
# Robot de Respaldo CoDexStuDy SRE
BACKUP_DIR="/media/jeff/Inclosure_JFF/codexstudy_Backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="codexstudy_db_backup_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "🐘 Iniciando DUMP de Base de datos PostgreSQL..."
# Ejecutamos el pg_dump nativo internamente sobre el contenedor docker
docker exec codexstudy-postgres pg_dump -U codexstudy codexstudy | gzip > "$BACKUP_DIR/$FILENAME"

# Mantener solo los últimos 7 respaldos para no llenar disco a la larga
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +7 -exec rm {} \;

echo "✅ Backup Exitoso completado en $BACKUP_DIR/$FILENAME"
