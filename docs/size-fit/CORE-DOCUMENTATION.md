# Size Fit Feature - Core Documentation

## 📋 **Product Measurement Schema**

### **Metafield Structure:**

#### **1. Product Measurements (`size_fit.measurements`)**
```json
{
  "S": { "chest": 96, "waist": 80, "hip": 100, "height": 170, "inseam": 76 },
  "M": { "chest": 100, "waist": 84, "hip": 104, "height": 175, "inseam": 78 },
  "L": { "chest": 104, "waist": 88, "hip": 108, "height": 180, "inseam": 80 },
  "XL": { "chest": 108, "waist": 92, "hip": 112, "height": 185, "inseam": 82 }
}
```

#### **2. Body Measurements (`size_fit.body_measurements`)**
```json
{
  "clothing_men": {
    "sizes": {
      "S": { "chest": 88, "waist": 76, "hip": 92, "height": 170, "inseam": 76 },
      "M": { "chest": 92, "waist": 80, "hip": 96, "height": 175, "inseam": 78 },
      "L": { "chest": 96, "waist": 84, "hip": 100, "height": 180, "inseam": 80 },
      "XL": { "chest": 100, "waist": 88, "hip": 104, "height": 185, "inseam": 82 }
    }
  },
  "clothing_women": {
    "sizes": {
      "S": { "chest": 84, "waist": 68, "hip": 92, "height": 165, "inseam": 74 },
      "M": { "chest": 88, "waist": 72, "hip": 96, "height": 170, "inseam": 76 },
      "L": { "chest": 92, "waist": 76, "hip": 100, "height": 175, "inseam": 78 },
      "XL": { "chest": 96, "waist": 80, "hip": 104, "height": 180, "inseam": 80 }
    }
  },
  "hiking_shoes_men": {
    "sizes": {
      "40": { "foot_length": 25.0 },
      "41": { "foot_length": 25.7 },
      "42": { "foot_length": 26.3 },
      "43": { "foot_length": 27.0 },
      "44": { "foot_length": 27.7 },
      "45": { "foot_length": 28.3 }
    }
  },
  "hiking_shoes_women": {
    "sizes": {
      "36": { "foot_length": 23.0 },
      "37": { "foot_length": 23.7 },
      "38": { "foot_length": 24.3 },
      "39": { "foot_length": 25.0 },
      "40": { "foot_length": 25.7 },
      "41": { "foot_length": 26.3 }
    }
  }
}
```

#### **3. Classification Metafields:**
- **`features.kind`**: Array - `["clothing"]` or `["shoes"]`
- **`features.gender`**: Array - `["men"]` or `["women"]`

## 🧮 **Size Recommendation Algorithm**

### **Core Logic:**

#### **1. Category Classification:**
```javascript
function getCategory(product) {
  const kind = product.metafields?.features?.kind?.[0]?.name || 'clothing';
  const gender = product.metafields?.features?.gender?.[0]?.name || 'men';
  
  if (kind === 'shoes') {
    return gender === 'women' ? 'hiking_shoes_women' : 'hiking_shoes_men';
  } else {
    return gender === 'women' ? 'clothing_women' : 'clothing_men';
  }
}
```

#### **2. Size Recommendation:**
```javascript
function recommendSize(userMeasurements, category, bodyMeasurements) {
  const categoryData = bodyMeasurements[category];
  if (!categoryData) return null;

  let bestSize = null;
  let minDifference = Infinity;

  for (const [size, measurements] of Object.entries(categoryData.sizes)) {
    let totalDifference = 0;
    let validMeasurements = 0;

    // Calculate weighted differences
    for (const [measurement, value] of Object.entries(measurements)) {
      if (userMeasurements[measurement] !== undefined) {
        const diff = Math.abs(userMeasurements[measurement] - value);
        const weight = getWeight(measurement, category);
        totalDifference += diff * weight;
        validMeasurements++;
      }
    }

    if (validMeasurements > 0) {
      const avgDifference = totalDifference / validMeasurements;
      if (avgDifference < minDifference) {
        minDifference = avgDifference;
        bestSize = size;
      }
    }
  }

  return bestSize;
}
```

#### **3. Measurement Weights:**
```javascript
function getWeight(measurement, category) {
  const weights = {
    clothing_men: { chest: 1.0, waist: 0.8, hip: 0.6, height: 0.4, inseam: 0.7 },
    clothing_women: { chest: 1.0, waist: 0.9, hip: 0.8, height: 0.4, inseam: 0.7 },
    hiking_shoes_men: { foot_length: 1.0 },
    hiking_shoes_women: { foot_length: 1.0 }
  };
  
  return weights[category]?.[measurement] || 0.5;
}
```

## 🎯 **Implementation Files**

### **Core Components:**
1. **`snippets/size-fit-modal.liquid`** - Modal UI
2. **`snippets/size-fit-body-measurements.liquid`** - Data structure & tables
3. **`assets/size-fit-modal.js`** - Algorithm implementation
4. **`snippets/product-variant-picker.liquid`** - Button integration

### **Data Flow:**
1. User clicks "Size Guide & Fit Recommender" button
2. Modal opens with size chart and measurement guide
3. User inputs body measurements
4. Algorithm calculates best size recommendation
5. Result displayed with confidence level

## 📐 **Measurement Categories**

### **Clothing (Men & Women):**
- **CHEST**: Around fullest part
- **WAIST**: Natural waistline
- **HIP**: Fullest part of hips
- **HEIGHT**: Head to floor
- **INSEAM**: Crotch to ankle

### **Hiking Shoes (Men & Women):**
- **FOOT_LENGTH**: Heel to longest toe (cm)

## 🔧 **Setup Requirements**

### **Metafields to Configure:**
1. `features.kind` - Product category classification
2. `features.gender` - Gender classification  
3. `size_fit.measurements` - Product-specific measurements (optional)
4. `size_fit.body_measurements` - Body measurement standards (optional)

### **Fallback Data:**
- Fixed data structure in `size-fit-body-measurements.liquid`
- No metafield setup required for basic functionality
- Automatic classification based on `features.kind` and `features.gender`

## ⚡ **Performance Notes**

- Uses fixed data structure for fast loading
- Client-side algorithm for instant recommendations
- Minimal server requests
- Responsive design for all devices
