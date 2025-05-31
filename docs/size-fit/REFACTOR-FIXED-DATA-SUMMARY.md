# Size Fit Feature Refactor - Fixed Data Implementation

## 🎯 **Objective**
Refactor size fit feature để sử dụng fixed data thay vì dynamic data từ metafields, với data được lấy từ https://northfinder.com/en/content/6-size-guide và phân loại thành 4 categories.

## 📋 **Changes Made**

### **1. Data Source Changes**

#### **Before:**
- Sử dụng dynamic data từ product metafields
- Data structure phức tạp với nested objects
- Cần setup metafields cho mỗi product

#### **After:**
- Sử dụng fixed data được hardcode trong template
- Data được lấy từ official Northfinder size guide
- Không cần setup metafields

### **2. Classification Logic**

#### **Product Categories:**
1. **Clothing Men** - `features.kind != 'shoes' && features.gender == 'men'`
2. **Clothing Women** - `features.kind != 'shoes' && features.gender != 'men'`
3. **Hiking Shoes Men** - `features.kind == 'shoes' && features.gender == 'men'`
4. **Hiking Shoes Women** - `features.kind == 'shoes' && features.gender != 'men'`

#### **Classification Logic:**
```liquid
{% assign is_shoes = false %}
{% assign is_men = false %}
{% assign kind_values = '' %}
{% assign gender_values = '' %}

{% comment %} Check features.kind for shoes {% endcomment %}
{% if product.metafields.features.kind.value %}
  {% for kind_item in product.metafields.features.kind.value %}
    {% assign kind_name = kind_item.name | downcase %}
    {% assign kind_values = kind_values | append: kind_name | append: ',' %}
    {% if kind_name == 'shoes' %}
      {% assign is_shoes = true %}
    {% endif %}
  {% endfor %}
{% endif %}

{% comment %} Check features.gender for men {% endcomment %}
{% if product.metafields.features.gender.value %}
  {% for gender_item in product.metafields.features.gender.value %}
    {% assign gender_name = gender_item.name | downcase %}
    {% assign gender_values = gender_values | append: gender_name | append: ',' %}
    {% if gender_name == 'men' %}
      {% assign is_men = true %}
    {% endif %}
  {% endfor %}
{% endif %}
```

### **3. Table Structure Changes**

#### **For Clothing (Men & Women):**
- **Rows:** EU, CHEST, WAIST, HIP, HEIGHT, INSEAM LENGTH
- **Men Sizes:** S, M, L, XL, XXL, 3XL, 4XL
- **Women Sizes:** XS, S, M, L, XL, XXL, 3XL

#### **For Hiking Shoes (Men & Women):**
- **Rows:** EU, UK, US, Foot Length (cm)
- **Men Sizes:** 40, 41, 42, 43, 44, 45, 46, 47
- **Women Sizes:** 36, 37, 38, 39, 40, 41

### **4. Measurement Guide Improvements**

#### **For Clothing (Men & Women):**
- **Title:** "How to Measure your Body?"
- **Bullet Points:** Simple list với letters A-E
  1. CHEST
  2. WAIST
  3. HIP
  4. HEIGHT
  5. INSEAM LENGTH

#### **For Hiking Shoes (Men & Women):**
- **Title:** "How to Measure the Product's Size?"
- **Bullet Points:** Simple list
  1. FOOT LENGTH
- **Note:** *Hiking shoes are sized according to the human foot

#### **UI Enhancements:**
- Uses same structure và styling như `sections/size-guide-section.liquid`
- Consistent `measurement-guide` class với `font-archivo-expanded` heading
- Responsive `measurement-content` layout với flex columns
- Category-specific figure images từ assets (explicitly handled cho tất cả 4 categories):
  - `category == 'clothing_men'` → `size-guide-man.png`
  - `category == 'clothing_women'` → `size-guide-woman.png`
  - `category == 'hiking_shoes_men'` → `hiking-shoe-sizing-man.png`
  - `category == 'hiking_shoes_women'` → `hiking-shoe-sizing-woman.png`
  - Fallback: `size-guide-man.png` cho clothing, `hiking-shoe-sizing-man.png` cho shoes

### **5. Files Modified**

#### **snippets/size-fit-body-measurements.liquid:**
- ✅ Changed parameter từ `measurements` thành `product`
- ✅ Added classification logic dựa trên metafields
- ✅ Replaced dynamic data với fixed data structure
- ✅ Added conditional table structures cho shoes vs clothing
- ✅ Updated measurement guide section với detailed instructions
- ✅ Added category-specific measurement instructions (shoes vs clothing)
- ✅ Enhanced UI với styled instruction boxes và tips

#### **snippets/size-fit-modal.liquid:**
- ✅ Updated body measurements tab để pass `product` object
- ✅ Removed dependency on `body_measurements` metafield

### **5. Data Structure**

#### **Clothing Men Data:**
```
S: EU 44-46, Chest 86-94, Waist 72-80, Hip 88-96, Height 170-176, Inseam 79-80
M: EU 48-50, Chest 94-102, Waist 80-88, Hip 96-104, Height 176-182, Inseam 81-82
L: EU 52-54, Chest 102-110, Waist 88-96, Hip 104-112, Height 182-188, Inseam 83-84
XL: EU 56-58, Chest 110-116, Waist 96-104, Hip 112-120, Height 188-194, Inseam 85-86
XXL: EU 60-62, Chest 116-128, Waist 104-112, Hip 120-128, Height 188-194, Inseam 87-88
3XL: EU 64, Chest 126-132, Waist 112-120, Hip 128-136, Height 188-194, Inseam 89
4XL: EU 66, Chest 132-140, Waist 120-128, Hip 136-144, Height 194-198, Inseam 89
```

#### **Clothing Women Data:**
```
XS: EU 32, Chest 74-78, Waist 58-62, Hip 82-86, Height 154-158, Inseam 79
S: EU 34-36, Chest 78-86, Waist 62-70, Hip 86-94, Height 158-162, Inseam 80
M: EU 38-40, Chest 86-94, Waist 70-78, Hip 94-102, Height 162-166, Inseam 81
L: EU 42-44, Chest 94-102, Waist 78-86, Hip 102-110, Height 166-170, Inseam 81-82
XL: EU 46-48, Chest 102-112, Waist 86-98, Hip 110-120, Height 170-178, Inseam 83-84
XXL: EU 50-52, Chest 112-124, Waist 98-108, Hip 120-128, Height 178-182, Inseam 85
3XL: EU 54-56, Chest 124-136, Waist 108-120, Hip 128-140, Height 178-182, Inseam 85
```

#### **Hiking Shoes Men Data:**
```
40: EU 40, UK 6.5, US 7, Foot Length 26.3cm
41: EU 41, UK 7, US 7.5, Foot Length 27.0cm
42: EU 42, UK 8, US 8.5, Foot Length 27.5cm
43: EU 43, UK 8.5, US 9, Foot Length 28.0cm
44: EU 44, UK 9, US 9.5, Foot Length 28.7cm
45: EU 45, UK 9.5, US 10.5, Foot Length 29.5cm
46: EU 46, UK 11, US 11.5, Foot Length 30.3cm
47: EU 47, UK 12, US 12.5, Foot Length 31.0cm
```

#### **Hiking Shoes Women Data:**
```
36: EU 36, UK 3.5, US 6, Foot Length 23.5cm
37: EU 37, UK 4, US 6.5, Foot Length 24.0cm
38: EU 38, UK 5, US 7.5, Foot Length 24.5cm
39: EU 39, UK 6, US 8.5, Foot Length 25.0cm
40: EU 40, UK 6.5, US 9, Foot Length 26.0cm
41: EU 41, UK 7, US 9.5, Foot Length 27.0cm
```

## 🚀 **Benefits**

### **1. Simplified Implementation:**
- Không cần setup metafields cho body measurements
- Consistent data across tất cả products
- Reduced complexity trong data management

### **2. Improved Performance:**
- Không cần fetch dynamic data
- Faster rendering với hardcoded values
- Reduced server load

### **3. Better Maintenance:**
- Centralized data trong template
- Easy to update size charts
- No dependency on metafield configuration

### **4. Enhanced User Experience:**
- Consistent size information
- Proper categorization cho different product types
- Accurate measurements từ official source

## 📝 **Usage**

### **Current Usage:**
```liquid
{% render 'size-fit-body-measurements', product: product %}
```

### **Classification Examples:**
- **T-shirt for men:** `features.kind = ['clothing']`, `features.gender = ['men']` → Clothing Men
- **Jacket for women:** `features.kind = ['clothing']`, `features.gender = ['women']` → Clothing Women
- **Hiking boots for men:** `features.kind = ['shoes']`, `features.gender = ['men']` → Hiking Shoes Men
- **Trail shoes for women:** `features.kind = ['shoes']`, `features.gender = ['women']` → Hiking Shoes Women

## ⚠️ **Important Notes**

1. **Metafield Dependency:** Feature vẫn cần `features.kind` và `features.gender` metafields để classification
2. **Array Field Handling:** Metafields được handle như array of objects, cần loop qua từng item và access `.name` property
3. **Fallback Logic:** Nếu không có metafields, sẽ fallback về clothing men data
4. **Backward Compatibility:** `size-fit-body-measurements-default.liquid` vẫn được giữ lại
5. **JavaScript Compatibility:** Size recommender có thể cần update để work với fixed data structure

## 🔄 **Migration Status**

- ✅ **Completed:** Basic refactor với fixed data
- ✅ **Completed:** Classification logic implementation
- ✅ **Completed:** Table structure updates
- ⏳ **Pending:** JavaScript compatibility verification
- ⏳ **Pending:** Testing với real products
