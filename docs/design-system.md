# Northfinder Shopify Theme - Design System Documentation

## Overview

The Northfinder theme is a modern Shopify theme built with a hybrid approach using both Tailwind CSS v4.0 and custom CSS components. It follows Shopify's Liquid templating system with a component-based architecture.

## Architecture

### File Structure
```
├── assets/           # CSS, JS, and media files
├── config/           # Theme settings and configuration
├── layout/           # Main theme layout (theme.liquid)
├── locales/          # Translation files
├── sections/         # Reusable theme sections
├── snippets/         # Reusable Liquid components
└── templates/        # Page templates
```

### Technology Stack
- **CSS Framework**: Tailwind CSS v4.0 with custom design tokens
- **JavaScript**: Vanilla JS with custom components and HyperHTML
- **Templating**: Shopify Liquid
- **Build Tools**: Shopify CLI, Tailwind CLI, Prettier
- **Testing**: Vitest for JavaScript testing

## Design Tokens

### Colors

The Northfinder theme uses a comprehensive color system with CSS custom properties for consistency and maintainability.

#### Base Colors (Theme Settings)
```css
--color-background: rgb(var(--color-base-background));
--color-foreground: rgb(var(--color-base-foreground));
--color-secondary: rgb(var(--color-base-secondary-button));
--color-secondary-foreground: rgb(var(--color-base-secondary-button-text));
```

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

#### Usage Examples
```liquid
<!-- Using design tokens in Tailwind classes -->
<div class="bg-gray-200 text-gray-950">Search input</div>
<div class="bg-accent text-white">CTA button</div>
<div class="border-gray-400">Card border</div>

<!-- Using in custom CSS -->
.custom-component {
  background-color: rgb(var(--color-gray-100));
  border: 1px solid rgb(var(--color-border-light));
  color: rgb(var(--color-gray-850));
}
```

### Typography

```css
--font-archivo-expanded: "Archivo SemiExpanded", sans-serif;
```

**Font Families:**
- **Primary**: Archivo SemiExpanded (400, 500, 700 weights)
- **System Fallbacks**: ui-sans-serif, system-ui, sans-serif

### Spacing & Layout

```css
--spacing: 0.25rem;
--breakpoint-md: 46.875rem;
--breakpoint-lg: 61.875rem;
--breakpoint-xl: 87.5rem;
--radius-3: 0.1875rem;
```

### Animation & Transitions

```css
:root {
  --duration-short: 100ms;
  --duration-default: 200ms;
  --duration-medium: 300ms;
  --duration-long: 500ms;
  --ease-out-slow: cubic-bezier(0, 0, 0.3, 1);
  --power1-out: linear(0, 0.2342, 0.4374, 0.6093 37.49%, ...);
}
```

## Core Components

### 1. Buttons

**Base Button Component:**

```css
.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 0;
  padding: 0.75rem 1.25rem;
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: 500;
  border-radius: var(--buttons-radius-outset);
  min-width: calc(5rem + var(--buttons-border-width) * 2);
  min-height: calc(2rem + var(--buttons-border-width) * 2);
}
```

**Button Variants:**
- `.button--primary`: Default button style
- `.button--secondary`: Secondary button with different colors
- `.button--tertiary`: Larger button (1.2rem font, 1rem 1.5rem padding)
- `.button--small`: Smaller button (0.8125rem font, 0.625rem 1.25rem padding)
- `.button--full-width`: Full width button

**Usage:**
```liquid
<button class="button">Primary Button</button>
<button class="button button--secondary">Secondary Button</button>
<button class="button button--small">Small Button</button>
```

### 2. Form Fields

**Form Field Component:**

```liquid
{% comment %}
  Reusable form field component

  Accepts:
  - type: Input type (text, email, password, tel, etc.)
  - id: Input ID
  - name: Input name
  - value: Input value
  - label: Label text
  - required: Whether the field is required
{% endcomment %}

<div class="field">
  <input
    type="{{ type }}"
    id="{{ id }}"
    name="{{ name }}"
    class="field__input"
    value="{{ value | default: '' }}"
    {% if required %}required{% endif %}
  >
  <label class="field__label" for="{{ id }}">{{ label }}</label>
</div>
```

**Usage:**
```liquid
{% render 'form-field',
  type: 'email',
  id: 'customer-email',
  name: 'customer[email]',
  label: 'Email Address',
  required: true
%}
```

**Specialized Form Fields:**
- `phone-field.liquid`: International phone number input
- `checkbox-field.liquid`: Checkbox with label

### 3. Product Cards

**Product Card Component:**

```liquid
{% comment %}
  Renders a product card in the Northfinder style

  Accepts:
  - card_product: {Object} Product Liquid object (required)
  - section_id: {String} The ID of the section that contains this card (required)
  - show_vendor: {Boolean} Show the product vendor. Default: false
  - show_rating: {Boolean} Show the product rating. Default: false
  - lazy_load: {Boolean} Image should be lazy loaded. Default: true (optional)

  Usage:
  {% render 'card-product', card_product: product, section_id: section.id %}
{% endcomment %}
```

**Features:**
- Responsive image handling with multiple sizes
- Color variant swatches
- Model image detection and switching
- Hover effects and animations
- Price display with sale indicators
- Availability status

### 4. Swatches

**Swatch Component:**

```liquid
{% comment %}
  Renders a swatch.
  Accepts:
  - swatch: {SwatchDrop} the swatch drop
  - shape: {String} swatch shape. Accepts 'square', defaults to circle
  - thumbnail_url: {String} URL for the thumbnail image
{% endcomment %}

<span class="swatch{% if shape == 'square' %} swatch--square{% endif %}">
  {%- if thumbnail_url != blank -%}
    <img src="{{ thumbnail_url }}" alt="" class="swatch-thumbnail">
  {%- endif -%}
</span>
```

### 5. Price Component

**Price Display:**

```liquid
{% comment %}
  Renders a list of product's price (regular, sale)

  Accepts:
  - product: {Object} Product Liquid object
  - use_variant: {Boolean} Renders selected or first variant price
  - show_badges: {Boolean} Renders 'Sale' and 'Sold Out' tags
  - price_class: {String} Adds a price class to the price element
{% endcomment %}
```

### 6. Modal Components

**Auth Modal:**

```liquid
<div id="auth-modal" class="fixed inset-0 z-50 hidden overflow-y-auto opacity-0 transition-opacity duration-150">
  <!-- Modal Backdrop -->
  <div class="modal-backdrop absolute top-0 left-0 right-0 h-full bg-[#0f0f0f] opacity-40"></div>

  <!-- Modal Panel -->
  <div class="flex min-h-full items-center justify-center p-0 md:p-4">
    <div class="relative w-full md:max-w-md bg-background md:rounded-3">
      <!-- Modal Content -->
    </div>
  </div>
</div>
```

## Sections

### 1. Video Section

**Video Hero Component:**

```liquid
<div class="gradient">
  <div class="video-section isolate{% unless section.settings.full_width %} page-width{% endunless %} section-{{ section.id }}-padding relative">
    <div class="relative z-1 h-full pointer-events-auto">
      <div class="banner__content banner__content--{{ section.settings.desktop_content_position }}">
        <div class="banner__box content-container">
          {%- for block in section.blocks -%}
            {%- case block.type -%}
              {%- when 'heading' -%}
                <h2 class="banner__heading">{{ block.settings.heading }}</h2>
              {%- when 'text' -%}
                <div class="banner__text">{{ block.settings.text }}</div>
            {%- endcase -%}
          {%- endfor -%}
        </div>
      </div>
    </div>
  </div>
</div>
```

**Schema Settings:**
- Video upload or URL
- Cover image
- Content positioning
- Full width option
- Padding controls

### 2. Featured Collection

**Collection Grid:**

```liquid
<div class="collection-card__overlay">
  <h3 class="collection-card__title">{{ block.settings.custom_title }}</h3>
  <div class="collection-card__buttons">
    <a href="{{ block.settings.men_collection }}" class="collection-card__button">
      {{ 'general.discover_northfinder.for_men' | t }}
    </a>
    <a href="{{ block.settings.women_collection }}" class="collection-card__button">
      {{ 'general.discover_northfinder.for_women' | t }}
    </a>
  </div>
</div>
```

### 3. Activities Section

**Activity Cards:**

```liquid
<div class="activity-card relative">
  <div class="relative overflow-hidden h-full aspect-video">
    <img class="activity-image" src="{{ block.settings.image | image_url }}" alt="{{ block.settings.image.alt }}">
  </div>
  <div class="activity-content">
    <h3 class="activity-title font-archivo-expanded font-extrabold">{{ block.settings.activity_title }}</h3>
    <a href="{{ block.settings.link_url }}" class="activity-button">{{ block.settings.button_text }}</a>
  </div>
</div>
```

## CSS Architecture

### Component-Based CSS

The theme uses a component-based CSS architecture with dedicated files:

- `component-card.css` - Card components
- `component-button.css` - Button styles (in base.css)
- `component-slider.css` - Slider/carousel components
- `component-cart-notification.css` - Cart notification styles
- `component-predictive-search.css` - Search functionality

### Utility Classes

**Tailwind Integration:**
- Uses Tailwind v4.0 with custom design tokens
- Responsive utilities for mobile-first design
- Custom spacing and color utilities

**Common Patterns:**
```css
/* Responsive text sizing */
.text-base lg:text-2xl

/* Flexbox layouts */
.flex items-center justify-center

/* Spacing utilities */
.mb-3 lg:mb-6

/* Custom font family */
.font-archivo-expanded
```

## JavaScript Components

### Custom Elements

**Modal Opener:**

```javascript
class ModalOpener extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector('button');
    if (!button) return;
    button.addEventListener('click', () => {
      const modal = document.querySelector(this.getAttribute('data-modal'));
      if (modal) modal.show(button);
    });
  }
}
customElements.define('modal-opener', ModalOpener);
```

### Predictive Search

**Search Component:**

```javascript
const html = template`
<div class="nf__predictive-search-results">
  <div class="nf__predictive-search__results-groups-wrapper">
    ${!hasResults ?
      hyperHTML.wire()`
        <div class="nf__predictive-search__no-results">
          <p class="nf__predictive-search__no-results-text">${window.theme?.strings?.search?.no_results}</p>
        </div>
      ` :
      ['collections', 'articles', 'products'].map((type) => {
        const items = results[type] || [];
        return items.length ? renderResultGroup(type, items) : null;
      })
    }
  </div>
</div>
`;
```

## Responsive Design

### Breakpoints

```css
--breakpoint-sm: 40rem;      /* 640px */
--breakpoint-md: 46.875rem;  /* 750px */
--breakpoint-lg: 61.875rem;  /* 990px */
--breakpoint-xl: 87.5rem;    /* 1400px */
```

### Mobile-First Approach

The theme follows a mobile-first responsive design approach:

```liquid
<!-- Mobile layout -->
<div class="block md:hidden">Mobile content</div>

<!-- Desktop layout -->
<div class="hidden md:block">Desktop content</div>

<!-- Responsive text -->
<h2 class="text-base lg:text-2xl">Responsive heading</h2>
```

## Accessibility Features

### Focus Management
- Custom focus styles with proper contrast
- Keyboard navigation support
- Screen reader friendly markup

### ARIA Support
- Proper ARIA labels and roles
- Live regions for dynamic content
- Semantic HTML structure

## Performance Optimizations

### Image Optimization
- Responsive images with multiple sizes
- Lazy loading by default
- WebP format support

### CSS Loading
- Critical CSS inlined
- Non-critical CSS loaded asynchronously
- Component-based CSS splitting

### JavaScript
- Deferred loading of non-critical scripts
- Custom elements for progressive enhancement
- Minimal dependencies

## Usage Guidelines

### Adding New Components

1. **Create the Liquid snippet** in `/snippets/`
2. **Add corresponding CSS** in `/assets/component-[name].css`
3. **Include CSS in layout** or section where used
4. **Document parameters** in component comments
5. **Add responsive behavior** using Tailwind utilities

### Styling Conventions

- Use Tailwind utilities for spacing, colors, and layout
- Create component-specific CSS for complex styling
- Follow BEM methodology for custom CSS classes
- Use CSS custom properties for theming

### Testing

- Test components across all breakpoints
- Verify accessibility with screen readers
- Check performance impact
- Validate HTML and CSS

## Component Reference

### Available Sections

| Section | File | Description |
|---------|------|-------------|
| Video | `sections/video.liquid` | Hero video with overlay content |
| Featured Collection | `sections/featured-collection.liquid` | Collection grid with dual gender links |
| Activities | `sections/activities.liquid` | Activity cards with images and CTAs |
| Feature Products | `sections/feature-products.liquid` | Product showcase section |
| Materials | `sections/materials.liquid` | Material showcase section |
| Blog Posts | `sections/featured-blog.liquid` | Blog post grid |
| Header | `sections/header.liquid` | Site navigation and branding |
| Footer | `sections/footer.liquid` | Site footer with links |

### Available Snippets

| Snippet | File | Description |
|---------|------|-------------|
| Product Card | `snippets/card-product.liquid` | Product display card |
| Form Field | `snippets/form-field.liquid` | Reusable form input |
| Phone Field | `snippets/phone-field.liquid` | International phone input |
| Checkbox Field | `snippets/checkbox-field.liquid` | Checkbox with label |
| Price | `snippets/price.liquid` | Product price display |
| Swatch | `snippets/swatch.liquid` | Color/variant swatch |
| Auth Modal | `snippets/auth-modal.liquid` | Login/register modal |

### CSS Components

| Component | File | Description |
|-----------|------|-------------|
| Base Styles | `assets/base.css` | Core styles and buttons |
| Cards | `assets/component-card.css` | Card component styles |
| Slider | `assets/component-slider.css` | Carousel/slider styles |
| Cart | `assets/component-cart-notification.css` | Cart notification styles |
| Search | `assets/component-predictive-search.css` | Search functionality styles |
| Tailwind | `assets/application.css` | Generated Tailwind CSS |

This design system documentation provides a comprehensive overview of the Northfinder theme's component architecture, styling patterns, and usage guidelines. It serves as a reference for developers working with or extending the theme.
