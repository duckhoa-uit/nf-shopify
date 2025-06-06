# Workflow: Apply Primary Button Styling

## Current tasks from user prompt
- Apply primary button styling from design system to the selection button in facets.liquid
- The user has selected the mobile facets open wrapper section that contains the filter/sort button

## Plan (simple)
1. Analyze current mobile facets button styling in the selected code
2. Identify primary button classes and styling from design system
3. Replace current button styling with primary button classes
4. Ensure the button maintains its functionality while adopting consistent design system styling

## Steps
1. Examine the current mobile facets button structure and classes
2. Review design system primary button styling (`.button`, `.button--primary`)
3. Update the mobile facets button to use primary button classes
4. Test that the button maintains proper functionality and responsive behavior
5. Verify styling consistency with other primary buttons in the theme

## Things done
- Analyzed design system and found primary button styling structure
- Identified current mobile facets button structure in snippets/facets.liquid
- Applied `.button` class to mobile facets open button in snippets/facets.liquid
- Updated CSS in assets/component-facets.css to override button styling for mobile facets
- Added proper spacing and layout adjustments for button elements
- Ensured button maintains proper functionality while adopting design system styling
- Applied consistent primary button styling with proper overrides for mobile facets context
- Updated button to be full width (width: 100%) and min-height: 36px as requested

## Things not done yet
- Task completed successfully! The mobile facets button now uses primary button styling from the design system with full width and 36px minimum height while maintaining its specific functionality and layout requirements.
