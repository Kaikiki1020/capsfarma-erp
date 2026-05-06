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
DB_USER="${SUPABASE_DB_USER:-postgres}"
VERIFY_DB_NAME="${VERIFY_DB_NAME:-restore_verify_$(date -u +%Y%m%d_%H%M%S)}"
EXPECTED_FUNCTIONS="${EXPECTED_FUNCTIONS:-4}"
EXPECTED_TABLES="${EXPECTED_TABLES:-7}"

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

cleanup() {
  docker exec -i "${CONTAINER_NAME}" dropdb -U "${DB_USER}" --if-exists "${VERIFY_DB_NAME}" >/dev/null 2>&1 || true
}

trap cleanup EXIT

echo "[1/4] Criando banco temporario ${VERIFY_DB_NAME}"
cleanup
docker exec -i "${CONTAINER_NAME}" createdb -U "${DB_USER}" "${VERIFY_DB_NAME}"

echo "[2/4] Restaurando backup isolado"
docker exec -i "${CONTAINER_NAME}" psql -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${VERIFY_DB_NAME}" < "${BACKUP_FILE}" >/dev/null

echo "[3/4] Validando funcoes criticas"
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${VERIFY_DB_NAME}" -tAc \
  "select count(*) from information_schema.routines where routine_schema='public' and routine_name in ('login_user','get_my_permissions','create_staff_user','get_vps_control_snapshot');" \
  | grep -qx "${EXPECTED_FUNCTIONS}"

echo "[4/4] Validando tabelas operacionais"
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${VERIFY_DB_NAME}" -tAc \
  "select count(*) from pg_tables where schemaname='public' and tablename in ('app_users','products','sales','service_orders','purchase_requests','customers','accounts_payable');" \
  | grep -qx "${EXPECTED_TABLES}"

echo "Restore de teste validado com ${BACKUP_FILE}"
