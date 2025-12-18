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

This repository uses an **Environment Branch Strategy** to manage multiple production stores while maintaining a shared codebase.

### Branch Structure

```
main (integration branch) ────────────────────────────► Shared codebase - no direct store connection
│                                                       ✅ Safe to merge features here
│
├── develop ──────────────────────────────────────────► Development Store (sportfinder-international.myshopify.com)
│   ├── feature/new-product-card                        🟡 Testing & staging
│   ├── feature/checkout-improvements
│   └── hotfix/critical-bug-fix
│
├── store/sportfinder-de ─────────────────────────────► Germany Production (northfinder-1.myshopify.com)
│                                                       🔴 Live store
├── store/international ──────────────────────────────► International (sportfinder-international.myshopify.com)
│                                                       🟢 Future multi-market
├── store/poland ─────────────────────────────────────► Poland Production (poland-northfinder-2.myshopify.com)
│                                                       🔴 Live store
└── store/perfumes ───────────────────────────────────► Perfumes Production (northfinder-parfums.myshopify.com)
                                                        🔴 Live store
```

### Store-Branch Mapping

| Store | Branch | Shopify Store | CLI Environment | Status |
|-------|--------|---------------|-----------------|--------|
| **Germany** | `store/sportfinder-de` | northfinder-1.myshopify.com | `germany` | 🔴 Production |
| **Development** | `develop` | sportfinder-international.myshopify.com | `development` | 🟡 Staging |
| **International** | `store/international` | sportfinder-international.myshopify.com | `development` | 🟢 Future |
| **Poland** | `store/poland` | poland-northfinder-2.myshopify.com | `poland` | 🔴 Production |
| **Perfumes** | `store/perfumes` | northfinder-parfums.myshopify.com | `perfumes` | 🔴 Production |
| **Integration** | `main` | *(no direct connection)* | - | ✅ Safe |

### Key Principles

1. **`main` = Integration Branch**: Shared codebase, no direct store connection - safe for merging
2. **`develop` = Safe Testing**: All feature development happens here, connected to development store
3. **`store/*` = Production**: Each store has its own branch with store-specific configs
4. **Shared UI, Isolated Configs**: All UI/features developed in `develop`, store-specific configs stay in `store/*` branches
5. **Never Merge Configs Up**: Store configurations never merge back to `main` or `develop`
6. **Always Merge Features Down**: Changes in `main` propagate to all `store/*` branches

### Quick Decision Tree

**What are you working on?**

- **New UI/Feature** (sections, snippets, assets, etc.)
  - Create `feature/*` branch from `develop`
  - Test on development store
  - Merge to `develop` via PR
  - Merge `develop` to `main`
  - Then merge `main` to all `store/*` branches

- **Store-Specific Config** (apps, theme settings)
  - Checkout `store/*` branch directly (e.g., `store/sportfinder-de` for Germany)
  - Commit changes to that store branch only
  - Do NOT merge back to `main` or `develop`

- **Emergency Fix**
  - Create `hotfix/*` from affected `store/*` branch
  - Merge to store branch first (deploy immediately)
  - Then merge to `main` and `develop`
  - Then merge to other store branches

## Development Setup

### Prerequisites

```bash
# Install pnpm globally if you haven't already
npm install -g pnpm

# Install Shopify CLI
npm install -g @shopify/cli @shopify/theme
```

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
[environments.development]
store = "sportfinder-international.myshopify.com"  # ✅ Safe development/staging

[environments.germany]
store = "northfinder-1.myshopify.com"              # ⚠️ Germany Production

[environments.poland]
store = "poland-northfinder-2.myshopify.com"

[environments.perfumes]
store = "northfinder-parfums.myshopify.com"
```

> ⚠️ **Warning**: The `germany` environment connects to the live production store. Always use `development` for testing.

## Development Workflow

### For Shared UI/Feature Development (Recommended)

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/new-product-card

# 3. Start development server (ALWAYS use development environment for safety)
pnpm dev  # Runs both Shopify dev + Tailwind watch on development store

# Or manually target the development store:
shopify theme dev -e development  # ✅ Safe - sportfinder-international.myshopify.com

# ⚠️ AVOID these during development:
# shopify theme dev -e germany     # ❌ Connects to live Germany store!

# 4. Make your changes to sections, snippets, assets, etc.
# ... develop your feature ...

# 5. Test your changes
pnpm test

# 6. Commit and push
git add .
git commit -m "feat: add new product card design"
git push origin feature/new-product-card

# 7. Create PR to develop
# After approval and merge to develop, changes are ready for production deployment
```

### Deploying to Production (Germany)

```bash
# 1. Ensure develop is stable and tested
git checkout develop
git pull origin develop

# 2. Merge to main (integration branch)
git checkout main
git pull origin main
git merge develop
git push origin main

# 3. Merge to Germany store branch
git checkout store/sportfinder-de
git pull origin store/sportfinder-de
git merge main
git push origin store/sportfinder-de

# 4. Deploy to Germany store
shopify theme push -e germany --allow-live
```

### For Store-Specific Configuration Changes

```bash
# 1. Checkout the specific store branch
git checkout store/sportfinder-de  # For Germany-specific config

# 2. Make configuration changes
# - Update config/settings_data.json (app embeds, theme settings)
# - Update templates/*.json if needed

# 3. Test with Shopify CLI
shopify theme dev -e germany

# 4. Commit directly to store branch
git add config/settings_data.json
git commit -m "config(germany): add reviews app embed"
git push origin store/sportfinder-de

# 5. Deploy to store
shopify theme push -e germany --allow-live

# ⚠️ DO NOT merge store configs back to main or develop
```

### For Emergency Hotfixes

```bash
# 1. Create hotfix from affected store branch
git checkout store/sportfinder-de
git checkout -b hotfix/fix-checkout-bug

# 2. Fix the bug
# ... make your fix ...

# 3. Test on development store first (if possible)
shopify theme dev -e development

# 4. Commit and merge to store branch (urgent)
git commit -m "fix: resolve checkout button not working"
git checkout store/sportfinder-de
git merge hotfix/fix-checkout-bug
git push origin store/sportfinder-de

# 5. Deploy immediately
shopify theme push -e germany --allow-live

# 6. Propagate to main and develop
git checkout main
git merge hotfix/fix-checkout-bug
git push origin main

git checkout develop
git merge hotfix/fix-checkout-bug
git push origin develop

# 7. Merge to other store branches as needed
git checkout store/poland
git merge main
git push origin store/poland
```

## Store Information

### Active Stores

| Store | Branch | Shopify Store | CLI Environment | Primary Language | Status |
|-------|--------|---------------|-----------------|------------------|--------|
| Germany | `store/sportfinder-de` | northfinder-1.myshopify.com | `germany` | German (de) | 🔴 Live |
| Development | `develop` | sportfinder-international.myshopify.com | `development` | Multiple | 🟡 Testing |
| Poland | `store/poland` | poland-northfinder-2.myshopify.com | `poland` | Polish (pl) | 🔴 Live |
| Perfumes | `store/perfumes` | northfinder-parfums.myshopify.com | `perfumes` | Multiple | 🔴 Live |
| International | `store/international` | sportfinder-international.myshopify.com | `development` | Multiple | 🟢 Future |
| Integration | `main` | *(no direct connection)* | - | - | ✅ Safe |

## Testing

### Running Tests

```bash
# Watch mode (development)
pnpm test

# Single run (CI)
pnpm test:ci

# Format code
pnpm format
```

### Manual Testing Checklist

Before merging to `develop`:
- [ ] Test locally with `shopify theme dev -e development`
- [ ] Test on development store (sportfinder-international.myshopify.com)
- [ ] Verify no breaking changes
- [ ] Run automated tests

Before merging to `main`:
- [ ] All changes tested on development store
- [ ] Run automated tests
- [ ] Verify no breaking changes

Before merging to `store/*` branches (Production):
- [ ] Changes merged to `main` first
- [ ] Test on unpublished theme if needed
- [ ] Verify store-specific configs intact
- [ ] Check app functionality
- [ ] Verify no visual regressions

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
- **Package Manager**: pnpm (requires Node.js 20+)

## Development Commands

```bash
pnpm dev              # Start development server (connects to sportfinder-international.myshopify.com)
pnpm start            # Start Shopify dev server only
pnpm watch            # Start Tailwind CSS watcher only
pnpm test             # Run tests
pnpm test:ci          # Run tests in CI mode
pnpm format           # Format code with Prettier
```

### Manual Shopify CLI Commands

```bash
# Development (safe)
shopify theme dev -e development    # ✅ sportfinder-international.myshopify.com

# Production (careful!)
shopify theme dev -e germany        # ⚠️ northfinder-1.myshopify.com (Germany Live)
shopify theme push -e germany       # ⚠️ Deploys to Germany production

# Other stores
shopify theme dev -e poland         # Poland store
shopify theme dev -e perfumes       # Perfumes store
```

## Important Files

### Shared Files (merge from develop to all stores)
- `/assets/*` - CSS, JS, images, fonts
- `/sections/*` - Section templates
- `/snippets/*` - Reusable components
- `/layout/*` - Layout files
- `/locales/*` - Translation files (25+ languages)
- `config/settings_schema.json` - Theme customization schema

### Store-Specific Files (never merge back to develop)
- `config/settings_data.json` - **CRITICAL**: App embeds and theme settings
- Some `/templates/*.json` - Templates with store-specific sections
- `shopify.theme.toml` - Store connection config (shared across all branches)

### Conflict Prevention

The repository uses `.gitattributes` to prevent config conflicts:

```gitattributes
# Always keep store branch version when merging
config/settings_data.json merge=ours
```

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

**Store-specific changes:**
```
config(germany): add reviews app embed
config(poland): update theme colors
config(perfumes): enable new payment method
```

### Pull Request Guidelines

- Use the PR template checklist
- Include screenshots for UI changes
- Test on target store(s) before requesting review
- Indicate if changes need to propagate to all stores

## Troubleshooting

### Common Issues

**Issue: Merge conflict in config/settings_data.json**
```bash
# Always keep the store branch version
git checkout --ours config/settings_data.json
git add config/settings_data.json
git commit
```

**Issue: Store branch missing latest main changes**
```bash
git checkout store/sportfinder-de
git pull origin store/sportfinder-de
git merge main
# Resolve conflicts (keep store's config/settings_data.json)
git push origin store/sportfinder-de
```

**Issue: Can't deploy to Germany store**
```bash
# Pull latest config from live store first
git checkout store/sportfinder-de
shopify theme pull -e germany --only config/settings_data.json
git add config/settings_data.json
git commit -m "config(germany): sync with live store"
git push origin store/sportfinder-de
```

**Issue: Development store out of sync**
```bash
# Push latest develop to development store
git checkout develop
shopify theme push -e development
```

## Support

For questions or issues:
- Review [AGENTS.md](AGENTS.md) for development guidelines
- Contact the development team

## License

Copyright (c) 2021-present Shopify Inc. See [LICENSE](/LICENSE.md) for further details.
