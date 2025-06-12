# Debug Stock Validation - Quick Test Guide

## 🚀 Quick Test Steps

### 1. Mở Browser Console
- Mở Developer Tools (F12)
- Chuyển sang tab Console

### 2. Enable Mock Mode
```javascript
enableMockStock()
```
Sẽ thấy message: "Mock stock mode ENABLED - will simulate insufficient stock"

### 3. Test Checkout
1. Thêm items vào cart (bất kỳ sản phẩm nào)
2. Click nút "Checkout" (main cart hoặc cart drawer)
3. Quan sát console logs và dialog behavior

### 4. Disable Mock Mode (khi test xong)
```javascript
disableMockStock()
```

## 🔍 Debug Information

### Console Commands
- `enableMockStock()` - Bật mock mode (giả lập thiếu stock)
- `disableMockStock()` - Tắt mock mode (dùng API thật)
- `checkMockStock()` - Kiểm tra trạng thái mock mode

### Console Logs để Theo Dõi
```
[CartSync DEBUG] ===== CHECKOUT VALIDATION STARTED =====
[CartSync DEBUG] Starting stock validation...
[CartSync DEBUG] Cart items: [...]
[CartSync DEBUG] Using MOCK response for testing
[CartSync DEBUG] Mock stock validation result: {...}
[CartSync DEBUG] INSUFFICIENT STOCK for SKU-123!
[CartSync DEBUG] Stock issues found: [...]
[CartSync DEBUG] Stock issues detected, showing dialog...
[CartSync DEBUG] Removing cart item: 44988638822590:3f323ea1e2539f0fcade6bad20369ed4
[CartSync DEBUG] Remove successful, result: {...}
[CartSync DEBUG] Publishing cartUpdate event for auto-reload
[CartSync DEBUG] All stock issues resolved, closing dialog...
```

## 🎯 Expected Behavior

### Khi Mock Mode ENABLED:
1. **Loading State**: Checkout button sẽ disabled và hiển thị "Validating stock..."
2. **Mock Response**: Tự động tạo stock levels thấp (0-2) cho mỗi item
3. **Dialog Xuất Hiện**: "Stock Unavailable" dialog với:
   - Danh sách items thiếu stock
   - "Requested: X, Available: Y" cho mỗi item
   - Buttons: "Remove", "Adjust to Y", "Cancel Checkout"
4. **Checkout Blocked**: Không thể proceed đến checkout page
5. **Auto-Reload**: Sau khi remove/adjust items, cart page sẽ auto-reload để update UI

### Khi Mock Mode DISABLED:
- Sử dụng API thật `/apps/nf-data-management/sync_erp_at_checkout`
- Behavior phụ thuộc vào response từ server

## 🐛 Troubleshooting

### Nếu không thấy dialog:
1. Check console có error không
2. Verify mock mode: `checkMockStock()`
3. Đảm bảo có items trong cart

### Nếu console không có logs:
1. Refresh page
2. Check file cart-sync.js đã load chưa
3. Verify `window.cartSyncManager` exists

### Nếu Remove button bị error 400:
- ✅ **FIXED**: Updated to use `fetchConfig()` với proper headers
- Check console logs cho detailed error information
- Verify itemKey format đúng (variant_id:hash)

### Test Scenarios:
1. **Sufficient Stock**: Disable mock mode, test với real API
2. **Insufficient Stock**: Enable mock mode
3. **API Error**: Disconnect network, test error handling
4. **Mixed Stock**: Test với multiple items
5. **Remove Items**: Test remove functionality trong stock dialog
6. **Adjust Quantity**: Test adjust quantity functionality

## 📝 Notes
- Mock mode chỉ ảnh hưởng stock validation, không ảnh hưởng cart functionality khác
- Debug logs sẽ hiển thị toàn bộ flow từ start đến finish
- Mock response tạo random stock 0-2 để đảm bảo có insufficient stock
- LocalStorage được dùng để persist mock mode setting
