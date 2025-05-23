# Color System Migration Guide

## Overview

This guide provides a comprehensive plan to migrate all hardcoded colors in the Northfinder theme to a unified design system using CSS custom properties.

## Current Color Audit

### ✅ Colors Already in Design System
- `#ec0009` - Brand accent red
- `#fff` - White
- `#000` - Black
- Theme-based colors (background, foreground, secondary)

### 🔄 Colors to Migrate

#### Gray Scale Palette
| Current Hex | New Token | Usage |
|-------------|-----------|-------|
| `#f9f9f9` | `--color-gray-50` | Lightest backgrounds |
| `#f5f5f5` | `--color-gray-100` | Announcement bar, info boxes |
| `#f0f0f0` | `--color-gray-200` | Search inputs, hover states |
| `#ebebeb` | `--color-gray-300` | Light backgrounds |
| `#e0dfdf` | `--color-gray-400` | Borders, dividers |
| `#b8b8b8` | `--color-gray-500` | Medium borders |
| `#999999` | `--color-gray-600` | Light text |
| `#666666` | `--color-gray-700` | Medium text |
| `#4d4d4d` | `--color-gray-800` | Medium-dark text |
| `#3d3d3d` | `--color-gray-850` | Dark text |
| `#333333` | `--color-gray-900` | SVG strokes, very dark text |
| `#0f0f0f` | `--color-gray-950` | Primary dark, modal backdrop |

#### Semantic Colors
| Current Hex | New Token | Usage |
|-------------|-----------|-------|
| `#00945f` | `--color-success` | Success states, valid inputs |
| `#ec0009` | `--color-error` | Error states, invalid inputs |
| `#f59e0b` | `--color-warning` | Warning states |
| `#3b82f6` | `--color-info` | Info states |

#### Component-Specific Colors
| Current Hex | New Token | Usage |
|-------------|-----------|-------|
| `#2b3c48` | `--color-newsletter-bg` | Newsletter section background |
| `#d00000` | `--color-svg-accent` | SVG accent elements |

## Migration Strategy

### Phase 1: Update Design Tokens ✅

Enhanced `assets/tailwind.css` with comprehensive color palette:

```css
@theme inline {
  /* Base colors from theme settings */
  --color-background: rgb(var(--color-base-background));
  --color-foreground: rgb(var(--color-base-foreground));
  --color-secondary: rgb(var(--color-base-secondary-button));
  --color-secondary-foreground: rgb(var(--color-base-secondary-button-text));
  
  /* Brand colors */
  --color-white: #fff;
  --color-black: #000;
  --color-accent: #ec0009;
  
  /* Gray scale palette */
  --color-gray-50: #f9f9f9;
  --color-gray-100: #f5f5f5;
  --color-gray-200: #f0f0f0;
  --color-gray-300: #ebebeb;
  --color-gray-400: #e0dfdf;
  --color-gray-500: #b8b8b8;
  --color-gray-600: #999999;
  --color-gray-700: #666666;
  --color-gray-800: #4d4d4d;
  --color-gray-850: #3d3d3d;
  --color-gray-900: #333333;
  --color-gray-950: #0f0f0f;
  
  /* Semantic colors */
  --color-success: #00945f;
  --color-error: #ec0009;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;
  
  /* Component-specific colors */
  --color-modal-backdrop: #0f0f0f;
  --color-newsletter-bg: #2b3c48;
  --color-border-light: #e0dfdf;
  --color-border-medium: #b8b8b8;
  --color-svg-stroke: #333333;
  --color-svg-accent: #d00000;
}
```

### Phase 2: Replace Hardcoded Colors in Liquid Templates

#### High Priority Files (Most Usage)

**1. Auth Modal (`snippets/auth-modal.liquid`)**
```liquid
<!-- Before -->
<div class="bg-[#0f0f0f] opacity-40"></div>
<div class="text-[#3D3D3D] mt-6"></div>
<div class="border-[#E0DFDF]"></div>

<!-- After -->
<div class="bg-gray-950 opacity-40"></div>
<div class="text-gray-850 mt-6"></div>
<div class="border-gray-400"></div>
```

**2. Header Search (`snippets/header-search.liquid`)**
```liquid
<!-- Before -->
<input class="bg-[#F0F0F0] rounded-3">

<!-- After -->
<input class="bg-gray-200 rounded-3">
```

**3. Product Cards (`snippets/card-product.liquid`)**
```liquid
<!-- Before -->
<div class="bg-[#EC0009] text-white">

<!-- After -->
<div class="bg-accent text-white">
```

#### Medium Priority Files

**4. Newsletter Section (`sections/newsletter.liquid`)**
```liquid
<!-- Before -->
<div class="bg-[#2B3C48]">

<!-- After -->
<div class="bg-newsletter-bg">
```

**5. Announcement Bar (`sections/announcement-bar.liquid`)**
```liquid
<!-- Before -->
<div class="bg-[#F5F5F5]">

<!-- After -->
<div class="bg-gray-100">
```

### Phase 3: Update Component CSS Files

**1. Cart Notification (`assets/component-cart-notification.css`)**
```css
/* Before */
.button--primary {
  background-color: #0F0F0F;
  color: #FFFFFF;
  border: 1px solid #B8B8B8;
}

/* After */
.button--primary {
  background-color: rgb(var(--color-gray-950));
  color: rgb(var(--color-white));
  border: 1px solid rgb(var(--color-gray-500));
}
```

**2. Account Styles (`assets/account.css`)**
```css
/* Before */
.account-element {
  border: 1px solid #dbdbdb;
  background-color: #ffffff;
  color: #333435;
}

/* After */
.account-element {
  border: 1px solid rgb(var(--color-gray-400));
  background-color: rgb(var(--color-white));
  color: rgb(var(--color-gray-850));
}
```

### Phase 4: Update SVG Colors

**Measure Figure Block (`snippets/measure-figure-block.liquid`)**
```liquid
<!-- Before -->
<path stroke="#333" fill="none" stroke-width="2"/>
<path stroke="#d00" stroke-width="2"/>

<!-- After -->
<path stroke="rgb(var(--color-svg-stroke))" fill="none" stroke-width="2"/>
<path stroke="rgb(var(--color-svg-accent))" stroke-width="2"/>
```

## Implementation Checklist

### ✅ Phase 1: Design Tokens
- [x] Enhanced color palette in `assets/tailwind.css`
- [x] Added gray scale (50-950)
- [x] Added semantic colors (success, error, warning, info)
- [x] Added component-specific tokens

### 🔄 Phase 2: Liquid Template Migration
- [ ] `snippets/auth-modal.liquid` (15+ color instances)
- [ ] `snippets/header-search.liquid` (2 instances)
- [ ] `snippets/header-search-mobile.liquid` (2 instances)
- [ ] `snippets/card-product.liquid` (3 instances)
- [ ] `sections/newsletter.liquid` (1 instance)
- [ ] `sections/announcement-bar.liquid` (1 instance)
- [ ] `sections/info-box.liquid` (1 instance)
- [ ] `sections/recent-products.liquid` (1 instance)
- [ ] `snippets/benefit-indicator.liquid` (1 instance)
- [ ] `snippets/price-facet.liquid` (1 instance)
- [ ] `snippets/related-articles.liquid` (1 instance)
- [ ] `snippets/facets.liquid` (1 instance)
- [ ] `snippets/header-drawer.liquid` (3 instances)

### 🔄 Phase 3: CSS File Migration
- [ ] `assets/component-cart-notification.css` (8 instances)
- [ ] `assets/account.css` (12+ instances)
- [ ] Other component CSS files as needed

### 🔄 Phase 4: SVG Migration
- [ ] `snippets/measure-figure-block.liquid` (20+ SVG color instances)

## Benefits of Migration

### 1. **Consistency**
- All colors follow a unified naming convention
- Easy to maintain brand consistency across the theme

### 2. **Maintainability**
- Single source of truth for all colors
- Easy to update colors globally
- Reduced risk of color inconsistencies

### 3. **Scalability**
- Easy to add new color variants
- Support for theme customization
- Better integration with Shopify's color scheme system

### 4. **Developer Experience**
- Semantic color names improve code readability
- Autocomplete support in modern editors
- Clear color hierarchy and purpose

### 5. **Performance**
- Reduced CSS bundle size through token reuse
- Better caching of color values
- Optimized color calculations

## Testing Strategy

### 1. **Visual Regression Testing**
- Compare before/after screenshots of all pages
- Test all color variants and states
- Verify hover and focus states

### 2. **Cross-Browser Testing**
- Test CSS custom property support
- Verify color rendering consistency
- Check fallback color support

### 3. **Accessibility Testing**
- Verify color contrast ratios
- Test with high contrast mode
- Validate color-blind accessibility

### 4. **Theme Customization Testing**
- Test with different Shopify color schemes
- Verify theme editor color changes
- Check color inheritance

## Migration Timeline

### Week 1: Foundation
- ✅ Update design tokens
- ✅ Create migration documentation
- Plan implementation phases

### Week 2: High Priority Templates
- Migrate auth modal and search components
- Update product card colors
- Test critical user flows

### Week 3: Medium Priority Components
- Migrate section components
- Update announcement and newsletter sections
- Test responsive behavior

### Week 4: CSS Files and SVGs
- Update component CSS files
- Migrate SVG colors
- Final testing and optimization

## Rollback Plan

If issues arise during migration:

1. **Immediate Rollback**: Revert specific file changes via git
2. **Partial Rollback**: Keep design tokens, revert specific components
3. **Full Rollback**: Revert entire color system changes

## Future Enhancements

### 1. **Dark Mode Support**
```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-gray-50: #1a1a1a;
    --color-gray-100: #2a2a2a;
    /* ... inverted gray scale */
  }
}
```

### 2. **Color Scheme Variants**
- Add support for seasonal color schemes
- Brand color variations for special events
- User-customizable color preferences

### 3. **Advanced Color Functions**
```css
--color-accent-light: color-mix(in oklab, var(--color-accent) 80%, white);
--color-accent-dark: color-mix(in oklab, var(--color-accent) 80%, black);
```

This migration will significantly improve the maintainability and consistency of the Northfinder theme's color system while providing a solid foundation for future enhancements.
