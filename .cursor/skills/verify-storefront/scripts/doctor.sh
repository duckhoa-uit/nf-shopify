#!/usr/bin/env bash
set -euo pipefail

THEME_ID="${1:?usage: doctor.sh <theme_id>}"
SESSION="${AGENT_BROWSER_SESSION:-verify-storefront}"
EVIDENCE="${VERIFY_EVIDENCE_DIR:-/opt/cursor/artifacts/verify-storefront}"
export PATH="${HOME}/.local/node_modules/.bin:${PATH}"
mkdir -p "$EVIDENCE"

agent-browser --session "$SESSION" --json eval '({id: window.Shopify && Shopify.theme && Shopify.theme.id, role: window.Shopify && Shopify.theme && Shopify.theme.role, name: window.Shopify && Shopify.theme && Shopify.theme.name, href: location.href})' >"$EVIDENCE/doctor.raw.json"

python3 - "$THEME_ID" "$EVIDENCE/doctor.raw.json" "$EVIDENCE/doctor.json" <<'PY'
import json, pathlib, sys
expected = str(sys.argv[1])
raw = json.loads(pathlib.Path(sys.argv[2]).read_text())
if not raw.get("success"):
    raise SystemExit(f"eval failed: {raw.get('error')}")
data = raw["data"]["result"]
if isinstance(data, str):
    data = json.loads(data)
pathlib.Path(sys.argv[3]).write_text(json.dumps(data) + "\n")
print(json.dumps(data))
actual = str(data.get("id"))
role = data.get("role")
if actual != expected or role != "unpublished":
    raise SystemExit(f"doctor failed id={actual} role={role} expected={expected} unpublished")
PY
