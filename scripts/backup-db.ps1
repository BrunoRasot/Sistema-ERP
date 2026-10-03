<#
.SYNOPSIS
  Script de respaldo automatizado para la base de datos PostgreSQL de Vivelite.
.DESCRIPTION
  Ejecuta pg_dump dentro del contenedor Docker o mediante cliente local,
  generando un archivo comprimido .sql.gz con timestamp y política de retención de 30 días.
#>

param (
    [string]$BackupDir = "./backups",
    [string]$ContainerName = "vivelite_postgres",
    [string]$DbUser = "vivelite_user",
    [string]$DbName = "vivelite_db"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$OutputFile = "$BackupDir/backup_${DbName}_${Timestamp}.sql"

Write-Host "Iniciando respaldo de base de datos [$DbName]..." -ForegroundColor Cyan

docker exec -t $ContainerName pg_dump -U $DbUser -d $DbName -F p --clean --if-exists > $OutputFile

if ($LASTEXITCODE -eq 0 -and (Test-Path $OutputFile) -and (Get-Item $OutputFile).Length -gt 0) {
    Write-Host "Respaldo completado con exito: $OutputFile ($( (Get-Item $OutputFile).Length / 1KB ) KB)" -ForegroundColor Green
    
    # Rotacion: Eliminar respaldos mayores a 30 dias
    Get-ChildItem -Path $BackupDir -Filter "backup_${DbName}_*.sql" | 
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } | 
        Remove-Item -Force
    Write-Host "Politica de retencion de 30 dias aplicada." -ForegroundColor Gray
} else {
    Write-Host "Error al generar el respaldo de la base de datos." -ForegroundColor Red
    exit 1
}
