# Size Recommendation Algorithm - Quick Summary

## 🎯 **How It Works (Simple Explanation)**

The size recommender calculates the best size for you using a simple 5-step process:

### **Step 1: Get Your Measurements**
- **Chest** (required): Your chest circumference in cm
- **Waist** (required): Your waist circumference in cm
- **Fit Preference**: How you like your clothes to fit (tight/regular/loose)

### **Step 2: Compare with Size Chart**
We have a size chart with ranges for each size:
```
Size S:  Chest 86-94cm,  Waist 72-80cm
Size M:  Chest 94-102cm, Waist 80-88cm
Size L:  Chest 102-110cm, Waist 88-96cm
```

### **Step 3: Calculate Fit Score**
For each size, we calculate how well your measurements fit:
- **Perfect fit** (measurement within range) = 100 points
- **Close fit** (measurement near range) = 50-99 points
- **Poor fit** (measurement far from range) = 0-49 points

### **Step 4: Find Best Match**
- Chest measurement counts for 60% of the score
- Waist measurement counts for 40% of the score
- The size with the highest total score wins

### **Step 5: Apply Your Preference**
- **Tight fit**: Recommend one size smaller
- **Regular fit**: Keep the calculated size
- **Loose fit**: Recommend one size larger

## 📊 **Example Calculation**

**Your measurements:** Chest 98cm, Waist 84cm, Regular fit

**Size M calculation:**
- Chest: 98cm fits in range 94-102cm → Score: 100
- Waist: 84cm fits in range 80-88cm → Score: 100
- Total: (100 × 0.6) + (100 × 0.4) = 100

**Result:** Size M with 95% confidence

## 🎯 **Why This Algorithm?**

### **Pros:**
- ✅ **Fast**: Instant results
- ✅ **Simple**: Easy to understand
- ✅ **Reliable**: Based on actual measurements
- ✅ **Flexible**: Considers fit preferences

### **Limitations:**
- ⚠️ **Basic**: Doesn't consider height/weight
- ⚠️ **Static**: Uses fixed size chart
- ⚠️ **No Learning**: Doesn't improve over time

## 🔧 **Technical Details**

**Location:** `assets/size-fit-modal.js`
**Main Function:** `calculateBasicRecommendation()`
**Algorithm Type:** Weighted scoring with preference adjustment

## 📚 **For More Details**

See complete explanation: [size-recommendation-algorithm.md](./size-recommendation-algorithm.md)
