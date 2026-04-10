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

LOGIN_CODE="${1:-900}"
FULL_NAME="${2:-Administrador Secundario}"
EMAIL="${3:-admin.secundario@capsfarma.local}"
PASSWORD="${4:-Caps@2026!Temp}"
DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_capsfarma-erp}"

if [[ ! "${LOGIN_CODE}" =~ ^[0-9]{3}$ ]]; then
  echo "LOGIN_CODE deve conter exatamente 3 digitos." >&2
  exit 1
fi

if [[ "${FULL_NAME}" == *"'"* || "${EMAIL}" == *"'"* || "${PASSWORD}" == *"'"* ]]; then
  echo "FULL_NAME, EMAIL e PASSWORD nao podem conter aspas simples." >&2
  exit 1
fi

docker exec -i "${DB_CONTAINER}" psql -U postgres -d postgres <<SQL
do \$\$
declare
  v_role_id uuid;
begin
  select id into v_role_id
  from public.permission_roles
  where name = 'TI';

  if v_role_id is null then
    raise exception 'Papel TI nao encontrado';
  end if;

  if not exists (
    select 1 from public.app_users where login_code = '${LOGIN_CODE}'
  ) then
    insert into public.app_users (
      login_code,
      full_name,
      phone,
      email,
      password_hash,
      department,
      role,
      permission_role_id,
      is_active
    )
    values (
      '${LOGIN_CODE}',
      '${FULL_NAME}',
      '${EMAIL}',
      '${EMAIL}',
      crypt('${PASSWORD}', gen_salt('bf')),
      'TI',
      'TI',
      v_role_id,
      true
    );
  end if;
end
\$\$;
SQL

echo "Usuario administrativo secundario garantido para login ${LOGIN_CODE}."
