# Product add to cart

The shopper opens a product from a collection and sees the add-to-cart button.

## Sub-features

- `pdp-open` opens a product page from a collection card.
- `pdp-add` shows the add-to-cart button for an in-stock variant.

## How to get to it (user POV)

- From a collection, choose a product card.
- On the product page, choose size if required, then use the add-to-cart button.

## Driving it with agent-browser

Preconditions:

- Doctor passed on the unpublished international draft.
- A collection grid is on screen and `preview_theme_id` is restored.

- **Open a product.** Run `agent-browser --session verify-storefront click "a[href*='/products/']"` on the collection. Wait `--load load`, then restore the preview param and run doctor. The URL path contains `/products/`.
- **See add to cart.** `button[name="add"]` is present. Its id starts with `ProductSubmitButton-`.
- **Proof.** Screenshot `/opt/cursor/artifacts/verify-storefront/product.png` with the button visible.

## Gotchas

- Some variants are sold out and the button is disabled. Pick another size or another product before treating that as a missing button.
- A product click drops `preview_theme_id`. Restore it before reading `Shopify.theme`.
- This recipe stops at the visible button. Completing a purchase is a later step and needs a variant that is in stock.
