#!/usr/bin/env bash
set -euo pipefail

SESSION="${AGENT_BROWSER_SESSION:-verify-storefront}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
BACKUP="${VERIFY_TOML_BACKUP:-/tmp/verify-storefront-shopify.theme.toml.bak}"
export PATH="${HOME}/.local/node_modules/.bin:${PATH}"

agent-browser --session "$SESSION" close || true

if [[ -f "$BACKUP" ]]; then
  cp "$BACKUP" "$ROOT/shopify.theme.toml"
fi
