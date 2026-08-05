# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is the Northfinder Shopify theme - a sophisticated e-commerce theme built on Shopify Dawn with extensive customizations for outdoor apparel. The theme uses advanced CSS architecture with Tailwind v4.0, unified design systems, and complex features like size fitting algorithms and international support.

## Development Commands

### Primary Development

```bash
pnpm dev              # Start development server with hot reloading (Shopify dev + Tailwind watch)
pnpm start            # Start Shopify development server only
pnpm watch            # Start Tailwind CSS watcher only
```

### Testing & Quality

```bash
pnpm lint             # Run Theme Check and Prettier on changed files
pnpm validate         # Run Vitest in CI mode
pnpm check            # Run the complete local/CI quality gate
pnpm test             # Run Vitest in watch mode
pnpm format           # Format code with Prettier
```

### Per-store commands

```bash
pnpm dev              # dev: international
pnpm dev:czech        # dev: CZ
pnpm dev:romania      # dev: RO
pnpm dev:perfumes     # dev: Perfumes

pnpm push:international   # push code to int (settings_data.json ignored)
pnpm push:czech           # push code to CZ
pnpm push:romania         # push code to RO
pnpm push:perfumes        # push code to perfumes
pnpm push:all             # push to all 4 in sequence

pnpm settings:backup:all  # snapshot live settings_data.json from all 4 stores
```

**Note:** `config/settings_data.json` is `ignore`d in `shopify.theme.toml` for every env, so `theme push` never overwrites merchant-managed app embed UUIDs / brand settings. Each store manages its own `settings_data.json` via Theme Editor. Repo holds snapshots in `config/backups/settings_data.<env>.json` (refresh manually).

### Manual Commands

```bash
pnpm exec tailwindcss -i ./assets/tailwind.css -o ./assets/application.css --watch
shopify theme dev -e international
```

## Architecture

### Technology Stack

- **Shopify Liquid** with component-based architecture
- **Tailwind CSS v4.0** with 150+ custom properties and unified design tokens
- **Vanilla JavaScript** with HyperHTML templating for dynamic content
- **Vitest** for testing
- **pnpm 11** package manager (requires Node.js 22.13+)

### Design System Architecture

The theme uses a sophisticated design system with:

- **Unified Design Tokens**: Comprehensive variable system in `assets/application.css`
- **Component Token Mappings**: Consistent styling across all components
- **Dynamic Theme Variables**: Generated from Shopify theme settings
- **Static Design Tokens**: Brand colors, spacing scales, semantic colors

### Key Directories

- **`/assets`**: CSS, JS, fonts, SVG icons (200+ files)
- **`/sections`**: Liquid section templates (50+ files)
- **`/snippets`**: Reusable Liquid components (60+ files)
- **`/templates`**: Page templates including customer account pages
- **`/docs`**: Comprehensive technical documentation
- **`/memory_bank`**: Workflow documentation (35+ files)

## Critical Features

### Size Fit System

Complex product measurement and recommendation engine located in:

- `snippets/size-fit-*` components
- `assets/size-fit.js` algorithm
- Detailed documentation in `/docs/size-fit/`

### Component Systems

- **Unified Button System**: Consistent loading states across all buttons
- **Product Card System**: Advanced color variant handling with hover effects
- **Swatch System**: Color/variant selection with image thumbnails
- **Predictive Search**: Uses HyperHTML templating in `snippets/predictive-search.liquid`

### Internationalization

- **25+ languages** with complete translation coverage
- **RTL support** for right-to-left languages
- **Multi-currency** and region-specific configurations
- Translation files in `/locales/`

## CSS Architecture

### Tailwind Configuration

- Uses Tailwind v4.0 with `@import "tailwindcss"` in `assets/tailwind.css`
- Extensive custom properties system
- Component-specific CSS files compiled into `assets/application.css`

### Critical CSS Patterns

- **Design tokens** defined as CSS custom properties
- **Component token mappings** for consistent theming
- **Responsive design** with mobile-first approach
- **Performance optimizations** with critical CSS inlining

## Testing

### JavaScript Testing

- **Vitest** for unit tests
- Example tests in `assets/product-utils.test.js`
- Run with `pnpm test` or `pnpm test:ci`

### Quality Assurance

- **Lighthouse CI** for performance monitoring
- **Theme Check** via GitHub Actions
- **Prettier** for code formatting with Liquid plugin

## Performance Considerations

- **Critical CSS inlining** for above-fold content
- **Deferred JavaScript** loading
- **Image optimization** with responsive images and WebP support
- **Component-based CSS** for efficient loading
- Monitor performance with Lighthouse CI integration

## Development Notes

### Local Development

- Use `pnpm dev` for full development experience (sportfinder-international.myshopify.com)
- Per-store dev: `pnpm dev:czech` (CZ), `pnpm dev:romania` (RO), `pnpm dev:perfumes`
- Tailwind watcher rebuilds CSS on file changes

### Code Patterns

- **Liquid components** follow snippet-based architecture
- **JavaScript** uses vanilla JS with HyperHTML for templating
- **CSS** follows Tailwind utility-first approach with custom component tokens
- **Internationalization** requires updating relevant locale files

### Documentation

- Extensive documentation in `/docs/` folder
- Memory bank system tracks feature implementations
- Architecture diagrams and design system references available
