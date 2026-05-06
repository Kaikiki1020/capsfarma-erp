#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/logs"
BACKUP_DIR="${PROJECT_ROOT}/backups"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "${LOG_DIR}" "${BACKUP_DIR}"

{
  printf '[%s] Iniciando backup operacional\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  BACKUP_DIR="${BACKUP_DIR}" bash "${PROJECT_ROOT}/backend/scripts/backup-supabase.sh"
  find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'supabase-postgres-*.sql' -mtime "+${RETENTION_DAYS}" -print -delete
  printf '[%s] Backup operacional concluido\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >> "${LOG_DIR}/production-backup.log" 2>&1
