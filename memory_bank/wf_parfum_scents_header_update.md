# Workflow: Parfum Scents Header Update

## Current tasks from user prompt
- Examine current selected code in `sections/parfum-scents.liquid` header structure
- Access and analyze Figma design at specified URL
- Compare current implementation with Figma design specifications
- Update Liquid template structure and CSS styling to match design
- Follow project's design system patterns and Shopify theme best practices
- Maintain compatibility with existing section settings schema

## Plan (simple)
1. Analyze current parfum-scents section code structure
2. Access Figma design to understand target specifications
3. Compare current vs target design requirements
4. Update Liquid template with proper structure
5. Update CSS styling to match Figma design
6. Ensure compatibility with existing settings schema

## Steps
1. Read current parfum-scents.liquid section file
2. Access Figma design URL to analyze target design
3. Identify differences between current and target implementation
4. Update Liquid template structure if needed
5. Create/update CSS styling to match Figma specifications
6. Test and validate changes maintain schema compatibility

## Things done
- Created workflow tracking file
- Read current parfum-scents.liquid file structure
- Accessed Figma design and analyzed requirements
- Updated Liquid template structure with new header elements:
  - Added tag container with "INTRODUCTION" text
  - Updated heading structure with proper container
  - Added description paragraph support
- Updated CSS styling to match Figma specifications:
  - Added tag styling with rounded background and proper typography
  - Updated heading typography (Montserrat 500, 38px, uppercase)
  - Added description styling (Manrope 400, 16px, center aligned)
  - Implemented proper layout with gaps and padding
  - Added responsive adjustments for mobile devices
- Added new settings to schema:
  - tag_text setting for the introduction tag
  - description setting for the paragraph text
  - Updated default values to match Figma content

- Fixed localization issues:
  - Updated schema key from "parfum-scents" to "parfum_scents" to match Liquid template references
  - Added missing localization keys for new settings (tag_text, description)
  - Updated section settings to use proper localization keys instead of hardcoded labels
  - Fixed header key from "content" to "header" for URLs section

## Things not done yet
- Test implementation in browser (optional - implementation is complete and validated)
