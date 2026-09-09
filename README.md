# Northfinder Shopify Theme

[![Test Status](https://github.com/duckhoa-uit/nf-shopify/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/duckhoa-uit/nf-shopify/actions/workflows/test.yml)

A sophisticated e-commerce theme built on Shopify Dawn with extensive customizations for outdoor apparel. This theme uses advanced CSS architecture with Tailwind v4.0, unified design systems, and complex features like size fitting algorithms and international support.

**Multi-Store Architecture**: This repository serves multiple production stores with shared UI/features but isolated store-specific configurations.

## Table of Contents

- [Multi-Store Git Flow](#multi-store-git-flow)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Store Information](#store-information)
- [Testing](#testing)
- [Documentation](#documentation)

## Multi-Store Git Flow

A single branch (`store/international`) ships the theme to every EU store (International, CZ, RO, Perfumes). Per-store differences are handled at runtime by Shopify Markets context overlays — not by separate branches.

### Branch Structure

```
main                          → Integration branch, no direct store connection
store/international           → Active deployment branch for ALL EU stores
url-migration                 → Workstream branch for Cloudflare Worker + KV redirect tooling
feature/<x>                   → Short-lived, merges into store/international
```

### Store ↔ Environment Mapping

| Store          | Shopify Store                           | CLI Environment | Primary Locale   |
| -------------- | --------------------------------------- | --------------- | ---------------- |
| International  | sportfinder-international.myshopify.com | `international` | en + bg/de/hr/sl |
| Czech Republic | northfinder-cz.myshopify.com            | `czech`         | cs               |
| Romania        | northfinder-ro.myshopify.com            | `romania`       | ro               |
| Perfumes       | northfinder-parfums.myshopify.com       | `perfumes`      | en + multi       |

### Per-store overrides

Differences between stores live in market-context files inside the theme, not in git branches:

- `config/markets.json` — registry of market handles
- `config/settings_data.context.<market>.json` — per-market theme settings (contact info, brand)
- `templates/<x>.context.<market>.json` — per-market template overlay
- `sections/<x>.context.<market>.json` — per-market section overlay
- `locales/<lang>.json` — per-language translations

When a store loads the theme, Shopify auto-applies the overlay matching that store's primary market handle.

### Key principles

1. **One branch, many stores** — `store/international` is the source of truth for theme code.
2. **Data, not branches** — store-specific contact info, language picker links, FAQ copy live in context JSON.
3. **`main` is integration only** — never connected to a live store directly.
4. **Workstreams stay isolated** — `url-migration` (Cloudflare KV redirects) never merges into store branches.

## Development Setup

### Prerequisites

- Node.js 22.13 or newer
- Corepack (included with Node.js) to install the pinned pnpm version

```bash
corepack enable
corepack prepare pnpm@11.20.0 --activate
```

Shopify CLI is installed as a project dependency, so local scripts and CI use the same pinned version.

### Installation

```bash
# Clone the repository
git clone https://github.com/duckhoa-uit/nf-shopify.git
cd nf-shopify

# Install dependencies
pnpm install
```

### Environment Configuration

The repository is configured for multiple stores in `shopify.theme.toml`:

```toml
[environments.international]
store = "sportfinder-international.myshopify.com"

[environments.czech]
store = "northfinder-cz.myshopify.com"

[environments.romania]
store = "northfinder-ro.myshopify.com"

[environments.perfumes]
store = "northfinder-parfums.myshopify.com"
```

All environments connect to live stores. Use `shopify theme dev -e <env>` to work against an unpublished development theme automatically created by the CLI — your changes never touch the published theme until you explicitly `shopify theme push`.

## Development Workflow

### Feature development

```bash
# 1. Start from store/international
git checkout store/international
git pull origin store/international

# 2. Create feature branch
git checkout -b feature/<name>

# 3. Start dev server against the international store (safe — uses unpublished dev theme)
pnpm dev

# 4. Make changes, run tests
pnpm test

# 5. Commit + PR back into store/international
git push origin feature/<name>
```

### Test on a specific store

```bash
pnpm dev:czech      # northfinder-cz.myshopify.com
pnpm dev:romania    # northfinder-ro.myshopify.com
pnpm dev:perfumes   # northfinder-parfums.myshopify.com
```

Each command spins up an unpublished dev theme on that store. Useful for verifying market overlays (footer, language picker, FAQ) that only render with real `localization.market.handle`.

### Deploying to production

```bash
# Push code to a single store (live theme, settings_data.json preserved)
pnpm push:international
pnpm push:czech
pnpm push:romania
pnpm push:perfumes

# Or all four in sequence
pnpm push:all
```

`shopify.theme.toml` declares `ignore = ["config/settings_data.json"]` for every environment so `theme push` never overwrites merchant-managed settings or per-store app embed block UUIDs. Code (sections, snippets, locales, schema, market overlays) ships; `config/settings_data.json` stays untouched on each store.

For a draft preview without replacing the live theme:

```bash
shopify theme push -e <env> --unpublished --theme "QA <date>" --json
```

Do not use `pnpm push:*` for drafts (`--allow-live`). After push, verify with agent-browser: the CLI preview host (`*.myshopify.com?preview_theme_id=`) redirects to the primary domain and drops the query param. Re-open the redirected origin + path with `preview_theme_id` restored, and re-apply it after every navigation. Confirm `Shopify.theme.id` before measuring. See [`.cursor/references/draft-theme-agent-browser.md`](.cursor/references/draft-theme-agent-browser.md).

### Backing up live settings_data.json

Each store's live `config/settings_data.json` is NOT auto-committed to the repo (since it's `ignore`d). Snapshot manually before major releases or weekly:

```bash
pnpm settings:backup:all
git add config/backups/
git commit -m "snapshot(settings): all stores $(date +%Y-%m-%d)"
```

Snapshots land in `config/backups/settings_data.<env>.json` and are read-only relative to deploy. See `config/backups/README.md` for restore procedure.

## Store Information

### Active Stores

| Store          | Shopify Store                           | CLI Environment | Primary Locale        | Market handle |
| -------------- | --------------------------------------- | --------------- | --------------------- | ------------- |
| International  | sportfinder-international.myshopify.com | `international` | en (+ bg, de, hr, sl) | (default)     |
| Czech Republic | northfinder-cz.myshopify.com            | `czech`         | cs                    | `czech`       |
| Romania        | northfinder-ro.myshopify.com            | `romania`       | ro                    | `romania`     |
| Perfumes       | northfinder-parfums.myshopify.com       | `perfumes`      | en (+ multi)          | (default)     |

All stores deploy from the `store/international` branch.

## Testing

### Running Quality Checks

```bash
pnpm lint          # Theme Check + Prettier check for changed files
pnpm validate      # Vitest in CI mode
pnpm check         # Full local/CI quality gate
pnpm test          # Vitest watch mode
pnpm format        # Write Prettier formatting across the repository
```

Theme Check and Prettier skip app-managed output from EComposer, PageFly, Swym, BON Loyalty, and theMarketer. The ignore rules are intentionally path-specific in `.theme-check.yml` and `.prettierignore`, so first-party templates remain validated. Prettier is enforced incrementally on files changed from the Git base commit, avoiding a repository-wide rewrite of legacy formatting while preventing new drift.

### Manual Testing Checklist

Before merging to `store/international`:

- [ ] Test locally with `pnpm dev` (international store)
- [ ] If change affects market overlays: test with `pnpm dev:czech` and `pnpm dev:romania`
- [ ] Run `pnpm check`
- [ ] Verify no console errors on home, PDP, cart, checkout

Before publishing to a live store:

- [ ] `shopify theme push -e <env> --unpublished` first
- [ ] Smoke test the unpublished theme on the target store
- [ ] Verify market-specific footer / language picker / FAQ render correctly
- [ ] Then publish via Shopify admin

## Documentation

### Key Documentation Files

- **[AGENTS.md](AGENTS.md)** - Shopify theme development guidelines and best practices
- **[CLAUDE.md](CLAUDE.md)** - Repository overview and architecture
- **[/docs](docs/)** - Technical documentation for features and systems
  - [Design System](docs/design-system.md)
  - [CSS Variables Reference](docs/css-variables-reference.md)
  - [Size Fit System](docs/size-fit/)
  - [Performance Optimization](docs/performance-optimization-guide.md)

### Architecture Overview

- **Technology Stack**: Shopify Liquid, Tailwind CSS v4.0, Vanilla JavaScript, Vitest
- **Design System**: 150+ custom properties with unified design tokens
- **Key Features**: Size fit algorithm, predictive search, multi-currency, 25+ languages
- **Package Manager**: pnpm 11 (requires Node.js 22.13+)

## Development Commands

```bash
pnpm dev               # International dev server + Tailwind watcher
pnpm dev:czech         # CZ dev server + Tailwind watcher
pnpm dev:romania       # RO dev server + Tailwind watcher
pnpm dev:perfumes      # Perfumes dev server + Tailwind watcher

pnpm start             # International dev server only
pnpm start:czech       # CZ dev server only
pnpm start:romania     # RO dev server only
pnpm start:perfumes    # Perfumes dev server only

pnpm watch             # Tailwind CSS watcher only
pnpm lint              # Theme Check + Prettier check
pnpm validate          # Vitest (run once)
pnpm check             # Full quality gate used by CI
pnpm test              # Vitest (watch)
pnpm format            # Write Prettier formatting
```

### Manual Shopify CLI Commands

```bash
shopify theme dev  -e international            # sportfinder-international
shopify theme dev  -e czech                    # northfinder-cz
shopify theme dev  -e romania                  # northfinder-ro
shopify theme dev  -e perfumes                 # northfinder-parfums

shopify theme push -e <env> --unpublished      # Push as draft (safe)
shopify theme push -e <env> --allow-live       # ⚠️ Overwrite live theme
```

## Important Files

### Shared Files (merge from develop to all stores)

- `/assets/*` - CSS, JS, images, fonts
- `/sections/*` - Section templates
- `/snippets/*` - Reusable components
- `/layout/*` - Layout files
- `/locales/*` - Translation files (25+ languages)
- `config/settings_schema.json` - Theme customization schema

### Per-store overlays (auto-applied by Shopify at runtime)

- `config/settings_data.context.<market>.json`
- `templates/<x>.context.<market>.json`
- `sections/<x>.context.<market>.json`
- `config/markets.json` — market registry

Overlays apply when the loading store's primary market handle matches the file suffix (e.g. `*.context.czech.json` applies on northfinder-cz).

## Contributing

### Commit Message Conventions

Use conventional commits with store prefix for store-specific changes:

**Shared changes:**

```
feat: add new product card design
fix: resolve checkout button issue
style: update button hover states
docs: update README with new workflow
```

**Store-specific config sync:**

```
config(international): sync settings_data from live
config(czech): add cross-market language slot 2
config(romania): update contact email
config(perfumes): enable new payment method
```

### Pull Request Guidelines

- Use the PR template checklist
- Include screenshots for UI changes
- Test on target store(s) before requesting review
- Indicate if changes need to propagate to all stores

## Troubleshooting

### Common Issues

**Issue: live store edited theme settings, local out of sync**

```bash
shopify theme pull -e <env> --only config/settings_data.json
git add config/settings_data.json
git commit -m "config(<env>): sync settings_data from live"
```

**Issue: market overlay (footer/picker) doesn't render**

- Confirm the market handle exists in the store's admin (Settings → Markets) and matches the file suffix exactly (`czech`, `romania`, `slovenia`, ...).
- Confirm the locale you're testing is published on that store.
- Real `request.host` is required to test cross-market language picker — use `shopify theme push -e <env> --unpublished` and preview the live URL with `?preview_theme_id=`.
- **Issue: agent-browser landed on the live theme after draft preview** — primary-domain redirect strips `preview_theme_id`. Re-open `https://<redirected-origin><path>?preview_theme_id=<id>` and check `Shopify.theme.id`. Steps: [`.cursor/references/draft-theme-agent-browser.md`](.cursor/references/draft-theme-agent-browser.md).

## Support

For questions or issues:

- Review [AGENTS.md](AGENTS.md) for development guidelines
- Contact the development team

## License

Copyright (c) 2021-present Shopify Inc. See [LICENSE](/LICENSE.md) for further details.
