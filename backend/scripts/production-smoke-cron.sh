#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/logs"

mkdir -p "${LOG_DIR}"

{
  printf '[%s] Iniciando smoke test operacional\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  APP_BASE_URL="${APP_BASE_URL:-http://127.0.0.1}" \
  SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1/supabase}" \
    bash "${PROJECT_ROOT}/backend/scripts/smoke-test.sh"
  printf '[%s] Smoke test operacional concluido\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >> "${LOG_DIR}/production-smoke.log" 2>&1
