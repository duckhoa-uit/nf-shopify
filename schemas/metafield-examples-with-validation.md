# Size Fit Metafields - JSON Schema & Examples

## 📋 Metafield Configuration

### Metafield 1: Body Measurements
```
Namespace: size_fit
Key: body_measurements
Name: Size Fit - Body Measurements
Type: JSON
Description: Standard body measurements for size guide
```

### Metafield 2: Product Measurements
```
Namespace: size_fit
Key: measurements
Name: Size Fit - Product Measurements
Type: JSON
Description: Product-specific measurements for garments
```

## 🔧 JSON Schema Structure

### Body Measurements Schema
```json
{
  "SIZE_NAME": {
    "eu_size": "string",
    "chest": {"min": number, "max": number},
    "waist": {"min": number, "max": number},
    "hip": {"min": number, "max": number},
    "height": {"min": number, "max": number},
    "inseam_length": {"min": number, "max": number}
  }
}

// Gender is obtained from: product.metafields.features.gender.value[0].name
// Values: "men" | "women" | "unisex"
```

### Product Measurements Schema
```json
{
  "SIZE_NAME": {
    "measurements": {
      // For tops/jackets:
      "chest_girth_half": number,
      "bottom_girth_stretched_half": number,
      "shoulder_point_to_point": number,
      "shoulder_sleeve_length": number,
      "center_back_length": number,
      "sleeve_length": number,

      // For bottoms/pants:
      "waist_girth": number,
      "hip_girth": number,
      "inside_length": number
    }
  }
}

// Product category is obtained from: product.metafields.features.kind.value[0].name
// Values: "top" | "bottom" | "dress" | "outerwear" | "underwear"
```

## 📝 Complete Examples

### Example 1: Men's Jacket (Body Measurements)
```json
{
  "S": {
    "eu_size": "44-46",
    "chest": {"min": 86, "max": 94},
    "waist": {"min": 72, "max": 80},
    "hip": {"min": 88, "max": 96},
    "height": {"min": 170, "max": 176},
    "inseam_length": {"min": 79, "max": 80}
  },
  "M": {
    "eu_size": "48-50",
    "chest": {"min": 94, "max": 102},
    "waist": {"min": 80, "max": 88},
    "hip": {"min": 96, "max": 104},
    "height": {"min": 176, "max": 182},
    "inseam_length": {"min": 81, "max": 82}
  },
  "L": {
    "eu_size": "52-54",
    "chest": {"min": 102, "max": 110},
    "waist": {"min": 88, "max": 96},
    "hip": {"min": 104, "max": 112},
    "height": {"min": 182, "max": 188},
    "inseam_length": {"min": 83, "max": 84}
  },
  "XL": {
    "eu_size": "56-58",
    "chest": {"min": 110, "max": 116},
    "waist": {"min": 96, "max": 104},
    "hip": {"min": 112, "max": 120},
    "height": {"min": 188, "max": 194},
    "inseam_length": {"min": 85, "max": 86}
  }
}
```

> **Note**: Gender "men" is obtained from `product.metafields.features.gender.value[0].name`

### Example 2: Men's Jacket (Product Measurements)
```json
{
  "S": {
    "measurements": {
      "chest_girth_half": 52,
      "bottom_girth_stretched_half": 48,
      "shoulder_point_to_point": 44,
      "shoulder_sleeve_length": 84,
      "center_back_length": 68,
      "sleeve_length": 65
    }
  },
  "M": {
    "measurements": {
      "chest_girth_half": 55,
      "bottom_girth_stretched_half": 51,
      "shoulder_point_to_point": 46,
      "shoulder_sleeve_length": 86,
      "center_back_length": 70,
      "sleeve_length": 66
    }
  },
  "L": {
    "measurements": {
      "chest_girth_half": 58,
      "bottom_girth_stretched_half": 54,
      "shoulder_point_to_point": 48,
      "shoulder_sleeve_length": 88,
      "center_back_length": 72,
      "sleeve_length": 67
    }
  },
  "XL": {
    "measurements": {
      "chest_girth_half": 61,
      "bottom_girth_stretched_half": 57,
      "shoulder_point_to_point": 50,
      "shoulder_sleeve_length": 90,
      "center_back_length": 74,
      "sleeve_length": 68
    }
  }
}
```

> **Note**: Product category "top" is obtained from `product.metafields.features.kind.value[0].name`

### Example 3: Women's Dress (Body Measurements)
```json
{
  "XS": {
    "eu_size": "32",
    "chest": {"min": 74, "max": 78},
    "waist": {"min": 58, "max": 62},
    "hip": {"min": 82, "max": 86},
    "height": {"min": 154, "max": 158},
    "inseam_length": {"min": 79, "max": 79}
  },
  "S": {
    "eu_size": "34-36",
    "chest": {"min": 78, "max": 86},
    "waist": {"min": 62, "max": 70},
    "hip": {"min": 86, "max": 94},
    "height": {"min": 158, "max": 162},
    "inseam_length": {"min": 80, "max": 80}
  },
  "M": {
    "eu_size": "38-40",
    "chest": {"min": 86, "max": 94},
    "waist": {"min": 70, "max": 78},
    "hip": {"min": 94, "max": 102},
    "height": {"min": 162, "max": 166},
    "inseam_length": {"min": 81, "max": 81}
  },
  "L": {
    "eu_size": "42-44",
    "chest": {"min": 94, "max": 102},
    "waist": {"min": 78, "max": 86},
    "hip": {"min": 102, "max": 110},
    "height": {"min": 166, "max": 170},
    "inseam_length": {"min": 81, "max": 82}
  }
}
```

> **Note**: Gender "women" is obtained from `product.metafields.features.gender.value[0].name`

### Example 4: Men's Pants (Product Measurements)
```json
{
  "S": {
    "measurements": {
      "waist_girth": 76,
      "hip_girth": 92,
      "inside_length": 80
    }
  },
  "M": {
    "measurements": {
      "waist_girth": 84,
      "hip_girth": 100,
      "inside_length": 82
    }
  },
  "L": {
    "measurements": {
      "waist_girth": 92,
      "hip_girth": 108,
      "inside_length": 84
    }
  },
  "XL": {
    "measurements": {
      "waist_girth": 100,
      "hip_girth": 116,
      "inside_length": 86
    }
  }
}
```

> **Note**: Product category "bottom" is obtained from `product.metafields.features.kind.value[0].name`

## ✅ Validation Rules

### Required Fields
- **Body Measurements**: At least one size entry (S, M, L, etc.)
- **Product Measurements**: At least one size entry with measurements
- **Product Metafields**: `features.gender` and `features.kind` must be set

### Data Types
- **Numbers**: All measurements must be positive numbers (cm)
- **Strings**: `eu_size`
- **Objects**: measurement ranges, measurements

### Valid Values
- **Gender** (from features.gender): `"men"`, `"women"`, `"unisex"`
- **Product Category** (from features.kind): `"top"`, `"bottom"`, `"dress"`, `"outerwear"`, `"underwear"`
- **Size Names**: `"XXS"`, `"XS"`, `"S"`, `"M"`, `"L"`, `"XL"`, `"XXL"`, `"3XL"`, `"4XL"`

### Measurement Ranges
- **Min/Max**: `min` value must be less than `max` value
- **Units**: All measurements in centimeters
- **Range**: Reasonable values (e.g., chest 60-200cm)

## 🔍 Validation Tools

### Online JSON Validators
1. [JSONLint](https://jsonlint.com/) - Basic JSON syntax validation
2. [JSON Schema Validator](https://www.jsonschemavalidator.net/) - Schema validation
3. [AJV](https://ajv.js.org/) - JavaScript schema validation

### Quick Validation Checklist
- [ ] Valid JSON syntax (no trailing commas, proper quotes)
- [ ] All required fields present
- [ ] Correct data types
- [ ] Valid enum values
- [ ] Logical measurement ranges (min < max)
- [ ] Consistent size naming across both metafields

## 🚨 Common Errors

### JSON Syntax Errors
```json
// ❌ Wrong - trailing comma
{
  "gender": "men",
  "sizes": {},
}

// ✅ Correct
{
  "gender": "men",
  "sizes": {}
}
```

### Missing Required Fields
```json
// ❌ Wrong - empty object
{
}

// ✅ Correct - at least one size
{
  "S": {
    "eu_size": "44-46",
    "chest": {"min": 86, "max": 94}
  }
}

// Note: Gender and product category come from product metafields:
// - product.metafields.features.gender.value[0].name
// - product.metafields.features.kind.value[0].name
```

### Invalid Range Values
```json
// ❌ Wrong - min > max
"chest": {"min": 94, "max": 86}

// ✅ Correct
"chest": {"min": 86, "max": 94}
```
