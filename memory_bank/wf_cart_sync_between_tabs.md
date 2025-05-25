# Cart Sync Between Tabs Workflow

## Current tasks from user prompt
- Fix cart line items not syncing between tabs
- When editing cart items in one tab and clicking checkout in another tab, it causes errors
- The issue is that old cart line items are being sent to checkout, causing crashes
- Need to implement a sync approach to prevent this issue

## Plan (simple) - UPDATED with BroadcastChannel API
1. Analyze current cart implementation and identify sync points ✓
2. Implement BroadcastChannel API for real-time cross-tab communication
3. Add cart sync manager to broadcast changes and listen for updates
4. Integrate with existing cart.js to broadcast on cart changes
5. Add checkout validation to ensure latest cart data
6. Test the synchronization functionality

**Why BroadcastChannel is the best solution:**
- Real-time sync without polling
- Simple implementation (~50 lines of code)
- Excellent browser support
- No storage overhead
- Automatic cleanup when tabs close

## Steps
1. Research current cart implementation in codebase
2. Identify all cart update points (add, remove, quantity change)
3. Design synchronization strategy using browser storage and events
4. Implement cart state management system
5. Add event listeners for cross-tab communication
6. Update checkout process to fetch latest cart data
7. Test synchronization across multiple tabs

## Things done
- Created workflow file
- User explained the problem with cart sync between tabs
- Analyzed current cart implementation (cart.js, pubsub.js, checkout process)
- Designed comprehensive synchronization approach using BroadcastChannel API
- Analyzed all existing cart functionality that needs to be preserved:
  * Quantity updates (dropdown, debounced, loading states)
  * Remove line items functionality
  * Error handling and recovery
  * Loading states and UI feedback
  * Form submission control
  * PubSub system integration

## Things done (COMPLETED!)
- ✅ Implemented CartSyncManager class with BroadcastChannel API
- ✅ Integrated with existing cart.js (non-intrusive approach)
- ✅ Added checkout validation for both cart page and cart drawer
- ✅ Added cart sync to product form (add to cart)
- ✅ Added global cart sync script to theme layout
- ✅ Created comprehensive test guide

## Files created/modified:
1. **assets/cart-sync.js** - New CartSyncManager class
2. **assets/cart.js** - Added broadcast calls (line 367-369)
3. **assets/product-form.js** - Added broadcast for add to cart (line 77-79)
4. **sections/main-cart-items.liquid** - Added script and checkout validation
5. **snippets/cart-drawer.liquid** - Added drawer checkout validation
6. **layout/theme.liquid** - Added cart sync script globally
7. **test-cart-sync.md** - Testing guide

## Things not done yet
- Test the implementation in browser
- Verify all existing functionality still works
- Test cross-tab synchronization
- Test checkout validation scenarios
