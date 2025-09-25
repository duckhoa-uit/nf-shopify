# Workflow: Parfum Recommendations Section

## Current Tasks
- Analyze Figma design for "Recommendations & Warnings" section
- Create new Shopify section following theme patterns
- Implement responsive design with proper container patterns
- Add section to page.parfum.json template
- Follow all AGENTS.md guidelines for Shopify development

## Plan (Simple)
1. **Design Analysis**: Parse Figma data to understand layout structure, content, and styling requirements
2. **Pattern Research**: Study existing parfum sections to understand container patterns and CSS architecture
3. **Implementation**: Create section file with proper Liquid templating, CSS styling, and schema
4. **Integration**: Add section to page template and ensure proper positioning
5. **Localization**: Add translation keys for internationalization

## Steps
1. ✅ **Figma Analysis**: Retrieved design data showing "Recommendations & Warnings" section with:
   - Main heading "Recommendations & Warnings" with FAQ badge
   - Instructions paragraph
   - 4 cards in 2x2 grid: Do/Don't and Recommended/Avoid
   - Each card has icon, heading, and bullet points
   - Colors: Green (#429364) for positive, Red (#E3350E) for negative

2. ✅ **Pattern Research**: Analyzed existing parfum sections:
   - All use `page-width` class for container
   - CSS loaded with `{{ 'section-name.css' | asset_url | stylesheet_tag }}`
   - Section padding with `section-{{ section.id }}-padding`
   - Color scheme support with `color-{{ section.settings.color_scheme }}`
   - Schema with proper translation keys

3. **File Creation**: Create section files
   - `sections/parfum-recommendations.liquid` - Main section file
   - `assets/section-parfum-recommendations.css` - Styling
   - Update locale files for translations

4. **Template Integration**: Add section to `templates/page.parfum.json`

5. **Testing**: Verify responsive design and functionality

## Things Done
- ✅ Analyzed Figma design data and identified section structure
- ✅ Researched existing parfum section patterns and container usage
- ✅ Identified color variables and theme architecture
- ✅ Planned section structure and naming convention
- ✅ Created `sections/parfum-recommendations.liquid` with proper Liquid templating
- ✅ Created `assets/section-parfum-recommendations.css` with responsive design
- ✅ Added translation keys to `locales/en.default.json` and `locales/en.default.schema.json`
- ✅ Updated `templates/page.parfum.json` to include new section after parfum_instructions
- ✅ Implemented 4-card grid layout matching Figma design exactly
- ✅ Used proper color values from Figma (#429364 green, #E3350E red)
- ✅ Added SVG icons for check, cross, star, and info symbols
- ✅ Followed theme container patterns with `page-width` class
- ✅ Implemented mobile-first responsive design

## Recent Updates
- ✅ **Updated Content Structure**: Changed from `<p>` with `<br>` tags to `<ul><li>` structure
- ✅ **Updated Translation Keys**: Split content into individual item keys (item_1, item_2, item_3)
- ✅ **Updated CSS**: Added proper styling for `ul` and `li` elements with list-style: none
- ✅ **Improved Semantic HTML**: Better accessibility with proper list structure

## Things Not Done Yet
- Test section in development environment
- Verify responsive behavior on different screen sizes
- Test translation system functionality
- Validate accessibility and semantic HTML structure

## Design Analysis Summary
**Section Name**: "parfum-recommendations" (based on content analysis)
**Layout**:
- Header with title "Recommendations & Warnings" and "FAQ" badge
- Instructions text
- 4-card grid (2x2 on desktop, 1 column on mobile)
- Cards: Do (green check), Don't (red X), Recommended (green star), Avoid (red info)

**Colors Identified**:
- Green: #429364 (positive actions)
- Red: #E3350E (negative/warning actions)
- White: #FFFFFF (card backgrounds)
- Gray variants for text and borders

**Typography**:
- Main heading: Montserrat 500, 38px, uppercase
- Card headings: Montserrat 600, 18px
- Body text: Montserrat 400, 14px with 2.3 line-height

## Implementation Summary

**Files Created:**
1. `sections/parfum-recommendations.liquid` - Main section file with 4 hardcoded cards
2. `assets/section-parfum-recommendations.css` - Responsive CSS with mobile-first design
3. Updated `templates/page.parfum.json` - Added section after parfum_instructions
4. Updated `locales/en.default.json` - Added translation keys for content
5. Updated `locales/en.default.schema.json` - Added schema translation keys

**Key Features:**
- ✅ **Exact Figma Match**: Colors, typography, spacing, and layout match design specifications
- ✅ **Responsive Design**: Mobile-first approach with proper breakpoints (749px, 989px)
- ✅ **Theme Integration**: Uses `page-width` container and theme color scheme system
- ✅ **Accessibility**: Semantic HTML structure with proper heading hierarchy
- ✅ **Internationalization**: Full translation support with proper key structure
- ✅ **Performance**: Inline SVG icons, efficient CSS with custom properties
- ✅ **Maintainability**: BEM naming convention, component-based architecture

**Section Position**: Added after "parfum_instructions" section as requested

**Ready for testing in development environment with `pnpm dev`**
