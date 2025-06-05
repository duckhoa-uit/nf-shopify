# Size Fit Button Refactor Workflow

## Current tasks from user prompt
- Analyze size fit functionality in 3 specific files
- Always show the size fit button trigger (remove hiding conditions)
- Conditionally display tabs in modal based on product measurement availability
- Preserve existing functionality when product measurements are available

## Plan (simple)
1. Read and analyze the 3 specified files to understand current logic
2. Identify conditions that control button visibility
3. Document tab display logic in modal
4. Refactor button to always show
5. Modify modal to conditionally show tabs based on product measurements
6. Test and verify functionality

## Steps
1. Read `sections/main-product.liquid` - understand size fit button trigger implementation
2. Read `snippets/product-variant-options.liquid` - analyze current button display logic
3. Read `snippets/size-fit-modal.liquid` - understand modal structure and tab system
4. Document current conditions for button visibility
5. Document current logic for tab display
6. Create detailed refactoring plan
7. Implement button visibility changes
8. Implement conditional tab display in modal
9. Test functionality

## Things done
- Created workflow file
- Read and analyzed the 3 specified files
- Found size fit button trigger in `snippets/product-variant-picker.liquid` (lines 59-70)
- Identified current button visibility conditions
- Documented tab display logic in modal

## Analysis Results

### Current Button Visibility Logic
**Location**: `snippets/product-variant-picker.liquid` lines 59-70
**Current Condition**: Button only shows when EITHER condition is true:
- `product.metafields.size_fit.measurements.value` (product measurements) OR
- `product.metafields.size_fit.body_measurements.value` (body measurements)

### Current Tab Display Logic
**Location**: `snippets/size-fit-modal.liquid` lines 62-84 (navigation) and 87-108 (content)
**Current Behavior**:
- All 3 tabs always show in navigation (Body Measurements, Product Measurements, Size Recommender)
- Product Measurements tab content shows "No product measurements available" message when `size_fit_data` is empty
- Body Measurements and Size Recommender tabs always show their content

### Required Changes
1. **Button Visibility**: Remove the conditional check - always show the button
2. **Tab Display**: Hide "Product Measurements" tab completely when no product measurements available

## Detailed Refactoring Plan

### Step 1: Modify Button Visibility (snippets/product-variant-picker.liquid)
**Current code (lines 59-70):**
```liquid
{% if product.metafields.size_fit.measurements.value or product.metafields.size_fit.body_measurements.value %}
  <button type="button" class="size-fit-button..." data-size-fit-modal>
    <!-- button content -->
  </button>
{% endif %}
```

**New code:**
```liquid
<button type="button" class="size-fit-button..." data-size-fit-modal>
  <!-- button content -->
</button>
```
**Change**: Remove the `{% if %}` condition completely - button always shows

### Step 2: Modify Tab Display Logic (snippets/size-fit-modal.liquid)
**Current code (lines 70-76):**
```liquid
<button type="button" class="tab-btn..." data-tab="product-measurements">
  Product Measurements
</button>
```

**New code:**
```liquid
{% if size_fit_data %}
  <button type="button" class="tab-btn..." data-tab="product-measurements">
    Product Measurements
  </button>
{% endif %}
```
**Change**: Conditionally render the Product Measurements tab button only when data exists

### Step 3: Update JavaScript Tab Logic (if needed)
**Check**: Verify that the JavaScript in `assets/size-fit-modal.js` handles missing tabs gracefully
**Action**: Update if necessary to prevent errors when Product Measurements tab is missing

## Things done (continued)
- ✅ Implemented button visibility changes (removed conditional check in product-variant-picker.liquid)
- ✅ Implemented conditional tab display in modal (size-fit-modal.liquid):
  - Tab navigation button only shows when size_fit_data exists
  - Tab content panel only renders when size_fit_data exists
  - Removed "No product measurements available" fallback message

## Things done (continued)
- ✅ Verified JavaScript compatibility: The existing JavaScript in `assets/size-fit-modal.js` handles missing tabs gracefully:
  - Line 69-73: Checks if target panel exists before showing it
  - Line 52-53: Dynamically queries for existing tabs, so missing tabs are automatically excluded
  - No JavaScript changes needed

## Summary of Changes Made

### 1. Button Visibility (snippets/product-variant-picker.liquid)
**Before**: Button only showed when `product.metafields.size_fit.measurements.value` OR `product.metafields.size_fit.body_measurements.value` existed
**After**: Button always shows regardless of product measurement availability

### 2. Tab Display (snippets/size-fit-modal.liquid) - UPDATED
**Before**:
- All 3 tabs always visible in navigation
- Product Measurements tab showed "No product measurements available" message when no data
**After**:
- **WITH product measurements**: Full tab navigation with all 3 tabs (Body Measurements, Product Measurements, Size Recommender)
- **WITHOUT product measurements**: No tab navigation, only simple body measurements content

## Expected Behavior
- **Products WITH measurements**: Full modal with 3 tabs (Body Measurements, Product Measurements, Size Recommender)
- **Products WITHOUT measurements**: Simple modal with only Body Measurements content (no tabs, no size recommender)
- **All products**: Size fit button always visible and functional

## Things not done yet
- Test functionality with products that have measurements
- Test functionality with products that don't have measurements
