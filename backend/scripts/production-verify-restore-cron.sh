#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/logs"

mkdir -p "${LOG_DIR}"

{
  printf '[%s] Iniciando restore semanal isolado\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  bash "${PROJECT_ROOT}/backend/scripts/verify-restore.sh"
  printf '[%s] Restore semanal isolado concluido\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
} >> "${LOG_DIR}/production-verify-restore.log" 2>&1
