# Settings backups (per store)

Snapshots of each store's live `config/settings_data.json`. Used for disaster
recovery and historical audit. **Not deployed back to any store** — this
folder is read-only relative to `shopify theme push`.

## When to refresh

- Before pushing a code-only release that touches `config/settings_schema.json`
  (so app embed UUIDs are captured in case rollback is needed).
- Weekly during active merchant edit cycles.
- After every major theme version change on a store.

## How to refresh

```bash
pnpm settings:backup:international   # snapshot Intl live theme
pnpm settings:backup:czech           # snapshot CZ live theme
pnpm settings:backup:romania         # snapshot RO live theme
pnpm settings:backup:perfumes        # snapshot Perfumes live theme

pnpm settings:backup:all             # all four in sequence
```

Then commit the diffs:

```bash
git add config/backups/
git commit -m "snapshot(settings): all stores $(date +%Y-%m-%d)"
```

## How to restore (rare, manual)

1. Copy the snapshot back over the live file:
   ```bash
   cp config/backups/settings_data.czech.json /tmp/restore-cz/config/settings_data.json
   ```
2. Push only that file to the target store:
   ```bash
   shopify theme push -e czech --only config/settings_data.json --live --path /tmp/restore-cz
   ```
3. Verify in Theme Editor.

**Important:** Restoring overwrites all merchant edits made after the snapshot
date. Always confirm with the merchant before running a restore.

## Why this isn't auto-deployed

Each store's `config/settings_data.json` contains store-specific app embed
block UUIDs that exist only on that store. Pushing one store's file to another
breaks the app blocks. See `shopify.theme.toml` — `ignore` rule prevents
`config/settings_data.json` from being pushed by `shopify theme push`.
