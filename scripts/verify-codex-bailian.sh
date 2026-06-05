#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
B_ENV_FILE="${HOME}/.config/bailian.env"
CODEX_BIN="/Applications/Codex.app/Contents/Resources/codex"

if [[ ! -x "${CODEX_BIN}" ]]; then
  echo "Missing Codex CLI at ${CODEX_BIN}."
  echo "Open Codex Desktop once or reinstall Codex, then retry."
  exit 1
fi

if [[ -f "${B_ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${B_ENV_FILE}"
fi

if [[ -z "${BAILIAN_API_KEY:-}" ]]; then
  echo "Missing BAILIAN_API_KEY. Copy ~/.config/bailian.env.example to ~/.config/bailian.env and fill in your real key."
  exit 1
fi

assert_exact_ok() {
  local label="$1"
  local file="$2"
  local value
  value="$(tr -d '\r' < "${file}")"

  if [[ "${value}" != "OK" ]]; then
    echo "${label} profile did not return exact OK."
    echo "Actual output: ${value}"
    exit 1
  fi
}

echo "Verifying Codex + Bailian daily profile..."
"${CODEX_BIN}" exec \
  --profile bailian \
  --strict-config \
  --skip-git-repo-check \
  --sandbox read-only \
  --color never \
  --output-last-message /tmp/codex-bailian-last.txt \
  "Respond with exactly OK."

echo "Verifying Codex + Bailian max profile..."
"${CODEX_BIN}" exec \
  --profile bailian-max \
  --strict-config \
  --skip-git-repo-check \
  --sandbox read-only \
  --color never \
  --output-last-message /tmp/codex-bailian-max-last.txt \
  "Respond with exactly OK."

echo
echo "Bailian daily profile output:"
cat /tmp/codex-bailian-last.txt
assert_exact_ok "Bailian daily" /tmp/codex-bailian-last.txt

echo
echo "Bailian max profile output:"
cat /tmp/codex-bailian-max-last.txt
assert_exact_ok "Bailian max" /tmp/codex-bailian-max-last.txt

echo
echo "Verification complete."
