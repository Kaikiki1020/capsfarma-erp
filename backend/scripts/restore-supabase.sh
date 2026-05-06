#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
DEFAULT_BACKUP_DIR="${PROJECT_ROOT}/backups"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

BACKUP_DIR="${BACKUP_DIR:-${DEFAULT_BACKUP_DIR}}"
CONTAINER_NAME="${SUPABASE_DB_CONTAINER:-supabase_db_capsfarma-erp}"
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="${SUPABASE_DB_USER:-postgres}"
CONFIRM_FLAG="${2:-}"

resolve_backup_file() {
  local requested_file="$1"
  local fallback_file="${DEFAULT_BACKUP_DIR}/latest.sql"

  if [[ -f "${requested_file}" ]]; then
    printf '%s\n' "${requested_file}"
    return 0
  fi

  if [[ "${requested_file}" != "${fallback_file}" ]] && [[ -f "${fallback_file}" ]]; then
    printf 'Aviso: backup %s nao encontrado. Usando %s.\n' "${requested_file}" "${fallback_file}" >&2
    printf '%s\n' "${fallback_file}"
    return 0
  fi

  printf 'Arquivo de backup nao encontrado: %s\n' "${requested_file}" >&2
  return 1
}

BACKUP_FILE="$(resolve_backup_file "${1:-${BACKUP_DIR}/latest.sql}")"

if [[ "${CONFIRM_FLAG}" != "--confirm-live-restore" ]]; then
  echo "Restore no banco principal bloqueado por seguranca." >&2
  echo "Use: bash backend/scripts/restore-supabase.sh ${BACKUP_FILE} --confirm-live-restore" >&2
  exit 1
fi

docker exec -i "${CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" < "${BACKUP_FILE}"

echo "Restore concluido com ${BACKUP_FILE}"
