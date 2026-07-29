# Parfum Product Data Audit

**Audit date:** 2026-07-29
**Store:** `sportfinder-international.myshopify.com`
**Theme:** `nf-shopify/store/international`

## Executive summary

The International store currently contains perfume products, but none of them are connected to the Parfum PDP implementation. The theme expects products assigned to the `parfums` product template and populated with the `custom.product_in_group` product-reference list. The current catalog has neither configuration.

As a result, perfume product URLs tested on the public storefront return 404 pages instead of the Parfum PDP, and no size selector can render.

## Catalog findings

Shopify Admin API read-only audit results:

- Total products in the catalog: **2,581**
- Products using the default product template: **2,579**
- Products using the `northkit` template: **2**
- Products using the `parfums` template: **0**
- Products using the legacy `ecom-scent-product` template: **0**
- Products with a populated `custom.product_in_group`: **0**
- Products with a public Online Store URL among the 56 perfume-title matches: **0**
- Products with a non-null `publishedAt` among the 56 perfume-title matches: **0**

The product-level metafield definition does exist:

- Namespace/key: `custom.product_in_group`
- Type: `list.product_reference`
- Purpose expected by the theme: link all products representing the same fragrance at different sizes

The existing product size metafield is defined as:

- Namespace/key: `custom.size`
- Type: `list.metaobject_reference`

## Perfume products found

The title-based audit found **56 active products** containing `perfume` or `laundry perfume` in the title.

Breakdown:

- **24 individual size products**
- **32 gift sets, trial sets, or multipacks**

Individual fragrance families currently present:

| Fragrance | Sizes found |
| --- | --- |
| Active Fresh | 5ML, 50ML, 150ML, 250ML, 500ML |
| Adventure Mist | 5ML, 50ML, 150ML, 250ML, 500ML |
| Classic Fresh | 5ML, 50ML, 150ML, 250ML, 500ML |
| Outdoor Flow | 5ML, 50ML, 150ML, 250ML, 500ML |
| Pure Essence | 50ML, 150ML, 250ML, 500ML |

Pure Essence currently has no 5ML individual product in the audited catalog. This should be confirmed as intentional before creating or linking another product.

Several products have duplicated or polluted handles, for example handles containing the product name twice. Handles are not suitable as the primary source of the size label, but they should still be reviewed for SEO and canonical URL quality.

## Required data contract for the Parfum PDP

For every individual-size product assigned to the Parfum PDP:

1. Assign the product template suffix `parfums`.
2. Publish the product to the Online Store sales channel.
3. Keep one native Shopify product per fragrance/size combination.
4. Ensure the native product option named `Size` contains the actual dosage value, such as `5ML`, `50ML`, `150ML`, `250ML`, or `500ML`.
5. Populate `custom.product_in_group` on every product in the same fragrance family.
6. Each reciprocal group should contain the complete set of individual products for that fragrance, including the current product.
7. Keep group ordering deterministic, preferably ascending by dosage.
8. Populate `custom.product_in_group_caption` if dosage cards or localized usage captions are required by the planned PDP metafield refactor.
9. Do not place gift sets or multipacks into the individual fragrance size group unless they are intentionally selectable as a size/product format.

Example expected group for Active Fresh:

```text
5ML -> 50ML -> 150ML -> 250ML -> 500ML
```

Each of the five products should reference the same five product records in `custom.product_in_group`.

## Theme/data interaction

The Parfum variant picker is implemented in `snippets/product-variant-picker-parfums.liquid` and is rendered only by `sections/main-product-parfums.liquid`.

The picker does not discover related products automatically. It reads only:

```liquid
product.metafields.custom.product_in_group.value
```

If that metafield is empty, the selector is intentionally omitted. Product title matching, collection matching, product tags, and SKU matching are not fallbacks. Therefore assigning the template alone is not enough to make the size options appear.

## Public storefront verification

The following representative product URLs were opened with Orca browser:

- Active Fresh 150ML: `/products/lp-10013sp-laundry-perfume-active-fresh-150ml`
- Adventure Mist 150ML: `/products/lp-10033sp-laundry-perfume-adventure-mist-150ml`
- Outdoor Flow 150ML: `/products/lp-10023sp-laundry-perfume-outdoor-flow-150ml`
- Classic Fresh 150ML: `/products/lp-10043sp-laundry-perfume-classic-fresh-150ml`
- Pure Essence 150ML: `/products/9224-lp-10053sp-laundry-perfume-active-fresh-5-ml-skplen-active-fresh-5`

All returned:

- `404 Not Found`
- No `<product-info>` element
- No `.parfum-product` layout
- No `.product-variant-picker-parfums-metafield` element
- No size radio inputs

The 404 result is consistent with the Admin API result that these products are not published to the Online Store.

## Backend repository audit status

The requested backend repository path was:

```text
/Users/macbook/orca/workspaces/nf-shopify/nf-shopify-be
```

That repository is not present in the current workspace. The parent directory currently contains only `store-international-2`. Because the backend source is unavailable, this audit cannot verify:

- product import payload construction
- one-product-per-size creation logic
- native Shopify `Size` option mapping
- `custom.size` mapping
- `custom.product_in_group` population
- template suffix assignment
- Online Store publication/channel mutations
- reciprocal group generation
- product handle generation

The missing backend repository is a blocker for identifying whether the issue originates in the importer, a data transformation job, or a post-import Shopify setup step. The backend must be mounted or provided at its actual local path before backend file/line citations can be added.

## Recommended remediation order

1. Inspect the backend importer or data-sync job once the backend repository is available.
2. Decide whether Pure Essence should receive a 5ML product.
3. Normalize individual perfume product records and exclude sets/multipacks from size groups.
4. Assign the `parfums` template suffix to the individual perfume products.
5. Populate reciprocal `custom.product_in_group` lists in ascending size order.
6. Add `custom.product_in_group_caption` where dosage usage cards require it.
7. Publish the individual products to the Online Store.
8. Verify every fragrance family on a preview/live theme with Orca browser.
9. Confirm that selecting each size navigates to the corresponding product and preserves the correct localized storefront URL.
