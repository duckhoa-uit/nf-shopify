# Cart Sync Testing Guide

## Test Scenarios

### 1. Basic Cart Sync Test
**Setup:**
1. Open two browser tabs with the store
2. Navigate to cart page in both tabs

**Test Steps:**
1. **Tab A**: Add a product to cart
2. **Tab B**: Check if cart updates automatically
3. **Tab A**: Change quantity of an item
4. **Tab B**: Verify quantity change is reflected
5. **Tab A**: Remove an item
6. **Tab B**: Verify item is removed

**Expected Results:**
- ✅ Cart updates should appear in Tab B within 1-2 seconds
- ✅ Notification should show "Cart updated from another tab"
- ✅ All cart totals should be accurate
- ✅ UI should update smoothly without page refresh

### 2. Checkout Validation Test
**Setup:**
1. Open two browser tabs with items in cart
2. Navigate to cart page in both tabs

**Test Steps:**
1. **Tab A**: Change cart items (add/remove/update quantity)
2. **Tab B**: Immediately click "Check out" button
3. Observe validation dialog
4. Choose "Review Cart" option
5. Verify cart is updated with latest data
6. Click "Check out" again
7. Choose "Continue to Checkout" option

**Expected Results:**
- ✅ Validation dialog should appear when cart is out of sync
- ✅ "Review Cart" should update the UI with latest cart data
- ✅ "Continue to Checkout" should proceed to checkout
- ✅ If cart is already in sync, checkout should proceed normally

### 3. Cart Drawer Sync Test
**Setup:**
1. Open two browser tabs
2. Use cart drawer functionality

**Test Steps:**
1. **Tab A**: Add item via product page (opens cart drawer)
2. **Tab B**: Open cart drawer
3. **Tab A**: Change quantity in cart drawer
4. **Tab B**: Check if cart drawer updates
5. **Tab B**: Click checkout in cart drawer when cart is out of sync

**Expected Results:**
- ✅ Cart drawer should sync between tabs
- ✅ Checkout validation should work in cart drawer
- ✅ Cart icon bubble should update with correct item count

### 4. Error Handling Test
**Setup:**
1. Open browser with network throttling or offline mode

**Test Steps:**
1. Try to update cart when network is slow/offline
2. Check error handling
3. Restore network and verify sync works again

**Expected Results:**
- ✅ Graceful error handling when network fails
- ✅ Sync resumes when network is restored
- ✅ No JavaScript errors in console

### 5. Browser Compatibility Test
**Test in different browsers:**
- ✅ Chrome (should work with BroadcastChannel)
- ✅ Firefox (should work with BroadcastChannel)
- ✅ Safari (should work with BroadcastChannel)
- ✅ Edge (should work with BroadcastChannel)
- ✅ Older browsers (should gracefully degrade)

### 6. Performance Test
**Test Steps:**
1. Open 5+ tabs with cart page
2. Make rapid cart changes in one tab
3. Monitor performance and memory usage

**Expected Results:**
- ✅ No significant performance impact
- ✅ No memory leaks
- ✅ Smooth operation across all tabs

## Console Debugging

Open browser console to see debug messages:
- `[CartSync] Initialized with BroadcastChannel support`
- `[CartSync] Broadcasted cart update: {data}`
- `[CartSync] Received message: {type, tabId}`

## Fallback Behavior

If BroadcastChannel is not supported:
- ✅ Cart functionality should work normally (no sync)
- ✅ No JavaScript errors
- ✅ Checkout should work without validation

## Files Modified

1. **assets/cart-sync.js** - New cart sync manager
2. **assets/cart.js** - Added broadcast calls
3. **assets/product-form.js** - Added broadcast for add to cart
4. **sections/main-cart-items.liquid** - Added checkout validation
5. **snippets/cart-drawer.liquid** - Added drawer checkout validation
6. **layout/theme.liquid** - Added cart sync script globally

## Key Features Implemented

1. **Real-time sync** using BroadcastChannel API
2. **Checkout validation** to prevent stale cart submissions
3. **User notifications** when cart is updated from another tab
4. **Graceful degradation** for unsupported browsers
5. **Non-intrusive integration** preserving all existing functionality
6. **Error handling** for network issues
7. **Performance optimization** with cart change detection

## Troubleshooting

**If sync is not working:**
1. Check browser console for errors
2. Verify BroadcastChannel support: `'BroadcastChannel' in window`
3. Check if cart-sync.js is loaded
4. Verify cartSyncManager is initialized: `window.cartSyncManager`

**If checkout validation is not working:**
1. Check if cartSyncManager is available
2. Verify form submission handlers are attached
3. Check network connectivity for cart validation calls
