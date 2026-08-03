# LP-1001 Parfum Pilot Evidence

## Scope

This package records the before/after evidence for the **Active Fresh `LP-1001`** pilot on `sportfinder-international.myshopify.com`.

- Store GID: `gid://shopify/Shop/100928389452`
- Draft theme: `Parfum LP-1001 Pilot`
- Draft theme ID: `203041505612`
- Verification date: `2026-08-03`
- Products: `LP-10011SP` through `LP-10015SP`
- Expected order: `5ML`, `50ML`, `150ML`, `250ML`, `500ML`

This is an internal evidence package. It intentionally includes Product/Variant GIDs, SKUs, and inventory quantities. It excludes Shopify credentials, tokens, cookies, auth headers, customer data, and app access-scope output.

## Result

**17/17 machine-readable assertions passed.**

| Area                     | Before                                              | After                                                         | Result |
| ------------------------ | --------------------------------------------------- | ------------------------------------------------------------- | ------ |
| Canonical data model     | No `parfum_group` record or product back-references | One `lp-1001` group and 5/5 product back-references           | PASS   |
| Legacy compatibility     | `custom.product_in_group` empty on 5/5 products     | 5/5 products contain the same ordered projection              | PASS   |
| Product order            | No group ordering                                   | `5ML → 50ML → 150ML → 250ML → 500ML`                          | PASS   |
| Idempotency              | Migration required                                  | Dry-run reports `hasChanges: false` and `No changes required` | PASS   |
| Core product fields      | Baseline snapshot                                   | Byte-equivalent normalized core snapshot                      | PASS   |
| Draft theme              | N/A                                                 | Theme `203041505612` remains unpublished                      | PASS   |
| UI current state         | No selectable Parfum group                          | 150ML is current with four sibling links                      | PASS   |
| Cross-product navigation | Not available                                       | 150ML → 250ML changes URL and current state                   | PASS   |
| Add to cart              | Existing control                                    | Present before and after navigation                           | PASS   |
| Verification rollback    | Products unpublished/default template               | Products restored to unpublished/default template             | PASS   |

## Before

The before snapshot proves:

- No product had `custom.parfum_group`.
- No product had `custom.product_in_group`.
- All five products were unpublished from the Online Store.
- All five products used the default product template.
- Product IDs, Variant IDs, SKUs, inventory, and availability were captured as the immutable comparison baseline.

See [`raw/before-products.json`](raw/before-products.json).

## After

The after snapshot proves:

- Metaobject definition `parfum_group` exists with Storefront `PUBLIC_READ` access.
- Product metafield definition `custom.parfum_group` exists as a `metaobject_reference`.
- Legacy metafield definition `custom.product_in_group` remains a `list.product_reference`.
- Canonical group `lp-1001` exists as `gid://shopify/Metaobject/2999983505740`.
- Its product list is ordered by dosage: `5ML`, `50ML`, `150ML`, `250ML`, `500ML`.
- All five products point to the canonical group.
- All five products retain the same ordered list in the legacy field.

See [`raw/after-state.json`](raw/after-state.json) and [`verification/group-membership.json`](verification/group-membership.json).

## Core product invariants

The normalized before and after core snapshots have the same SHA-256 digest:

```text
c0d720a1501a048a61c69bbdbccc4d51133c242d20c3dd4ce343684f02894161
```

The following fields are unchanged:

- Product GIDs
- Variant GIDs
- Product status
- SKUs
- Inventory quantities
- Variant availability
- Online Store publication state after rollback
- Product template after rollback

Shopify serializes the default template as `null` in the original export and `""` in the final query. The comparison normalizes both values to `null` before hashing.

See [`verification/core-before.json`](verification/core-before.json), [`verification/core-after.json`](verification/core-after.json), and [`comparison.json`](comparison.json).

## Idempotency

A fresh read-only dry-run after migration returned:

```text
needsDefinition: false
needsMetafieldDefinition: false
needsGroup: false
productsNeedingSync: []
hasChanges: false
No changes required
```

See [`verification/idempotency-dry-run.txt`](verification/idempotency-dry-run.txt).

## UI evidence

The picker was verified on unpublished draft theme `203041505612` during a temporary publication/template verification window.

### 150ML initial state

The Orca accessibility snapshot records:

```text
- group "Size"
  - link "5ML"
  - link "50ML"
  - StaticText "150ML"
  - link "250ML"
  - link "500ML"
- button "ADD TO CART"
```

The current size is deliberately non-interactive while the four siblings are links.

See [`verification/browser-150ml.json`](verification/browser-150ml.json) and the exact server-rendered excerpt in [`verification/rendered-picker-150ml.html`](verification/rendered-picker-150ml.html).

### After navigating to 250ML

Orca clicked the 250ML link from the 150ML page. The destination snapshot records:

```text
- group "Size"
  - link "5ML"
  - link "50ML"
  - link "150ML"
  - StaticText "250ML"
  - link "500ML"
- button "ADD TO CART"
```

The URL changed to the `LP-10014SP` 250ML product and the current/non-link state moved from 150ML to 250ML.

See [`verification/browser-navigation.json`](verification/browser-navigation.json) and [`verification/browser-250ml-after-navigation.json`](verification/browser-250ml-after-navigation.json).

All five PDPs were also asserted during the verification window to have exactly one current size and the other four sibling links. Those session results are recorded in [`verification/five-pdp-session-assertions.json`](verification/five-pdp-session-assertions.json). The 150ML HTML and 150ML/250ML browser snapshots are the retained direct UI artifacts.

## Rollback proof

After UI verification:

- All five products have `publishedAt: null`.
- All five products have `onlineStoreUrl: null`.
- All five products are back on the default template.
- Draft theme `203041505612` remains `unpublished`.
- Canonical and legacy group metadata remain intentionally populated.

See [`raw/after-state.json`](raw/after-state.json) and [`verification/draft-theme-state.json`](verification/draft-theme-state.json).

## Screenshot limitation

Orca's `Page.captureScreenshot` timed out even after activating and focusing both retained browser tabs. The local Chromium launcher was also unavailable because its application target was missing. No fabricated or reconstructed screenshot is included.

The retained UI evidence therefore consists of:

1. Orca accessibility-tree snapshots before and after navigation.
2. The exact server-rendered 150ML picker HTML captured from draft theme `/cdn/shop/t/10`.
3. The recorded successful Orca click and destination URL.
4. Session assertions for all five PDPs.

## File index

- [`summary.json`](summary.json): review summary and aggregate result.
- [`comparison.json`](comparison.json): explicit changed and unchanged field matrix.
- [`raw/before-products.json`](raw/before-products.json): full internal before snapshot.
- [`raw/after-state.json`](raw/after-state.json): full internal after/rollback state, excluding auth scopes.
- [`verification/assertions.json`](verification/assertions.json): 17 machine-readable assertions.
- [`verification/group-membership.json`](verification/group-membership.json): canonical and legacy membership per product.
- [`verification/core-before.json`](verification/core-before.json): normalized core baseline.
- [`verification/core-after.json`](verification/core-after.json): normalized final core state.
- [`verification/idempotency-dry-run.txt`](verification/idempotency-dry-run.txt): fresh read-only convergence check.
- [`verification/browser-150ml.json`](verification/browser-150ml.json): initial 150ML accessibility evidence.
- [`verification/browser-250ml-after-navigation.json`](verification/browser-250ml-after-navigation.json): destination 250ML accessibility evidence.
- [`verification/browser-navigation.json`](verification/browser-navigation.json): click/destination and screenshot limitation record.
- [`verification/rendered-picker-150ml.html`](verification/rendered-picker-150ml.html): exact captured SSR picker markup.
- [`verification/five-pdp-session-assertions.json`](verification/five-pdp-session-assertions.json): recorded assertions for all five size PDPs.
- [`verification/draft-theme-state.json`](verification/draft-theme-state.json): final unpublished draft-theme state.
