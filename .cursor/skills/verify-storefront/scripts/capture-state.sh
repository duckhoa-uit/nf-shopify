#!/usr/bin/env bash
set -euo pipefail

OUT="${1:?usage: capture-state.sh <output.json> [baseline.json]}"
BASELINE="${2:-}"
SESSION="${AGENT_BROWSER_SESSION:-verify-storefront}"
export PATH="${HOME}/.local/node_modules/.bin:${PATH}"
mkdir -p "$(dirname "$OUT")"

agent-browser --session "$SESSION" --json eval --stdin >"${OUT}.raw" <<'EOF'
(() => {
  const button = document.querySelector("[data-collection-read-more]");
  const panel = document.querySelector("[data-collection-description-panel]");
  const preview = document.querySelector("[data-collection-description-preview]");
  const full = document.querySelector("#collection-description-full");
  const heading = document.querySelector("h1");
  return {
    scrollY: window.scrollY,
    hash: location.hash,
    href: location.href,
    themeId: window.Shopify && Shopify.theme && Shopify.theme.id,
    role: window.Shopify && Shopify.theme && Shopify.theme.role,
    buttonCount: document.querySelectorAll("[data-collection-read-more]").length,
    ariaExpanded: button ? button.getAttribute("aria-expanded") : null,
    buttonType: button ? button.getAttribute("type") : null,
    buttonHref: button ? button.getAttribute("href") : null,
    panelHidden: panel ? panel.hidden : null,
    previewHidden: preview ? preview.hidden : null,
    fullPresent: Boolean(full),
    title: heading ? heading.textContent.trim() : null
  };
})()
EOF

python3 - "$OUT" "$BASELINE" <<'PY'
import json, pathlib, sys
out = pathlib.Path(sys.argv[1])
baseline = sys.argv[2]
raw = json.loads(pathlib.Path(str(out) + ".raw").read_text())
if not raw.get("success"):
    raise SystemExit(f"eval failed: {raw.get('error')}")
data = raw["data"]["result"]
if isinstance(data, str):
    data = json.loads(data)
if baseline:
    previous = json.loads(pathlib.Path(baseline).read_text())
    data["scrollDelta"] = data["scrollY"] - previous["scrollY"]
out.write_text(json.dumps(data) + "\n")
print(json.dumps(data))
PY
