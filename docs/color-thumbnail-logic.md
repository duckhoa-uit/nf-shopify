# Color Thumbnail Logic Documentation

## Overview

This document explains how the theme retrieves color-specific product thumbnails from variant data, SKU references, and product media.

## Image Naming Convention

Our product images follow a specific naming pattern:

```
NF-{PREFIX}-{PRODUCT_CODE}-{COLOR_REFERENCE_ID}-{IMAGE_TYPE}_{SEQUENCE}.jpg
```

### Image Types:
- **H**: Main product photo (Hero image)
- **M**: Model photos (person wearing the product)
- **B**: Back main product photo
- **BV**: Back variant photo
- **D**: Detail photos

### Examples:
```
NF-TR-4919OR-362-H.jpg        # Main image for color 362
NF-TR-4919OR-362-M_1.jpg      # First model image for color 362
NF-TR-4919OR-362-M_2.jpg      # Second model image for color 362
NF-TR-4919OR-362-BV.jpg       # Back variant for color 362
```

## Core Components

### 1. Main Utility: `snippets/product-color-utils.liquid`

This is the core utility that handles all color image logic with multiple functions:

#### Functions Available:
- `get_color_reference_id`: Get reference ID from product metafields
- `find_image_by_reference_id`: Find image by reference ID with type filtering
- `find_image_by_color_name`: Find image by color name
- `get_color_image`: Main function (most commonly used)

#### Usage:
```liquid
{% render 'product-color-utils' with 'get_color_image',
  product: product,
  color_value: color_value,
  image_type: 'M',
  width: 100,
  height: 100,
  crop: 'center'
%}
```

### 2. Wrapper: `snippets/get-variant-color-image.liquid`

A simplified wrapper around the core utility:

```liquid
{% render 'get-variant-color-image',
  product: product,
  color_value: color_value,
  variant: variant,
  width: 80,
  height: 80,
  crop: 'center',
  image_type: 'M'
%}
```

## Canonical Priority Logic

All PDP and product-card color thumbnails use this order:

1. `variant.featured_image`
2. Same-reference `-H`
3. Same-reference `-M`
4. Same-reference lowest numbered `-M_1`, `-M_2`, `-M_3`...
5. Same-reference lowest numbered `-D_1`, `-D_2`, `-D_3`...
6. Same-reference `-BV`
7. Same-reference `-B`
8. Native color swatch
9. Placeholder

The resolver never falls back to another color's model image or product featured image.

The preferred reference source is the numeric segment before the size segment in the variant SKU. For example, `108139-490-372` resolves to reference `490`. The color metaobject `reference_id` is used when the SKU is unavailable or does not contain a valid numeric reference.

Media matching uses the exact `-<reference>-` token, and supports Shopify UUID suffixes such as `-M_1_<uuid>.jpg`.

## Missing Image Behavior

When a color has no direct variant image and no same-reference media, `always` keeps the color visible and renders its native swatch or a placeholder. `thumbnail_only` hides that color. Neither mode may display an image belonging to another color.

## Files Using Color Thumbnails

### 1. Product Variant Picker
**File**: `snippets/product-variant-options.liquid`
**Usage**: Color swatches in product variant selection
```liquid
{% capture thumbnail_url %}{% render 'get-variant-color-image',
  product: product,
  color_value: color_value,
  variant: value.variant,
  width: 80,
  height: 80,
  crop: 'center',
  image_type: 'M'
%}{% endcapture %}
```

### 2. Cart Notification
**File**: `sections/cart-notification-product.liquid`
**Usage**: Product image in add-to-cart popup
```liquid
{% capture variant_image_url %}{% render 'get-variant-color-image',
  product: item.product,
  color_value: color_value_normalized,
  width: 140,
  height: 140,
  crop: 'center',
  image_type: 'M'
%}{% endcapture %}
```

### 3. Account Orders
**File**: `snippets/account-tab-orders.liquid`
**Usage**: Product images in order history
```liquid
{% capture variant_image_url %}{% render 'get-variant-color-image',
  product: line_item.product,
  color_value: color_value,
  width: 100,
  height: 100,
  crop: 'center',
  image_type: 'M'
%}{% endcapture %}
```

### 4. Cart Items
**File**: `sections/main-cart-items.liquid`
**Usage**: Product images in cart page
```liquid
{% capture variant_image_url %}{% render 'get-variant-color-image',
  product: item.product,
  color_value: color_value,
  width: 300,
  height: 300,
  crop: 'center',
  image_type: 'M'
%}{% endcapture %}
```

### 5. Product Cards
**File**: `snippets/card-product.liquid`
**Usage**: Color swatches and the large card image on listing pages
*Note: Uses custom logic instead of the utility for performance reasons*

**Default card image** follows the same front-first, color-aware chain as swatches, scoped to `selected_or_first_available_variant`. Back type tokens (`-B` / `-BV`) are skipped when they are the variant featured image.

**Hover is not required to be front.** Card hover swaps to the same color's model shot (`-M` or lowest `-M_N`). That file may be a photographic back (JIMEN / SUCHY `M_1`). Swatch hover still uses that color's `-H`.

Media matching uses the exact `-<reference>-` token, so Shopify UUID suffixes such as `-M_1_<uuid>.jpg` still parse as type `M`. See `docs/product-card-media/evidence.md`.

## Example Scenario

Given this media list for a product:
```json
[
  {"position": 1, "src": "...NF-TR-4919OR-362-M_4.jpg"},
  {"position": 12, "src": "...NF-TR-4919OR-362-M_2.jpg"},
  {"position": 21, "src": "...NF-TR-4919OR-362-M_1.jpg"}
]
```

**For color reference ID 362:**
- ❌ Old logic would select: `M_4` (first found)
- ✅ New logic selects: `M_1` (lowest sequence)

## Key Improvements Made

1. **Canonical priority**: H, M, M_n, D_n, BV, B after the direct variant image
2. **SKU reference fallback**: Supports colors whose metafields are incomplete
3. **Exact reference matching**: Prevents cross-color image leakage
4. **Native swatch fallback**: Preserves the color when no image exists
5. **Deterministic sequence selection**: Chooses the lowest numeric M/D sequence

## Best Practices

1. **Pass the exact variant** when one is available
2. **Use the SKU reference** before the color metaobject reference
3. **Match the complete `-<reference>-` token**
4. **Keep `always` separate from image selection strictness**
5. **Use native swatches before placeholders**

## Troubleshooting

### Common Issues:
1. **Wrong image selected**: Check if `image_type: 'M'` is specified
2. **No image found**: Verify color metafields are properly configured
3. **Performance issues**: Consider caching for frequently accessed images

### Debug Steps:
1. Check product metafields for color reference IDs
2. Verify image naming follows the convention
3. Test with different color values
4. Check browser network tab for image requests

## Technical Implementation Details

### Color Value Normalization
```liquid
{% assign color_value_normalized = color_value
  | downcase
  | strip
  | replace: ' ', '-'
  | replace: "'", ""
  | replace: ".", ""
  | replace: ",", ""
%}
```

### Metafield Structure
The system expects color metafields in this format:
```json
{
  "custom": {
    "color": {
      "value": [
        {
          "name": "red",
          "reference_id": "362",
          "position": 1
        },
        {
          "name": "blue",
          "reference_id": "320",
          "position": 2
        }
      ]
    }
  }
}
```

### Performance Considerations

1. **Caching**: Results are not cached, consider implementing if needed
2. **Image Processing**: Uses Shopify's image transformation API
3. **Fallback Chain**: Multiple fallback steps may impact performance
4. **Media Loop**: Iterates through all product media for each color

### Error Handling

The system gracefully handles:
- Missing metafields
- Invalid reference IDs
- Missing images
- Malformed URLs
- Empty color values

### Integration Points

This logic integrates with:
- Shopify's variant system
- Product metafields
- Image transformation API
- Theme's swatch system
- Cart functionality
- Account pages

## Migration Notes

When updating from old logic:
1. Ensure all calls include `image_type: 'M'`
2. Test with products having multiple model images
3. Verify fallback behavior
4. Check performance impact
5. Update any custom implementations

## Future Enhancements

Potential improvements:
1. **Caching layer** for frequently accessed images
2. **Lazy loading** for better performance
3. **WebP format** support for modern browsers
4. **Responsive images** with multiple sizes
5. **Error logging** for debugging
