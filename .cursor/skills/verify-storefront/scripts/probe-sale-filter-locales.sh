#!/usr/bin/env bash
set -euo pipefail

# Probe the unpublished international draft on each same-store market.
# Czech, Romania, and Perfumes stores stay out of scope.
# PASS: unpublished theme, no Sale Yes/No accordion, discount checkbox still present.

THEME_ID="${1:-$(cat /opt/cursor/artifacts/verify-storefront/theme-id.txt)}"
SESSION="${AGENT_BROWSER_SESSION:-verify-storefront}"
ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
EVIDENCE="${VERIFY_EVIDENCE_DIR:-/opt/cursor/artifacts/verify-storefront}"
OUT="$EVIDENCE/locales"
export PATH="${HOME}/.local/node_modules/.bin:${PATH}"
export AGENT_BROWSER_SESSION="$SESSION"

mkdir -p "$OUT" /opt/cursor/artifacts

agent-browser --session "$SESSION" close || true
agent-browser --session "$SESSION" set viewport 1400 900

measure_js='(() => {
  const saleAccordions = [...document.querySelectorAll("details[id*=\"filter.p.m.custom.sale_off\"]")];
  const desktop = document.querySelector("#FacetsWrapperDesktop");
  const summaries = desktop
    ? [...desktop.querySelectorAll(".accordion__title")].map((el) => el.textContent.trim()).filter(Boolean)
    : [];
  const checkbox = document.getElementById("discount-filter-checkbox");
  const saleInputs = [...document.querySelectorAll("input[name=\"filter.p.m.custom.sale_off\"]")];
  return {
    href: location.href,
    locale: window.Shopify && Shopify.locale,
    country: window.Shopify && Shopify.country,
    language: window.Shopify && Shopify.locale,
    themeId: window.Shopify && Shopify.theme && Shopify.theme.id,
    themeRole: window.Shopify && Shopify.theme && Shopify.theme.role,
    themeName: window.Shopify && Shopify.theme && Shopify.theme.name,
    facetsDesktopExists: Boolean(desktop),
    saleAccordionCount: saleAccordions.length,
    saleAccordionIds: saleAccordions.map((el) => el.id),
    discountCheckboxExists: Boolean(checkbox),
    discountCheckboxName: checkbox && checkbox.getAttribute("name"),
    discountCheckboxValue: checkbox && checkbox.value,
    discountCheckboxLabel: checkbox && checkbox.closest("label") && checkbox.closest("label").innerText.trim(),
    saleOffInputCount: saleInputs.length,
    saleOffInputIds: saleInputs.map((el) => el.id),
    saleOffInputValues: saleInputs.map((el) => el.value),
    desktopFacetTitles: summaries,
  };
})()'

probe_one() {
  local slug="$1"
  local expected_locale="$2"
  local url="$3"
  local preview="${url}?preview_theme_id=${THEME_ID}"
  if [[ "$url" == *\?* ]]; then
    preview="${url}&preview_theme_id=${THEME_ID}"
  fi

  echo "PROBE $slug $preview"
  agent-browser --session "$SESSION" open "$preview"
  agent-browser --session "$SESSION" wait --load load
  bash "$ROOT/.cursor/skills/verify-storefront/scripts/restore-preview.sh" "$THEME_ID"

  local doctor_ok=0
  if bash "$ROOT/.cursor/skills/verify-storefront/scripts/doctor.sh" "$THEME_ID" >"$OUT/${slug}-doctor.json"; then
    doctor_ok=1
  else
    echo "doctor failed for $slug" >&2
  fi

  agent-browser --session "$SESSION" wait "#FacetsWrapperDesktop" || true
  agent-browser --session "$SESSION" --json eval "$measure_js" >"$OUT/${slug}-raw.json"
  python3 - "$OUT/${slug}-raw.json" "$OUT/${slug}.json" "$slug" "$expected_locale" "$doctor_ok" "$THEME_ID" <<'PY'
import json, pathlib, sys
raw_path, out_path, slug, expected_locale, doctor_ok, theme_id = sys.argv[1:7]
raw = json.loads(pathlib.Path(raw_path).read_text())
if not raw.get("success"):
    data = {"error": raw.get("error"), "slug": slug, "verdict": "BLOCKED"}
else:
    data = raw["data"]["result"]
    if isinstance(data, str):
        data = json.loads(data)
data["slug"] = slug
data["expectedLocale"] = expected_locale
data["doctorOk"] = doctor_ok == "1"
data["expectedThemeId"] = int(theme_id)
sale_count = data.get("saleAccordionCount")
checkbox = data.get("discountCheckboxExists")
values = data.get("saleOffInputValues") or []
locale_ok = str(data.get("locale") or "") == expected_locale
theme_ok = str(data.get("themeId")) == str(theme_id) and data.get("themeRole") == "unpublished"
values_ok = bool(values) and all(v == "true" for v in values)
if data.get("verdict") == "BLOCKED":
    pass
elif data.get("doctorOk") and theme_ok and sale_count == 0 and checkbox and values_ok and locale_ok:
    data["verdict"] = "PASS"
else:
    data["verdict"] = "ISSUES"
    data["failReasons"] = []
    if not data.get("doctorOk") or not theme_ok:
        data["failReasons"].append("draft theme missing")
    if sale_count != 0:
        data["failReasons"].append(f"sale accordion count {sale_count}")
    if not checkbox:
        data["failReasons"].append("discount checkbox missing")
    if not values_ok:
        data["failReasons"].append(f"sale_off values {values}")
    if not locale_ok:
        data["failReasons"].append(f"locale {data.get('locale')} != {expected_locale}")
pathlib.Path(out_path).write_text(json.dumps(data, indent=2) + "\n")
print(json.dumps({"slug": slug, "verdict": data["verdict"], "locale": data.get("locale"), "saleAccordionCount": data.get("saleAccordionCount"), "discountCheckboxExists": data.get("discountCheckboxExists")}))
PY

  local shot="$OUT/${slug}.png"
  agent-browser --session "$SESSION" screenshot "$shot"
  cp "$shot" "/opt/cursor/artifacts/sale-filter-${slug}.png"
}

# Same-store markets only. Handles from live storefronts that already have filters.
probe_one sk sk "https://northfinder.sk/collections/panske-oblecenie-bundy"
probe_one bg bg "https://northfinder.bg/collections/damski-drehi"
probe_one en en "https://shop.northfinder.com/collections/all-clothing"
probe_one de de "https://shop.northfinder.com/de/collections/all-clothing"
probe_one hr hr "https://shop.northfinder.com/hr/collections/all-clothing"
probe_one sl sl "https://shop.northfinder.com/sl/collections/all-clothing"

python3 - "$OUT" <<'PY'
import json, pathlib, sys
out = pathlib.Path(sys.argv[1])
rows = []
for slug in ("sk", "bg", "en", "de", "hr", "sl"):
    path = out / f"{slug}.json"
    if path.exists():
        rows.append(json.loads(path.read_text()))
matrix = {
    "themeId": rows[0]["expectedThemeId"] if rows else None,
    "verdicts": {row["slug"]: row["verdict"] for row in rows},
    "rows": [
        {
            "slug": row["slug"],
            "verdict": row["verdict"],
            "locale": row.get("locale"),
            "country": row.get("country"),
            "href": row.get("href"),
            "saleAccordionCount": row.get("saleAccordionCount"),
            "saleAccordionIds": row.get("saleAccordionIds"),
            "discountCheckboxExists": row.get("discountCheckboxExists"),
            "discountCheckboxValue": row.get("discountCheckboxValue"),
            "discountCheckboxLabel": row.get("discountCheckboxLabel"),
            "saleOffInputValues": row.get("saleOffInputValues"),
            "desktopFacetTitles": row.get("desktopFacetTitles"),
            "themeId": row.get("themeId"),
            "themeRole": row.get("themeRole"),
            "failReasons": row.get("failReasons"),
        }
        for row in rows
    ],
}
(out / "matrix.json").write_text(json.dumps(matrix, indent=2) + "\n")
(pathlib.Path("/opt/cursor/artifacts") / "sale-filter-locale-matrix.json").write_text(json.dumps(matrix, indent=2) + "\n")
failed = [row["slug"] for row in rows if row["verdict"] != "PASS"]
print(json.dumps(matrix["verdicts"]))
if failed:
    raise SystemExit("failed locales: " + ",".join(failed))
PY
