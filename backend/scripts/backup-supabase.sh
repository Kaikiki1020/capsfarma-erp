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
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"

resolve_backup_dir() {
  local requested_dir="$1"

  if mkdir -p "${requested_dir}" 2>/dev/null; then
    printf '%s\n' "${requested_dir}"
    return 0
  fi

  if [[ "${requested_dir}" != "${DEFAULT_BACKUP_DIR}" ]]; then
    mkdir -p "${DEFAULT_BACKUP_DIR}"
    printf 'Aviso: BACKUP_DIR=%s nao esta gravavel. Usando %s.\n' "${requested_dir}" "${DEFAULT_BACKUP_DIR}" >&2
    printf '%s\n' "${DEFAULT_BACKUP_DIR}"
    return 0
  fi

  printf 'Erro: nao foi possivel preparar o diretorio de backup em %s.\n' "${requested_dir}" >&2
  return 1
}

BACKUP_DIR="$(resolve_backup_dir "${BACKUP_DIR}")"
BACKUP_FILE="${BACKUP_DIR}/supabase-${DB_NAME}-${TIMESTAMP}.sql"
TEMP_BACKUP_FILE="${BACKUP_FILE}.tmp"
LATEST_LINK="${BACKUP_DIR}/latest.sql"

cleanup() {
  rm -f "${TEMP_BACKUP_FILE}"
}

trap cleanup EXIT

docker exec -i "${CONTAINER_NAME}" pg_dump \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --schema=public \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | awk '
      /^DROP POLICY IF EXISTS / { next }
      /^DROP TRIGGER IF EXISTS / { next }
      /^DROP FUNCTION IF EXISTS public\.generate_sale_number\(\);$/ { next }
      /^-- Name: generate_sale_number\(\); Type: FUNCTION; Schema: public; Owner: -$/ { skip_legacy_sale_function = 1; next }
      skip_legacy_sale_function {
        if (/^\$\$;$/) {
          skip_legacy_sale_function = 0;
        }
        next
      }
      { print }
    ' > "${TEMP_BACKUP_FILE}"

if [[ ! -s "${TEMP_BACKUP_FILE}" ]]; then
  echo "Erro: backup gerado vazio. Mantendo latest.sql inalterado." >&2
  exit 1
fi

mv "${TEMP_BACKUP_FILE}" "${BACKUP_FILE}"
ln -sfn "${BACKUP_FILE}" "${LATEST_LINK}"

echo "Backup criado em ${BACKUP_FILE}"
