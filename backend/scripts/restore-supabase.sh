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
BACKUP_FILE="${1:-${BACKUP_DIR}/latest.sql}"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Arquivo de backup nao encontrado: ${BACKUP_FILE}" >&2
  exit 1
fi

docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"

echo "Restore concluido com ${BACKUP_FILE}"
