#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/logs"

mkdir -p "${LOG_DIR}"

{
  printf '[%s] Reaplicando firewall operacional\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  docker run --rm --privileged --network host -v /:/host nginx:alpine \
    chroot /host "${PROJECT_ROOT}/backend/scripts/apply-production-firewall.sh"
} >> "${LOG_DIR}/production-firewall.log" 2>&1
