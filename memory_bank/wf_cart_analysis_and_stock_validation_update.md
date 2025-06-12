# Workflow: Cart Analysis and Stock Validation Update

## Current tasks from user prompt:
**Phase 1: Analysis**
1. Analyze the entire cart codebase to understand all cart-related handlers, functions, and workflows
2. Find the dialog with title "cart updated" - investigate why it appears and under what conditions it's triggered
3. Locate the current `validateStock` function and understand its current implementation

**Phase 2: Update validateStock Function**
Update the `validateStock` function with new specifications:
- Request format: POST with variants array containing sku and id
- Response format: data array with sku and stock levels
- Logic: Compare API response stock levels with cart quantities, block checkout on insufficient stock, provide user options

## Plan (simple):
1. Analyze entire cart codebase to understand all handlers and workflows
2. Find and investigate "cart updated" dialog
3. Locate and understand current validateStock function
4. Update validateStock function with new specifications
5. Ensure integration with existing cart workflows

## Steps:
1. ⏳ Analyze cart-sync.js file to understand current implementation
2. ⏳ Search for all cart-related files and handlers
3. ⏳ Find "cart updated" dialog and its trigger conditions
4. ⏳ Locate current validateStock function
5. ⏳ Update validateStock function with new request/response format
6. ⏳ Implement stock comparison logic and user options
7. ⏳ Test implementation

## Things done:
- Created workflow memory file
- Read previous cart stock validation workflows for context
- ✅ Analyzed cart-sync.js file (822 lines) - main cart synchronization manager
- ✅ Found cart-related files and components:
  * assets/cart-sync.js - CartSyncManager class for cross-tab sync
  * assets/cart-drawer.js - CartDrawer and CartDrawerItems classes
  * assets/cart.js - CartItems and CartRemoveButton classes
  * assets/cart-notification.js - CartNotification class
  * snippets/cart-drawer.liquid - Cart drawer template with checkout button
  * sections/main-cart-items.liquid - Main cart page template
  * snippets/cart-notification.liquid - Cart notification template
- ✅ Found "Cart Updated" dialog in cart-sync.js:
  * Line 749: showCheckoutValidationDialog() method creates modal with title "Cart Updated"
  * Triggered when cart hash changes between tabs during checkout validation
  * Shows when user tries to checkout but cart was modified in another tab
  * Provides options: "Review Cart" or "Continue to Checkout"
- ✅ Located current validateStock function in cart-sync.js (lines 250-294):
  * Currently sends POST to '/apps/nf-data-management/sync_erp_at_checkout'
  * Request format: { product_ids: [array of product IDs] }
  * Response handling is commented out (lines 269-290)
  * Error handling is commented out (lines 284-290)
  * Currently just calls API without processing response

- ✅ Updated validateStock function (lines 250-306):
  * Changed request format from { product_ids: [...] } to { variants: [{ sku, id }] }
  * Added response processing to handle { data: [{ sku, stock }] } format
  * Implemented stock comparison logic between API response and cart quantities
  * Returns { success: boolean, stockIssues: [...] } format
- ✅ Updated validateBeforeCheckout function (lines 378-405):
  * Re-enabled stock validation response handling
  * Added logic to show stock validation dialog when issues found
  * Blocks checkout when insufficient stock detected
- ✅ Updated showStockValidationDialog function (lines 437-474):
  * Modified to work with new stockIssues format
  * Uses cartItem data from stockIssues instead of separate lookup
  * Maintains existing user options (remove item, adjust quantity)

- ✅ Created test guide (test-stock-validation.md) with comprehensive testing scenarios

## Implementation Summary:
**Phase 1: Analysis - COMPLETED**
- ✅ Analyzed entire cart codebase and identified all handlers/workflows
- ✅ Found "Cart Updated" dialog in showCheckoutValidationDialog() method
- ✅ Located and understood current validateStock function implementation

**Phase 2: Update validateStock Function - COMPLETED**
- ✅ Updated request format: `{ variants: [{ sku, id }] }`
- ✅ Updated response processing: `{ data: [{ sku, stock }] }`
- ✅ Implemented stock comparison logic
- ✅ Added user notification/dialog for stock issues
- ✅ Blocks checkout on insufficient stock
- ✅ Provides user options (remove item, reduce quantity)
- ✅ Maintains existing error handling patterns
- ✅ Follows user preference for minimal loading states

## Things not done yet:
- Test implementation in browser environment
- Verify API endpoint returns expected response format
