# Fix Desktop Gallery Single Item Display Issue

## Current tasks from user prompt:
- Investigate why desktop gallery with 1 item shows height = 0 and image doesn't display
- Fix the CSS/layout issue causing the image to not render properly

## Plan (simple):
1. Analyze the current desktop gallery HTML structure and CSS
2. Identify the root cause of height = 0 issue when only 1 item exists
3. Check CSS grid layout and media query behavior
4. Fix the styling to ensure single items display correctly
5. Test the solution

## Steps:
1. Examine the desktop gallery HTML structure and CSS classes
2. Look at the CSS for `.hidden`, grid layout, and media queries
3. Check if the issue is related to grid-cols-2 when only 1 item exists
4. Investigate the product media CSS and aspect ratio handling
5. Implement fix for single item display
6. Test the solution

## Things done:
- Created workflow file
- Analyzed desktop gallery structure and found the root cause
- Identified that the single item has class "hidden expandable-item" which causes display: none !important

## Root Cause Analysis:
- Desktop gallery uses `grid-cols-2` layout
- When only 1 item exists, the JavaScript logic in product-media-gallery.liquid adds "hidden" class to the item
- The "hidden" class has `display: none !important` which makes the item invisible
- This happens because the gallery expansion logic treats single items as "expandable" items that should be hidden initially

## Things not done yet:
- None - solution is complete!

## Fix Applied:
- Modified assets/product-utils.module.js line 367 to ensure visibleCount is at least 1
- Changed: `visibleCount = Math.floor(groupedImages[key].length / 2) * 2;`
- To: `visibleCount = Math.max(1, Math.floor(groupedImages[key].length / 2) * 2);`
- This prevents single items from being marked as hidden due to visibleCount = 0
- Added test case in assets/product-utils.test.js to verify single image handling
- All tests pass successfully (18/18)
