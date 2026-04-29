# Aktivnosti menu links missing `/sl/` prefix — audit & manual fix guide

**Status**: Open — requires manual fix in Shopify Admin
**Scope**: Slovenian (`sl`) storefront
**Owner**: Merchant / store admin

---

## 1. Symptom

On the `/sl/` storefront, navigation entries titled **"Aktivnosti"** (Slovenian for "Activities") link to URLs that do **not** include the `/sl/` locale prefix. Buyers click an "Aktivnosti" submenu item and land on the **default-locale** version of the collection instead of the localized SL collection. URLs typically look like:

```
/1625-jackets/aktivnosti-smucanje
/1638-trousers/aktivnosti-pohodnistvo
/1781-obuv/aktivnosti-pohodnistvo/vrsta_materiala-vibram
…
```

These are **legacy PrestaShop facet URLs** preserved verbatim in the Shopify menu data; Shopify's locale routing only auto-prefixes URLs that are stored as `shopify://…` references or as relative paths it can resolve to a localized resource.

## 2. Root cause

When the historical PrestaShop catalogue was migrated, navigation menu items were imported with their original absolute URLs (or their SL-locale Translate & Adapt overrides were imported with absolute legacy URLs). Because the URL is absolute and points to a path that does not exist as a Shopify resource, the Worker's redirect layer rewrites the destination at request time but the **`<a href="…">` rendered in the menu still shows the un-prefixed legacy URL**. From a buyer's perspective, the link target appears in the wrong locale.

The current `qa-review-si.csv` and `resolved-edge-redirects-en-si-uat.csv` confirm dozens of menu entries still carry these legacy paths. See:
- `scripts/url-migration/generated/qa-review-si.csv`
- `scripts/url-migration/generated/resolved-edge-redirects-en-si-uat.csv`

## 3. Diagnostics already available

The repo already contains read-only audit tooling. To regenerate the latest snapshot:

```bash
node scripts/menu-fix/audit-all-menus.mjs
# Output: .menu-fix-cache/all-menus-audit.json
```

`audit-all-menus.mjs` reports:
- legacy hostnames (`northfinder.com`, `sportfinder.com`, …)
- path-based filter URLs (legacy `/<base>/foo-bar` style)
- dead Metaobject GIDs
- unknown filter param keys

Run it whenever you want a fresh "what's wrong now?" snapshot before / after the merchant fix.

## 4. Recommended fix (manual, in Shopify Admin)

For every flagged "Aktivnosti" menu item, replace the legacy URL with a Shopify-native reference so the storefront URL auto-localizes per market.

### Pattern: legacy faceted URL → `shopify://` + filter

| Legacy URL | Recommended menu link |
|---|---|
| `/1625-jackets/aktivnosti-smucanje` | `shopify://collections/moska-oblacila-jakne?filter.p.m.features.activities=gid://shopify/Metaobject/1813303722316` |
| `/1638-trousers/aktivnosti-pohodnistvo` | `shopify://collections/zenske-obleke-hlace?filter.p.m.features.activities=gid://shopify/Metaobject/1813303984460` |
| `/1644-skirts/aktivnosti-pohodnistvo` | `shopify://collections/zenske-obleke-krila?filter.p.m.features.activities=gid://shopify/Metaobject/1813303984460` |
| `/1781-obuv/aktivnosti-pohodnistvo/vrsta_materiala-vibram` | `shopify://collections/oprema-obutev?filter.p.m.features.activities=gid://shopify/Metaobject/1813303984460&filter.p.m.features.type_of_material=gid://shopify/Metaobject/1813305295180` |
| `/1637-jackets/aktivnosti-turno_smucanje` | `shopify://collections/zenske-obleke-jakne?filter.p.m.features.activities=gid://shopify/Metaobject/1813304049996` |
| `/1779-palice/aktivnosti-turno_smucanje` | `shopify://collections/oprema-palice?filter.p.m.features.activities=gid://shopify/Metaobject/1813304049996` |
| `/1640-shorts/aktivnosti-kolesarjenje` | `shopify://collections/zenske-obleke-kratke-hlace?filter.p.m.features.activities=gid://shopify/Metaobject/1813303722316` |
| `/1629-vests/aktivnosti-pohodnistvo` | `shopify://collections/moska-oblacila-telovniki?filter.p.m.features.activities=gid://shopify/Metaobject/1813303984460` |
| `/1462-jackets/aktivnosti-turno_smucanje` | `shopify://collections/zensko-oblacila-jakne?filter.p.m.features.activities=gid://shopify/Metaobject/1813304049996` |
| `/1482-skirts/aktivnosti-pohodnistvo` | `shopify://collections/zenske-obleke-krila?filter.p.m.features.activities=gid://shopify/Metaobject/1813303984460` |

> **Source**: `scripts/url-migration/generated/qa-review-si.csv` (rows tagged "Faceted → collection + filter" / "✅ Fixed"). For a complete crosswalk see that file plus `resolved-edge-redirects-en-si-uat.csv`.

The `gid://shopify/Metaobject/<id>` values come from the same QA review spreadsheet — they are the Shopify metaobject IDs that back the "Activities" features filter (skiing, hiking, ski-touring, cycling, running, …). The `audit-all-menus.mjs` script can also enumerate every Metaobject GID currently referenced by any menu URL.

### Why `shopify://` instead of an absolute path?

`shopify://` URIs are **resolved at render time** against the requesting market's locale. So a single menu item:

```
shopify://collections/moska-oblacila-jakne?filter.p.m.features.activities=gid://shopify/Metaobject/1813303722316
```

renders as:
- `/collections/moska-oblacila-jakne?filter.p.m.features.activities=...` on the default locale
- `/sl/collections/moska-oblacila-jakne?filter.p.m.features.activities=...` on the SL storefront

…with no per-locale duplication of menu entries, no Worker rewrite cost, and no risk of dangling absolute URLs.

## 5. Step-by-step instructions for the merchant

### Step 1 — Audit
1. Open Shopify Admin → **Online Store → Navigation**.
2. Open each of the menus reported by `audit-all-menus.mjs` (typically `main-menu`, plus any locale-specific override menus).
3. For each menu item whose **Title** is "Aktivnosti" (or contains an activity name like Smučanje, Pohodništvo, Tek, Kolesarjenje, Turno smučanje, Kros), inspect the **Link**.

### Step 2 — Fix the link
1. Click the menu item.
2. Replace the legacy URL with the recommended `shopify://collections/<handle>?filter.p.m.features.activities=<gid>` value from the table in §4 (or look it up in `qa-review-si.csv`).
3. Click **Apply changes** then **Save menu**.

### Step 3 — Translate & Adapt overrides
If there is a per-locale **Translate & Adapt** override of the menu item URL, it will mask the new value:
1. Open Shopify Admin → **Apps → Translate & Adapt**.
2. Select the **Slovenian** language.
3. Open the menu item under **Theme → Navigation**.
4. Either delete the SL URL override (so the canonical `shopify://` URL is used) **or** copy the recommended `shopify://` URL into the SL override.

### Step 4 — Verify
1. Open the SL storefront in a private window: `https://northfinder.com/sl/`.
2. Navigate to each fixed "Aktivnosti" menu item; confirm the address bar shows `/sl/collections/<handle>?…`.
3. Re-run the audit:
   ```bash
   node scripts/menu-fix/audit-all-menus.mjs
   ```
   Confirm there are no remaining `findings` in `.menu-fix-cache/all-menus-audit.json`.

## 6. Future-proofing

- Train content editors to **always** use the resource picker (it inserts `shopify://…`) instead of pasting absolute URLs.
- Re-run `node scripts/menu-fix/audit-all-menus.mjs` as part of the post-deploy QA workflow whenever menus are edited.
- For a future automated apply, a `--confirm`-gated writer can be added (mirroring `scripts/menu-fix/apply.mjs`); intentionally out of scope for this pass per merchant request.

## 7. Related fixes shipped in the same change set

- `sections/footer.liquid` + `locales/*.json` — footer phone/email now read from `'footer.contact.phone' | t` / `'footer.contact.email' | t`, so `/sl/` shows `+386 2 828 19 52` and `eshop@northfinder.si` instead of the SK contact center values.
- `scripts/menu-fix/fix-blog-faq-sl.mjs` — `--confirm`-gated writer that registers SL translations on the `news` blog and `faq` page resources, fixing the Blog/FAQ menu links rendering as `/blogs/news` and `/pages/faq` instead of `/sl/blogs/news` and `/sl/pages/faq`.

## 8. References
- Audit script: `scripts/menu-fix/audit-all-menus.mjs`
- Apply script (existing pattern, not used here): `scripts/menu-fix/apply.mjs`
- Crosswalk spreadsheet: `scripts/url-migration/generated/qa-review-si.csv`
- Edge redirects: `scripts/url-migration/generated/resolved-edge-redirects-en-si-uat.csv`
