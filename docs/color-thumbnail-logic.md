# Color Thumbnail Logic Documentation

## Overview

This document explains the complex logic used to retrieve color-specific product images (thumbnails) based on color variants in the Shopify theme. The system prioritizes model images with specific naming conventions and fallback strategies.

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
  width: 80,
  height: 80,
  crop: 'center',
  image_type: 'M'
%}
```

## Priority Logic for Model Images (image_type: 'M')

When `image_type: 'M'` is specified, the system follows this priority order:

### Step 1: Find Reference ID
```liquid
{% assign color_value_normalized = color_value | downcase | strip | replace: ' ', '-' %}
{% if product.metafields.custom.color.value != blank %}
  {% for color_item in product.metafields.custom.color.value %}
    {% if color_item.name == color_value_normalized %}
      {% assign reference_id = color_item.reference_id %}
      {% break %}
    {% endif %}
  {% endfor %}
{% endif %}
```

### Step 2: Priority Order
1. **Highest Priority**: Model image without sequence (`-M`)
   - Example: `NF-TR-4919OR-362-M.jpg`

2. **Second Priority**: Model image with lowest sequence number (`-M_1`, `-M_2`, `-M_3`...)
   - Example: `NF-TR-4919OR-362-M_1.jpg` (preferred over `M_2`, `M_3`, etc.)

### Step 3: Improved Sequence Selection Logic

**Previous Issue**: Logic was selecting the first image found, not necessarily the lowest sequence.

**Current Solution**:
```liquid
{% assign lowest_sequence = 999 %}
{% assign best_model_media = nil %}

{% for media in product.media %}
  {% if parsed_url contains reference_id and parsed_url contains '-M_' %}
    {% assign sequence_number = sequence_part | plus: 0 %}

    {% if sequence_number > 0 and sequence_number < lowest_sequence %}
      {% assign lowest_sequence = sequence_number %}
      {% assign best_model_media = media %}
    {% endif %}
  {% endif %}
{% endfor %}

{% if best_model_media %}
  {% assign image_url = best_model_media.preview_image | image_url: width: width, height: height, crop: crop %}
{% endif %}
```

## Fallback Strategy

If no model image is found, the system uses this fallback order:

1. **Step 4**: Try to match by color name in URL
2. **Step 5**: Try to find any image with color reference pattern
3. **Step 6**: Fallback to first model image of any color
4. **Step 7**: Final fallback to any product image

## Files Using Color Thumbnails

### 1. Product Variant Picker
**File**: `snippets/product-variant-options.liquid`
**Usage**: Color swatches in product variant selection
```liquid
{% capture thumbnail_url %}{% render 'get-variant-color-image',
  product: product,
  color_value: color_value,
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
**Usage**: Color swatches on product listing pages
*Note: Uses custom logic instead of the utility for performance reasons*

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

1. **Fixed Sequence Priority**: Now correctly selects lowest sequence number
2. **Added Validation**: `sequence_number > 0` to avoid invalid sequences
3. **Consistent Implementation**: All files now use `image_type: 'M'` parameter
4. **Better Performance**: Store best candidate and assign URL only once

## Best Practices

1. **Always specify `image_type: 'M'`** for color thumbnails
2. **Use consistent dimensions** across similar use cases
3. **Include fallback logic** for when no color-specific image exists
4. **Normalize color values** before processing
5. **Strip whitespace** from captured URLs

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
