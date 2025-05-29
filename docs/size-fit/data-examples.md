# Size Fit Data Examples & Templates

This document contains all JSON examples and templates for the Size Fit feature.

## 📋 **Quick Reference**

### **Metafields Required:**
```
Namespace: size_fit
Key: body_measurements (JSON)
Key: measurements (JSON)
```

## 📊 **Body Measurements Examples**

### **Men's Clothing Template**
```json
{
  "gender": "men",
  "sizes": {
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
    },
    "XXL": {
      "eu_size": "60-62",
      "chest": {"min": 116, "max": 128},
      "waist": {"min": 104, "max": 112},
      "hip": {"min": 120, "max": 128},
      "height": {"min": 188, "max": 194},
      "inseam_length": {"min": 87, "max": 88}
    }
  }
}
```

### **Women's Clothing Template**
```json
{
  "gender": "women",
  "sizes": {
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
      "inseam_length": {"min": 82, "max": 82}
    }
  }
}
```

## 🧥 **Product Measurements Examples**

### **Top/Jacket Measurements**
```json
{
  "product_category": "top",
  "size_chart": {
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
}
```

### **Bottom/Pants Measurements**
```json
{
  "product_category": "bottom",
  "size_chart": {
    "S": {
      "measurements": {
        "waist_girth": 76,
        "hip_girth": 92,
        "inside_length": 80
      }
    },
    "M": {
      "measurements": {
        "waist_girth": 80,
        "hip_girth": 96,
        "inside_length": 81
      }
    },
    "L": {
      "measurements": {
        "waist_girth": 84,
        "hip_girth": 100,
        "inside_length": 82
      }
    },
    "XL": {
      "measurements": {
        "waist_girth": 88,
        "hip_girth": 104,
        "inside_length": 83
      }
    }
  }
}
```

## 📏 **Measurement Definitions**

### **Body Measurements**
| Field | Description | Unit | Example Range |
|-------|-------------|------|---------------|
| `chest` | Chest circumference | cm | 86-94 |
| `waist` | Waist circumference | cm | 72-80 |
| `hip` | Hip circumference | cm | 88-96 |
| `height` | Body height | cm | 170-176 |
| `inseam_length` | Inseam length | cm | 79-80 |

### **Product Measurements (Tops)**
| Field | Description | Unit | Example |
|-------|-------------|------|---------|
| `chest_girth_half` | Half chest width | cm | 52 |
| `bottom_girth_stretched_half` | Half bottom width (stretched) | cm | 48 |
| `shoulder_point_to_point` | Shoulder width | cm | 44 |
| `shoulder_sleeve_length` | Shoulder to sleeve end | cm | 84 |
| `center_back_length` | Center back length | cm | 68 |
| `sleeve_length` | Sleeve length | cm | 65 |

### **Product Measurements (Bottoms)**
| Field | Description | Unit | Example |
|-------|-------------|------|---------|
| `waist_girth` | Waist circumference | cm | 76 |
| `hip_girth` | Hip circumference | cm | 92 |
| `inside_length` | Inside leg length | cm | 80 |

## 📊 **Size Reference Tables**

### **Men's Sizes (CM)**
```
S:   Chest 86-94,   Waist 72-80,   Hip 88-96,   Height 170-176
M:   Chest 94-102,  Waist 80-88,   Hip 96-104,  Height 176-182
L:   Chest 102-110, Waist 88-96,   Hip 104-112, Height 182-188
XL:  Chest 110-116, Waist 96-104,  Hip 112-120, Height 188-194
XXL: Chest 116-128, Waist 104-112, Hip 120-128, Height 188-194
```

### **Women's Sizes (CM)**
```
XS: Chest 74-78,  Waist 58-62,  Hip 82-86,  Height 154-158
S:  Chest 78-86,  Waist 62-70,  Hip 86-94,  Height 158-162
M:  Chest 86-94,  Waist 70-78,  Hip 94-102, Height 162-166
L:  Chest 94-102, Waist 78-86,  Hip 102-110, Height 166-170
```

## 🔧 **Import Templates**

### **CSV Import Template**
```csv
Handle,Size Fit Body Measurements,Size Fit Product Measurements
men-jacket-1,"JSON_BODY_DATA","JSON_PRODUCT_DATA"
women-dress-1,"JSON_BODY_DATA","JSON_PRODUCT_DATA"
```

### **API Import Example**
```javascript
const productId = 'gid://shopify/Product/123456789';
const metafields = [
  {
    namespace: 'size_fit',
    key: 'body_measurements',
    value: JSON.stringify(bodyMeasurementsData),
    type: 'json'
  },
  {
    namespace: 'size_fit',
    key: 'measurements', 
    value: JSON.stringify(productMeasurementsData),
    type: 'json'
  }
];
```

## ✅ **Validation**

### **Required Fields**
- **Body Measurements**: `gender`, `sizes`
- **Product Measurements**: `product_category`, `size_chart`

### **Data Constraints**
- All measurements must be positive numbers
- `min` must be less than `max` in ranges
- Size names should be standard (S, M, L, XL, etc.)
- Gender: `men`, `women`, or `unisex`
- Product category: `top`, `bottom`, `dress`, `outerwear`, `underwear`

### **Recommended Ranges**
- Chest: 60-200 cm
- Waist: 50-180 cm
- Hip: 60-200 cm
- Height: 140-220 cm
- Product measurements: 20-150 cm

---

## 📚 **Related Documentation**

- **Setup Guide**: [setup-guide.md](./setup-guide.md)
- **Schema Reference**: [json-schema-reference.md](./json-schema-reference.md)
- **Validation Tools**: `scripts/validate-size-fit-data.js`
- **Data Generator**: `scripts/generate-size-fit-data.js`
