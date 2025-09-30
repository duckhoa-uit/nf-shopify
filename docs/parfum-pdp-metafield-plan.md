# Parfum PDP Metafield Refactor Plan

## Goals
- Replace hardcoded parfum content in `sections/main-product-parfums.liquid` with dynamic product metafields.
- Keep all section headings sourced from locale translation strings (no heading metafields).
- Model each section with dedicated metaobjects and metafields; remove deprecated tagged-feature logic.
- Generate usage dosage cards from `custom.product_in_group` related products instead of standalone metaobjects.

## Metaobject Schemas
### `parfum_characteristic`
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `title` | single_line_text | ✔ | Card label (e.g., “Svieža”). |
| `image` | file_reference | ✔ | Composition card image asset. |
| `alt_text` | single_line_text | – | Optional alt text; fallback to `title`. |

### `parfum_fragrance_benefit`
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | single_line_text | ✔ | Primary text for About Fragrance card. |
| `description` | multi_line_text | – | Optional supporting copy. |
| `icon` | file_reference | ✔ | Icon graphic. |
| `alt_text` | single_line_text | – | Optional alt text; fallback to `label`. |

### `parfum_perfume_advantage`
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | single_line_text | ✔ | Primary text for About Perfumes card. |
| `description` | multi_line_text | – | Optional supporting copy. |
| `icon` | file_reference | ✔ | Icon graphic. |
| `alt_text` | single_line_text | – | Optional alt text; fallback to `label`. |

### `parfum_certificate`
| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `label` | single_line_text | ✔ | Certificate description. |
| `icon` | file_reference | ✔ | Badge icon. |
| `alt_text` | single_line_text | – | Optional alt text; fallback to `label`. |

## Product Metafields (Namespace `parfum`)
| Key | Type | Metaobject | Purpose |
| --- | --- | --- | --- |
| `composition_cards` | list.metaobject_reference | `parfum_characteristic` | Composition tiles. |
| `composition_description` | rich_text | – | Rich text body under composition. |
| `about_fragrance_cards` | list.metaobject_reference | `parfum_fragrance_benefit` | Cards for About Fragrance section. |
| `usage_description` | rich_text | – | Paragraph under dosage cards. |
| `warnings` | rich_text | – | Safety warnings copy. |
| `certificates` | list.metaobject_reference | `parfum_certificate` | Certificates grid content. |
| `certificates_video_url` | url | – | Optional video URL for certificates section (YouTube/Vimeo). |
| `about_perfumes_description` | rich_text | – | About perfumes narrative text. |
| `about_perfumes_features` | list.metaobject_reference | `parfum_perfume_advantage` | Feature list cards. |

## Usage Dosage Logic
- Pull related products from `product.metafields.custom.product_in_group.value` (already consumed by the parfum variant picker).
- For each related product:
  - Determine the dosage amount with existing size extraction logic (variant option named “size”, `custom.size` metafield, or title parsing fallback).
  - Read the caption from the linked product’s `custom.product_in_group_caption` metafield (populated per product). No translation fallback is required.
  - Render the washing machine icon (`washing-machine-icon.svg`) using alternative text composed from the dosage amount and caption (e.g., "5 ml 1 pranie").

## Certificates Video Logic
- Merchandisers provide a single URL via `parfum.certificates_video_url` (supports YouTube or Vimeo).
- The theme parses the URL to infer platform and extract the video ID.
- Video renders only when a valid ID is detected.
- Defaults: no custom title, autoplay disabled, loop disabled, controls enabled.
- Hide the dosage grid if `product_in_group` is empty.

## JSON Upload Blueprint
```json
{
  "product": {
    "id": 1234567890,
    "metafields": [
      {"namespace": "parfum", "key": "composition_cards", "type": "list.metaobject_reference", "value": "[\"gid://shopify/Metaobject/characteristic-1\"]"},
      {"namespace": "parfum", "key": "composition_description", "type": "rich_text", "value": "{...}"},
      {"namespace": "parfum", "key": "about_fragrance_cards", "type": "list.metaobject_reference", "value": "[\"gid://shopify/Metaobject/fragrance-benefit-1\"]"},
      {"namespace": "parfum", "key": "usage_description", "type": "rich_text", "value": "{...}"},
      {"namespace": "parfum", "key": "warnings", "type": "rich_text", "value": "{...}"},
      {"namespace": "parfum", "key": "certificates", "type": "list.metaobject_reference", "value": "[\"gid://shopify/Metaobject/certificate-1\"]"},
      {"namespace": "parfum", "key": "certificates_video_url", "type": "url", "value": "https://youtu.be/ZQb7XU6RxR0"},
      {"namespace": "parfum", "key": "about_perfumes_description", "type": "rich_text", "value": "{...}"},
      {"namespace": "parfum", "key": "about_perfumes_features", "type": "list.metaobject_reference", "value": "[\"gid://shopify/Metaobject/perfume-advantage-1\"]"}
    ]
  }
}
```
- Replace placeholders with actual metaobject GIDs.
- Rich text payloads must follow Shopify’s rich text JSON structure.
- Maintain `custom.product_in_group` metafield relationships; ensure each linked product includes the `custom.product_in_group_caption` metafield.
- Populate `parfum.certificates_video_url` with a full YouTube or Vimeo link when a video should display.

## Implementation Steps
1. Prepare metafield/metaobject data on a staging product, ensuring `product_in_group` data is accurate.
2. Refactor `sections/main-product-parfums.liquid` section-by-section:
   - Composition
   - About Fragrance
   - Usage
   - Warnings
   - Certificates
   - About Perfumes
3. Integrate translation-based headings and metaobject-driven loops, removing hardcoded content.
4. Validate video embed configuration defaults and section fallbacks.
5. QA in preview theme for localization, responsive layout, and missing-data handling.

## QA Checklist
- Composition tiles render only when metafield populated; heading uses translation.
- About Fragrance cards pull from dedicated metaobjects (no About Perfumes reuse).
- Usage dosage cards reflect related products’ amounts/captions sourced from `custom.product_in_group`; grid hides with no data.
- Warnings render rich text and hide when empty.
- Certificates grid renders when provided; video appears only when `certificates_video_url` contains a valid YouTube/Vimeo link.
- About Perfumes description and features render correctly with translation heading.
