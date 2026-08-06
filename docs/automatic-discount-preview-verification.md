# Automatic discount preview verification

Issue: [#38](https://github.com/duckhoa-uit/nf-shopify/issues/38)
Base: `store/international`
Implementation branch: `codex/issue-38-discount-preview`

## Implemented contract

- Source metafield: `custom.automatic_discount_preview`
- Payload version: `1`
- Preview outcome rendered by the theme: `EXACT_PRICE`
- Audience rules: `ALL`, `AUTHENTICATED_CUSTOMER`, `CUSTOMER_TAG`
- Value rules: `PERCENTAGE`, `FIXED_AMOUNT` with matching presentment currency
- Safe fallback: normal Shopify price for invalid, inactive, unsupported, quantity-dependent, currency-unresolved, or ambiguous data
- Surfaces: standard PDP, perfume PDP, and main product card
- Variant changes: existing server-rendered `product-info` price refresh
- Cart: unchanged, Shopify line allocations remain authoritative
- Kill switch: `settings.automatic_discount_preview_enabled`, default `true`

## Source-level matrix

| Matrix area | Case                                          | Expected                         | Automated evidence                         |
| ----------- | --------------------------------------------- | -------------------------------- | ------------------------------------------ |
| Customer    | Guest + `ALL`                                 | Preview shown                    | `tests/automatic-discount-preview.test.js` |
| Customer    | Guest + authenticated/tag rule                | Preview hidden                   | `tests/automatic-discount-preview.test.js` |
| Customer    | Logged-in customer + `AUTHENTICATED_CUSTOMER` | Preview shown                    | `tests/automatic-discount-preview.test.js` |
| Customer    | Matching customer tag                         | Preview shown                    | `tests/automatic-discount-preview.test.js` |
| Customer    | Missing/unknown customer data                 | Public-only fallback             | `tests/automatic-discount-preview.test.js` |
| Discount    | Percentage                                    | Exact minor-unit calculation     | `tests/automatic-discount-preview.test.js` |
| Discount    | Fixed amount, matching currency               | Exact minor-unit calculation     | `tests/automatic-discount-preview.test.js` |
| Discount    | Fixed amount, unresolved currency             | Normal price                     | `tests/automatic-discount-preview.test.js` |
| Discount    | Minimum quantity not met                      | Normal price                     | `tests/automatic-discount-preview.test.js` |
| Discount    | Unsupported audience/value                    | Normal price                     | `tests/automatic-discount-preview.test.js` |
| Discount    | Overlapping eligible rules                    | Normal price                     | `tests/automatic-discount-preview.test.js` |
| Lifecycle   | Scheduled or expired rule                     | Normal price                     | `tests/automatic-discount-preview.test.js` |
| Product     | Variant-specific payload                      | Selected variant price           | `tests/automatic-discount-preview.test.js` |
| Product     | Product fallback payload                      | Product rule price               | `tests/automatic-discount-preview.test.js` |
| Surface     | Standard PDP                                  | Shared component                 | `tests/automatic-discount-preview.test.js` |
| Surface     | Perfume PDP                                   | Shared component                 | `tests/automatic-discount-preview.test.js` |
| Surface     | Main PLP card                                 | Shared component                 | `tests/automatic-discount-preview.test.js` |
| Safety      | JS/variant refresh failure                    | Server-rendered baseline remains | `tests/automatic-discount-preview.test.js` |
| Release     | Kill switch disabled                          | Normal price                     | `tests/automatic-discount-preview.test.js` |

## Required live acceptance fixtures

These require an unpublished theme containing the sync job's metafields and access to the international storefront:

1. DAMIR guest: `€119.00 → €83.30`, `-30%`.
2. DAMIR logged-in: same result.
3. LADOVY guest: `€79.00`, no preview UI.
4. LADOVY verified registered customer: `€79.00 → €55.30`, only after the passwordless-session gate passes.
5. PATH eligible product after passwordless PATH login.
6. PEAK eligible product after passwordless PEAK login.
7. PATH/PEAK free shipping remains cart-only.
8. Every preview equals the final Shopify cart line price.

The live authenticated cases must be completed by the store owner or authorized QA user directly in isolated persistent browser profiles. No OTP, password, cookie, or session token belongs in this repository, PR, or evidence upload.

## Live QA status (nf-development)

- [x] Clean repository theme published as the dev-store live theme.
- [x] Guest `ALL` percentage preview on PDP and PLP.
- [x] Authenticated customer percentage preview on LADOVY.
- [x] `BON_path` and `BON_peak` tag previews on PDP.
- [x] Matching-currency fixed amount on PDP and PLP.
- [x] Fixed amount Shopify native cart parity.
- [x] Currency mismatch, lifecycle, quantity, unsupported, invalid, zero, oversized, and ambiguous fail-closed cases.
- [x] Variant-level precedence and product-level fallback.
- [x] Perfume template preview.
- [x] Kill switch live OFF and ON behavior.
- [x] Percentage native cart parity for DAMIR/LADOVY/PATH/PEAK.
- [x] Final QA resource restoration verified.

## Maintenance update requirement

A live maintenance update from 30% to 25% was verified. When the preview metafield and Shopify native automatic discount were updated together, PDP, PLP, and cart converged on `€89.25` / `25%`.

Updating only the native discount first produced a temporary mismatch: Shopify cart changed to `€89.25` while the Liquid preview still showed the old `€83.30`. Therefore the external sync/provisioning service must update the versioned preview metafield and the native discount as one coordinated/versioned release, then wait for storefront propagation before publishing the new customer-facing rule.

## Remaining scope boundaries

- The repository contains the Shopify theme, not the external sync/provisioning service. The service must own atomic/versioned updates of the native discount and preview metafield.
- Client-side multi-variant selector refresh was not separately replayed with multiple priced variants; server-rendered refresh and variant precedence were covered.
- Free shipping remains cart/checkout-authoritative and is outside the product-price preview contract.
- Pixel screenshot capture was blocked by local Chrome/CDP renderer failures; DOM assertions, Admin readbacks, cart allocations, and restoration checks are the authoritative attached evidence.
