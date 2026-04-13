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

APP_BASE_URL="${APP_BASE_URL:-http://127.0.0.1}"
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_capsfarma-erp}"

echo "[1/5] Healthcheck web"
curl -fsS "${APP_BASE_URL}/healthz" >/dev/null

echo "[2/5] HTML principal"
curl -fsS "${APP_BASE_URL}/" | grep -q "ERP-CAPSFARMA"

echo "[3/5] API Supabase"
curl -fsS "${SUPABASE_URL}/rest/v1/" -H "apikey: ${SUPABASE_ANON_KEY}" >/dev/null

echo "[4/5] Banco e funcoes criticas"
docker exec -i "${DB_CONTAINER}" psql -U postgres -d postgres -tAc \
  "select count(*) from information_schema.routines where routine_schema='public' and routine_name in ('login_user','get_my_permissions','create_staff_user','get_vps_control_snapshot');" \
  | grep -qx "4"

echo "[5/5] Tabelas operacionais"
docker exec -i "${DB_CONTAINER}" psql -U postgres -d postgres -tAc \
  "select count(*) from pg_tables where schemaname='public' and tablename in ('app_users','products','sales','service_orders','purchase_requests','customers');" \
  | grep -qx "6"

echo "Smoke test concluido com sucesso."
