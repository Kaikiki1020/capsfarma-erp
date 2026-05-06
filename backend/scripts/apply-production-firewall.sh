#!/usr/bin/env bash
set -euo pipefail

IPTABLES="${IPTABLES:-/usr/sbin/iptables}"
INTERNAL_PORTS=(8080 54321 54322 54323 54324 54327)

ensure_rule() {
  if ! "${IPTABLES}" -C DOCKER-USER "$@" 2>/dev/null; then
    "${IPTABLES}" -I DOCKER-USER 1 "$@"
  fi
}

ensure_input_rule() {
  if ! "${IPTABLES}" -C INPUT "$@" 2>/dev/null; then
    "${IPTABLES}" -I INPUT 1 "$@"
  fi
}

# Keep already established connections and Docker bridge traffic working.
ensure_rule -m conntrack --ctstate RELATED,ESTABLISHED -j RETURN
ensure_rule -s 172.16.0.0/12 -j RETURN

for port in "${INTERNAL_PORTS[@]}"; do
  ensure_rule -p tcp -m conntrack --ctorigdstport "${port}" -j DROP
  ensure_input_rule -p tcp --dport "${port}" -j DROP
done

ensure_input_rule -s 172.16.0.0/12 -j ACCEPT
ensure_input_rule -i lo -j ACCEPT
ensure_input_rule -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

echo "Firewall Docker aplicado para portas internas: ${INTERNAL_PORTS[*]}"
