# CSS Variable Color Usage Fix

## Current tasks from user prompt:
- Analyze codebase for incorrect usage of `rgb(var(--color-*))` with hex color variables
- Fix instances where hex color variables are wrapped in rgb() function
- Ensure proper usage: theme variables (RGB format) use `rgb()`, design tokens (hex format) use direct `var()`

## Plan (simple):
1. Identify the two types of color variables:
   - Theme variables (RGB format): `--color-base-*: r,g,b` → Use `rgb(var(--color-base-*))`
   - Design tokens (hex format): `--color-gray-*, --color-accent, etc.: #hex` → Use `var(--color-*)`
2. Search for incorrect usage of `rgb(var(--color-*))` with hex variables
3. Fix each instance by removing the `rgb()` wrapper for hex variables
4. Update documentation to reflect correct usage patterns

## Steps:
1. ✅ Analyze codebase to understand color variable types and usage patterns
2. ✅ Search for all instances of `rgb(var(--color-*))` usage
3. ✅ Identify incorrect usage with hex color variables
4. ✅ Fix each file with incorrect usage
5. ✅ Update documentation examples

## Things done:
- ✅ Analyzed color variable definitions in `assets/tailwind.css` and `layout/theme.liquid`
- ✅ Identified two types of variables:
  - Theme variables (RGB): `--color-base-background: 255,255,255` → Need `rgb()`
  - Design tokens (hex): `--color-gray-100: #f5f5f5` → Direct `var()`
- ✅ Fixed `assets/base.css` line 1437: `rgb(var(--color-gray-900))` → `var(--color-gray-900)`
- ✅ Fixed `assets/component-predictive-search.css` line 493: `rgb(var(--color-gray-900))` → `var(--color-gray-900)`
- ✅ Fixed `assets/activities.css` line 94: `rgb(var(--color-gray-900))` → `var(--color-gray-900)`
- ✅ Fixed `docs/design-system.md` lines 99-101: Updated example usage
- ✅ Fixed `docs/design-system.md` line 438: Button loading state example
- ✅ Fixed `docs/css-variables-reference.md` lines 314-315: Design token usage examples
- ✅ Fixed `docs/css-variables-reference.md` line 375: Tailwind class example

## Things not done yet:
- Test the fixes to ensure colors render correctly
- Verify no other files have similar issues
- Update any build processes if needed

## Summary of Changes:
**Problem**: CSS variables defined as hex values (`--color-gray-900: #333333`) were incorrectly used with `rgb()` function (`rgb(var(--color-gray-900))`), which produces invalid CSS.

**Solution**: Removed `rgb()` wrapper for hex color variables, keeping it only for theme variables that are defined in RGB format.

**Files Updated**:
1. `assets/base.css` - Button loading state
2. `assets/component-predictive-search.css` - Predictive search button loading
3. `assets/activities.css` - Activity button loading
4. `docs/design-system.md` - Documentation examples (2 instances)
5. `docs/css-variables-reference.md` - Usage pattern examples (2 instances)

**Correct Usage Patterns**:
```css
/* Theme variables (RGB format) - USE rgb() */
background-color: rgb(var(--color-base-background));
color: rgb(var(--color-base-foreground));

/* Design tokens (hex format) - USE direct var() */
background-color: var(--color-gray-100);
border-color: var(--color-border-light);
color: var(--color-accent);
```
