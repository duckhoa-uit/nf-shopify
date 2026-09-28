# Cart drawer

The shopper opens the cart from the header icon.

## Sub-features

- `cart-open` opens the cart drawer from the header.
- `cart-empty` shows the drawer when the cart has no lines.

## How to get to it (user POV)

- Choose the bag icon in the header.

## Driving it with agent-browser

Preconditions:

- Doctor passed on the unpublished international draft.
- The header is visible.

- **Open.** Run `agent-browser --session verify-storefront click "#cart-icon-bubble"`. `#CartDrawer` is visible.
- **Proof.** Screenshot `/opt/cursor/artifacts/verify-storefront/cart.png`. The drawer is open.

## Gotchas

- Adding a line from the product page changes the drawer contents. Prove the empty drawer before adding, or record the line count you expect.
- The overlay is `#CartDrawer-Overlay`. A click on the overlay closes the drawer.
