# Header search

The shopper types into the header search field and gets predictive results.

## Sub-features

- `search-focus` focuses the header search field.
- `search-type` shows a predictive result list after a query.

## How to get to it (user POV)

- On a wide screen, use the search field in the header.
- Submit the field to open the search results page.

## Driving it with agent-browser

Preconditions:

- Doctor passed on the unpublished international draft.
- Viewport is 1400x900.

- **Focus.** On the storefront home with `preview_theme_id` restored, run `agent-browser --session verify-storefront click "#Search-In-Modal"`. The field is the combobox named by the search placeholder.
- **Type.** Run `agent-browser --session verify-storefront fill "#Search-In-Modal" "jacket"`. `[data-predictive-search]` becomes visible or the results region gains options.
- **Proof.** Screenshot `/opt/cursor/artifacts/verify-storefront/search.png` while the query text is in the field.

## Gotchas

- The header search block is `hidden` below `lg`. A phone viewport does not show `#Search-In-Modal`.
- Predictive results wait on a network response. Wait for `[data-predictive-search]` rather than a fixed sleep alone.
- Do not wait for `networkidle`.
