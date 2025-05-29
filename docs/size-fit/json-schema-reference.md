# Size Fit Metafields - JSON Schema Reference

## 📋 Quick Reference

### Metafield 1: Body Measurements
- **Namespace**: `size_fit`
- **Key**: `body_measurements`
- **Type**: JSON
- **Purpose**: Standard body measurements for size guide

### Metafield 2: Product Measurements
- **Namespace**: `size_fit`
- **Key**: `measurements`
- **Type**: JSON
- **Purpose**: Product-specific garment measurements

## 🔧 Schema Structure

### Body Measurements Structure
```typescript
interface BodyMeasurements {
  gender: "men" | "women" | "unisex";
  sizes: {
    [sizeName: string]: {
      eu_size?: string;
      chest?: MeasurementRange;
      waist?: MeasurementRange;
      hip?: MeasurementRange;
      height?: MeasurementRange;
      inseam_length?: MeasurementRange;
    }
  }
}

interface MeasurementRange {
  min: number; // in centimeters
  max: number; // in centimeters
}
```

### Product Measurements Structure
```typescript
interface ProductMeasurements {
  product_category: "top" | "bottom" | "dress" | "outerwear" | "underwear";
  size_chart: {
    [sizeName: string]: {
      measurements: TopMeasurements | BottomMeasurements;
    }
  }
}

interface TopMeasurements {
  chest_girth_half?: number;
  bottom_girth_stretched_half?: number;
  shoulder_point_to_point?: number;
  shoulder_sleeve_length?: number;
  center_back_length?: number;
  sleeve_length?: number;
}

interface BottomMeasurements {
  waist_girth?: number;
  hip_girth?: number;
  inside_length?: number;
}
```

## 📏 Measurement Definitions

### Body Measurements
| Field | Description | Unit | Example Range |
|-------|-------------|------|---------------|
| `chest` | Chest circumference | cm | 86-94 |
| `waist` | Waist circumference | cm | 72-80 |
| `hip` | Hip circumference | cm | 88-96 |
| `height` | Body height | cm | 170-176 |
| `inseam_length` | Inseam length | cm | 79-80 |

### Product Measurements (Tops)
| Field | Description | Unit | Example |
|-------|-------------|------|---------|
| `chest_girth_half` | Half chest width | cm | 52 |
| `bottom_girth_stretched_half` | Half bottom width (stretched) | cm | 48 |
| `shoulder_point_to_point` | Shoulder width | cm | 44 |
| `shoulder_sleeve_length` | Shoulder to sleeve end | cm | 84 |
| `center_back_length` | Center back length | cm | 68 |
| `sleeve_length` | Sleeve length | cm | 65 |

### Product Measurements (Bottoms)
| Field | Description | Unit | Example |
|-------|-------------|------|---------|
| `waist_girth` | Waist circumference | cm | 76 |
| `hip_girth` | Hip circumference | cm | 92 |
| `inside_length` | Inside leg length | cm | 80 |

## ✅ Validation Rules

### Required Fields
- **Body Measurements**: `gender`, `sizes`
- **Product Measurements**: `product_category`, `size_chart`

### Data Constraints
- All measurements must be positive numbers
- `min` must be less than `max` in ranges
- Size names should be standard (S, M, L, XL, etc.)
- Gender must be: `men`, `women`, or `unisex`
- Product category must be: `top`, `bottom`, `dress`, `outerwear`, or `underwear`

### Recommended Ranges
- Chest: 60-200 cm
- Waist: 50-180 cm
- Hip: 60-200 cm
- Height: 140-220 cm
- Product measurements: 20-150 cm

## 📝 Complete Examples

> 📊 **All JSON examples**: [data-examples.md](./data-examples.md)
>
> Includes complete examples for:
> - Men's & Women's body measurements
> - Top/Jacket & Bottom/Pants product measurements
> - Import templates and API examples

## 🔍 Validation Tools

### Manual Validation
1. **JSON Syntax**: Use [JSONLint](https://jsonlint.com/)
2. **Schema Validation**: Use provided validator script
3. **Data Logic**: Check min < max, reasonable ranges

### Automated Validation
```bash
# Run validation script
node scripts/validate-size-fit-data.js
```

### Browser Console Test
```javascript
// Test in browser console
const data = { /* your JSON data */ };
console.log(JSON.stringify(data, null, 2));
```

## 🚨 Common Issues

### JSON Syntax Errors
- Trailing commas
- Missing quotes around strings
- Incorrect nesting

### Data Logic Errors
- min >= max in ranges
- Negative measurements
- Missing required fields
- Invalid enum values

### Type Errors
- String instead of number for measurements
- Number instead of object for ranges
- Array instead of object for sizes

## 📚 Additional Resources

- **Full Schema**: `schemas/size-fit-metafields-schema.json`
- **Examples**: `schemas/metafield-examples-with-validation.md`
- **Validator**: `scripts/validate-size-fit-data.js`
- **Generator**: `scripts/generate-size-fit-data.js`

## 🎯 Best Practices

1. **Consistent Sizing**: Use same size names across both metafields
2. **Logical Ranges**: Ensure measurements make sense for target audience
3. **Complete Data**: Include all relevant measurements for accurate recommendations
4. **Validation**: Always validate JSON before importing
5. **Testing**: Test with real products and user scenarios
6. **Documentation**: Keep measurement definitions clear for team members
