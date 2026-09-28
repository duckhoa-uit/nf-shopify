#!/usr/bin/env bash
set -euo pipefail

THEME_NAME="${1:?usage: push-draft.sh \"Draft - <name>\"}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
EVIDENCE="${VERIFY_EVIDENCE_DIR:-/opt/cursor/artifacts/verify-storefront}"
TOML="$ROOT/shopify.theme.toml"
BACKUP="${VERIFY_TOML_BACKUP:-/tmp/verify-storefront-shopify.theme.toml.bak}"
mkdir -p "$EVIDENCE"
cp "$TOML" "$BACKUP"

restore_toml() {
  if [[ -f "$BACKUP" ]]; then
    cp "$BACKUP" "$TOML"
  fi
}
trap restore_toml EXIT

python3 - "$TOML" <<'PY'
import pathlib, sys
path = pathlib.Path(sys.argv[1])
text = path.read_text()
needle = '[environments.international]\nstore = "sportfinder-international.myshopify.com"\nignore = ["config/settings_data.json"]\n'
replacement = '[environments.international]\nstore = "sportfinder-international.myshopify.com"\n'
if needle not in text:
    raise SystemExit('international ignore block not found, refusing to push')
if text.count('ignore = ["config/settings_data.json"]') != 4:
    raise SystemExit('expected ignore on all 4 envs before the temporary international drop')
path.write_text(text.replace(needle, replacement, 1))
PY

cd "$ROOT"
set +e
pnpm exec shopify theme push -e international --unpublished --theme "$THEME_NAME" --json >"$EVIDENCE/push.json" 2>"$EVIDENCE/push.err"
status=$?
set -e
restore_toml
trap - EXIT

if [[ "$status" -ne 0 ]]; then
  echo "push failed, toml restored, see $EVIDENCE/push.err" >&2
  exit "$status"
fi

python3 - "$EVIDENCE/push.json" "$EVIDENCE/theme-id.txt" <<'PY'
import json, pathlib, sys
raw = pathlib.Path(sys.argv[1]).read_text(errors='ignore')
start = raw.find('{')
if start < 0:
    raise SystemExit('push json missing')
data = json.loads(raw[start:])
theme = data.get('theme') or data
theme_id = theme.get('id') or data.get('id')
if not theme_id:
    raise SystemExit('theme id missing from push json')
pathlib.Path(sys.argv[2]).write_text(str(theme_id) + '\n')
print(f'THEME_ID={theme_id}')
PY

if grep -n 'ignore = \["config/settings_data.json"\]' "$TOML" | wc -l | grep -qx '4'; then
  echo "toml ignore restored"
else
  echo "toml ignore count is wrong after restore" >&2
  exit 1
fi
