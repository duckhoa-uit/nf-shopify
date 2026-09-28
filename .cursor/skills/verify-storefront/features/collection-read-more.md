# Collection Read more

On a collection with a description, the shopper reads a one-line excerpt beside the title and opens the full description under that title. The page stays put.

## Sub-features

- `read-more-present` shows the excerpt and the Read more button when the collection has a description.
- `read-more-expand` opens the full description under the title without changing the URL hash or scroll position.
- `read-more-collapse` hides that description and shows the excerpt again.
- `read-more-absent` renders no Read more button when the collection description is blank.

## How to get to it (user POV)

- Open a collection that has a description, such as Pánske oblečenie - Bundy.
- Use the underlined Read more control in the collection title row. It is on the page at mobile and desktop widths.
- A collection with no description has no control. The empty footer anchor is absent.

## Driving it with agent-browser

Preconditions:

- `doctor.sh` passed for this `THEME_ID` on an unpublished international draft.
- Viewport is 1400x900.
- The page is `https://northfinder.sk/collections/panske-oblecenie-bundy` with `preview_theme_id` restored.

- **Open the collection.** Run `agent-browser --session verify-storefront open "https://northfinder.sk/collections/panske-oblecenie-bundy?preview_theme_id=$THEME_ID"`, then `agent-browser --session verify-storefront wait --load load`, then `bash .cursor/skills/verify-storefront/scripts/restore-preview.sh "$THEME_ID"` and `bash .cursor/skills/verify-storefront/scripts/doctor.sh "$THEME_ID"`. The heading contains the collection title and `[data-collection-read-more]` is visible.
- **Record the closed state.** Run `bash .cursor/skills/verify-storefront/scripts/capture-state.sh /opt/cursor/artifacts/verify-storefront/read-more-before.json`. `ariaExpanded` is `false` and `panelHidden` is true. Plain `agent-browser eval` wraps the value in a quoted string. Use `capture-state.sh`, which calls `eval --json`.
- **Expand.** Run `agent-browser --session verify-storefront click "[data-collection-read-more]"`. Save the measurement with `bash .cursor/skills/verify-storefront/scripts/capture-state.sh /opt/cursor/artifacts/verify-storefront/read-more-after-open.json /opt/cursor/artifacts/verify-storefront/read-more-before.json` and `agent-browser --session verify-storefront screenshot /opt/cursor/artifacts/verify-storefront/read-more-open.png`. The second argument adds `scrollDelta`. Hash is empty, `scrollDelta` is 0, `ariaExpanded` is `true`, the preview is hidden, and the panel is visible under the title.
- **Collapse.** Click `[data-collection-read-more]` again. Save `read-more-after-close.json` with `capture-state.sh`. `ariaExpanded` is `false`, the panel is hidden, and the preview is visible.
- **Blank description.** Open `https://northfinder.sk/collections/panske-oblecenie?preview_theme_id=$THEME_ID`, restore the param, and run doctor. `[data-collection-read-more]` is absent and `#collection-description-full` is absent.

## Gotchas

- The open panel must start below the title at 1600px, not only at 1400px. `max-width` on the flex item lets the panel share the title row once the row is wider than the title plus that cap.
- Below 750px the button is its own row under the title, and the excerpt or the open paragraph sits under that button. It does not share a line with the title or the excerpt. The button's box is the same in both states.
- The primary domain redirect removes `preview_theme_id`, including after `restore-preview.sh` re-opens the collection URL. `location.href` can omit the param while `Shopify.theme.role` is still `unpublished`. Run `doctor.sh` before measuring.
- The full description still exists after the product grid when the description is not blank. That block is not the click target.
- The Slovak label is `blogs.article.read_more` ("Čítať viac"). The English label is "Read more".
- Wait for `--load load`. Analytics never reaches `networkidle`.
