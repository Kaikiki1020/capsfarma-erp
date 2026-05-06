#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ALLOW_DIRTY="${ALLOW_DIRTY:-0}"

if [[ "${1:-}" == "--allow-dirty" ]]; then
  ALLOW_DIRTY=1
fi

cd "${PROJECT_ROOT}"

if [[ "${ALLOW_DIRTY}" != "1" ]] && [[ -n "$(git status --porcelain)" ]]; then
  echo "Worktree com alteracoes locais. Limpe ou use --allow-dirty para homologacao." >&2
  exit 1
fi

echo "[1/4] Sintaxe e consistencia"
bash "${PROJECT_ROOT}/backend/scripts/check-syntax.sh"

echo "[2/4] Backup operacional"
bash "${PROJECT_ROOT}/backend/scripts/backup-supabase.sh" >/dev/null

echo "[3/4] Restore de teste"
bash "${PROJECT_ROOT}/backend/scripts/verify-restore.sh" >/dev/null

echo "[4/4] Smoke test"
bash "${PROJECT_ROOT}/backend/scripts/smoke-test.sh"

echo "Release check concluido com sucesso."
