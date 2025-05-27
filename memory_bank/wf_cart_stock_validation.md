# Workflow: Cart Stock Validation Before Checkout

## Current tasks from user prompt
Cải thiện cart checkout functionality bằng cách tạo POST request đến endpoint '/apps/nf-data-management/sync_erp_at_checkout' với param product_ids trước khi navigate đến checkout page để check available stock còn trong kho.

## Plan (simple)
Analyze current cart functionality và cách tạo proxy request trong account-forms.js, sau đó implement stock validation trước khi checkout.

## Steps
1. ✅ Analyze assets/account-forms.js để hiểu cách tạo proxy request
2. ✅ Analyze current cart functionality và checkout flow
3. ✅ Identify where to intercept checkout process
4. ✅ Design implementation plan
5. ✅ Get user approval for plan
6. ✅ Implement stock validation method trong CartSyncManager
7. ✅ Modify validateBeforeCheckout() để integrate stock validation
8. ✅ Create stock validation dialog với actions
9. ✅ Add loading states và error handling
10. ⏳ Test implementation

## Things done
- Analyzed account-forms.js proxy request pattern (lines 264-347)
- Analyzed cart functionality: main cart page và cart drawer
- Identified checkout interception points trong cart-sync.js validateBeforeCheckout()
- Created detailed implementation plan với user requirements:
  * API format giống update_customer endpoint
  * Block checkout khi out of stock, show dialog với available quantity
  * Actions: cancel, remove item, reduce quantity
  * 5s timeout, loading indicator
  * Fallback: warning + proceed nếu API fails
- ✅ Implemented stock validation functionality:
  * Added validateStock() method với 5s timeout
  * Modified validateBeforeCheckout() để call stock validation first
  * Created showStockValidationDialog() với remove/adjust actions
  * Created showStockValidationWarning() cho API failures
  * Added loading states cho checkout buttons
  * Added helper methods removeCartItem() và updateCartItemQuantity()

## Things not done yet
- Test the implementation thoroughly
- Handle edge cases nếu có
