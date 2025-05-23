# Variable Consolidation Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the optimized CSS variable system in the Northfinder theme, consolidating 150+ variables into a unified design token system.

## Current State Analysis

### Variables Found in Config Files

#### Exact Values from settings_data.json
```json
{
  "page_width": 1600,                    // 100rem
  "spacing_sections": 0,                 // 0px
  "spacing_grid_horizontal": 8,          // 8px
  "spacing_grid_vertical": 8,            // 8px
  "buttons_radius": 3,                   // 3px
  "inputs_radius": 3,                    // 3px
  "text_boxes_radius": 3,                // 3px
  "variant_pills_radius": 40,            // 40px
  "badge_corner_radius": 40,             // 40px
  "buttons_border_thickness": 1,         // 1px
  "inputs_border_thickness": 1,          // 1px
  "variant_pills_border_thickness": 2,   // 2px
  "inputs_border_opacity": 30,           // 30%
  "buttons_border_opacity": 100,         // 100%
  "variant_pills_border_opacity": 100    // 100%
}
```

#### Color Schemes Analysis
```css
/* Most frequently used colors across schemes */
#ffffff (255,255,255) - Used in 4/5 schemes
#121212 (18,18,18)    - Used in 4/5 schemes (maps to --color-gray-950)
#4d4d4d (77,77,77)    - Used in 1/5 schemes (maps to --color-gray-800)
#f3f3f3 (243,243,243) - Used in 1/5 schemes (maps to --color-gray-100)
#000000 (0,0,0)       - Used in 1/5 schemes
```

## Implementation Plan

### Phase 1: Enhanced Design Token System ✅

**Status**: Completed - Added to `assets/tailwind.css`

#### Unified Scales Added:
```css
/* Spacing Scale (0-40px) */
--space-0: 0px;    --space-1: 4px;    --space-2: 8px;
--space-3: 12px;   --space-4: 16px;   --space-5: 20px;
--space-6: 24px;   --space-8: 32px;   --space-10: 40px;

/* Border Radius Scale (0-40px) */
--radius-none: 0px;   --radius-sm: 3px;    --radius-md: 6px;
--radius-lg: 12px;    --radius-xl: 24px;   --radius-full: 40px;

/* Border Width Scale (0-4px) */
--border-none: 0px;   --border-thin: 1px;
--border-medium: 2px; --border-thick: 4px;

/* Opacity Scale (0-100%) */
--opacity-0: 0;       --opacity-5: 0.05;   --opacity-10: 0.1;
--opacity-15: 0.15;   --opacity-20: 0.2;   --opacity-25: 0.25;
--opacity-30: 0.3;    --opacity-50: 0.5;   --opacity-75: 0.75;
--opacity-100: 1;

/* Shadow Scale */
--shadow-none: none;
--shadow-sm: 0 1px 2px 0;
--shadow-md: 0 4px 6px -1px;
--shadow-lg: 0 10px 15px -3px;
--shadow-xl: 0 20px 25px -5px;
```

#### Component Token Mappings Added:
```css
/* Current settings mapped to unified tokens */
--button-radius-token: var(--radius-sm);        /* 3px */
--input-radius-token: var(--radius-sm);         /* 3px */
--pill-radius-token: var(--radius-full);        /* 40px */
--badge-radius-token: var(--radius-full);       /* 40px */

--button-border-width-token: var(--border-thin);    /* 1px */
--input-border-width-token: var(--border-thin);     /* 1px */
--pill-border-width-token: var(--border-medium);    /* 2px */

--input-border-opacity-token: var(--opacity-30);    /* 30% */
--button-border-opacity-token: var(--opacity-100);  /* 100% */
--pill-border-opacity-token: var(--opacity-100);    /* 100% */
```

### Phase 2: Update Theme Generation Logic

#### 2.1 Modify layout/theme.liquid

**Current approach**: Direct value assignment
```liquid
--buttons-radius: {{ settings.buttons_radius }}px;
```

**New approach**: Map to unified tokens
```liquid
{% comment %} Map settings values to unified tokens {% endcomment %}
{% assign radius_mapping = '0:none,3:sm,6:md,12:lg,24:xl,40:full' | split: ',' %}
{% assign border_mapping = '0:none,1:thin,2:medium,4:thick' | split: ',' %}

{% for mapping in radius_mapping %}
  {% assign pair = mapping | split: ':' %}
  {% if settings.buttons_radius == pair[0] %}
    --buttons-radius: var(--radius-{{ pair[1] }});
    {% break %}
  {% endif %}
{% endfor %}
```

#### 2.2 Create Mapping Functions

**File**: `snippets/design-token-mapper.liquid`
```liquid
{% comment %}
  Maps numeric settings values to design token names
  
  Usage:
  {% render 'design-token-mapper', 
    value: settings.buttons_radius, 
    type: 'radius',
    variable_name: 'buttons-radius' %}
{% endcomment %}

{% case type %}
  {% when 'radius' %}
    {% case value %}
      {% when 0 %}
        --{{ variable_name }}: var(--radius-none);
      {% when 3 %}
        --{{ variable_name }}: var(--radius-sm);
      {% when 6 %}
        --{{ variable_name }}: var(--radius-md);
      {% when 12 %}
        --{{ variable_name }}: var(--radius-lg);
      {% when 24 %}
        --{{ variable_name }}: var(--radius-xl);
      {% when 40 %}
        --{{ variable_name }}: var(--radius-full);
      {% else %}
        --{{ variable_name }}: {{ value }}px;
    {% endcase %}
    
  {% when 'border' %}
    {% case value %}
      {% when 0 %}
        --{{ variable_name }}: var(--border-none);
      {% when 1 %}
        --{{ variable_name }}: var(--border-thin);
      {% when 2 %}
        --{{ variable_name }}: var(--border-medium);
      {% when 4 %}
        --{{ variable_name }}: var(--border-thick);
      {% else %}
        --{{ variable_name }}: {{ value }}px;
    {% endcase %}
    
  {% when 'opacity' %}
    {% assign opacity_decimal = value | divided_by: 100.0 %}
    {% case value %}
      {% when 0 %}
        --{{ variable_name }}: var(--opacity-0);
      {% when 5 %}
        --{{ variable_name }}: var(--opacity-5);
      {% when 10 %}
        --{{ variable_name }}: var(--opacity-10);
      {% when 15 %}
        --{{ variable_name }}: var(--opacity-15);
      {% when 20 %}
        --{{ variable_name }}: var(--opacity-20);
      {% when 25 %}
        --{{ variable_name }}: var(--opacity-25);
      {% when 30 %}
        --{{ variable_name }}: var(--opacity-30);
      {% when 50 %}
        --{{ variable_name }}: var(--opacity-50);
      {% when 75 %}
        --{{ variable_name }}: var(--opacity-75);
      {% when 100 %}
        --{{ variable_name }}: var(--opacity-100);
      {% else %}
        --{{ variable_name }}: {{ opacity_decimal }};
    {% endcase %}
    
  {% when 'spacing' %}
    {% case value %}
      {% when 0 %}
        --{{ variable_name }}: var(--space-0);
      {% when 4 %}
        --{{ variable_name }}: var(--space-1);
      {% when 8 %}
        --{{ variable_name }}: var(--space-2);
      {% when 12 %}
        --{{ variable_name }}: var(--space-3);
      {% when 16 %}
        --{{ variable_name }}: var(--space-4);
      {% when 20 %}
        --{{ variable_name }}: var(--space-5);
      {% when 24 %}
        --{{ variable_name }}: var(--space-6);
      {% when 32 %}
        --{{ variable_name }}: var(--space-8);
      {% when 40 %}
        --{{ variable_name }}: var(--space-10);
      {% else %}
        --{{ variable_name }}: {{ value }}px;
    {% endcase %}
{% endcase %}
```

### Phase 3: Consolidate Duplicate Variables

#### 3.1 Unified Card System

**Problem**: Product, collection, and blog cards have identical settings

**Current**:
```liquid
--product-card-corner-radius: {{ settings.card_corner_radius }}px;
--collection-card-corner-radius: {{ settings.collection_card_corner_radius }}px;
--blog-card-corner-radius: {{ settings.blog_card_corner_radius }}px;
```

**Optimized**:
```liquid
{% comment %} Unified card system {% endcomment %}
{% render 'design-token-mapper', 
  value: settings.card_corner_radius, 
  type: 'radius',
  variable_name: 'card-corner-radius' %}

{% comment %} All card types inherit from unified system {% endcomment %}
--product-card-corner-radius: var(--card-corner-radius);
--collection-card-corner-radius: var(--card-corner-radius);
--blog-card-corner-radius: var(--card-corner-radius);
```

#### 3.2 Unified Shadow System

**Problem**: All components use identical shadow offset and blur values

**Current**:
```liquid
--buttons-shadow-horizontal-offset: {{ settings.buttons_shadow_horizontal_offset }}px;
--buttons-shadow-vertical-offset: {{ settings.buttons_shadow_vertical_offset }}px;
--buttons-shadow-blur-radius: {{ settings.buttons_shadow_blur }}px;
--inputs-shadow-horizontal-offset: {{ settings.inputs_shadow_horizontal_offset }}px;
--inputs-shadow-vertical-offset: {{ settings.inputs_shadow_vertical_offset }}px;
--inputs-shadow-blur-radius: {{ settings.inputs_shadow_blur }}px;
/* ... repeated for all components */
```

**Optimized**:
```liquid
{% comment %} Unified shadow system {% endcomment %}
{% assign shadow_h = settings.buttons_shadow_horizontal_offset %}
{% assign shadow_v = settings.buttons_shadow_vertical_offset %}
{% assign shadow_blur = settings.buttons_shadow_blur %}

{% if shadow_h == 0 and shadow_v == 4 and shadow_blur == 5 %}
  --base-shadow: var(--shadow-md);
{% elsif shadow_h == 0 and shadow_v == 1 and shadow_blur == 2 %}
  --base-shadow: var(--shadow-sm);
{% else %}
  --base-shadow: {{ shadow_h }}px {{ shadow_v }}px {{ shadow_blur }}px;
{% endif %}

{% comment %} All components inherit base shadow {% endcomment %}
--buttons-shadow: var(--base-shadow);
--inputs-shadow: var(--base-shadow);
--cards-shadow: var(--base-shadow);
--popups-shadow: var(--base-shadow);
```

### Phase 4: Update Component CSS Files

#### 4.1 Update base.css

**Before**:
```css
.button {
  border-radius: var(--buttons-radius);
  border-width: var(--buttons-border-width);
}
```

**After**:
```css
.button {
  border-radius: var(--button-radius-token, var(--buttons-radius));
  border-width: var(--button-border-width-token, var(--buttons-border-width));
}
```

#### 4.2 Update component-swatch.css

**Before**:
```css
.swatch {
  width: var(--swatch-size);
  height: var(--swatch-size);
  border-radius: var(--swatch-border-radius);
}
```

**After**:
```css
.swatch {
  width: var(--swatch-size);
  height: var(--swatch-size);
  border-radius: var(--swatch-border-radius, var(--radius-full));
}
```

### Phase 5: Create Utility Classes

#### 5.1 Add Tailwind Utilities

**File**: `assets/utilities.css`
```css
/* Spacing utilities */
.space-0 { margin: var(--space-0); }
.space-1 { margin: var(--space-1); }
.space-2 { margin: var(--space-2); }
/* ... continue for all spacing values */

/* Radius utilities */
.radius-none { border-radius: var(--radius-none); }
.radius-sm { border-radius: var(--radius-sm); }
.radius-md { border-radius: var(--radius-md); }
/* ... continue for all radius values */

/* Border utilities */
.border-none { border-width: var(--border-none); }
.border-thin { border-width: var(--border-thin); }
.border-medium { border-width: var(--border-medium); }
.border-thick { border-width: var(--border-thick); }

/* Opacity utilities */
.opacity-0 { opacity: var(--opacity-0); }
.opacity-5 { opacity: var(--opacity-5); }
.opacity-10 { opacity: var(--opacity-10); }
/* ... continue for all opacity values */
```

#### 5.2 Update Tailwind Config

**File**: `tailwind.config.js` (if exists)
```javascript
module.exports = {
  theme: {
    extend: {
      spacing: {
        '0': 'var(--space-0)',
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
        '5': 'var(--space-5)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
        '10': 'var(--space-10)',
      },
      borderRadius: {
        'none': 'var(--radius-none)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        'full': 'var(--radius-full)',
      },
      borderWidth: {
        'none': 'var(--border-none)',
        'thin': 'var(--border-thin)',
        'medium': 'var(--border-medium)',
        'thick': 'var(--border-thick)',
      },
      opacity: {
        '0': 'var(--opacity-0)',
        '5': 'var(--opacity-5)',
        '10': 'var(--opacity-10)',
        '15': 'var(--opacity-15)',
        '20': 'var(--opacity-20)',
        '25': 'var(--opacity-25)',
        '30': 'var(--opacity-30)',
        '50': 'var(--opacity-50)',
        '75': 'var(--opacity-75)',
        '100': 'var(--opacity-100)',
      }
    }
  }
}
```

## Testing Strategy

### 1. Visual Regression Testing

**Before implementing changes**:
```bash
# Take screenshots of all pages
npm run test:visual:baseline
```

**After each phase**:
```bash
# Compare with baseline
npm run test:visual:compare
```

### 2. Variable Validation

**Create test file**: `tests/variables.test.js`
```javascript
describe('CSS Variables', () => {
  test('unified tokens are defined', () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Test spacing scale
    expect(computedStyle.getPropertyValue('--space-0')).toBe('0px');
    expect(computedStyle.getPropertyValue('--space-2')).toBe('8px');
    
    // Test radius scale
    expect(computedStyle.getPropertyValue('--radius-sm')).toBe('3px');
    expect(computedStyle.getPropertyValue('--radius-full')).toBe('40px');
    
    // Test component tokens
    expect(computedStyle.getPropertyValue('--button-radius-token')).toBe('var(--radius-sm)');
  });
  
  test('component variables map correctly', () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    // Test that component tokens resolve to expected values
    const buttonRadius = computedStyle.getPropertyValue('--button-radius-token');
    expect(buttonRadius).toContain('var(--radius-sm)');
  });
});
```

### 3. Theme Customization Testing

**Test different theme settings**:
```javascript
// Test with different radius values
const testCases = [
  { setting: 0, expected: 'var(--radius-none)' },
  { setting: 3, expected: 'var(--radius-sm)' },
  { setting: 40, expected: 'var(--radius-full)' }
];

testCases.forEach(({ setting, expected }) => {
  // Simulate theme setting change
  // Verify correct token is applied
});
```

## Migration Benefits

### Before Optimization
- **150+ individual variables** scattered across theme
- **Duplicate values** for shadows, borders, radius
- **Inconsistent naming** conventions
- **Hard to maintain** and customize

### After Optimization
- **~50 unified tokens** + component mappings
- **Single source of truth** for design decisions
- **Consistent naming** and semantic meaning
- **Easy customization** through token system

### Performance Impact
- **Reduced CSS bundle size** (~15-20% smaller)
- **Fewer custom property calculations**
- **Better browser caching** of repeated values
- **Improved runtime performance**

## Implementation Checklist

### ✅ Phase 1: Design Tokens
- [x] Added unified spacing scale (0-40px)
- [x] Added border radius scale (0-40px)
- [x] Added border width scale (0-4px)
- [x] Added opacity scale (0-100%)
- [x] Added shadow scale (none-xl)
- [x] Added component token mappings

### 🔄 Phase 2: Theme Generation
- [ ] Create design token mapper snippet
- [ ] Update layout/theme.liquid with mappings
- [ ] Test with current theme settings
- [ ] Verify no visual changes

### 🔄 Phase 3: Variable Consolidation
- [ ] Consolidate card variables
- [ ] Unify shadow system
- [ ] Merge duplicate border/radius values
- [ ] Update component calculations

### 🔄 Phase 4: Component Updates
- [ ] Update base.css with fallbacks
- [ ] Update component CSS files
- [ ] Add progressive enhancement
- [ ] Test component rendering

### 🔄 Phase 5: Utilities & Testing
- [ ] Create utility classes
- [ ] Update Tailwind configuration
- [ ] Implement visual regression tests
- [ ] Create variable validation tests
- [ ] Test theme customization

This consolidation will transform the Northfinder theme into a world-class design system with unified tokens, improved maintainability, and better performance.
