#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "[1/3] Shell scripts"
find "${PROJECT_ROOT}/backend/scripts" -maxdepth 1 -type f -name '*.sh' -print0 \
  | xargs -0 -n1 bash -n

echo "[2/3] JavaScript"
find "${PROJECT_ROOT}/frontend" "${PROJECT_ROOT}/backend" "${PROJECT_ROOT}/config" -type f -name '*.js' -print0 \
  | xargs -0 -n1 node --check

echo "[3/3] Marcadores de conflito"
if rg -n '^(<<<<<<<|=======|>>>>>>>)' "${PROJECT_ROOT}" -g '!node_modules' >/dev/null; then
  echo "Marcadores de conflito encontrados no repositório." >&2
  exit 1
fi

echo "Validacao de sintaxe concluida com sucesso."
