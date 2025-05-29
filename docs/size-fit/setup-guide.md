# Size Fit Feature Setup Guide

## 1. Tạo Metafield Definitions trong Shopify Admin

### Bước 1: Truy cập Shopify Admin
1. Đăng nhập vào Shopify Admin
2. Vào **Settings** → **Custom data**
3. Chọn **Products** → **Add definition**

### Bước 2: Tạo Body Measurements Metafield

**Metafield 1: Body Measurements**
```
Namespace: size_fit
Key: body_measurements
Name: Size Fit - Body Measurements
Type: JSON
```

**Sample JSON Structure:**
> 📊 **See complete examples**: [data-examples.md](./data-examples.md#body-measurements-examples)

### Bước 3: Tạo Product Measurements Metafield

**Metafield 2: Product Measurements**
```
Namespace: size_fit
Key: measurements
Name: Size Fit - Product Measurements
Type: JSON
```

**Sample JSON Structure:**
> 📊 **See complete examples**: [data-examples.md](./data-examples.md#product-measurements-examples)

## 2. Import Data vào Products

### Phương pháp 1: Manual Input (cho vài products)

1. Vào **Products** trong Shopify Admin
2. Chọn một product cần thêm size fit data
3. Scroll xuống **Metafields** section
4. Tìm **Size Fit - Body Measurements** và **Size Fit - Product Measurements**
5. Paste JSON data tương ứng

### Phương pháp 2: Bulk Import (cho nhiều products)

#### Bước 1: Tạo CSV Template
Tạo file CSV với columns:
```csv
Handle,Size Fit Body Measurements,Size Fit Product Measurements
product-handle-1,"JSON_DATA_1","JSON_DATA_2"
product-handle-2,"JSON_DATA_3","JSON_DATA_4"
```

#### Bước 2: Sử dụng Shopify Import
1. Vào **Products** → **Import**
2. Upload CSV file
3. Map columns với metafields

### Phương pháp 3: Sử dụng Shopify API (Advanced)

```javascript
// Example API call để update product metafields
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

// GraphQL mutation
const mutation = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        metafields(first: 10) {
          edges {
            node {
              namespace
              key
              value
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
```

## 3. Sample Data Templates

> 📊 **Complete templates available**: [data-examples.md](./data-examples.md)
>
> Includes:
> - Men's & Women's body measurements
> - Top/Jacket & Bottom/Pants product measurements
> - CSV import templates
> - API import examples

## 4. Testing Setup

### Bước 1: Kiểm tra Metafields
1. Vào product page trong admin
2. Verify metafields đã được tạo và có data
3. Check JSON format đúng

### Bước 2: Test Frontend
1. Vào product page trên storefront
2. Kiểm tra size fit button xuất hiện
3. Click button và test modal functionality
4. Test unit conversion và size recommender

### Bước 3: Debug Issues
Nếu có vấn đề:
1. Check browser console cho errors
2. Verify metafield namespace và key đúng
3. Validate JSON format
4. Check product có variants không

## 5. Next Steps

Sau khi setup xong:
1. Test với real products
2. Gather user feedback
3. Fine-tune size recommendation algorithm
4. Add more language translations
5. Monitor performance và usage analytics
