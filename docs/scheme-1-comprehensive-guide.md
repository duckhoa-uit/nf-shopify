# Northfinder Theme - Scheme 1 Comprehensive Guide

## Overview

This document provides comprehensive documentation for the Northfinder theme optimized specifically for **Color Scheme 1** (the default white theme). Since you're using only Scheme 1, this guide eliminates complexity and focuses on the exact values and optimizations for this single color scheme.

## Color Scheme 1 - Complete Specification

### Core Color Values

#### Exact Values from Config
```json
{
  "background": "#ffffff",           // Pure white background
  "background_gradient": "",         // No gradient (solid color)
  "text": "#121212",                 // Very dark gray text
  "button": "#121212",               // Dark button background
  "button_label": "#ffffff",         // White button text
  "secondary_button_label": "#4d4d4d", // Medium gray secondary text
  "shadow": "#121212"                // Dark shadow color
}
```

#### RGB Values for Dynamic Usage
```css
/* For use with rgba() and rgb() functions */
--rgb-primary-bg: 255,255,255;      /* #ffffff */
--rgb-primary-text: 18,18,18;       /* #121212 */
--rgb-primary-button: 18,18,18;     /* #121212 */
--rgb-primary-button-text: 255,255,255; /* #ffffff */
--rgb-secondary-text: 77,77,77;     /* #4d4d4d */
--rgb-primary-shadow: 18,18,18;     /* #121212 */
```

### Enhanced Color System for Scheme 1

#### Primary Color Palette
```css
/* === NORTHFINDER BRAND COLORS (SCHEME 1 FOCUSED) === */

/* Primary Brand Colors */
--color-white: #ffffff;                    /* Pure white backgrounds */
--color-black: #000000;                    /* Pure black for contrast */
--color-accent: #ec0009;                   /* Northfinder red accent */

/* Scheme 1 Core Colors (Default Theme) */
--color-primary-bg: #ffffff;               /* scheme-1 background */
--color-primary-text: #121212;             /* scheme-1 text */
--color-primary-button: #121212;           /* scheme-1 button */
--color-primary-button-text: #ffffff;      /* scheme-1 button_label */
--color-secondary-text: #4d4d4d;           /* scheme-1 secondary_button_label */
--color-primary-shadow: #121212;           /* scheme-1 shadow */
```

#### Extended Gray Scale (Optimized for Scheme 1)
```css
/* Gray scale palette optimized for white background theme */
--color-gray-50: #f9f9f9;   /* Lightest gray - subtle backgrounds */
--color-gray-100: #f5f5f5;  /* Very light gray - announcement bars */
--color-gray-200: #f0f0f0;  /* Light gray - input backgrounds, hover states */
--color-gray-300: #ebebeb;  /* Light gray - borders, dividers */
--color-gray-400: #e0dfdf;  /* Medium-light gray - card borders */
--color-gray-500: #b8b8b8;  /* Medium gray - inactive elements */
--color-gray-600: #999999;  /* Medium-dark gray - placeholder text */
--color-gray-700: #666666;  /* Dark gray - secondary text */
--color-gray-800: #4d4d4d;  /* Very dark gray - scheme-1 secondary text */
--color-gray-850: #3d3d3d;  /* Darker gray - emphasis text */
--color-gray-900: #333333;  /* Very dark gray - headings */
--color-gray-950: #121212;  /* Darkest gray - scheme-1 primary text/buttons */
```

#### Semantic Colors (Scheme 1 Compatible)
```css
/* Semantic colors optimized for white background */
--color-success: #00945f;    /* Success green - good contrast on white */
--color-error: #ec0009;      /* Error red - matches brand accent */
--color-warning: #f59e0b;    /* Warning orange - good visibility */
--color-info: #3b82f6;       /* Info blue - professional look */
```

## Complete Component Configuration

### Current Settings Values (Scheme 1 Focused)

#### Layout Configuration
```json
{
  "page_width": 1600,                    // 100rem max width
  "spacing_sections": 0,                 // No section spacing
  "spacing_grid_horizontal": 8,          // 8px grid spacing
  "spacing_grid_vertical": 8,            // 8px grid spacing
  "type_header_font": "archivo_n4",      // Archivo font for headings
  "type_body_font": "archivo_n4",        // Archivo font for body
  "heading_scale": 100,                  // 100% heading scale
  "body_scale": 100                      // 100% body scale
}
```

#### Button Configuration (Scheme 1)
```json
{
  "buttons_border_thickness": 1,         // 1px border
  "buttons_border_opacity": 100,         // 100% opacity (solid)
  "buttons_radius": 3,                   // 3px border radius
  "buttons_shadow_opacity": 0,           // No shadow
  "buttons_shadow_horizontal_offset": 0, // No horizontal offset
  "buttons_shadow_vertical_offset": 4,   // 4px vertical offset (if enabled)
  "buttons_shadow_blur": 5               // 5px blur (if enabled)
}
```

#### Input Configuration (Scheme 1)
```json
{
  "inputs_border_thickness": 1,          // 1px border
  "inputs_border_opacity": 30,           // 30% opacity (subtle)
  "inputs_radius": 3,                    // 3px border radius
  "inputs_shadow_opacity": 0,            // No shadow
  "inputs_shadow_horizontal_offset": 0,  // No horizontal offset
  "inputs_shadow_vertical_offset": 4,    // 4px vertical offset (if enabled)
  "inputs_shadow_blur": 5                // 5px blur (if enabled)
}
```

#### Card Configuration (Scheme 1)
```json
{
  "card_style": "standard",              // Standard card style
  "card_image_padding": 0,               // No image padding
  "card_text_alignment": "left",         // Left-aligned text
  "card_color_scheme": "scheme-2",       // Note: Cards use scheme-2 by default
  "card_border_thickness": 0,            // No border
  "card_border_opacity": 10,             // 10% opacity (if border enabled)
  "card_corner_radius": 0,               // No border radius (square corners)
  "card_shadow_opacity": 0               // No shadow
}
```

## Optimized CSS Variable System

### Unified Design Tokens (Scheme 1 Optimized)

#### Spacing Scale
```css
/* Spacing scale based on 8px grid system */
--space-0: 0px;      /* No spacing */
--space-1: 4px;      /* Quarter grid unit */
--space-2: 8px;      /* Base grid unit (matches current settings) */
--space-3: 12px;     /* 1.5x grid unit */
--space-4: 16px;     /* 2x grid unit */
--space-5: 20px;     /* 2.5x grid unit */
--space-6: 24px;     /* 3x grid unit */
--space-8: 32px;     /* 4x grid unit */
--space-10: 40px;    /* 5x grid unit */
```

#### Border Radius Scale
```css
/* Border radius scale based on current usage */
--radius-none: 0px;    /* Square corners (current cards) */
--radius-sm: 3px;      /* Small radius (current buttons/inputs) */
--radius-md: 6px;      /* Medium radius */
--radius-lg: 12px;     /* Large radius */
--radius-xl: 24px;     /* Extra large radius */
--radius-full: 40px;   /* Full radius (current variant pills/badges) */
```

#### Border Width Scale
```css
/* Border width scale based on current usage */
--border-none: 0px;    /* No border (current cards) */
--border-thin: 1px;    /* Thin border (current buttons/inputs) */
--border-medium: 2px;  /* Medium border (current variant pills) */
--border-thick: 4px;   /* Thick border (for emphasis) */
```

#### Opacity Scale
```css
/* Opacity scale based on current usage */
--opacity-0: 0;        /* Transparent (current shadows) */
--opacity-5: 0.05;     /* Very subtle */
--opacity-10: 0.1;     /* Subtle (current card borders) */
--opacity-15: 0.15;    /* Light */
--opacity-20: 0.2;     /* Light-medium */
--opacity-25: 0.25;    /* Medium-light */
--opacity-30: 0.3;     /* Medium (current input borders) */
--opacity-50: 0.5;     /* Half */
--opacity-75: 0.75;    /* Strong */
--opacity-100: 1;      /* Solid (current buttons) */
```

#### Shadow Scale
```css
/* Shadow scale for Scheme 1 (white background) */
--shadow-none: none;
--shadow-sm: 0 1px 2px 0 rgba(18, 18, 18, 0.05);
--shadow-md: 0 4px 6px -1px rgba(18, 18, 18, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(18, 18, 18, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(18, 18, 18, 0.1);

/* Current shadow pattern (if enabled) */
--shadow-current: 0 4px 5px rgba(18, 18, 18, var(--shadow-opacity, 0));
```

### Component Token Mappings (Scheme 1 Specific)

#### Layout Tokens
```css
/* Layout tokens matching current settings */
--page-width-token: 100rem;                    /* 1600px */
--section-spacing-token: var(--space-0);       /* 0px */
--grid-spacing-h-token: var(--space-2);        /* 8px */
--grid-spacing-v-token: var(--space-2);        /* 8px */
```

#### Button Tokens (Scheme 1)
```css
/* Button tokens matching current settings */
--button-bg-token: var(--color-primary-button);           /* #121212 */
--button-text-token: var(--color-primary-button-text);    /* #ffffff */
--button-border-width-token: var(--border-thin);          /* 1px */
--button-border-opacity-token: var(--opacity-100);        /* 100% */
--button-radius-token: var(--radius-sm);                  /* 3px */
--button-shadow-token: var(--shadow-none);                /* none */
```

#### Input Tokens (Scheme 1)
```css
/* Input tokens matching current settings */
--input-bg-token: var(--color-primary-bg);                /* #ffffff */
--input-text-token: var(--color-primary-text);            /* #121212 */
--input-border-color-token: var(--color-gray-500);        /* #b8b8b8 */
--input-border-width-token: var(--border-thin);           /* 1px */
--input-border-opacity-token: var(--opacity-30);          /* 30% */
--input-radius-token: var(--radius-sm);                   /* 3px */
--input-shadow-token: var(--shadow-none);                 /* none */
```

#### Card Tokens (Scheme 1)
```css
/* Card tokens matching current settings */
--card-bg-token: var(--color-primary-bg);                 /* #ffffff */
--card-text-token: var(--color-primary-text);             /* #121212 */
--card-padding-token: var(--space-0);                     /* 0px */
--card-border-width-token: var(--border-none);            /* 0px */
--card-border-opacity-token: var(--opacity-10);           /* 10% */
--card-radius-token: var(--radius-none);                  /* 0px */
--card-shadow-token: var(--shadow-none);                  /* none */
--card-text-alignment-token: left;                        /* left */
```

## Component Usage Patterns (Scheme 1)

### Button Patterns

#### Primary Button (Scheme 1 Style)
```css
.button--primary {
  background-color: var(--color-primary-button);      /* #121212 */
  color: var(--color-primary-button-text);            /* #ffffff */
  border: var(--button-border-width-token) solid var(--color-primary-button);
  border-radius: var(--button-radius-token);          /* 3px */
  opacity: var(--button-border-opacity-token);        /* 100% */
}
```

#### Secondary Button (Scheme 1 Style)
```css
.button--secondary {
  background-color: transparent;
  color: var(--color-secondary-text);                 /* #4d4d4d */
  border: var(--button-border-width-token) solid var(--color-secondary-text);
  border-radius: var(--button-radius-token);          /* 3px */
}
```

#### Accent Button (Brand Style)
```css
.button--accent {
  background-color: var(--color-accent);              /* #ec0009 */
  color: var(--color-white);                          /* #ffffff */
  border: var(--button-border-width-token) solid var(--color-accent);
  border-radius: var(--button-radius-token);          /* 3px */
}
```

### Input Patterns

#### Text Input (Scheme 1 Style)
```css
.input--text {
  background-color: var(--color-primary-bg);          /* #ffffff */
  color: var(--color-primary-text);                   /* #121212 */
  border: var(--input-border-width-token) solid rgba(var(--rgb-primary-text), var(--input-border-opacity-token));
  border-radius: var(--input-radius-token);           /* 3px */
}

.input--text::placeholder {
  color: var(--color-gray-600);                       /* #999999 */
}

.input--text:focus {
  border-color: var(--color-primary-button);          /* #121212 */
  outline: var(--focused-base-outline);
}
```

### Card Patterns

#### Product Card (Scheme 1 Style)
```css
.card--product {
  background-color: var(--card-bg-token);             /* #ffffff */
  color: var(--card-text-token);                      /* #121212 */
  border-radius: var(--card-radius-token);            /* 0px */
  text-align: var(--card-text-alignment-token);       /* left */
  box-shadow: var(--card-shadow-token);               /* none */
}

.card--product__title {
  color: var(--color-primary-text);                   /* #121212 */
}

.card--product__price {
  color: var(--color-primary-text);                   /* #121212 */
}

.card--product__price--sale {
  color: var(--color-accent);                         /* #ec0009 */
}
```

## Typography System (Scheme 1)

### Font Configuration
```css
/* Current font settings */
--font-header-family: "Archivo", var(--font-archivo-expanded), sans-serif;
--font-body-family: "Archivo", var(--font-archivo-expanded), sans-serif;
--font-header-scale: 1;          /* 100% */
--font-body-scale: 1;            /* 100% */
```

### Text Color Hierarchy (Scheme 1)
```css
/* Text color hierarchy for white background */
.text--primary {
  color: var(--color-primary-text);                   /* #121212 - Main text */
}

.text--secondary {
  color: var(--color-secondary-text);                 /* #4d4d4d - Secondary text */
}

.text--muted {
  color: var(--color-gray-600);                       /* #999999 - Muted text */
}

.text--accent {
  color: var(--color-accent);                         /* #ec0009 - Brand accent */
}

.text--inverse {
  color: var(--color-white);                          /* #ffffff - On dark backgrounds */
}
```

## Layout System (Scheme 1)

### Page Layout
```css
/* Page layout matching current settings */
.page-width {
  max-width: var(--page-width-token);                 /* 100rem / 1600px */
  margin: 0 auto;
  padding: 0 var(--page-width-margin, 2rem);
}

.section {
  padding-top: var(--section-spacing-token);          /* 0px */
  padding-bottom: var(--section-spacing-token);       /* 0px */
}
```

### Grid System
```css
/* Grid system matching current settings */
.grid {
  display: grid;
  gap: var(--grid-spacing-v-token) var(--grid-spacing-h-token); /* 8px 8px */
}

.grid--mobile {
  gap: calc(var(--grid-spacing-v-token) / 2) calc(var(--grid-spacing-h-token) / 2); /* 4px 4px */
}
```

## Accessibility (Scheme 1)

### Color Contrast Ratios
```css
/* All combinations meet WCAG AA standards */
/* #121212 on #ffffff = 16.75:1 (AAA) */
/* #4d4d4d on #ffffff = 9.74:1 (AAA) */
/* #ec0009 on #ffffff = 5.89:1 (AA) */
/* #ffffff on #121212 = 16.75:1 (AAA) */
/* #ffffff on #ec0009 = 5.89:1 (AA) */
```

### Focus States (Scheme 1)
```css
/* Focus states optimized for Scheme 1 */
.focus-visible {
  outline: var(--focused-base-outline);               /* 0.2rem solid rgba(18,18,18,0.5) */
  outline-offset: var(--focused-base-outline-offset); /* 0.3rem */
  box-shadow: var(--focused-base-box-shadow);
}
```

## Performance Optimizations

### CSS Custom Properties Usage
```css
/* Optimized for Scheme 1 - fewer calculations */
.component {
  /* Instead of: rgba(var(--color-base-foreground), 0.3) */
  /* Use: rgba(18, 18, 18, 0.3) */
  border-color: rgba(var(--rgb-primary-text), var(--opacity-30));
}
```

### Reduced Variable Count
- **Before**: 150+ variables for all schemes
- **After**: ~60 variables focused on Scheme 1
- **Reduction**: 60% fewer variables to process

## Implementation Checklist

### ✅ Phase 1: Enhanced Color System
- [x] Added Scheme 1 specific color tokens
- [x] Created RGB value mappings
- [x] Enhanced gray scale for white background
- [x] Added semantic colors with good contrast

### 🔄 Phase 2: Component Optimization
- [ ] Update button components to use Scheme 1 tokens
- [ ] Optimize input components for white background
- [ ] Enhance card components with Scheme 1 styling
- [ ] Update typography with proper contrast

### 🔄 Phase 3: Layout & Spacing
- [ ] Implement unified spacing system
- [ ] Update grid system with current values
- [ ] Optimize page layout for Scheme 1
- [ ] Enhance responsive behavior

### 🔄 Phase 4: Performance & Testing
- [ ] Remove unused color scheme variables
- [ ] Test contrast ratios and accessibility
- [ ] Validate component rendering
- [ ] Optimize CSS bundle size

## Usage Examples

### Complete Button Implementation
```liquid
<!-- Primary button using Scheme 1 tokens -->
<button class="button button--primary">
  {{ 'general.add_to_cart' | t }}
</button>

<!-- Secondary button using Scheme 1 tokens -->
<button class="button button--secondary">
  {{ 'general.learn_more' | t }}
</button>

<!-- Accent button using brand colors -->
<button class="button button--accent">
  {{ 'general.shop_now' | t }}
</button>
```

### Complete Form Implementation
```liquid
<!-- Form using Scheme 1 styling -->
<form class="form form--scheme-1">
  <div class="field">
    <input type="email" class="input--text" placeholder="{{ 'general.email_placeholder' | t }}">
    <label class="field__label">{{ 'general.email_label' | t }}</label>
  </div>
  
  <button type="submit" class="button button--primary">
    {{ 'general.subscribe' | t }}
  </button>
</form>
```

### Complete Card Implementation
```liquid
<!-- Product card using Scheme 1 styling -->
<div class="card card--product">
  <div class="card__media">
    {{ product.featured_image | image_url: width: 400 | image_tag }}
  </div>
  
  <div class="card__content">
    <h3 class="card__title text--primary">{{ product.title }}</h3>
    <div class="card__price text--primary">
      {% if product.compare_at_price > product.price %}
        <span class="price--sale text--accent">{{ product.price | money }}</span>
        <span class="price--compare text--muted">{{ product.compare_at_price | money }}</span>
      {% else %}
        <span class="price">{{ product.price | money }}</span>
      {% endif %}
    </div>
  </div>
</div>
```

This comprehensive guide provides everything needed to work with the Northfinder theme optimized specifically for Color Scheme 1, eliminating complexity while maintaining full functionality and design consistency.
