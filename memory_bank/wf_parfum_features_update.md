# Parfum Features Section Update - Figma Design Implementation

## Current Task
Update existing parfum features section to match new Figma design specifications

## Design Analysis Results

### Key Changes Identified from Figma:
1. **Background Color**: #F9F9F9 (light gray background)
2. **Asymmetric Padding**: Header has padding 0px 150px 0px 60px (right 150px, left 60px)
3. **Section Padding**: Default 100px top/bottom instead of 36px
4. **Card Height**: Fixed height 240px instead of min-height
5. **Spacing**: Maintained 60px gap between header and cards (already correct)

### Figma Specifications:
- **Main Container**: Column layout, 60px gap, 100px vertical padding, #F9F9F9 background
- **Header Container**: Asymmetric padding (0px 150px 0px 60px)
- **Cards Container**: Row layout, 20px gap, center justified
- **Individual Cards**: 240px fixed height, 30px internal gap, white background, 1px border
- **Typography**: Montserrat 500 38px for heading, Manrope 400 16px for description

## Implementation Changes Made

### 1. CSS Updates (`assets/section-parfum-features.css`)

**Background Color:**
```css
--parfum-features-bg: #F9F9F9; /* Changed from rgb(var(--color-background)) */
```

**Header Asymmetric Padding:**
```css
.parfum-features__header {
  padding: 0 6rem 0 6rem; /* Base symmetric padding */
}

@media screen and (min-width: 990px) {
  .parfum-features__header {
    padding: 0 15rem 0 6rem; /* Asymmetric for desktop */
  }
}
```

**Card Height:**
```css
.parfum-features__card {
  height: 24rem; /* Changed from min-height: 24rem */
}

@media screen and (max-width: 749px) {
  .parfum-features__card {
    height: 20rem; /* Smaller height for mobile */
  }
}
```

**Mobile Responsive Updates:**
```css
@media screen and (max-width: 749px) {
  .parfum-features__header {
    padding: 0 1rem; /* Symmetric padding for mobile */
  }
  
  .parfum-features__description {
    padding: 0; /* Remove extra padding */
  }
}
```

### 2. Schema Updates (`sections/parfum-features.liquid`)

**Default Padding Values:**
```json
{
  "id": "padding_top",
  "max": 200,
  "default": 100
},
{
  "id": "padding_bottom", 
  "max": 200,
  "default": 100
}
```

### 3. Template Updates (`templates/page.parfum.json`)

**Updated Padding Values:**
```json
"settings": {
  "padding_top": 100,
  "padding_bottom": 100
}
```

## Responsive Design Strategy

### Desktop (≥990px):
- Asymmetric header padding: 0 15rem 0 6rem
- 4-column card grid
- Fixed card height: 24rem (240px)

### Tablet (750px-989px):
- Symmetric header padding: 0 6rem
- 2-column card grid
- Fixed card height: 24rem (240px)

### Mobile (≤749px):
- Minimal header padding: 0 1rem
- Single column card grid
- Reduced card height: 20rem (200px)

## Files Modified

1. **`assets/section-parfum-features.css`** - Updated styling to match Figma design
2. **`sections/parfum-features.liquid`** - Updated default padding values in schema
3. **`templates/page.parfum.json`** - Updated section settings to use new padding values

## No Breaking Changes

- HTML structure remains unchanged
- All existing functionality preserved
- Backward compatible with existing content
- Translation keys unchanged
- Block structure unchanged

## Design Compliance

✅ **Background Color**: #F9F9F9 implemented  
✅ **Asymmetric Padding**: Desktop 0 15rem 0 6rem implemented  
✅ **Fixed Card Height**: 240px desktop, 200px mobile implemented  
✅ **Section Padding**: 100px default implemented  
✅ **Responsive Design**: Mobile-first approach maintained  
✅ **Typography**: Existing typography matches Figma specs  
✅ **Colors**: Design system colors maintained  

## Ready for Testing

The updated section now matches the Figma design specifications while maintaining responsive behavior and existing functionality.
