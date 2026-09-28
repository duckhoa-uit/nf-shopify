---
name: verify-storefront
description: Verify the Northfinder international Shopify storefront in a real browser. Use when a change must be proven on the unpublished international draft via agent-browser and a preview_theme_id URL, including collection Read more, search, filters, product, and cart.
---

# Verify the Northfinder storefront

The surface is the international storefront in a browser. Local `shopify theme dev` is not the proof path. The myshopify host redirects to the primary domain and drops `preview_theme_id`. Czech, Romania, and Perfumes stores are out of scope.

## Launch

One unpublished draft on `sportfinder-international.myshopify.com` only. Never `pnpm push:*` and never `--allow-live` or `--publish`.

From the repo root:

```bash
bash .cursor/skills/verify-storefront/scripts/push-draft.sh "Draft - collection read more verify"
```

Ready when the script prints `THEME_ID=<id>` and writes `/opt/cursor/artifacts/verify-storefront/theme-id.txt`. The script uploads every theme file, including `config/settings_data.json`, then restores `ignore` in `shopify.theme.toml` before it exits. A failed push still restores that file.

`--unpublished` creates a new theme id on every run. To refresh a draft a shopper already has open, push that id with `--theme <id>` and no `--unpublished` or `--publish`. The role must stay `unpublished`.

Then open the draft. `agent-browser` is the CLI at `$HOME/.local/node_modules/.bin` after `npm install --prefix "$HOME/.local" agent-browser@0.38.1` and `agent-browser install`.

```bash
export PATH="$HOME/.local/node_modules/.bin:$PATH"
export AGENT_BROWSER_SESSION=verify-storefront
THEME_ID="$(cat /opt/cursor/artifacts/verify-storefront/theme-id.txt)"
agent-browser --session "$AGENT_BROWSER_SESSION" close || true
agent-browser --session "$AGENT_BROWSER_SESSION" set viewport 1400 900
agent-browser --session "$AGENT_BROWSER_SESSION" open "https://sportfinder-international.myshopify.com/?preview_theme_id=${THEME_ID}"
agent-browser --session "$AGENT_BROWSER_SESSION" wait --load load
bash .cursor/skills/verify-storefront/scripts/restore-preview.sh "$THEME_ID"
```

The Read more control is visible at every width. Check it at 390x844 and at 1600x900. A 1400px-wide window can hide the row bug: from about 1474px the open panel used to sit beside the title.

## Doctor

Run this before the first drive and again after any navigation that looks like the live theme.

```bash
bash .cursor/skills/verify-storefront/scripts/doctor.sh "$THEME_ID"
```

Pass means `Shopify.theme.id` equals `THEME_ID` and `Shopify.theme.role` is `unpublished`. A missing query param is not a failure by itself. A matching query param is not a pass by itself.

On `northfinder.sk`, opening a URL that already contains `preview_theme_id` still ends with that param stripped from `location.href` after `--load load`. Re-open with the param anyway, then trust `doctor.sh`. The unpublished theme stays on the session. `doctor.sh` reads `agent-browser --json eval` and writes `data.result` to `doctor.json`. Plain `eval` prints a quoted string and fails JSON parsing.

## Drive

Session name is `verify-storefront`. After every `open` or click that can change the URL, run `restore-preview.sh` and then `doctor.sh` before measuring.

Read `.cursor/skills/verify-storefront/features/README.md` and the feature file. Stable handles for the collection description control:

- `[data-collection-read-more]` button, `aria-expanded` `false` then `true`
- `[data-collection-description-preview]`
- `[data-collection-description-panel]`

A collection that has a description on the international store's Slovak market is `https://northfinder.sk/collections/panske-oblecenie-bundy`. Open that path with `preview_theme_id` set, then restore the param if the redirect strips it.

```bash
agent-browser --session "$AGENT_BROWSER_SESSION" open "https://northfinder.sk/collections/panske-oblecenie-bundy?preview_theme_id=${THEME_ID}"
agent-browser --session "$AGENT_BROWSER_SESSION" wait --load load
bash .cursor/skills/verify-storefront/scripts/restore-preview.sh "$THEME_ID"
bash .cursor/skills/verify-storefront/scripts/doctor.sh "$THEME_ID"
agent-browser --session "$AGENT_BROWSER_SESSION" wait "[data-collection-read-more]"
```

Click the button with `agent-browser click "[data-collection-read-more]"`. Do not use a hash link. Record `scrollY`, `location.hash`, `aria-expanded`, and whether the panel and preview are hidden. Click again and record the closed state.

## Evidence

Write proof under `/opt/cursor/artifacts/verify-storefront/`. Cleanup must not delete that directory.

A passing Read more proof contains all of these:

- `doctor.json` with the unpublished theme id
- `read-more-before.json` and `read-more-after-open.json` and `read-more-after-close.json` from the page, not from a unit test
- `read-more-open.png` taken while the panel is open, with the collection title still in view
- the open JSON shows `hash` empty, `scrollDelta` 0, `ariaExpanded` `true`, `panelHidden` false, `previewHidden` true

Drive the storefront a shopper sees. Do not call the toggle function from a fixture. Do not treat Theme Check as behavior proof.

## Cleanup

```bash
bash .cursor/skills/verify-storefront/scripts/cleanup.sh
```

That closes the `verify-storefront` browser session and restores `shopify.theme.toml` from the backup if a push was interrupted. It does not delete `/opt/cursor/artifacts/verify-storefront/` and it does not delete the unpublished theme. Leave the draft so the preview URL in the proof still resolves.

Never `pkill` Chrome by name. Never run `pnpm push:*`.

## Helpers

- `bash .cursor/skills/verify-storefront/scripts/push-draft.sh "Draft - collection read more verify"` uploads the full international theme and prints `THEME_ID`.
- `bash .cursor/skills/verify-storefront/scripts/restore-preview.sh <theme_id>` re-opens the current URL when `preview_theme_id` is missing or wrong.
- `bash .cursor/skills/verify-storefront/scripts/doctor.sh <theme_id>` writes `doctor.json` and exits non-zero when the page is not that unpublished theme. It reads `agent-browser --json eval` (`data.result`). Plain `eval` prints a quoted string and is not valid doctor input.
- `bash .cursor/skills/verify-storefront/scripts/capture-state.sh <output.json> [baseline.json]` writes the Read more measurement (`scrollY`, `hash`, `ariaExpanded`, hidden flags) from `--json eval`. The optional baseline adds `scrollDelta`.
- `bash .cursor/skills/verify-storefront/scripts/cleanup.sh` closes the session and restores `shopify.theme.toml`.
