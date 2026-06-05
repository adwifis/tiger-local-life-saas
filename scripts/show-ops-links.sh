#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REFERENCE_REMOTE="$(git -C /Users/z/Desktop/tigerclub/tiger_ai_saas remote get-url origin 2>/dev/null || true)"

echo "Project root: ${ROOT_DIR}"
echo
echo "GitHub"
if [[ -n "${REFERENCE_REMOTE}" ]]; then
  echo "  Reference project remote: ${REFERENCE_REMOTE}"
else
  echo "  Reference project remote: not configured"
fi
echo "  Current repo remote: $(git -C "${ROOT_DIR}" remote get-url origin 2>/dev/null || echo 'not configured')"
echo
echo "Aliyun console links"
echo "  DashScope / Bailian: https://dashscope.console.aliyun.com/"
echo "  ECS console: https://ecs.console.aliyun.com/"
echo "  OSS console: https://oss.console.aliyun.com/"
echo "  Domain / DNS: https://dns.console.aliyun.com/"
echo
echo "Server access"
echo "  PEM reference on this Mac: /Users/z/Desktop/tigerclub/tiger-ai-saas.pem"
echo "  SSH host is not written into this repo. Add it to docs/ops-setup.md after confirmation."
