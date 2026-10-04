# Plan de Recuperación ante Desastres (Disaster Recovery) — Vivelite ERP

## 1. Procedimiento de Restauración Paso a Paso

En caso de fallo catastrófico de servidor, corrupción de base de datos o ataque de ransomware, siga estos pasos estrictos de recuperación:

### Paso 1: Aislamiento y Notificación
1. Detener el tráfico hacia la aplicación poniendo la página de mantenimiento en Nginx o Cloudflare.
2. Notificar al equipo técnico y de operaciones.

### Paso 2: Aprovisionamiento del Entorno
1. Levantar una nueva instancia de servidor o base de datos PostgreSQL 16 limpia.
2. Verificar que las variables de entorno (`DATABASE_URL`, `JWT_SECRET`, etc.) estén cargadas en `.env.production`.

### Paso 3: Descarga y Restauración del Backup
```bash
# Descargar el último archivo de backup de S3
aws s3 cp s3://vivelite-backups/backups/<TIMESTAMP>/vivelite_backup.sql.gz /tmp/vivelite_backup.sql.gz

# Restaurar la base de datos con pg_restore en paralelo
PGPASSWORD="${POSTGRES_PASSWORD}" pg_restore -h localhost \
    -U postgres \
    -d vivelite \
    --clean \
    --if-exists \
    --jobs=4 \
    /tmp/vivelite_backup.sql.gz
```

### Paso 4: Sincronización de Migraciones Prisma
```bash
cd /app/backend
pnpm prisma migrate deploy
```

### Paso 5: Pruebas de Sanidad (Smoke Tests)
1. Ejecutar test de conexión a base de datos.
2. Consultar último registro de `sales` y `kardex` para certificar punto de restauración.
3. Verificar inicio de sesión con usuario administrador.

### Paso 6: Reactivación del Tráfico
1. Retirar la página de mantenimiento.
2. Monitorear logs de NestJS (`tail -f /var/log/vivelite/backend.log`) y métricas de CPU/RAM durante 1 hora.
