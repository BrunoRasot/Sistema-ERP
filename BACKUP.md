# Estrategia de Copias de Seguridad (Backups) — Vivelite ERP

## 1. Objetivos RPO y RTO

- **RPO (Recovery Point Objective):** <= 1 hora (pérdida máxima tolerable de datos).
- **RTO (Recovery Time Objective):** <= 30 minutos (tiempo máximo de restauración total del servicio).

---

## 2. Tipos de Respaldo y Frecuencia

| Tipo | Frecuencia | Retención | Destino |
| :--- | :--- | :--- | :--- |
| **Backup Completo (pg_dump)** | Diario (02:00 AM) | 30 días locales / 365 días en Cloud Storage | AWS S3 / Cloudflare R2 con cifrado AES-256 |
| **WAL Archiving (PITR)** | Continuo (cada 15 min) | 7 días | Almacenamiento replicado fuera de sitio |
| **Volumen de Base de Datos (EBS/Disk Snapshot)** | Semanal | 12 semanas | Snapshots en región secundaria |

---

## 3. Script Automatizado de Backup (PostgreSQL)

```bash
#!/bin/bash
set -eo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/vivelite"
DB_NAME="${POSTGRES_DB:-vivelite}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "Iniciando respaldo de base de datos ${DB_NAME} a las ${TIMESTAMP}..."

# Exportar con compresión gzip y formato custom para restauración paralela
PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump -h "${POSTGRES_HOST:-localhost}" \
    -U "${POSTGRES_USER:-postgres}" \
    -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_FILE}"

echo "Respaldo completado exitosamente: ${BACKUP_FILE}"

# Subir a almacenamiento en la nube (ej. AWS S3)
if [ -n "$S3_BACKUP_BUCKET" ]; then
    echo "Subiendo a S3: ${S3_BACKUP_BUCKET}..."
    aws s3 cp "${BACKUP_FILE}" "s3://${S3_BACKUP_BUCKET}/backups/${TIMESTAMP}/" --sse AES256
fi

# Eliminar respaldos locales de más de 30 días
find "${BACKUP_DIR}" -type f -name "*.sql.gz" -mtime +30 -delete
```

---

## 4. Verificación de Integridad

Los backups deben verificarse periódicamente restaurándolos en un entorno de pruebas aislado (Staging) mediante un job programado que ejecute pruebas de integridad sobre tablas críticas (`sales`, `kardex`, `customers`, `sunat_documents`).
