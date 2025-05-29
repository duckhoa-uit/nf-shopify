# Size Fit Setup Checklist

## ✅ Pre-Setup Checklist

- [ ] Shopify Admin access
- [ ] Products đã có variants với sizes (S, M, L, XL, etc.)
- [ ] Quyền edit metafields trong Shopify Admin
- [ ] Theme development environment setup

## 📋 Step-by-Step Setup

### Phase 1: Metafield Configuration

#### Step 1: Create Body Measurements Metafield
- [ ] Vào Shopify Admin → Settings → Custom data
- [ ] Chọn Products → Add definition
- [ ] Tạo metafield với thông tin:
  ```
  Namespace: size_fit
  Key: body_measurements
  Name: Size Fit - Body Measurements
  Type: JSON
  ```
- [ ] Save metafield definition

#### Step 2: Create Product Measurements Metafield
- [ ] Tạo metafield thứ 2:
  ```
  Namespace: size_fit
  Key: measurements
  Name: Size Fit - Product Measurements
  Type: JSON
  ```
- [ ] Save metafield definition

### Phase 2: Data Preparation

#### Step 3: Prepare Sample Data
- [ ] Download file `scripts/generate-size-fit-data.js`
- [ ] Run script để generate sample data:
  ```bash
  node scripts/generate-size-fit-data.js
  ```
- [ ] Copy JSON data cho products cần setup

#### Step 4: Choose Import Method

**Option A: Manual Input (1-5 products)**
- [ ] Vào Products trong Shopify Admin
- [ ] Chọn product cần setup
- [ ] Scroll xuống Metafields section
- [ ] Paste JSON data vào 2 metafields đã tạo
- [ ] Save product

**Option B: CSV Import (nhiều products)**
- [ ] Download template `data/size-fit-import-template.csv`
- [ ] Edit CSV với product handles và data thực tế
- [ ] Vào Products → Import trong Shopify Admin
- [ ] Upload CSV và map columns

### Phase 3: Testing

#### Step 5: Verify Metafields
- [ ] Check 1-2 products có metafields data
- [ ] Verify JSON format đúng (không có syntax errors)
- [ ] Test với cả men's và women's products

#### Step 6: Frontend Testing
- [ ] Vào product page trên storefront
- [ ] Kiểm tra size fit button xuất hiện
- [ ] Click button và test modal mở
- [ ] Test 3 tabs: Body Measurements, Product Measurements, Size Recommender
- [ ] Test unit conversion CM ↔ Inches
- [ ] Test size recommender form

#### Step 7: Cross-browser Testing
- [ ] Test trên Chrome
- [ ] Test trên Safari
- [ ] Test trên mobile devices
- [ ] Test responsive design

### Phase 4: Fine-tuning

#### Step 8: Data Validation
- [ ] Verify measurements data chính xác
- [ ] Check size ranges hợp lý
- [ ] Test size recommender với different inputs
- [ ] Validate translations hiển thị đúng

#### Step 9: Performance Check
- [ ] Check modal load time
- [ ] Test với slow network
- [ ] Verify no JavaScript errors
- [ ] Check accessibility features

## 🔧 Troubleshooting

### Common Issues & Solutions

**Issue: Size fit button không xuất hiện**
- [ ] Check product có metafields không
- [ ] Verify metafield namespace/key đúng
- [ ] Check conditional logic trong main-product.liquid

**Issue: Modal không mở**
- [ ] Check JavaScript console cho errors
- [ ] Verify size-fit-modal.js được load
- [ ] Check modal HTML structure

**Issue: Data không hiển thị đúng**
- [ ] Validate JSON format
- [ ] Check metafield type là JSON
- [ ] Verify data structure match với code

**Issue: Unit conversion không work**
- [ ] Check measurement-value elements có data attributes
- [ ] Verify JavaScript unit conversion logic
- [ ] Test với different measurement values

## 📊 Sample Data Reference

### Men's Sizes (CM)
```
S:  Chest 86-94,  Waist 72-80,  Hip 88-96
M:  Chest 94-102, Waist 80-88,  Hip 96-104
L:  Chest 102-110, Waist 88-96, Hip 104-112
XL: Chest 110-116, Waist 96-104, Hip 112-120
```

### Women's Sizes (CM)
```
XS: Chest 74-78,  Waist 58-62,  Hip 82-86
S:  Chest 78-86,  Waist 62-70,  Hip 86-94
M:  Chest 86-94,  Waist 70-78,  Hip 94-102
L:  Chest 94-102, Waist 78-86,  Hip 102-110
```

## 🚀 Go-Live Checklist

- [ ] All metafields configured correctly
- [ ] Sample data imported successfully
- [ ] Frontend functionality tested
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility confirmed
- [ ] Performance acceptable
- [ ] No JavaScript errors
- [ ] Translations working
- [ ] Size recommender algorithm tested
- [ ] User acceptance testing completed

## 📈 Post-Launch

- [ ] Monitor user engagement với size fit feature
- [ ] Collect feedback về size recommendations
- [ ] Track conversion rate impact
- [ ] Plan for additional language translations
- [ ] Consider advanced features (size comparison, fit feedback)

---

**Need Help?**
- Check browser console cho JavaScript errors
- Verify metafield data format với JSON validator
- Test với simple products trước khi scale up
- Document any custom modifications cho future reference
