# Northfinder storefront verification map

This directory is the maintained source for verifying shopper-facing behavior on the international Northfinder storefront. Read the index, then use the matching feature file.

## Baseline preconditions

- Push only with `bash .cursor/skills/verify-storefront/scripts/push-draft.sh`. The store is `sportfinder-international.myshopify.com`.
- `THEME_ID` is the id in `/opt/cursor/artifacts/verify-storefront/theme-id.txt`.
- `agent-browser` session name is `verify-storefront`.
- Viewport is 1400x900 before any control that is desktop-only.
- Run `doctor.sh` and require `Shopify.theme.id` and role `unpublished`.
- Never measure the live theme. Never push Czech, Romania, or Perfumes.

## Driving conventions

- Start from the doctor-passed draft.
- After every navigation, run `restore-preview.sh` and `doctor.sh` before asserting.
- Prefer `[data-collection-read-more]`, `#Search-In-Modal`, `#FacetsWrapperDesktop`, `#cart-icon-bubble`, and `button[name="add"]`.
- Wait with `agent-browser wait --load load`. Do not wait for `networkidle`.
- Proof artifacts stay in `/opt/cursor/artifacts/verify-storefront/`.

## Proof and skip reporting

- Capture the click and the resulting state, not only a screenshot.
- Record `THEME_ID`, the URL, and `Shopify.theme.role` with every proof.
- Report an unreachable path with the command and the failed doctor output.
- Do not mark a skipped entry point verified through a different path.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then exactly four H2 sections. `Sub-features`, `How to get to it (user POV)`, `Driving it with agent-browser`, and `Gotchas`.

## Features

- [Collection Read more](./collection-read-more.md) opens and closes the collection description under the title.
- [Collection filters](./collection-filters.md) shows the desktop filter column on a collection.
- [Header search](./header-search.md) types a query into the header search field.
- [Product add to cart](./product-add-to-cart.md) reaches a product and the add-to-cart button.
- [Product gallery video](./product-gallery-video.md) places a square clip second and opens the 9:16 reel fullscreen.
- [Cart drawer](./cart-drawer.md) opens the cart from the header icon.
