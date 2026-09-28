#!/usr/bin/env bash
set -euo pipefail

THEME_ID="${1:?usage: restore-preview.sh <theme_id>}"
SESSION="${AGENT_BROWSER_SESSION:-verify-storefront}"
export PATH="${HOME}/.local/node_modules/.bin:${PATH}"

raw="$(agent-browser --session "$SESSION" get url)"
next="$(python3 - "$THEME_ID" "$raw" <<'PY'
import json, sys
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
theme_id, raw = sys.argv[1], sys.argv[2].strip()
if raw.startswith('{') or raw.startswith('['):
    data = json.loads(raw)
    if isinstance(data, dict):
        raw = data.get('url') or data.get('data') or ''
    elif isinstance(data, list) and data:
        item = data[0]
        raw = item if isinstance(item, str) else item.get('url', '')
parsed = urlparse(raw)
query = dict(parse_qsl(parsed.query, keep_blank_values=True))
needs = query.get('preview_theme_id') != theme_id
query['preview_theme_id'] = theme_id
rebuilt = urlunparse(parsed._replace(query=urlencode(query)))
print('yes' if needs else 'no')
print(rebuilt)
PY
)"
needs="$(printf '%s\n' "$next" | sed -n '1p')"
rebuilt="$(printf '%s\n' "$next" | sed -n '2p')"
echo "CURRENT $(agent-browser --session "$SESSION" get url)"
if [[ "$needs" == "yes" ]]; then
  agent-browser --session "$SESSION" open "$rebuilt"
  agent-browser --session "$SESSION" wait --load load
fi
echo "OPEN $rebuilt"
