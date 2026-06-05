#!/usr/bin/env bash

set -euo pipefail

MODE="${1:-auto}"
shift || true

RUN=0
if [[ "${1:-}" == "--run" ]]; then
  RUN=1
  shift
fi

TASK="${*:-}"
choose_mode() {
  case "${MODE}" in
    cx|cxb|cxbm)
      printf '%s' "${MODE}"
      return
      ;;
    auto)
      ;;
    *)
      echo "Unsupported mode: ${MODE}" >&2
      exit 1
      ;;
  esac

  if [[ "${TASK}" =~ 架构|review|风险|支付|权限|上线|billing|security ]]; then
    printf 'cx'
  elif [[ "${TASK}" =~ 重构|schema|migration|复杂|跨文件|refactor|prisma|debug ]]; then
    printf 'cxbm'
  else
    printf 'cxb'
  fi
}

FINAL_MODE="$(choose_mode)"
CODEX_BIN="/Applications/Codex.app/Contents/Resources/codex"

case "${FINAL_MODE}" in
  cx)
    LABEL="Codex Plus"
    PROFILE_ARGS=()
    ;;
  cxb)
    LABEL="Bailian Daily"
    PROFILE_ARGS=(--profile bailian)
    ;;
  cxbm)
    LABEL="Bailian Max"
    PROFILE_ARGS=(--profile bailian-max)
    ;;
esac

echo "Recommended mode: ${FINAL_MODE} (${LABEL})"
if [[ -n "${TASK}" ]]; then
  echo "Task: ${TASK}"
fi

PROFILE_TEXT=""
if [[ "${#PROFILE_ARGS[@]}" -gt 0 ]]; then
  PROFILE_TEXT="${PROFILE_ARGS[*]} "
fi
echo "Command: ${CODEX_BIN} exec ${PROFILE_TEXT}\"${TASK:-<your prompt>}\""

if [[ "${RUN}" -ne 1 ]]; then
  echo "Tip: append --run to execute immediately."
  exit 0
fi

if [[ ! -x "${CODEX_BIN}" ]]; then
  echo "Missing Codex CLI at ${CODEX_BIN}" >&2
  exit 1
fi

exec "${CODEX_BIN}" exec "${PROFILE_ARGS[@]}" "${TASK}"
