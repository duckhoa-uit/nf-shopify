# Simplify Size Guide CSS

## Current tasks from user prompt:
- Simplify the size-guide.css file that was copied from another site
- Update CSS variables to work with the current system
- Remove unnecessary complexity and make it consistent with the theme

## Plan (simple):
1. Analyze current size-guide.css to understand what it does
2. Identify issues with current CSS variables and styling
3. Simplify the CSS by removing redundant properties and outdated browser prefixes
4. Update font family variables to use the correct theme variables
5. Update colors to use the current design system variables
6. Clean up spacing and sizing to use rem units consistently
7. Make the code more maintainable and consistent with the theme

## Steps:
1. ✅ Examine current size-guide.css file
2. ✅ Understand the current CSS variable system from tailwind.css and theme.liquid
3. ✅ Simplify and update the CSS file
4. Test the changes to ensure styling still works correctly

## Things done:
- ✅ Analyzed current size-guide.css file (54 lines)
- ✅ Identified issues:
  - Uses non-existent `--font-family-main` variable
  - Uses hardcoded colors (#000, #fff) instead of theme variables
  - Has redundant px/rem declarations
  - Uses outdated flexbox prefixes (-ms-flexbox)
  - Complex margin/padding calculations
- ✅ Understood current CSS variable system:
  - Font families: `--font-body-family`, `--font-heading-family`
  - Colors: `--color-black`, `--color-white`, theme variables with `rgb()`
  - Spacing: rem units preferred, design system uses 0.25rem base
- ✅ Simplified and updated the CSS file (Round 1):
  - Replaced `--font-family-main` with `--font-body-family`
  - Updated hardcoded colors to use design system variables
  - Removed redundant px/rem declarations (kept only rem)
  - Removed outdated flexbox prefixes
  - Simplified margin/padding values
  - Added helpful comment header
  - Reduced file from 54 lines to 36 lines (33% reduction)
- ✅ Optimized additional styling (Round 2):
  - User added `.measurement-instructions ol` styling
  - Simplified redundant margin declarations (margin-block-*, margin-inline-*)
  - Removed duplicate property declarations
  - Consolidated margin properties using shorthand
  - Reduced file from 47 lines to 37 lines (21% reduction from original)

- ✅ Fixed counter issue (Round 3):
  - User reported counter showing A, A, A, A instead of A, B, C, D
  - Added missing `counter-reset: item;` to `.measurement-instructions ol`
  - Now counter will properly increment through A, B, C, D, E, etc.

## Things not done yet:
- Test the updated styling to ensure it renders correctly
- Verify compatibility with existing size guide components

## Summary of Final Optimizations:
**Before (Round 2):**
```css
.measurement-instructions ol {
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-inline-start: 0;
  margin-inline-start: 0;  /* duplicate */
  margin-inline-end: 0;
  margin-inline-end: 0;    /* duplicate */
  padding-inline-start: 40px;
  padding-inline-start: 2.5rem;  /* duplicate */
}
```

**After (Round 2):**
```css
.measurement-instructions ol {
  margin: 1rem 0;
  padding-left: 2.5rem;
}
```

**Benefits:**
- Removed duplicate property declarations
- Used shorthand margin property for cleaner code
- Consistent rem units throughout
- Better browser compatibility (logical properties not needed here)
- Reduced complexity while maintaining same visual result
