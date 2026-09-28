#!/usr/bin/env bash
set -euo pipefail

# Drive size, discount checkbox, and clear-all on the unpublished draft.
# Presence of the filter column is not enough. A shopper click must change count and URL.

THEME_ID="${1:-$(cat /opt/cursor/artifacts/verify-storefront/theme-id.txt)}"
SESSION="${AGENT_BROWSER_SESSION:-verify-storefront}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
EVIDENCE="${VERIFY_EVIDENCE_DIR:-/opt/cursor/artifacts/verify-storefront}"
OUT="$EVIDENCE/filter-regression"
export PATH="${HOME}/.local/node_modules/.bin:${PATH}"
export AGENT_BROWSER_SESSION="$SESSION"

mkdir -p "$OUT" /opt/cursor/artifacts

measure_js='(() => {
  const countEl = document.getElementById("ProductCount");
  const desktopCount = document.getElementById("ProductCountDesktop");
  const checkbox = document.getElementById("discount-filter-checkbox");
  const cards = document.querySelectorAll("#product-grid > li");
  const params = [...new URLSearchParams(location.search)];
  const filterParams = params.filter(([key]) => key.startsWith("filter."));
  const saleOff = params.filter(([key]) => key === "filter.p.m.custom.sale_off").map(([, value]) => value);
  const otherFilters = filterParams.filter(([key]) => key !== "filter.p.m.custom.sale_off");
  const chips = [...document.querySelectorAll("#FacetsWrapperDesktop .active-filter-tag span, #FacetsWrapperDesktop .active-filter-tag")].map((el) => el.textContent.trim()).filter(Boolean);
  const titles = [...document.querySelectorAll("#FacetsWrapperDesktop .accordion__title")].map((el) => el.textContent.trim()).filter(Boolean);
  const inputs = [...document.querySelectorAll("#FacetsWrapperDesktop input[type=\"checkbox\"]")].filter((el) => el.id !== "discount-filter-checkbox" && !el.disabled && el.name !== "filter.p.m.custom.sale_off");
  const target = inputs[0];
  const details = target && target.closest("details");
  const summary = details && details.querySelector("summary");
  return {
    href: location.href,
    search: location.search,
    locale: window.Shopify && Shopify.locale,
    themeId: window.Shopify && Shopify.theme && Shopify.theme.id,
    themeRole: window.Shopify && Shopify.theme && Shopify.theme.role,
    productCountAttr: countEl && countEl.getAttribute("data-total-count"),
    productCountText: (countEl && countEl.textContent.trim()) || (desktopCount && desktopCount.textContent.trim()),
    cardCount: cards.length,
    loading: Boolean(document.querySelector("#ProductGridContainer .collection.loading")),
    saleAccordionCount: document.querySelectorAll("details[id*=\"filter.p.m.custom.sale_off\"]").length,
    discountExists: Boolean(checkbox),
    discountChecked: Boolean(checkbox && checkbox.checked),
    saleOffParam: saleOff,
    otherFilterParams: otherFilters,
    activeChips: chips,
    facetTitles: titles,
    targetInputId: target && target.id,
    targetInputName: target && target.name,
    targetInputValue: target && target.value,
    targetChecked: Boolean(target && target.checked),
    detailsOpen: Boolean(details && details.open),
    summarySelector: summary ? "#FacetsWrapperDesktop details.js-filter summary" : null,
    clearAllExists: Boolean(document.querySelector("#FacetsWrapperDesktop a.clear-all-filters")),
  };
})()'

eval_json() {
  local dest="$1"
  agent-browser --session "$SESSION" --json eval "$measure_js" >"$OUT/${dest}-raw.json"
  python3 - "$OUT/${dest}-raw.json" "$OUT/${dest}.json" <<'PY'
import json, pathlib, sys
raw = json.loads(pathlib.Path(sys.argv[1]).read_text())
if not raw.get("success"):
    raise SystemExit("eval failed: " + str(raw.get("error")))
data = raw["data"]["result"]
if isinstance(data, str):
    data = json.loads(data)
pathlib.Path(sys.argv[2]).write_text(json.dumps(data, indent=2) + "\n")
print(json.dumps({
    "href": data.get("href"),
    "count": data.get("productCountAttr"),
    "cards": data.get("cardCount"),
    "saleOff": data.get("saleOffParam"),
    "other": data.get("otherFilterParams"),
    "checked": data.get("discountChecked"),
    "saleAccordion": data.get("saleAccordionCount"),
    "target": data.get("targetInputId"),
}))
PY
}

wait_settled() {
  sleep 2
  local i
  for i in 1 2 3 4 5 6 7 8; do
    agent-browser --session "$SESSION" --json eval '({loading: Boolean(document.querySelector("#ProductGridContainer .collection.loading"))})' >"$OUT/loading-raw.json"
    if python3 - "$OUT/loading-raw.json" <<'PY'
import json, pathlib, sys
raw = json.loads(pathlib.Path(sys.argv[1]).read_text())
data = raw.get("data", {}).get("result")
if isinstance(data, str):
    data = json.loads(data)
raise SystemExit(0 if not (data or {}).get("loading") else 1)
PY
    then
      break
    fi
    sleep 1
  done
  bash "$ROOT/.cursor/skills/verify-storefront/scripts/restore-preview.sh" "$THEME_ID"
  bash "$ROOT/.cursor/skills/verify-storefront/scripts/doctor.sh" "$THEME_ID" >"$OUT/doctor.json"
}

agent-browser --session "$SESSION" close || true
agent-browser --session "$SESSION" set viewport 1400 900
agent-browser --session "$SESSION" open "https://shop.northfinder.com/collections/all-clothing?preview_theme_id=${THEME_ID}"
agent-browser --session "$SESSION" wait --load load
bash "$ROOT/.cursor/skills/verify-storefront/scripts/restore-preview.sh" "$THEME_ID"
bash "$ROOT/.cursor/skills/verify-storefront/scripts/doctor.sh" "$THEME_ID" >"$OUT/doctor-baseline.json"
agent-browser --session "$SESSION" wait "#FacetsWrapperDesktop"
agent-browser --session "$SESSION" wait "#discount-filter-checkbox"

echo "STEP baseline"
eval_json baseline
agent-browser --session "$SESSION" screenshot "$OUT/baseline.png"
cp "$OUT/baseline.png" /opt/cursor/artifacts/filter-regression-baseline.png

TARGET_ID="$(python3 - "$OUT/baseline.json" <<'PY'
import json, pathlib, sys
data = json.loads(pathlib.Path(sys.argv[1]).read_text())
print(data.get("targetInputId") or "")
PY
)"
if [[ -z "$TARGET_ID" ]]; then
  echo "no enabled desktop facet checkbox" >&2
  exit 1
fi

echo "STEP open-size-group"
# Open the accordion that holds the first non-sale checkbox, then click that box.
agent-browser --session "$SESSION" --json eval "$(cat <<EOF
(() => {
  const input = document.getElementById(${TARGET_ID@Q});
  const details = input && input.closest("details");
  if (details && !details.open) {
    const summary = details.querySelector("summary");
    if (summary) summary.click();
  }
  return { open: Boolean(details && details.open), id: input && input.id };
})()
EOF
)" >"$OUT/open-size-raw.json"
sleep 0.4

echo "STEP click-size $TARGET_ID"
agent-browser --session "$SESSION" click "[id=\"${TARGET_ID}\"]"
wait_settled
echo "STEP after-size"
eval_json after-size
agent-browser --session "$SESSION" screenshot "$OUT/after-size.png"
cp "$OUT/after-size.png" /opt/cursor/artifacts/filter-regression-size.png

echo "STEP click-discount"
agent-browser --session "$SESSION" click "#discount-filter-checkbox"
wait_settled
echo "STEP after-discount"
eval_json after-discount
agent-browser --session "$SESSION" screenshot "$OUT/after-discount.png"
cp "$OUT/after-discount.png" /opt/cursor/artifacts/filter-regression-discount.png

echo "STEP clear-all"
if agent-browser --session "$SESSION" click "#FacetsWrapperDesktop a.clear-all-filters"; then
  agent-browser --session "$SESSION" wait --load load || true
else
  echo "clear-all click failed, continuing" >&2
fi
wait_settled
echo "STEP after-clear"
eval_json after-clear
agent-browser --session "$SESSION" screenshot "$OUT/after-clear.png"
cp "$OUT/after-clear.png" /opt/cursor/artifacts/filter-regression-cleared.png

python3 - "$OUT" "$THEME_ID" <<'PY'
import json, pathlib, sys
out = pathlib.Path(sys.argv[1])
theme_id = str(sys.argv[2])
steps = ["baseline", "after-size", "after-discount", "after-clear"]
rows = {name: json.loads((out / f"{name}.json").read_text()) for name in steps}

def unpublished(row):
    return str(row.get("themeId")) == theme_id and row.get("themeRole") == "unpublished"

def no_sale_accordion(row):
    return row.get("saleAccordionCount") == 0

issues = []
base, size, disc, cleared = (rows[name] for name in steps)

if not unpublished(base):
    issues.append("baseline not unpublished draft")
if not base.get("discountExists"):
    issues.append("discount checkbox missing at baseline")
if not no_sale_accordion(base):
    issues.append("sale accordion present at baseline")

if not unpublished(size):
    issues.append("size step left the unpublished draft")
if not size.get("otherFilterParams"):
    issues.append("size click did not add a non-sale filter param")
if size.get("productCountAttr") == base.get("productCountAttr") and size.get("cardCount") == base.get("cardCount"):
    issues.append("size click did not change product count")
if not no_sale_accordion(size):
    issues.append("sale accordion appeared after size click")

if not unpublished(disc):
    issues.append("discount step left the unpublished draft")
if disc.get("saleOffParam") != ["true"]:
    issues.append(f"discount click sale_off={disc.get('saleOffParam')}")
if not disc.get("discountChecked"):
    issues.append("discount checkbox not checked after click")
if not disc.get("otherFilterParams"):
    issues.append("size filter dropped after discount click")
if disc.get("productCountAttr") == size.get("productCountAttr") and disc.get("cardCount") == size.get("cardCount"):
    issues.append("discount click did not change product count")
if not no_sale_accordion(disc):
    issues.append("sale accordion appeared after discount click")

if not unpublished(cleared):
    issues.append("clear-all left the unpublished draft")
if cleared.get("saleOffParam"):
    issues.append(f"clear-all left sale_off={cleared.get('saleOffParam')}")
if cleared.get("otherFilterParams"):
    issues.append(f"clear-all left other filters {cleared.get('otherFilterParams')}")
if cleared.get("discountChecked"):
    issues.append("discount checkbox still checked after clear-all")
if not no_sale_accordion(cleared):
    issues.append("sale accordion appeared after clear-all")

matrix = {
    "themeId": int(theme_id),
    "verdict": "PASS" if not issues else "ISSUES",
    "issues": issues,
    "steps": {
        name: {
            "href": rows[name].get("href"),
            "productCountAttr": rows[name].get("productCountAttr"),
            "productCountText": rows[name].get("productCountText"),
            "cardCount": rows[name].get("cardCount"),
            "saleOffParam": rows[name].get("saleOffParam"),
            "otherFilterParams": rows[name].get("otherFilterParams"),
            "discountChecked": rows[name].get("discountChecked"),
            "saleAccordionCount": rows[name].get("saleAccordionCount"),
            "facetTitles": rows[name].get("facetTitles"),
            "themeRole": rows[name].get("themeRole"),
        }
        for name in steps
    },
}
(out / "matrix.json").write_text(json.dumps(matrix, indent=2) + "\n")
pathlib.Path("/opt/cursor/artifacts/filter-regression-matrix.json").write_text(json.dumps(matrix, indent=2) + "\n")
print(json.dumps({"verdict": matrix["verdict"], "issues": issues, "counts": {name: rows[name].get("productCountAttr") for name in steps}}, indent=2))
if issues:
    raise SystemExit("filter regression failed: " + "; ".join(issues))
PY
