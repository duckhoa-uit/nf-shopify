# Collection filters

The shopper narrows a collection from the filter column on a wide screen.

## Sub-features

- `filters-desktop` shows the desktop filter wrapper on a collection.
- `filters-count` shows a product count that updates after a filter click.

## How to get to it (user POV)

- Open any collection that uses the default collection template.
- On a wide screen, use the filter groups in the left column.

## Driving it with agent-browser

Preconditions:

- Doctor passed on the unpublished international draft.
- Viewport is 1400x900.
- `preview_theme_id` is on the current URL.

- **Reach filters.** Open `https://shop.northfinder.com/collections/all-clothing?preview_theme_id=$THEME_ID`, wait `--load load`, restore the preview param, and run doctor. `#FacetsWrapperDesktop` is present.
- **Proof.** Run `agent-browser --session verify-storefront screenshot /opt/cursor/artifacts/verify-storefront/filters.png`. The filter column is in the shot.
- **Locales.** `bash .cursor/skills/verify-storefront/scripts/probe-sale-filter-locales.sh "$THEME_ID"` opens SK, BG, EN, DE, HR, and SL on the unpublished draft. PASS is `Shopify.theme.role` unpublished, `saleAccordionCount` 0, and `#discount-filter-checkbox` present. The script writes `/opt/cursor/artifacts/verify-storefront/locales/matrix.json`.
- **Regression.** `bash .cursor/skills/verify-storefront/scripts/probe-filter-regression.sh "$THEME_ID"` clicks a size value, then `#discount-filter-checkbox`, then `a.clear-all-filters` on English all-clothing. PASS is a changed `data-total-count`, `sale_off=true` after the checkbox, both params gone after clear, and no Sale Yes/No accordion throughout. The script writes `/opt/cursor/artifacts/verify-storefront/filter-regression/matrix.json`.

## Gotchas

- Mobile uses `.mobile-facets__open` instead of the desktop wrapper.
- Filter clicks fetch new grid HTML. Restore `preview_theme_id` if the URL changes.
- An empty collection can show filters with no product cards.
- Do not hide a Shopify filter by `filter.label`. Search & Discovery translates that string (`Sale` becomes `Výpredaj` / `Разпродажба`). Skip `filter.p.m.custom.sale_off` by `param_name` so the Yes/No group stays off in every locale. Leave the price-group `discount-filter-checkbox` alone. It posts the same param with `value="true"` and still needs the Search & Discovery filter enabled.
- Locale collection handles translate after redirect. `/de/collections/all-clothing` becomes `alle-kleidung`, `/hr/` becomes `sva-odjeca`, `/sl/` becomes `vsa-oblacila`. Restore `preview_theme_id` on the redirected path. Czech, Romania, and Perfumes stores stay out of scope.

## Sale Yes/No group

`#Details-filter.p.m.custom.sale_off-{{ section.id }}` must not exist on desktop or in `#FacetsWrapperMobile`. `#discount-filter-checkbox` must still exist inside the price group.
