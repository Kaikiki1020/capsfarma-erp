#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
CONTAINER_NAME="${SUPABASE_DB_CONTAINER:-supabase_db_capsfarma-erp}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/supabase-${DB_NAME}-${TIMESTAMP}.sql"
LATEST_LINK="${BACKUP_DIR}/latest.sql"

mkdir -p "${BACKUP_DIR}"

docker exec -i "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${BACKUP_FILE}"
ln -sfn "${BACKUP_FILE}" "${LATEST_LINK}"

echo "Backup criado em ${BACKUP_FILE}"
