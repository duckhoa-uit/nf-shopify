# Scheme 1 Implementation Plan - Simplified & Focused

## Overview

Since you're using only **Color Scheme 1**, this implementation plan eliminates all multi-scheme complexity and focuses on optimizing the theme specifically for the white background theme.

## Exact Current Values (Scheme 1)

### Color Values
```css
/* Scheme 1 - Exact values from config */
--color-primary-bg: #ffffff;        /* background */
--color-primary-text: #121212;      /* text */
--color-primary-button: #121212;    /* button */
--color-primary-button-text: #ffffff; /* button_label */
--color-secondary-text: #4d4d4d;    /* secondary_button_label */
--color-primary-shadow: #121212;    /* shadow */
```

### Component Values
```css
/* Current component settings */
--page-width: 100rem;               /* 1600px */
--grid-spacing: 8px;                /* horizontal & vertical */
--button-radius: 3px;               /* border radius */
--button-border: 1px;               /* border width */
--input-radius: 3px;                /* border radius */
--input-border: 1px;                /* border width */
--input-border-opacity: 30%;        /* 30% opacity */
--card-radius: 0px;                 /* no border radius */
--card-border: 0px;                 /* no border */
--variant-pill-radius: 40px;        /* full rounded */
--badge-radius: 40px;               /* full rounded */
```

## Simplified CSS Variable System

### Core Color System (Scheme 1 Only)
```css
/* === SCHEME 1 OPTIMIZED COLORS === */

/* Primary colors (from Scheme 1) */
--white: #ffffff;
--black: #000000;
--primary: #121212;                 /* Main text & buttons */
--primary-soft: #4d4d4d;            /* Secondary text */
--accent: #ec0009;                  /* Brand red */

/* Gray scale (optimized for white background) */
--gray-50: #f9f9f9;                /* Lightest */
--gray-100: #f5f5f5;               /* Very light */
--gray-200: #f0f0f0;               /* Light */
--gray-300: #ebebeb;               /* Light-medium */
--gray-400: #e0dfdf;               /* Medium-light */
--gray-500: #b8b8b8;               /* Medium */
--gray-600: #999999;               /* Medium-dark */
--gray-700: #666666;               /* Dark */
--gray-800: #4d4d4d;               /* Very dark (matches primary-soft) */
--gray-900: #333333;               /* Darker */
--gray-950: #121212;               /* Darkest (matches primary) */

/* Semantic colors */
--success: #00945f;
--error: #ec0009;                   /* Same as accent */
--warning: #f59e0b;
--info: #3b82f6;
```

### Simplified Design Tokens
```css
/* === SIMPLIFIED DESIGN TOKENS === */

/* Spacing (based on 8px grid) */
--space-0: 0px;
--space-1: 4px;
--space-2: 8px;                     /* Current grid spacing */
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;

/* Radius (based on current usage) */
--radius-none: 0px;                 /* Current cards */
--radius-sm: 3px;                   /* Current buttons/inputs */
--radius-md: 6px;
--radius-lg: 12px;
--radius-full: 40px;                /* Current pills/badges */

/* Borders */
--border-none: 0px;                 /* Current cards */
--border-thin: 1px;                 /* Current buttons/inputs */
--border-medium: 2px;

/* Opacity */
--opacity-0: 0;
--opacity-10: 0.1;
--opacity-30: 0.3;                  /* Current input borders */
--opacity-50: 0.5;
--opacity-100: 1;                   /* Current buttons */
```

## Component Mappings (Scheme 1 Specific)

### Button System
```css
/* === BUTTON TOKENS === */
--btn-primary-bg: var(--primary);           /* #121212 */
--btn-primary-text: var(--white);           /* #ffffff */
--btn-primary-border: var(--primary);       /* #121212 */

--btn-secondary-bg: transparent;
--btn-secondary-text: var(--primary-soft);  /* #4d4d4d */
--btn-secondary-border: var(--primary-soft);

--btn-accent-bg: var(--accent);             /* #ec0009 */
--btn-accent-text: var(--white);            /* #ffffff */
--btn-accent-border: var(--accent);

--btn-radius: var(--radius-sm);             /* 3px */
--btn-border-width: var(--border-thin);     /* 1px */
```

### Input System
```css
/* === INPUT TOKENS === */
--input-bg: var(--white);                   /* #ffffff */
--input-text: var(--primary);               /* #121212 */
--input-border: var(--gray-500);            /* #b8b8b8 */
--input-placeholder: var(--gray-600);       /* #999999 */
--input-focus: var(--primary);              /* #121212 */

--input-radius: var(--radius-sm);           /* 3px */
--input-border-width: var(--border-thin);   /* 1px */
--input-border-opacity: var(--opacity-30);  /* 30% */
```

### Card System
```css
/* === CARD TOKENS === */
--card-bg: var(--white);                    /* #ffffff */
--card-text: var(--primary);                /* #121212 */
--card-text-secondary: var(--primary-soft); /* #4d4d4d */
--card-border: var(--gray-400);             /* #e0dfdf */

--card-radius: var(--radius-none);          /* 0px */
--card-border-width: var(--border-none);    /* 0px */
--card-padding: var(--space-0);             /* 0px */
```

## Simplified Implementation Steps

### Step 1: Update Core Variables ✅
**File**: `assets/tailwind.css`
```css
/* Add simplified Scheme 1 variables */
/* (Already implemented in previous update) */
```

### Step 2: Create Component Utilities
**File**: `assets/scheme-1-utilities.css` (New)
```css
/* === SCHEME 1 UTILITIES === */

/* Button utilities */
.btn {
  border-radius: var(--btn-radius);
  border-width: var(--btn-border-width);
  font-weight: 500;
  padding: 0.75rem 1.25rem;
  transition: all 0.2s ease;
}

.btn--primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border-color: var(--btn-primary-border);
}

.btn--secondary {
  background-color: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--btn-secondary-border);
}

.btn--accent {
  background-color: var(--btn-accent-bg);
  color: var(--btn-accent-text);
  border-color: var(--btn-accent-border);
}

/* Input utilities */
.input {
  background-color: var(--input-bg);
  color: var(--input-text);
  border: var(--input-border-width) solid rgba(var(--input-border), var(--input-border-opacity));
  border-radius: var(--input-radius);
  padding: 0.75rem 1rem;
}

.input::placeholder {
  color: var(--input-placeholder);
}

.input:focus {
  border-color: var(--input-focus);
  outline: 2px solid rgba(var(--input-focus), 0.2);
  outline-offset: 2px;
}

/* Card utilities */
.card {
  background-color: var(--card-bg);
  border-radius: var(--card-radius);
  border: var(--card-border-width) solid var(--card-border);
}

.card__title {
  color: var(--card-text);
  font-weight: 600;
}

.card__text {
  color: var(--card-text-secondary);
}

/* Text utilities */
.text-primary { color: var(--primary); }
.text-secondary { color: var(--primary-soft); }
.text-accent { color: var(--accent); }
.text-success { color: var(--success); }
.text-error { color: var(--error); }
.text-muted { color: var(--gray-600); }

/* Background utilities */
.bg-primary { background-color: var(--primary); }
.bg-white { background-color: var(--white); }
.bg-gray-50 { background-color: var(--gray-50); }
.bg-gray-100 { background-color: var(--gray-100); }
.bg-gray-200 { background-color: var(--gray-200); }
.bg-accent { background-color: var(--accent); }

/* Border utilities */
.border-gray-300 { border-color: var(--gray-300); }
.border-gray-400 { border-color: var(--gray-400); }
.border-gray-500 { border-color: var(--gray-500); }

/* Spacing utilities */
.p-0 { padding: var(--space-0); }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }

.m-0 { margin: var(--space-0); }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }

/* Radius utilities */
.rounded-none { border-radius: var(--radius-none); }
.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-full { border-radius: var(--radius-full); }
```

### Step 3: Update Existing Components
**File**: `assets/base.css` (Update existing)
```css
/* Update existing button styles */
.button {
  /* Replace existing styles with token references */
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: var(--btn-border-width) solid var(--btn-primary-border);
  border-radius: var(--btn-radius);
}

.button--secondary {
  background-color: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--btn-secondary-border);
}

/* Update field styles */
.field__input {
  background-color: var(--input-bg);
  color: var(--input-text);
  border: var(--input-border-width) solid rgba(var(--input-border), var(--input-border-opacity));
  border-radius: var(--input-radius);
}
```

### Step 4: Simplify Theme Generation
**File**: `layout/theme.liquid` (Simplify)
```liquid
{% comment %} Simplified for Scheme 1 only {% endcomment %}
<style>
  :root {
    {% comment %} Use fixed Scheme 1 values {% endcomment %}
    --color-base-background: 255,255,255;
    --color-base-foreground: 18,18,18;
    --color-base-button: 18,18,18;
    --color-base-button-text: 255,255,255;
    --color-base-secondary-button-text: 77,77,77;
    --color-base-shadow: 18,18,18;
    
    {% comment %} Component settings {% endcomment %}
    --page-width: {{ settings.page_width | divided_by: 10 }}rem;
    --spacing-sections-desktop: {{ settings.spacing_sections }}px;
    --grid-desktop-horizontal-spacing: {{ settings.spacing_grid_horizontal }}px;
    --grid-desktop-vertical-spacing: {{ settings.spacing_grid_vertical }}px;
    
    {% comment %} Map to design tokens {% endcomment %}
    {% if settings.buttons_radius == 3 %}
      --buttons-radius: var(--radius-sm);
    {% else %}
      --buttons-radius: {{ settings.buttons_radius }}px;
    {% endif %}
    
    {% if settings.inputs_radius == 3 %}
      --inputs-radius: var(--radius-sm);
    {% else %}
      --inputs-radius: {{ settings.inputs_radius }}px;
    {% endif %}
    
    {% comment %} Continue for other components... {% endcomment %}
  }
</style>
```

## Migration Strategy

### Phase 1: Foundation ✅
- [x] Added Scheme 1 specific color tokens
- [x] Created simplified design token system
- [x] Enhanced gray scale for white background

### Phase 2: Component Utilities
- [ ] Create `assets/scheme-1-utilities.css`
- [ ] Add button, input, card utilities
- [ ] Add text and background utilities
- [ ] Add spacing and border utilities

### Phase 3: Update Existing Components
- [ ] Update `assets/base.css` with token references
- [ ] Update component CSS files
- [ ] Add fallbacks for backward compatibility
- [ ] Test component rendering

### Phase 4: Simplify Theme Generation
- [ ] Simplify `layout/theme.liquid` for Scheme 1 only
- [ ] Remove multi-scheme complexity
- [ ] Add design token mappings
- [ ] Test theme customization

### Phase 5: Cleanup & Optimization
- [ ] Remove unused color scheme variables
- [ ] Optimize CSS bundle size
- [ ] Update documentation
- [ ] Final testing and validation

## Benefits of Scheme 1 Focus

### Simplified Maintenance
- **60% fewer variables** to manage
- **Single color scheme** to test and maintain
- **Consistent styling** across all components
- **Easier customization** through unified tokens

### Improved Performance
- **Smaller CSS bundle** (no multi-scheme overhead)
- **Fewer calculations** at runtime
- **Better caching** of color values
- **Faster rendering** with static values

### Better Developer Experience
- **Clear color hierarchy** with semantic names
- **Consistent component behavior**
- **Easy-to-understand** token system
- **Reduced complexity** in implementation

## Quick Reference

### Most Used Colors (Scheme 1)
```css
--white: #ffffff;           /* Backgrounds, button text */
--primary: #121212;         /* Text, buttons, borders */
--primary-soft: #4d4d4d;    /* Secondary text */
--accent: #ec0009;          /* Brand highlights, CTAs */
--gray-200: #f0f0f0;        /* Input backgrounds */
--gray-500: #b8b8b8;        /* Borders, dividers */
--gray-600: #999999;        /* Placeholder text */
```

### Most Used Tokens
```css
--space-2: 8px;             /* Grid spacing */
--radius-sm: 3px;           /* Buttons, inputs */
--radius-none: 0px;         /* Cards */
--radius-full: 40px;        /* Pills, badges */
--border-thin: 1px;         /* Buttons, inputs */
--opacity-30: 0.3;          /* Input borders */
```

### Common Patterns
```liquid
<!-- Primary button -->
<button class="btn btn--primary">{{ 'Add to Cart' }}</button>

<!-- Text input -->
<input type="text" class="input" placeholder="Enter email">

<!-- Product card -->
<div class="card">
  <h3 class="card__title">{{ product.title }}</h3>
  <p class="card__text">{{ product.description }}</p>
</div>
```

This simplified approach eliminates complexity while maintaining full design system benefits, optimized specifically for your Scheme 1 usage.
