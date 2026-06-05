#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
EXAMPLE_FILE="${ROOT_DIR}/.env.example"
BAILIAN_ENV_FILE="${HOME}/.config/bailian.env"

if [[ ! -f "${EXAMPLE_FILE}" ]]; then
  echo "Missing ${EXAMPLE_FILE}"
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${EXAMPLE_FILE}" "${ENV_FILE}"
  echo "Created ${ENV_FILE} from .env.example"
fi

random_hex() {
  openssl rand -hex 24
}

set_env_value() {
  local key="$1"
  local value="$2"

  python3 - "$ENV_FILE" "$key" "$value" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
key = sys.argv[2]
value = sys.argv[3]
lines = path.read_text().splitlines()
updated = False
for idx, line in enumerate(lines):
    if line.startswith(f"{key}="):
        lines[idx] = f"{key}={value}"
        updated = True
        break
if not updated:
    lines.append(f"{key}={value}")
path.write_text("\n".join(lines) + "\n")
PY
}

if grep -q '^POSTGRES_PASSWORD=replace_with_random_password$' "${ENV_FILE}"; then
  password="$(random_hex)"
  set_env_value "POSTGRES_PASSWORD" "${password}"
  set_env_value "DATABASE_URL" "postgresql://tiger_local_life:${password}@127.0.0.1:5433/tiger_local_life?schema=public"
fi

if grep -q '^AUTH_SECRET=replace_with_random_secret$' "${ENV_FILE}"; then
  set_env_value "AUTH_SECRET" "$(random_hex)"
fi

if grep -q '^ADMIN_API_KEY=replace_with_random_admin_key$' "${ENV_FILE}"; then
  set_env_value "ADMIN_API_KEY" "$(random_hex)"
fi

if [[ -f "${BAILIAN_ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${BAILIAN_ENV_FILE}"

  if [[ -n "${BAILIAN_API_KEY:-}" ]]; then
    set_env_value "BAILIAN_API_KEY" "${BAILIAN_API_KEY}"
  fi
fi

echo "Local environment is ready."
echo "Next:"
echo "  docker compose up -d postgres redis"
echo "  npm run db:generate"
echo "  npm run db:push"
echo "  npm run db:seed"
