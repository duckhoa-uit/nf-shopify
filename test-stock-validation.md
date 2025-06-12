# Stock Validation Testing Guide

## Overview
This guide helps test the updated stock validation functionality in the cart checkout process.

## Updated Implementation Summary

### Request Format
```json
{
  "variants": [
    { "sku": "1023-209-192", "id": "12343434-3434" }
  ]
}
```

### Response Format
```json
{
  "data": [
    {
      "sku": "103867-270-102", 
      "stock": 71
    },
    {
      "sku": "103867-270-106",
      "stock": 5
    }
  ]
}
```

### Key Changes Made

1. **validateStock() function (lines 250-306)**:
   - Changed request format from `{ product_ids: [...] }` to `{ variants: [{ sku, id }] }`
   - Added response processing for `{ data: [{ sku, stock }] }` format
   - Compares API stock levels with cart item quantities
   - Returns `{ success: boolean, stockIssues: [...] }` format

2. **validateBeforeCheckout() function (lines 378-405)**:
   - Re-enabled stock validation response handling
   - Shows stock validation dialog when issues are found
   - Blocks checkout when insufficient stock is detected

3. **showStockValidationDialog() function (lines 437-474)**:
   - Updated to work with new stockIssues format
   - Uses cartItem data directly from stockIssues
   - Maintains existing user options (remove item, adjust quantity)

## Testing Scenarios

### Scenario 1: Sufficient Stock
1. Add items to cart with quantities that are available in stock
2. Proceed to checkout
3. **Expected**: Checkout should proceed normally without any dialogs

### Scenario 2: Insufficient Stock
1. Add items to cart with quantities that exceed available stock
2. Proceed to checkout
3. **Expected**: 
   - Loading state should appear on checkout button
   - Stock validation dialog should appear showing out-of-stock items
   - Dialog should show "Requested: X, Available: Y" for each item
   - User should see options to "Remove" or "Adjust to Y" (if Y > 0)

### Scenario 3: API Timeout/Error
1. Simulate API timeout or error (disconnect network temporarily)
2. Proceed to checkout
3. **Expected**:
   - Stock validation warning dialog should appear
   - User should see options to "Cancel Checkout" or "Continue Anyway"

### Scenario 4: Mixed Stock Levels
1. Add multiple items: some with sufficient stock, some without
2. Proceed to checkout
3. **Expected**:
   - Only items with insufficient stock should appear in the dialog
   - User can handle each item individually

## Testing Steps

1. **Open browser developer tools** to monitor network requests and console logs
2. **Add items to cart** using various quantities
3. **Click checkout button** (either main cart or cart drawer)
4. **Observe the following**:
   - Network request to `/apps/nf-data-management/sync_erp_at_checkout`
   - Request payload format matches new specification
   - Console log showing stock validation result
   - Appropriate dialog behavior based on stock levels

## Debug Information

- Check browser console for `[CartSync] Stock validation result:` logs
- Monitor network tab for POST requests to stock validation endpoint
- Verify request payload contains `variants` array with `sku` and `id` fields
- Check response contains `data` array with `sku` and `stock` fields

## Notes

- The implementation maintains backward compatibility with existing cart workflows
- Loading states are shown during stock validation
- User preferences for minimal loading states are respected
- All existing cart functionality should continue to work normally
