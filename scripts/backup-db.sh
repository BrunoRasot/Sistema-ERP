#!/usr/bin/env bash
# ==============================================================================
# Vivelite - Script de Respaldo Automatizado de Base de Datos PostgreSQL
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
CONTAINER_NAME="${CONTAINER_NAME:-vivelite_postgres}"
DB_USER="${POSTGRES_USER:-vivelite_user}"
DB_NAME="${POSTGRES_DB:-vivelite_db}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Iniciando backup de la base de datos ${DB_NAME}..."

docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"

if [ -s "${BACKUP_FILE}" ]; then
  echo "[SUCCESS] Respaldo generado exitosamente: ${BACKUP_FILE}"
  # Rotación: eliminar respaldos con más de 30 días
  find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -mtime +30 -exec rm {} \;
  echo "[INFO] Política de retención de 30 días aplicada."
else
  echo "[ERROR] El archivo de respaldo está vacío o falló la exportación." >&2
  exit 1
fi
