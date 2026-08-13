# Product badge and campaign rendering

## Purpose

This document defines how product badges are currently rendered across the
Northfinder theme, how each badge depends on Shopify product data, and how a
campaign should be configured so the intended promotion tag is visible.

The audit covers:

- Canonical product cards used by collection, search, related products, recent
  products, featured products, and collage sections.
- The standard apparel/Northkit PDP and the maintained parfum PDP.
- Sale badges derived from `compare_at_price`.
- Automatic discount preview badges supported by the theme contract.
- Product labels from `custom_features.promotion` and
  `custom_features.nf_flow_series`, plus the non-rendered
  `custom_features.extra` data source.
- Alternate Dawn and EComposer implementations that do not follow the
  canonical rendering path.
- Current Shopify Admin data on
  `sportfinder-international.myshopify.com`, fetched read-only on 2026-08-12.

## Executive summary

The theme is only partially standardized.

The main storefront paths are standardized around these components:

- `snippets/card-product.liquid`
- `snippets/product-badge-row.liquid`
- `snippets/discount-badge.liquid`
- `snippets/automatic-discount-preview.liquid`
- `sections/main-product.liquid`
- `sections/main-product-parfums.liquid`

On those canonical paths, the rendering order is:

1. Automatic discount preview badge, if a valid preview payload exists.
2. Compare-at-price sale badge, if `compare_at_price > price`.
3. Up to two nonblank entries from `custom_features.promotion`.

`custom_features.extra` is intentionally not rendered in the canonical badge
row. It remains product metadata, but cannot displace campaign promotions.

However, the implementation is not fully consistent across the entire theme:

- Canonical cards and maintained PDPs share the same renderer, promotion limit,
  single-line overflow behavior, and badge priority.
- Canonical compare-at badges are calculated at product level, while PDP and
  card price displays are based on a selected variant.
- The Featured Product section still uses Dawn's textual `Sale` and
  `Sold out` badges.
- Active EComposer pages use independent product-tag, hardcoded-label, and
  percentage/saving implementations.
- NF Flow Series is PDP-only and is rendered only when another Parameters
  entry exists.

For a normal campaign on canonical cards and PDPs, use
`custom_features.promotion`. A promotion metaobject only controls the visible
label. It does not change the price or create a Shopify discount. Configure the
actual discount separately with Shopify pricing or discounts.

## Terminology

This document uses these terms deliberately:

- **Sale badge**: a badge automatically derived from Shopify
  `compare_at_price` and current price.
- **Automatic discount preview**: a calculated preview badge and preview price
  based on `custom.automatic_discount_preview`. This does not replace the
  actual Shopify discount allocation at checkout.
- **Promotion label**: a manually assigned metaobject reference from
  `custom_features.promotion`.
- **Extra metadata**: a manually assigned metaobject reference from
  `custom_features.extra`. It is not rendered in canonical badge rows.
- **Product tag badge**: a badge driven by `product.tags`. This is used only by
  generated EComposer paths, not canonical product cards or PDPs.

## Canonical render surfaces

### Product cards

The canonical product-card implementation delegates its badge row to
`snippets/product-badge-row.liquid`.

It is reused by the main storefront surfaces, including:

- Collection grid: `sections/main-collection-product-grid.liquid:447-458`
- Search results: `sections/main-search.liquid:273-286`
- Related products: `sections/related-products.liquid:63-79`
- Recently viewed products: `sections/recent-product-card.liquid:1-16`
- Feature Products: `sections/feature-products.liquid:59-70` and
  `sections/feature-products.liquid:105-119`
- Collage product blocks: `sections/collage.liquid:94-105`

Therefore, changing the canonical card logic affects all of these surfaces.

### Standard apparel and Northkit PDP

The standard and Northkit product templates use `main-product`:

- `templates/product.json:21-158`
- `templates/product.northkit.json:21-162`

The top badge row delegates to `snippets/product-badge-row.liquid`.

### Maintained parfum PDP

The maintained parfum template uses `main-product-parfums`:

- `templates/product.parfums.json:21-155`
- Badge row delegates to `snippets/product-badge-row.liquid`

Its top badge row uses the same shared renderer as the standard PDP and
canonical cards.

## Canonical rendering order and limits

### Shared card and PDP order

`snippets/product-badge-row.liquid` is the canonical renderer for cards,
standard/Northkit PDPs, and maintained parfum PDPs. It renders:

1. Shared automatic-preview and compare-at-price badges.
2. The first two nonblank `custom_features.promotion` entries.

The highest-priority promotion must therefore be the first reference in
`custom_features.promotion`.

`custom_features.extra` is not rendered. This prevents category-like,
internal, durable, or legacy Extra values from displacing active campaign
labels.

### Overflow behavior

The canonical row does not scroll and does not display a scrollbar. It uses:

- `flex-wrap: nowrap` so every badge remains on one row.
- `overflow: hidden` on the row so its content cannot exceed the parent.
- `min-width: 0`, `white-space: nowrap`, and `text-overflow: ellipsis` so long
  promotion labels shrink and truncate instead of wrapping or creating a
  horizontal scrollbar.
- A non-shrinking discount badge so pricing information keeps priority while
  promotion labels use the remaining width.
- The same maximum of two promotion labels on cards and maintained PDPs.
- One neutral outline style for all promotions, matching the earlier canonical
  card and PDP presentation.
- Shared base badge dimensions with semantic `discount` and `promotion`
  variants. Each variant maps its background, border, and text colors to the
  theme's existing design tokens.

The old card-only horizontal scroller, gradient shadows, scroll listeners, and
resize observer were removed.

### Practical precedence

Canonical precedence is now:

```text
automatic/price discount badges > primary promotion > secondary promotion
```

Here, primary and secondary describe data priority only. Promotion order still
determines which labels are retained by the two-item limit, but it no longer
changes their visual styling.

If both an automatic preview badge and a compare-at badge are valid, the shared
discount renderer can still output both before promotions. That separate
pricing-precedence issue is documented below.

## Sale badge derived from compare-at price

### Data source

The shared renderer is `snippets/discount-badge.liquid:18-71`.

It supports either:

- An explicitly passed variant, using `variant.compare_at_price` and
  `variant.price`.
- Otherwise, the product-level `product.compare_at_price` and `product.price`.

All current canonical badge-row calls pass only the product. As a result, the
current card and PDP sale badge uses product-level aggregate prices.

### Display rule

The badge is rendered only when:

```text
compare_price > current_price
```

The percentage is:

```text
round((compare_price - current_price) * 100 / compare_price)
```

The visible text is:

| Calculated discount | Visible badge                                           |
| ------------------- | ------------------------------------------------------- |
| 15% or more         | `-N%`                                                   |
| Less than 15%       | Localized `products.product.sale_badge`, English `SALE` |

The 15% threshold is a snippet default, not a Theme Editor setting. See
`snippets/discount-badge.liquid:18-21` and
`snippets/discount-badge.liquid:61-70`.

### How to configure a compare-at sale

For each variant participating in the sale:

1. Set **Price** to the actual selling price.
2. Set **Compare-at price** to the original price.
3. Ensure Compare-at price is strictly greater than Price.

Examples:

| Price | Compare-at price | Calculated result                         |
| ----: | ---------------: | ----------------------------------------- |
|   €85 |             €100 | `-15%`                                    |
|   €90 |             €100 | `SALE`, because the discount is below 15% |
|  €100 |             €100 | No sale badge                             |
|  €100 |            Empty | No sale badge                             |

### Important caveats

- A promotion metaobject such as `Outdoor Sale` does not create this sale
  badge. Only price data does.
- The compare-at badge does not check product availability. It can remain
  visible for a sold-out product.
- The card's normal compare-at price display checks `product.available` in
  `snippets/automatic-discount-preview.liquid:155-168`. A sold-out product can
  therefore show a sale badge while showing only one price.
- Four products in the 2026-08-12 Admin snapshot have a mixture of discounted
  and non-discounted variants. Because the badge is product-level, it can be
  less precise than the selected-variant price display.
- A PDP variant refresh updates the badge container, but the ordinary
  compare-at badge is still rendered from product aggregate prices because the
  PDP does not pass the selected variant into `discount-badge`.

## Automatic discount preview

### Current status

The theme implements an automatic discount preview contract in
`snippets/automatic-discount-preview.liquid`.

However, the International store snapshot on 2026-08-12 showed:

- No Product metafield definition for
  `custom.automatic_discount_preview`.
- No Product Variant metafield definition for
  `custom.automatic_discount_preview`.
- Zero product values using the metafield.
- Zero variant values using the metafield.

Therefore, this feature is supported by theme code but is not currently
configured or active in Shopify Admin.

Do not ask merchandisers to populate this field until the metafield definition,
validation, ownership, and campaign workflow have been formally created.

### Source and fallback

The renderer reads:

1. `variant.metafields.custom.automatic_discount_preview.value`
2. If the variant value is blank,
   `product.metafields.custom.automatic_discount_preview.value`

See `snippets/automatic-discount-preview.liquid:20-31`.

If a variant value exists but is malformed or unsupported, the renderer does
not fall back to the product value. Fallback happens only when the variant value
is blank.

### Required JSON contract

When the feature is formally enabled, the metafield must be a JSON value with:

- Top-level `version: 1`
- A `rules` array
- `preview: "EXACT_PRICE"`
- One supported audience
- One supported discount value
- No more than one simultaneously eligible rule

Supported audiences:

- `ALL`
- `AUTHENTICATED_CUSTOMER`
- `CUSTOMER_TAG`

Supported values:

- `PERCENTAGE`
- `FIXED_AMOUNT`

### Percentage example

```json
{
  "version": 1,
  "rules": [
    {
      "preview": "EXACT_PRICE",
      "audience": {
        "type": "ALL"
      },
      "value": {
        "type": "PERCENTAGE",
        "value": 20
      },
      "minimumQuantity": 1,
      "startsAt": "2026-09-01T00:00:00Z",
      "endsAt": "2026-09-15T00:00:00Z"
    }
  ]
}
```

This previews a `-20%` badge and a calculated preview price during the active
interval.

### Fixed-amount example

For a €10 preview discount in a storefront using EUR:

```json
{
  "version": 1,
  "rules": [
    {
      "preview": "EXACT_PRICE",
      "audience": {
        "type": "ALL"
      },
      "value": {
        "type": "FIXED_AMOUNT",
        "amount": 1000,
        "currency": "EUR"
      },
      "minimumQuantity": 1
    }
  ]
}
```

The amount follows Shopify Liquid price units. For a two-decimal currency,
`1000` means €10.00. Currency must exactly match the active storefront currency,
and the fixed amount must be less than the selected variant price.

### Audience examples

Authenticated customers only:

```json
{
  "type": "AUTHENTICATED_CUSTOMER"
}
```

Customers with the exact `VIP` customer tag:

```json
{
  "type": "CUSTOMER_TAG",
  "value": "VIP"
}
```

### Eligibility rules and edge cases

- `startsAt` is active when the current timestamp reaches the start time.
- `endsAt` is inactive when the current timestamp reaches the end time.
- Current card and PDP calls evaluate quantity as `1`. Do not use
  `minimumQuantity` greater than `1` for storefront preview under the current
  implementation.
- A percentage must be greater than zero and no greater than 100.
- A 100% percentage previews a zero price.
- A fixed amount equal to the variant price is rejected.
- A `CUSTOMER_TAG` value must exactly match a logged-in customer's tag.
- If two rules are eligible at the same time, no preview is rendered.
- A valid automatic preview does not suppress the compare-at sale badge. If
  compare-at pricing is also active, two discount badges can be shown.
- The calculated price is only a preview. Shopify cart and checkout discount
  allocations remain authoritative.

## Promotion labels from metafields

### Shopify Admin definition

`custom_features.promotion` is currently defined as:

- Owner: Product
- Type: `list.metaobject_reference`
- Referenced metaobject type: `promotion`
- Metaobject display-name field: `name`
- `name` type: `single_line_text_field`
- Additional field: `parent`, a metaobject reference used by the imported data

This confirms that the theme's `promotion.name` access is compatible with the
actual Admin schema.

### Rendering behavior

Canonical cards and PDPs render the `name` field exactly as stored in the
referenced metaobject. The theme does not:

- Look up a locale-file translation key.
- Automatically uppercase the stored text before rendering. CSS applies
  uppercase presentation on canonical surfaces.
- Deduplicate duplicate references or names.
- Filter blank names.
- Activate or expire a promotion based on dates.
- Validate that the product has a real discount.
- Connect the label to a Shopify discount object.

The assignment itself is the on/off switch. A promotion remains visible until
the reference is removed from the product.

### Current International store usage

Read-only Admin data fetched on 2026-08-12 showed:

- 2,592 active products in total.
- 156 products with at least one promotion reference.
- 113 products with exactly one promotion.
- 43 products with exactly two promotions.
- No product with more than two promotions.
- Every promoted product includes `Outdoor Sale`.
- Additional promotion usage:
  - `Bestsellers`: 15 products
  - `Last pieces`: 9 products
  - `New arrival`: 17 products
  - `Premium collection`: 2 products
- Promotion combinations:
  - `Outdoor Sale`: 113 products
  - `Outdoor Sale` + `Last pieces`: 9 products
  - `Outdoor Sale` + `Bestsellers`: 15 products
  - `Outdoor Sale` + `New arrival`: 17 products
  - `Outdoor Sale` + `Premium collection`: 2 products

The promotion catalog contains many legacy or currently unused entries. Only
five promotion names are assigned to products in the current snapshot.

### How to configure a canonical campaign label

For a normal campaign that must appear on canonical product cards and the
standard/parfum PDP:

1. Go to the Product in Shopify Admin.
2. Find the Product metafield **PROMOTION**
   (`custom_features.promotion`).
3. Select an existing `promotion` metaobject or create an approved one.
4. Set its `name` to the customer-facing campaign label.
5. Put the highest-priority label first in the reference list.
6. Remove the reference when the campaign ends.
7. Configure the real discount separately.

Recommended values:

| Campaign purpose                       | Recommended `name`                                              |
| -------------------------------------- | --------------------------------------------------------------- |
| General seasonal landing-page campaign | `Outdoor Sale` or the approved campaign name                    |
| Bestseller merchandising               | `Bestsellers`                                                   |
| Low remaining stock, manually curated  | `Last pieces`                                                   |
| Newly launched product                 | `New arrival`                                                   |
| Premium range                          | `Premium collection`                                            |
| Black Friday campaign                  | `Black Friday`                                                  |
| Additional campaign discount label     | `Black Friday -20% Extra` or a similarly explicit approved name |

Avoid ambiguous values such as `Discount`, `Discounted price`, or generic color
names. Several such legacy values exist in the promotion catalog, but they do
not communicate a clear campaign or pricing rule.

### Translation requirement

Promotion labels are not translated through `locales/*.json`. If localized
labels are required, translations must be added to the metaobject `name` field
through Shopify's translation workflow. Do not create one differently named
promotion object per market unless that is an intentional data-model decision.

## Extra labels from metafields

### Shopify Admin definition

`custom_features.extra` is currently defined as:

- Owner: Product
- Type: `list.metaobject_reference`
- Referenced metaobject type: `extra`
- Metaobject display-name field: `name`
- `name` type: `single_line_text_field`

### Current usage

The 2026-08-12 snapshot showed:

- The metafield exists on 2,534 products according to its definition usage
  count, primarily as stored empty lists.
- All 2,592 exported products resolved to zero selected `extra` references.
- The `extra` metaobject catalog contains 34 possible values, but none are
  currently assigned.

The catalog mixes category-like labels and campaign-like labels, including
`Jackets`, `Northkit`, `3-year warranty`, `Extra discount -30%`, and
`-50% Extra`.

### Recommendation

Use `extra` only for durable product-level metadata that is not a campaign
promotion. Canonical product cards and maintained PDP badge rows do not render
this metafield.

Campaign-specific labels belong in `custom_features.promotion`.

## NF Flow Series badge

### Shopify Admin definition

`custom_features.nf_flow_series` is currently:

- Owner: Product
- Type: `list.metaobject_reference`
- Referenced metaobject type: `nf_flow_series`
- Display-name field: `name`

Current metaobjects:

- `PATH Flow™ Series`
- `PEAK Flow™ Series`

### Current usage

The 2026-08-12 snapshot showed:

- 1,965 products with one NF Flow Series reference.
- 1,788 products assigned to `PATH Flow™ Series`.
- 177 products assigned to `PEAK Flow™ Series`.
- No product with multiple NF Flow Series references.

### Render location

The badge is implemented in `snippets/nf-flow-series-badge.liquid:1-25` and is
only called from the standard apparel/Northkit Parameters area at
`sections/main-product.liquid:653-656`.

It is not shown on:

- Product cards.
- Maintained parfum PDPs.
- EComposer scent PDPs.
- The top PDP badge row.

It is also currently inside `if sortable_entries != ''`. A product with an NF
Flow assignment but no other displayable Parameters entry will not show the NF
Flow badge.

This field should not be used for campaign promotions.

## Product tags and EComposer exceptions

Canonical cards and maintained PDPs do not render arbitrary `product.tags` as
badges.

Product tags are used by generated EComposer paths, especially the Outdoor
Sale page. The generated renderer:

- Splits a configured comma-separated badge allowlist.
- Iterates through `product.tags`.
- Performs exact, case-sensitive equality after replacing non-breaking spaces.
- Renders a matching tag as a custom badge.

See `sections/ecom-outdoor-sale-page.liquid:424-467`, with duplicated seasonal
implementations at `sections/ecom-outdoor-sale-page.liquid:1007-1050` and
`sections/ecom-outdoor-sale-page.liquid:1590-1633`.

The International Admin snapshot currently contains these campaign-selection
tags:

- `sale-summer`: 68 products
- `sale-autumn`: 61 products
- `sale-winter`: 39 products

There are 168 unique products with at least one of those tags. Of those:

- 156 also have the `Outdoor Sale` promotion metaobject.
- 12 have a seasonal sale product tag but do not have the `Outdoor Sale`
  promotion metaobject.

This is an important split:

- The seasonal product tag can control EComposer campaign grouping or badge
  matching.
- The `Outdoor Sale` promotion metaobject controls the canonical card/PDP
  visible label.

Setting only one does not guarantee both implementations show the same
campaign state.

The generated English EComposer allowlist also contains examples such as
`Hot`, `Best Selling`, and `Trending Item`, but no current product has any of
those exact product tags in the 2026-08-12 snapshot. Therefore those custom
badges currently render on zero products.

## Other non-canonical implementations

### Featured Product section

`sections/featured-product.liquid:116-124` uses the Dawn `price` snippet with
`show_badges: true`.

`snippets/price.liquid:126-133` renders:

- Localized textual `Sale`.
- Localized `Sold out`.

It does not render:

- Canonical percentage/`SALE` threshold behavior.
- `custom_features.extra`.
- `custom_features.promotion`.
- Automatic discount previews.

Its colors use legacy global badge settings from
`config/settings_schema.json:1237-1285`.

### Outdoor Sale EComposer cards

The active Outdoor Sale generated page renders its own:

- Sold-out badge.
- Textual sale badge.
- Exact product-tag badges.
- Monetary saving badge, such as a localized “save €N” value.

It does not consume `custom_features.promotion` for its custom badge list.

### EComposer scent PDP

The active `product.ecom-scent-product` template uses
`sections/ecom-scent-product-product.liquid`.

This generated PDP contains:

- A hardcoded `Best Selling` label.
- A compare-at percentage badge in the form `N% OFF`.
- A sold-out badge.
- Raw rendering of `product.metafields.ecomposer.product_label`.
- Additional recommendation-card implementations based on exact product tags.

See `sections/ecom-scent-product-product.liquid:259-310`,
`sections/ecom-scent-product-product.liquid:1043-1084`, and
`sections/ecom-scent-product-product.liquid:1657-1697`.

The 2026-08-12 International snapshot has no definition and no values for
`ecomposer.product_label`.

## Consistency matrix

| Surface                                                | Sale source                                            | Sale text                         | Promotion source                                        | Limit/order                                            | Standardized?             |
| ------------------------------------------------------ | ------------------------------------------------------ | --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ | ------------------------- |
| Collection/search/related/recent/feature/collage cards | Product-level compare-at price                         | `-N%` at 15%+, otherwise `SALE`   | `custom_features.promotion`                             | Discount first, then first 2 promotions                | Yes, canonical shared row |
| Standard/Northkit PDP                                  | Product-level compare-at badge; selected-variant price | Same shared badge                 | `custom_features.promotion`                             | Same order, limit, and single-line truncation as cards | Yes, canonical shared row |
| Maintained parfum PDP                                  | Same as standard PDP                                   | Same shared badge                 | `custom_features.promotion`                             | Same order, limit, and single-line truncation as cards | Yes, canonical shared row |
| Featured Product                                       | Dawn price state                                       | Localized `Sale`/`Sold out`       | None                                                    | Dawn behavior                                          | No                        |
| NF Flow Parameters                                     | None                                                   | NF Flow name                      | `custom_features.nf_flow_series`                        | All references, Parameters-gated                       | Separate PDP-only feature |
| Outdoor Sale EComposer cards                           | Generated compare-at logic                             | Textual sale plus monetary saving | Exact `product.tags` allowlist                          | Generated order                                        | No                        |
| EComposer scent PDP/cards                              | Generated selected-target logic                        | `N% OFF`, sale, sold out          | Hardcoded label, raw EComposer metafield, or exact tags | Generated order                                        | No                        |

## Campaign configuration playbook

### Scenario 1: Visible campaign label only

Use this when prices should remain unchanged but a merchandising label should
appear.

1. Assign an approved `promotion` metaobject to
   `custom_features.promotion`.
2. Put the most important label first.
3. Remove the reference when the campaign ends.
4. Verify both a canonical collection card and the PDP.

Expected result:

- Canonical card: campaign label appears after any discount badge.
- Maintained PDP: campaign label appears after any discount badge.
- EComposer campaign page: not guaranteed to display the label.

### Scenario 2: Standard compare-at sale plus campaign label

Use this for a normal markdown sale with an original price.

1. Set variant Price and Compare-at price.
2. Assign the campaign's `promotion` metaobject.
3. If an EComposer Outdoor Sale page is also involved, assign its required
   seasonal product tag, for example `sale-summer`.
4. Test variants with the lowest and highest prices.

Expected canonical order:

```text
-N% or SALE | campaign label | optional second promotion
```

The promotion label and price discount are independent. Both must be configured
if both should appear.

### Scenario 3: Extra Shopify automatic discount

If Shopify applies an automatic discount only in cart or checkout, setting a
promotion label such as `-20% Extra` communicates the campaign but does not
change the displayed product price.

Current safe workflow:

1. Configure and test the real Shopify automatic discount.
2. Assign an explicit promotion label, for example `Black Friday -20% Extra`.
3. Do not promise a calculated PDP/card price unless the automatic preview
   feature is formally configured and tested.
4. Remove the label when the automatic discount ends.

Avoid using `custom_features.extra` for this purpose, even though legacy
discount-like values exist there.

### Scenario 4: Outdoor Sale generated page plus canonical storefront

To keep both systems aligned under the current architecture:

1. Add the correct EComposer/selection product tag, such as `sale-summer`,
   `sale-autumn`, or `sale-winter`.
2. Assign the `Outdoor Sale` promotion metaobject.
3. Set valid compare-at prices if a sale percentage and strikethrough price
   should be visible.
4. Confirm the generated Outdoor Sale page and a canonical collection card.

The current Admin snapshot shows 12 products with a seasonal sale tag but no
`Outdoor Sale` promotion. Those products can participate in tag-based campaign
logic without showing the canonical `Outdoor Sale` label.

### Scenario 5: Bestseller, new arrival, or last pieces

Assign the corresponding promotion after the main campaign label:

```text
1. Outdoor Sale
2. Bestsellers, New arrival, Last pieces, or Premium collection
```

This matches the current data order used by all 43 products with two promotion
references.

## Recommended governance

### Data ownership

Use each data source for one responsibility:

| Data source                         | Intended responsibility                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Variant Price and Compare-at price  | Actual displayed markdown pricing and automatic sale badge                                                 |
| `custom_features.promotion`         | Time-sensitive campaign and merchandising labels                                                           |
| `custom_features.extra`             | Durable secondary product metadata; not rendered in canonical badge rows                                   |
| `custom_features.nf_flow_series`    | NF Flow product-series classification                                                                      |
| Product tags                        | Collection/filter/import/EComposer selection only, unless a generated page explicitly requires a tag badge |
| Shopify Discounts                   | Actual automatic discount behavior in cart/checkout                                                        |
| `custom.automatic_discount_preview` | Optional deterministic storefront preview after formal rollout                                             |

### Promotion naming rules

- Use customer-facing wording.
- Keep labels short enough for product cards.
- Use one concept per label.
- Prefer `Black Friday -20% Extra` over separate ambiguous labels such as
  `Black Friday` and `Discount` when the extra amount is central to the offer.
- Do not put category names, colors, or internal campaign codes in Promotion.
- Do not create duplicate metaobjects with only capitalization differences.
- Translate the metaobject field rather than cloning per-language labels.

### Campaign launch checklist

- [ ] Actual Shopify prices or discounts are configured and tested.
- [ ] The correct promotion metaobject is assigned.
- [ ] Promotion reference order is correct.
- [ ] Required EComposer product tag is assigned, if the campaign uses a
      generated page.
- [ ] Compare-at price is greater than Price for every intended sale variant.
- [ ] Products with mixed sale and regular variants are manually verified.
- [ ] Card is checked on collection and search.
- [ ] PDP is checked before and after changing variants.
- [ ] Sold-out behavior is checked.
- [ ] Mobile single-line truncation is checked for multiple or long promotion
      labels.
- [ ] Localized metaobject names are verified.
- [ ] An end-of-campaign task exists to remove promotion references and stale
      product tags.

## Known issues and improvement candidates

The main candidates for future standardization are:

1. Pass the selected/current variant into the canonical discount badge so PDP
   sale percentages match the selected variant.
2. Define a clear precedence rule when automatic preview and compare-at pricing
   are both present, instead of showing two discount badges.
3. Guard against duplicate metaobject names. Blank promotion names are already
   skipped by the shared canonical renderer.
4. Move NF Flow rendering outside the unrelated Parameters-entry gate.
5. Migrate Featured Product and active EComposer product renderers to the
   canonical badge components, or explicitly document them as isolated systems.
6. Remove or archive unused promotion and extra metaobjects after merchant-data
   review.
7. Decide whether the 12 seasonal-tagged products without `Outdoor Sale` are
   intentional or data drift.
8. Create the `custom.automatic_discount_preview` Admin definition and tests
   before enabling that workflow for merchandisers.

## Audit evidence

### Repository evidence

- Canonical badge row: `snippets/product-badge-row.liquid`
- Canonical card call site: `snippets/card-product.liquid`
- Shared sale badge: `snippets/discount-badge.liquid:18-90`
- Automatic preview contract:
  `snippets/automatic-discount-preview.liquid:20-238`
- Standard PDP call site: `sections/main-product.liquid`
- Parfum PDP call site: `sections/main-product-parfums.liquid`
- NF Flow renderer: `snippets/nf-flow-series-badge.liquid:1-25`
- NF Flow call site: `sections/main-product.liquid:653-656`
- Dawn alternate badges: `snippets/price.liquid:126-133`
- Featured Product alternate path: `sections/featured-product.liquid:116-124`
- Outdoor Sale generated path:
  `sections/ecom-outdoor-sale-page.liquid:424-467`
- EComposer scent PDP path:
  `sections/ecom-scent-product-product.liquid:259-310`

### Admin evidence

The Admin audit used Shopify Admin GraphQL API `2026-04` with read-only
definition queries and a bulk product export. Relevant Shopify documentation:

- [metafieldDefinition query](https://shopify.dev/docs/api/admin-graphql/2026-04/queries/metafieldDefinition)
- [metafieldDefinitions query](https://shopify.dev/docs/api/admin-graphql/2026-04/queries/metafieldDefinitions)
- [metaobjects query](https://shopify.dev/docs/api/admin-graphql/2026-04/queries/metaobjects)

Snapshot values can change after 2026-08-12. Re-run the Admin audit before a
major campaign migration or cleanup.
