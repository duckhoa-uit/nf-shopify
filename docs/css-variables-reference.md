# CSS Variables Reference - Northfinder Theme

## Overview

This document provides a comprehensive reference of all CSS custom properties (variables) used throughout the Northfinder Shopify theme. These variables are defined in `layout/theme.liquid` and `assets/tailwind.css`.

## Variable Categories

### 1. Dynamic Theme Variables (from Shopify Settings)

These variables are dynamically generated from the theme's color scheme settings in `layout/theme.liquid`:

#### Color Variables
```css
/* Base colors from theme settings */
--color-base-background: {r},{g},{b};
--color-base-foreground: {r},{g},{b};
--color-base-background-contrast: {r},{g},{b};
--color-base-shadow: {r},{g},{b};
--color-base-button: {r},{g},{b};
--color-base-button-text: {r},{g},{b};
--color-base-secondary-button: {r},{g},{b};
--color-base-secondary-button-text: {r},{g},{b};
--color-base-link: {r},{g},{b};
--color-base-badge-foreground: {r},{g},{b};
--color-base-badge-background: {r},{g},{b};
--color-base-badge-border: {r},{g},{b};

/* Gradient backgrounds */
--gradient-background: /* Dynamic gradient or solid color */;
--payment-terms-background-color: rgb({r},{g},{b});
```

#### Typography Variables
```css
/* Font families */
--font-body-family: /* Dynamic font family with fallbacks */;
--font-body-style: /* normal | italic */;
--font-body-weight: /* 100-900 */;
--font-body-weight-bold: /* body weight + 300, max 1000 */;

--font-heading-family: /* Dynamic font family with fallbacks */;
--font-heading-style: /* normal | italic */;
--font-heading-weight: /* 100-900 */;

/* Font scaling */
--font-body-scale: /* Decimal value from settings */;
--font-heading-scale: /* Calculated ratio */;
```

#### Layout Variables
```css
/* Page layout */
--page-width: /* rem value from settings */;
--page-width-margin: /* 0 or 2rem based on width */;

/* Section spacing */
--spacing-sections-desktop: /* px value */;
--spacing-sections-mobile: /* calculated mobile spacing */;

/* Grid spacing */
--grid-desktop-vertical-spacing: /* px value */;
--grid-desktop-horizontal-spacing: /* px value */;
--grid-mobile-vertical-spacing: /* desktop / 2 */;
--grid-mobile-horizontal-spacing: /* desktop / 2 */;
```

#### Media & Image Variables
```css
/* Media styling */
--media-padding: /* px value */;
--media-border-opacity: /* 0-1 decimal */;
--media-border-width: /* px value */;
--media-radius: /* px value */;
--media-shadow-opacity: /* 0-1 decimal */;
--media-shadow-horizontal-offset: /* px value */;
--media-shadow-vertical-offset: /* px value */;
--media-shadow-blur-radius: /* px value */;
--media-shadow-visible: /* 0 or 1 */;
```

#### Product Card Variables
```css
/* Product cards */
--product-card-image-padding: /* rem value */;
--product-card-corner-radius: /* rem value */;
--product-card-text-alignment: /* left | center | right */;
--product-card-border-width: /* rem value */;
--product-card-border-opacity: /* 0-1 decimal */;
--product-card-shadow-opacity: /* 0-1 decimal */;
--product-card-shadow-visible: /* 0 or 1 */;
--product-card-shadow-horizontal-offset: /* rem value */;
--product-card-shadow-vertical-offset: /* rem value */;
--product-card-shadow-blur-radius: /* rem value */;
```

#### Collection Card Variables
```css
/* Collection cards */
--collection-card-image-padding: /* rem value */;
--collection-card-corner-radius: /* rem value */;
--collection-card-text-alignment: /* left | center | right */;
--collection-card-border-width: /* rem value */;
--collection-card-border-opacity: /* 0-1 decimal */;
--collection-card-shadow-opacity: /* 0-1 decimal */;
--collection-card-shadow-visible: /* 0 or 1 */;
--collection-card-shadow-horizontal-offset: /* rem value */;
--collection-card-shadow-vertical-offset: /* rem value */;
--collection-card-shadow-blur-radius: /* rem value */;
```

#### Blog Card Variables
```css
/* Blog cards */
--blog-card-image-padding: /* rem value */;
--blog-card-corner-radius: /* rem value */;
--blog-card-text-alignment: /* left | center | right */;
--blog-card-border-width: /* rem value */;
--blog-card-border-opacity: /* 0-1 decimal */;
--blog-card-shadow-opacity: /* 0-1 decimal */;
--blog-card-shadow-visible: /* 0 or 1 */;
--blog-card-shadow-horizontal-offset: /* rem value */;
--blog-card-shadow-vertical-offset: /* rem value */;
--blog-card-shadow-blur-radius: /* rem value */;
```

#### UI Component Variables
```css
/* Badges */
--badge-corner-radius: /* rem value */;

/* Popups */
--popup-border-width: /* px value */;
--popup-border-opacity: /* 0-1 decimal */;
--popup-corner-radius: /* px value */;
--popup-shadow-opacity: /* 0-1 decimal */;
--popup-shadow-horizontal-offset: /* px value */;
--popup-shadow-vertical-offset: /* px value */;
--popup-shadow-blur-radius: /* px value */;

/* Drawers */
--drawer-border-width: /* px value */;
--drawer-border-opacity: /* 0-1 decimal */;
--drawer-shadow-opacity: /* 0-1 decimal */;
--drawer-shadow-horizontal-offset: /* px value */;
--drawer-shadow-vertical-offset: /* px value */;
--drawer-shadow-blur-radius: /* px value */;

/* Text boxes */
--text-boxes-border-opacity: /* 0-1 decimal */;
--text-boxes-border-width: /* px value */;
--text-boxes-radius: /* px value */;
--text-boxes-shadow-opacity: /* 0-1 decimal */;
--text-boxes-shadow-visible: /* 0 or 1 */;
--text-boxes-shadow-horizontal-offset: /* px value */;
--text-boxes-shadow-vertical-offset: /* px value */;
--text-boxes-shadow-blur-radius: /* px value */;
```

#### Button Variables
```css
/* Buttons */
--buttons-radius: /* px value */;
--buttons-radius-outset: /* calculated radius + border */;
--buttons-border-width: /* px value or 0 */;
--buttons-border-opacity: /* 0-1 decimal */;
--buttons-shadow-opacity: /* 0-1 decimal */;
--buttons-shadow-visible: /* 0 or 1 */;
--buttons-shadow-horizontal-offset: /* px value */;
--buttons-shadow-vertical-offset: /* px value */;
--buttons-shadow-blur-radius: /* px value */;
--buttons-border-offset: /* calculated offset */;
```

#### Input Variables
```css
/* Form inputs */
--inputs-radius: /* px value */;
--inputs-border-width: /* px value */;
--inputs-border-opacity: /* 0-1 decimal */;
--inputs-shadow-opacity: /* 0-1 decimal */;
--inputs-shadow-horizontal-offset: /* px value */;
--inputs-margin-offset: /* calculated margin */;
--inputs-shadow-vertical-offset: /* px value */;
--inputs-shadow-blur-radius: /* px value */;
--inputs-radius-outset: /* calculated radius + border */;
```

#### Variant Picker Variables
```css
/* Variant pills */
--variant-pills-radius: /* px value */;
--variant-pills-border-width: /* px value */;
--variant-pills-border-opacity: /* 0-1 decimal */;
--variant-pills-shadow-opacity: /* 0-1 decimal */;
--variant-pills-shadow-horizontal-offset: /* px value */;
--variant-pills-shadow-vertical-offset: /* px value */;
--variant-pills-shadow-blur-radius: /* px value */;
```

### 2. Static Design Tokens (from assets/tailwind.css)

These variables are defined as static values in the design system:

#### Brand Colors
```css
--color-white: #fff;
--color-black: #000;
--color-accent: #ec0009;  /* Northfinder red */
```

#### Gray Scale Palette
```css
--color-gray-50: #f9f9f9;   /* Lightest backgrounds */
--color-gray-100: #f5f5f5;  /* Announcement bar, info boxes */
--color-gray-200: #f0f0f0;  /* Search inputs, hover states */
--color-gray-300: #ebebeb;  /* Light backgrounds */
--color-gray-400: #e0dfdf;  /* Borders, dividers */
--color-gray-500: #b8b8b8;  /* Medium borders */
--color-gray-600: #999999;  /* Light text */
--color-gray-700: #666666;  /* Medium text */
--color-gray-800: #4d4d4d;  /* Medium-dark text */
--color-gray-850: #3d3d3d;  /* Dark text */
--color-gray-900: #333333;  /* SVG strokes, very dark text */
--color-gray-950: #0f0f0f;  /* Primary dark, modal backdrop */
```

#### Semantic Colors
```css
--color-success: #00945f;  /* Success states, valid inputs */
--color-error: #ec0009;    /* Error states, invalid inputs */
--color-warning: #f59e0b;  /* Warning states */
--color-info: #3b82f6;     /* Info states */
```

#### Component-Specific Colors
```css
--color-modal-backdrop: #0f0f0f;
--color-newsletter-bg: #2b3c48;
--color-border-light: #e0dfdf;
--color-border-medium: #b8b8b8;
--color-svg-stroke: #333333;
--color-svg-accent: #d00000;
```

#### Alpha Values
```css
--alpha-button-background: 1;
--alpha-button-border: 1;
--alpha-link: 0.85;
--alpha-badge-border: 0.1;
```

#### Focus States
```css
--focused-base-outline: 0.2rem solid rgba(var(--color-base-foreground), 0.5);
--focused-base-outline-offset: 0.3rem;
--focused-base-box-shadow: 0 0 0 0.3rem rgb(var(--color-base-background)), 0 0 0.5rem 0.4rem rgba(var(--color-base-foreground), 0.3);
```

#### Component Sizing
```css
--swatch-size: 3.2rem;
--swatch-border-radius: 50%;
--swatch-square-border-radius: 0.2rem;
--ratio-percent: 56.25%;
```

#### Breakpoints
```css
--breakpoint-md: 46.875rem;  /* 750px */
--breakpoint-lg: 61.875rem;  /* 990px */
--breakpoint-xl: 87.5rem;    /* 1400px */
```

#### Typography
```css
--font-archivo-expanded: "Archivo SemiExpanded", sans-serif;
--radius-3: 0.1875rem;
```

### 3. Component-Specific Variables

#### Swatch Components
```css
/* From component-swatch-input.css */
--swatch-input--border-radius: 50%;  /* Circle swatches */
--swatch-input--size: 3.2rem;        /* Desktop size */
--swatch-input--border-radius: 0.2rem; /* Square swatches */

/* Mobile adjustments */
--swatch-input--size: 2.8rem;        /* Mobile size */

/* From component-swatch.css */
--swatch--size: var(--swatch-input--size, 3.2rem);
--swatch--border-radius: var(--swatch-input--border-radius, 50%);
```

#### Video Components
```css
/* From video-section.css */
--ratio-percent: 56.25%;  /* 16:9 aspect ratio */
```

## Usage Patterns

### 1. Color Usage
```css
/* Using theme colors */
background-color: rgb(var(--color-base-background));
color: rgb(var(--color-base-foreground));

/* Using design tokens */
background-color: var(--color-gray-100);
border-color: var(--color-border-light);

/* Using with alpha */
background-color: rgba(var(--color-base-foreground), var(--alpha-link));
```

### 2. Spacing and Layout
```css
/* Using dynamic spacing */
padding: var(--spacing-sections-desktop);
margin: var(--grid-desktop-vertical-spacing);

/* Using static tokens */
border-radius: var(--radius-3);
```

### 3. Component Styling
```css
/* Using component variables */
border-radius: var(--buttons-radius);
box-shadow: var(--buttons-shadow-horizontal-offset) var(--buttons-shadow-vertical-offset) var(--buttons-shadow-blur-radius) rgba(var(--color-base-shadow), var(--buttons-shadow-opacity));
```

### 4. Responsive Design
```css
/* Using breakpoint variables */
@media screen and (min-width: var(--breakpoint-md)) {
  /* Tablet styles */
}

@media screen and (min-width: var(--breakpoint-lg)) {
  /* Desktop styles */
}
```

## Variable Inheritance

### Theme Settings Cascade
1. **Root Level**: Base theme colors and settings
2. **Color Scheme Level**: Specific scheme overrides
3. **Component Level**: Component-specific calculations
4. **Element Level**: Final computed values

### Example Cascade
```css
/* 1. Root level (theme.liquid) */
:root {
  --color-base-button: 18,18,18;
  --buttons-radius: 4px;
}

/* 2. Component level (base.css) */
.button {
  --shadow-horizontal-offset: var(--buttons-shadow-horizontal-offset);
  background-color: rgba(var(--color-base-button), var(--alpha-button-background));
  border-radius: var(--buttons-radius);
}

/* 3. Design token level (tailwind.css) */
.bg-gray-200 {
  background-color: var(--color-gray-200);
}
```

## Best Practices

### 1. Variable Naming
- Use semantic names over descriptive names
- Follow the existing naming conventions
- Group related variables with prefixes

### 2. Color Usage
- Prefer design tokens for new components
- Use theme variables for dynamic content
- Always provide fallback values

### 3. Responsive Variables
- Use mobile-first approach
- Leverage existing breakpoint variables
- Consider performance impact of calculations

### 4. Component Variables
- Define component-specific variables locally
- Use CSS custom property inheritance
- Document variable purposes and usage

## Migration Notes

When migrating hardcoded values to variables:

1. **Identify the appropriate variable category**
2. **Check if a suitable variable already exists**
3. **Create new variables following naming conventions**
4. **Update all instances consistently**
5. **Test across different theme settings**

This comprehensive variable system provides a solid foundation for maintaining consistency, enabling theme customization, and supporting future design system evolution.
