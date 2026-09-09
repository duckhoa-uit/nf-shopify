# Draft theme push + agent-browser verify

Push unpublished drafts. Never use `pnpm push:*` for this (`--allow-live`).

```bash
shopify theme push -e <env> --unpublished --theme "Draft - <short name>" --json
```

CLI preview URLs use the `*.myshopify.com` host. Primary domains (e.g. `shop.northfinder.com`) strip `preview_theme_id` from the visible URL after redirect. Shopify may still apply the draft via session, but agent-browser must not rely on that.

## Preserve `preview_theme_id` after redirect

1. Capture `theme.id` from the push JSON (or `Shopify.theme.id` after first load).
2. Open the CLI preview URL (`https://<store>.myshopify.com/?preview_theme_id=<id>`).
3. Wait `--load load` (not `networkidle` — analytics keeps the page busy).
4. `get url`. If the host changed or `preview_theme_id` is missing, rebuild the current URL on that origin and re-open with the param:

```bash
# After redirect, CURRENT is e.g. https://shop.northfinder.com/products/foo
# Re-open: https://shop.northfinder.com/products/foo?preview_theme_id=<id>
```

Use the redirected origin (`get url`), not a hardcoded domain. Keep existing path + query; set/replace `preview_theme_id`.

5. After every in-app navigation (search, product click, locale switch), `get url` again and re-open if the param dropped.
6. Before measuring, confirm:

```js
Shopify.theme.id === <id> && Shopify.theme.role === 'unpublished'
```

Do not treat a missing query param as "live theme" without checking `Shopify.theme`. Do not treat a present query param as success without that check.

`settings_data.json` is ignored on push by default. Unpublished drafts then use schema defaults (e.g. Dawn Assistant), not merchant Archivo. To verify brand fonts on a draft, temporarily drop `ignore` for that env in `shopify.theme.toml`, push to the **unpublished theme id only**, then restore `ignore` immediately. Never leave ignore off — `pnpm push:*` is `--allow-live`.

Shop Pay / wallet iframes use their own fonts. Ignore them.

Learned 2026-08-25 on international draft `204302844236`: myshopify preview redirected to `https://shop.northfinder.com/` with an empty search string; `Shopify.theme` was still the draft. Re-opening `https://shop.northfinder.com/?preview_theme_id=204302844236` is the verify entry point.

Full settings push (ignore dropped once, then restored) made `--font-heading-family` / `--font-body-family` `Archivo`. EComposer still sets `body { font-family: Poppins }` — do not fight that with `!important` on `body`. Apparel PDP text that would inherit must set `font-family: var(--font-body-family)` itself (`.current-price`, `.view-all-link`, `.northfinder-product-page`).
