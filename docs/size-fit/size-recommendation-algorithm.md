# Size Recommendation Algorithm Explained

## 🎯 **Overview**

Size recommender sử dụng một algorithm đơn giản để tính toán size phù hợp nhất dựa trên measurements của user và fit preference.

## 📊 **Input Data**

### **User Measurements:**
- **Chest** (required): Vòng ngực (cm)
- **Waist** (required): Vòng eo (cm)  
- **Height** (optional): Chiều cao (cm)
- **Weight** (optional): Cân nặng (kg)

### **Fit Preference:**
- **Tight Fit**: Ôm sát, form-fitting
- **Regular Fit**: Vừa vặn, comfortable
- **Loose Fit**: Rộng rãi, relaxed

## 🔢 **Algorithm Steps**

### **Step 1: Size Chart Lookup**
```javascript
const sizeChart = {
  'XS': { chest: { min: 82, max: 86 }, waist: { min: 68, max: 72 } },
  'S':  { chest: { min: 86, max: 94 }, waist: { min: 72, max: 80 } },
  'M':  { chest: { min: 94, max: 102 }, waist: { min: 80, max: 88 } },
  'L':  { chest: { min: 102, max: 110 }, waist: { min: 88, max: 96 } },
  'XL': { chest: { min: 110, max: 118 }, waist: { min: 96, max: 104 } }
};
```

### **Step 2: Calculate Fit Score cho mỗi Size**

#### **Fit Score Formula:**
```javascript
function calculateFitScore(measurement, range) {
  const mid = (range.min + range.max) / 2;
  const tolerance = (range.max - range.min) / 2;
  
  // Perfect fit nếu measurement nằm trong range
  if (measurement >= range.min && measurement <= range.max) {
    return 100;
  }
  
  // Calculate distance từ range
  const distance = Math.min(
    Math.abs(measurement - range.min),
    Math.abs(measurement - range.max)
  );
  
  // Score giảm dần theo distance
  return Math.max(0, 100 - (distance / tolerance) * 50);
}
```

#### **Example Calculation:**
User có chest = 98cm, size M có range 94-102cm:
- Measurement nằm trong range → Score = 100
- Perfect fit cho chest measurement

User có chest = 92cm, size M có range 94-102cm:
- Distance = min(|92-94|, |92-102|) = 2cm
- Tolerance = (102-94)/2 = 4cm
- Score = 100 - (2/4) * 50 = 75

### **Step 3: Weighted Total Score**

```javascript
const chestFit = calculateFitScore(chest, ranges.chest);
const waistFit = calculateFitScore(waist, ranges.waist);

// Chest có weight 60%, waist có weight 40%
const totalScore = (chestFit * 0.6) + (waistFit * 0.4);
```

**Rationale:** Chest measurement quan trọng hơn waist trong việc xác định size áo.

### **Step 4: Apply Fit Preference**

```javascript
if (fit_preference === 'tight') {
  // Giảm 1 size (S → XS)
  recommendedSize = getSmallerSize(bestSize);
  confidence -= 10;
} else if (fit_preference === 'loose') {
  // Tăng 1 size (S → M)
  recommendedSize = getLargerSize(bestSize);
  confidence -= 10;
}
```

### **Step 5: Calculate Confidence Score**

```javascript
const confidence = Math.min(95, Math.max(60, totalScore));
```

- **Minimum confidence**: 60%
- **Maximum confidence**: 95%
- **Based on**: Total fit score

## 📈 **Detailed Example**

### **User Input:**
- Chest: 98cm
- Waist: 84cm
- Fit Preference: Regular

### **Calculation for each Size:**

#### **Size S (chest: 86-94, waist: 72-80):**
- Chest score: 100 - (4/4) * 50 = 50 (98 > 94, distance = 4)
- Waist score: 100 - (4/4) * 50 = 50 (84 > 80, distance = 4)
- Total: (50 * 0.6) + (50 * 0.4) = 50

#### **Size M (chest: 94-102, waist: 80-88):**
- Chest score: 100 (98 trong range 94-102)
- Waist score: 100 (84 trong range 80-88)
- Total: (100 * 0.6) + (100 * 0.4) = 100

#### **Size L (chest: 102-110, waist: 88-96):**
- Chest score: 100 - (4/4) * 50 = 50 (98 < 102, distance = 4)
- Waist score: 100 - (4/4) * 50 = 50 (84 < 88, distance = 4)
- Total: (50 * 0.6) + (50 * 0.4) = 50

### **Result:**
- **Best Match**: Size M (score: 100)
- **Confidence**: 95%
- **Explanation**: "Based on your measurements and preference for comfortable fit, size M should provide the best fit."

## 🎯 **Algorithm Strengths**

### **1. Simple & Fast**
- Lightweight calculation
- Real-time results
- No external API calls needed

### **2. Intuitive Logic**
- Perfect fit = 100 score
- Score decreases with distance from ideal range
- Weighted importance (chest > waist)

### **3. Fit Preference Support**
- Adjusts recommendation based on user preference
- Maintains confidence scoring

### **4. Alternative Suggestions**
- Provides backup size options
- Helps users make informed decisions

## ⚠️ **Current Limitations**

### **1. Basic Size Chart**
- Uses hardcoded sample data
- Should integrate with product metafields
- Limited to 5 standard sizes

### **2. Simple Algorithm**
- Doesn't consider height/weight
- No body type analysis
- Linear scoring system

### **3. No Learning**
- Doesn't improve over time
- No user feedback integration
- Static confidence calculation

## 🔄 **Potential Improvements**

### **1. Dynamic Size Chart**
```javascript
// Get size chart from product metafields
const sizeChart = getProductSizeChart(productId);
```

### **2. Enhanced Algorithm**
```javascript
// Consider all measurements
const scores = {
  chest: calculateFitScore(chest, ranges.chest) * 0.4,
  waist: calculateFitScore(waist, ranges.waist) * 0.3,
  height: calculateFitScore(height, ranges.height) * 0.2,
  weight: calculateBodyTypeScore(weight, height) * 0.1
};
```

### **3. Machine Learning**
```javascript
// Learn from user feedback
const recommendation = await mlModel.predict({
  measurements,
  fitPreference,
  productCategory,
  userFeedback: previousFeedback
});
```

### **4. Body Type Analysis**
```javascript
// BMI and body type consideration
const bmi = weight / ((height/100) ** 2);
const bodyType = classifyBodyType(chest, waist, hip, bmi);
const adjustedRecommendation = adjustForBodyType(baseRecommendation, bodyType);
```

## 🛠️ **Implementation Notes**

### **Current Code Location:**
- **File**: `assets/size-fit-modal.js`
- **Function**: `calculateBasicRecommendation()`
- **Lines**: 215-282

### **Key Functions:**
- `calculateFitScore()`: Tính score cho 1 measurement
- `getSizeRecommendation()`: Main entry point
- `getExplanation()`: Generate explanation text

### **Integration Points:**
- Form submission in size recommender tab
- Product metafields for size chart data
- User preference selection

## 📊 **Testing the Algorithm**

### **Test Cases:**
```javascript
// Perfect fit
testRecommendation({ chest: 98, waist: 84 }); // Expected: M

// Between sizes
testRecommendation({ chest: 94, waist: 80 }); // Expected: M (boundary)

// Tight preference
testRecommendation({ chest: 98, waist: 84, fit_preference: 'tight' }); // Expected: S

// Loose preference  
testRecommendation({ chest: 98, waist: 84, fit_preference: 'loose' }); // Expected: L
```

### **Edge Cases:**
- Very small measurements (below XS)
- Very large measurements (above XL)
- Conflicting measurements (small chest, large waist)
- Missing required measurements

---

## 📚 **Related Documentation**

- **Implementation**: [implementation-summary.md](./implementation-summary.md)
- **Data Examples**: [data-examples.md](./data-examples.md)
- **Troubleshooting**: [troubleshooting-guide.md](./troubleshooting-guide.md)
