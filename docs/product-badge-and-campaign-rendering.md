# Product badge and campaign rendering

Canonical rendering contract updated on 2026-11-05. Historical Admin snapshot
sections below retain their observation dates and are not current store counts.

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
- Public labels from `custom_features.extra_storefront` and
  `custom_features.promotion_storefront`, plus the separate
  `custom_features.nf_flow_series` classification.
- Internal `custom_features.extra` and `custom_features.promotion` fields,
  which are not fallback sources for the canonical badge row.
- Alternate Dawn and EComposer implementations that do not follow the
  canonical rendering path.
- Read-only International verification on 2026-11-05 and explicitly dated
  historical Shopify Admin observations from 2026-08-12.

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
3. All nonblank entries from `custom_features.extra_storefront`.
4. Up to two nonblank entries from `custom_features.promotion_storefront`.

Extra does not consume the promotion limit. A product with one Extra and two
Promotion entries renders all three public labels, after any pricing badges.
Both lists retain their stored reference order. Names and title attributes are
HTML-escaped. Internal `extra` and `promotion` are never used as fallbacks.

However, the implementation is not fully consistent across the entire theme:

- Canonical cards and maintained PDPs share the same renderer, promotion limit,
  wrapping behavior, and badge priority.
- Canonical compare-at badges are calculated at product level, while PDP and
  card price displays are based on a selected variant.
- The Featured Product section still uses Dawn's textual `Sale` and
  `Sold out` badges.
- Active EComposer pages use independent product-tag, hardcoded-label, and
  percentage/saving implementations.
- NF Flow Series is PDP-only and is rendered only when another Parameters
  entry exists.

For a normal campaign on canonical cards and PDPs, use
`custom_features.promotion_storefront`. Use `custom_features.extra_storefront`
for public Extra labels. Neither field changes the price or creates a Shopify
discount. Configure the actual discount separately with Shopify pricing or
discounts.

## Terminology

This document uses these terms deliberately:

- **Sale badge**: a badge automatically derived from Shopify
  `compare_at_price` and current price.
- **Automatic discount preview**: a calculated preview badge and preview price
  based on `custom.automatic_discount_preview`. This does not replace the
  actual Shopify discount allocation at checkout.
- **Promotion label**: a manually assigned metaobject reference from
  `custom_features.promotion_storefront`.
- **Extra label**: a public metaobject reference from
  `custom_features.extra_storefront`, rendered before Promotion labels.
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
2. All nonblank `custom_features.extra_storefront` entries.
3. The first two nonblank `custom_features.promotion_storefront` entries.

The highest-priority promotion must therefore be the first reference in
`custom_features.promotion_storefront`.

The renderer preserves the reference order stored on the Product metafield. It
does not sort, reverse, group, or reprioritize promotions by name, style, or
campaign type. Blank names are skipped without changing the relative order of
the remaining entries, and the first two nonblank references are rendered.

Extra has a separate loop and does not increment the promotion counter.
`promotion_limit` applies only to Promotion labels, not the complete row.
Missing fields and blank names render nothing. Internal `extra` and
`promotion` fields remain excluded, so durable or feed-only metadata cannot
leak into shopper-facing badges.

### Overflow behavior

The canonical row does not scroll and does not display a scrollbar. It uses:

- `flex-wrap: wrap` so whole badges move onto another line when space is tight.
- Non-shrinking badges so adding Extra cannot squeeze a Promotion out of view.
- `max-width: 100%`, `min-width: 0`, `white-space: nowrap`, and
  `text-overflow: ellipsis` so an individual overlong label stays within its
  parent. Its title attribute retains the complete label.
- No row-level clipping and no horizontal scroller.
- The same maximum of two promotion labels on cards and maintained PDPs.
- One neutral outline style for public Extra and Promotion labels.
- Shared base badge dimensions with semantic `discount`, `extra`, and `promotion`
  variants. Each variant maps its background, border, and text colors to the
  theme's existing design tokens.

The old card-only horizontal scroller, gradient shadows, scroll listeners, and
resize observer were removed.

### Practical precedence

Canonical precedence is now:

```text
automatic/price discount badges > Extra labels > primary promotion > secondary promotion
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

The historical International store snapshot on 2026-08-12 showed:

- No Product metafield definition for
  `custom.automatic_discount_preview`.
- No Product Variant metafield definition for
  `custom.automatic_discount_preview`.
- Zero product values using the metafield.
- Zero variant values using the metafield.

That historical snapshot does not establish current store configuration.
The five products checked on 2026-11-05 had no product-level preview payload;
their variant-level payloads were not audited in that check.

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

`custom_features.promotion_storefront` uses the existing `promotion` type:

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
- Activate or expire a promotion based on dates.
- Validate that the product has a real discount.
- Connect the label to a Shopify discount object.

The assignment itself is the on/off switch. A promotion remains visible until
the reference is removed from the product.
Whitespace-only or missing names are skipped and do not consume the limit.
Both text and title attributes are escaped; CSS supplies uppercase presentation.

### Historical International store usage, 2026-08-12

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

These counts describe the original `custom_features.promotion` field in the
historical snapshot, not current Storefront field assignments.

### How to configure a canonical campaign label

For a normal campaign that must appear on canonical product cards and the
standard/parfum PDP:

1. Go to the Product in Shopify Admin.
2. Find the Product metafield **Promotion Storefront**
   (`custom_features.promotion_storefront`).
3. Select an existing `promotion` metaobject or create an approved one.
4. Set its `name` to the customer-facing campaign label.
5. Put the highest-priority label first in the reference list.
6. Remove the reference when the campaign ends.
7. Configure the real discount separately.

Recommended values:

| Campaign purpose                       | Recommended `name`                                                 |
| -------------------------------------- | ------------------------------------------------------------------ |
| General seasonal landing-page campaign | `Outdoor Sale` or the approved campaign name                       |
| Bestseller merchandising               | `Bestsellers`                                                      |
| Low remaining stock, manually curated  | `Last pieces`                                                      |
| Newly launched product                 | `New arrival`                                                      |
| Premium range                          | `Premium collection`                                               |
| Black Friday campaign                  | `Black Friday`                                                     |
| Additional campaign discount label     | Use the approved Extra entry in `custom_features.extra_storefront` |

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

`custom_features.extra_storefront` uses the same existing metaobject type as
`custom_features.extra`:

- Owner: Product
- Type: `list.metaobject_reference`
- Referenced metaobject type: `extra`
- Metaobject display-name field: `name`
- `name` type: `single_line_text_field`

### Current Storefront usage, 2026-11-05

The middleware contains 523 non-deleted International product mappings with a
Shopify ID and an Extra Storefront assignment: 375 with `-30% Extra`, 63 with
`-40% Extra`, and 85 with `-50% Extra`. These are not published/in-stock counts.
All four standard entries (`-20%`, `-30%`, `-40%`, `-50% Extra`) exist and were
`ACTIVE`. The four badge metafield definitions and both shared metaobject
definitions allow `PUBLIC_READ`.

Storefront labels are curated references, not the whole Extra catalog. Do not
hardcode percentages, infer labels from banners, or render all metaobjects of
type `extra`. No separate `extra_storefront` metaobject type is needed.

### Historical internal Extra usage, 2026-08-12

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

Keep the original `extra` and `promotion` fields for their internal/feed
purposes. Assign public Extra labels to `custom_features.extra_storefront` and
campaign/merchandising labels to `custom_features.promotion_storefront`.

### Independent PDP campaign banners

`registered_discount` and `discount_banner` blocks in `main-product` depend on
configured collection membership. Their copy and login requirements do not
come from the badge metafields. For example, GANEK had no Extra Storefront value
on 2026-11-05 but displayed a collection-driven Black Friday -20% banner.
Adding an Extra badge must not alter those blocks, prices, or automatic discount
eligibility. A label advertises a campaign; cart/checkout allocations remain
authoritative.

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

| Surface                                                | Sale source                                            | Sale text                         | Promotion source                                        | Limit/order                                                  | Standardized?             |
| ------------------------------------------------------ | ------------------------------------------------------ | --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------ | ------------------------- |
| Collection/search/related/recent/feature/collage cards | Product-level compare-at price                         | `-N%` at 15%+, otherwise `SALE`   | `extra_storefront`, then `promotion_storefront`         | Discount, all public Extra, first 2 public Promotions; wraps | Yes, canonical shared row |
| Standard/Northkit PDP                                  | Product-level compare-at badge; selected-variant price | Same shared badge                 | Same public fields                                      | Same order, limits, and wrapping as cards                    | Yes, canonical shared row |
| Maintained parfum PDP                                  | Same as standard PDP                                   | Same shared badge                 | Same public fields                                      | Same order, limits, and wrapping as cards                    | Yes, canonical shared row |
| Featured Product                                       | Dawn price state                                       | Localized `Sale`/`Sold out`       | None                                                    | Dawn behavior                                                | No                        |
| NF Flow Parameters                                     | None                                                   | NF Flow name                      | `custom_features.nf_flow_series`                        | All references, Parameters-gated                             | Separate PDP-only feature |
| Outdoor Sale EComposer cards                           | Generated compare-at logic                             | Textual sale plus monetary saving | Exact `product.tags` allowlist                          | Generated order                                              | No                        |
| EComposer scent PDP/cards                              | Generated selected-target logic                        | `N% OFF`, sale, sold out          | Hardcoded label, raw EComposer metafield, or exact tags | Generated order                                              | No                        |

## Campaign configuration playbook

### Scenario 1: Visible campaign label only

Use this when prices should remain unchanged but a merchandising label should
appear.

1. Assign an approved `promotion` metaobject to
   `custom_features.promotion_storefront`.
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
2. Assign the campaign's `promotion` metaobject to Promotion Storefront.
3. If an EComposer Outdoor Sale page is also involved, assign its required
   seasonal product tag, for example `sale-summer`.
4. Test variants with the lowest and highest prices.

Expected canonical order:

```text
-N% or SALE | optional Extra labels | campaign label | optional second promotion
```

The promotion label and price discount are independent. Both must be configured
if both should appear.

### Scenario 3: Extra Shopify automatic discount

If Shopify applies an automatic discount only in cart or checkout, setting a
public Extra label such as `-20% Extra` communicates the campaign but does not
change the displayed product price.

Current safe workflow:

1. Configure and test the real Shopify automatic discount.
2. Assign the approved `-20% Extra` entry to
   `custom_features.extra_storefront` and the campaign name, if needed, to
   `custom_features.promotion_storefront`.
3. Do not promise a calculated PDP/card price unless the automatic preview
   feature is formally configured and tested.
4. Remove the label when the automatic discount ends.

Avoid using `custom_features.extra` for this purpose, even though legacy
discount-like values exist there.

### Scenario 4: Outdoor Sale generated page plus canonical storefront

To keep both systems aligned under the current architecture:

1. Add the correct EComposer/selection product tag, such as `sale-summer`,
   `sale-autumn`, or `sale-winter`.
2. Assign the approved campaign promotion to Promotion Storefront.
3. Set valid compare-at prices if a sale percentage and strikethrough price
   should be visible.
4. Confirm the generated Outdoor Sale page and a canonical collection card.

The historical 2026-08-12 Admin snapshot showed 12 products with a seasonal sale tag but no
`Outdoor Sale` promotion. Those products can participate in tag-based campaign
logic without showing the canonical `Outdoor Sale` label.

### Scenario 5: Bestseller, new arrival, or last pieces

Assign the corresponding promotion after the main campaign label:

```text
1. Outdoor Sale
2. Bestsellers, New arrival, Last pieces, or Premium collection
```

This is an illustrative order, not a hardcoded name priority. The current
renderer always follows the Promotion Storefront reference list.

## Recommended governance

### Data ownership

Use each data source for one responsibility:

| Data source                                             | Intended responsibility                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Variant Price and Compare-at price                      | Actual displayed markdown pricing and automatic sale badge                                                 |
| `custom_features.promotion_storefront`                  | Public campaign and merchandising labels; up to two nonblank entries                                       |
| `custom_features.extra_storefront`                      | Public Extra labels; separate from the promotion limit                                                     |
| `custom_features.promotion` and `custom_features.extra` | Internal/feed metadata; never fallback badge sources                                                       |
| `custom_features.nf_flow_series`                        | NF Flow product-series classification                                                                      |
| Product tags                                            | Collection/filter/import/EComposer selection only, unless a generated page explicitly requires a tag badge |
| Shopify Discounts                                       | Actual automatic discount behavior in cart/checkout                                                        |
| `custom.automatic_discount_preview`                     | Optional deterministic storefront preview after formal rollout                                             |

### Promotion naming rules

- Use customer-facing wording.
- Keep labels short enough for product cards.
- Use one concept per label.
- Use approved, explicit Extra labels such as `-20% Extra` in Extra Storefront
  and campaign names such as `Black Friday` in Promotion Storefront.
- Do not put category names, colors, or internal campaign codes in Promotion.
- Do not create duplicate metaobjects with only capitalization differences.
- Translate the metaobject field rather than cloning per-language labels.

### Campaign launch checklist

- [ ] Actual Shopify prices or discounts are configured and tested.
- [ ] The correct promotion metaobject is assigned.
- [ ] Public Extra references are assigned to Extra Storefront, if applicable.
- [ ] Promotion reference order is correct.
- [ ] Required EComposer product tag is assigned, if the campaign uses a
      generated page.
- [ ] Compare-at price is greater than Price for every intended sale variant.
- [ ] Products with mixed sale and regular variants are manually verified.
- [ ] Card is checked on collection and search.
- [ ] PDP is checked before and after changing variants.
- [ ] Sold-out behavior is checked.
- [ ] Mobile wrapping is checked with Extra plus two Promotions; long single
      labels remain bounded and have a complete title attribute.
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

## Import safety and outstanding mappings

The 2026-11-05 import contained 532 catalogs. Nine had no International
`store_product_codes` mapping: MI-41821PRO, MI-4352PRO, NO-3101OR, NO-3572SNW,
NO-3575SNW, NO-3652SNW, NO-4267OR, NO-4652SNW, and TR-3374SII. Confirm that these
products should exist in International before creating mappings or retrying
only those rows. Reimporting the full file cannot create missing mappings.

The backend importer must scope replacement/deletion by the specific metafield
definition. Internal and Storefront fields share metaobject definitions, so
scoping only by metaobject type can remove sibling-field assignments. Fix that
scope and cover both field pairs before another import. Do not create duplicate
Extra entries or a separate Storefront metaobject type.

## Validation and legacy parity

`tests/product-badge-row-render.test.js` executes the real shared Liquid source
with LiquidJS, using a stub only for the unchanged pricing-badge dependency.
It covers field isolation, both contexts, blank names, ordering, independent
promotion limits, escaping, and retention of pricing-badge markup. Source
contracts protect shared call sites, wrapping, and variant-refresh integration.
These are local tests, not Shopify runtime or visual preview verification.

Legacy EN samples showed `Bestsellers` before `Black Friday`, unlike Shopify's
stored order, and no Extra badges on those samples. Neither a legacy Extra
priority nor a hard total badge cap was established. The canonical contract
above is an explicit Shopify design, not a claim of exact legacy parity.

Do not use `shopify theme console` as a supposedly read-only check: it can
create a Liquid Console theme and upload support assets. Remote preview or
runtime probes that create/upload a theme require separate authorization.

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
