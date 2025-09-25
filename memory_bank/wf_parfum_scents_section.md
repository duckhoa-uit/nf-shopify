# Parfum Scents Section Implementation Workflow

## Current Tasks
- Analyze Figma design for new parfum scents section (5 fragrance cards)
- Create new section to be added below parfum_features in page.parfum.json
- Extract and optimize product images from Figma design
- Implement proper localization using Shopify's translation system
- Follow Dawn theme best practices and existing patterns

## Plan (Simple)
1. Analyze Figma design to understand the 5 fragrance cards layout
2. Determine appropriate section name: "parfum-scents" based on content
3. Extract product images and icons from Figma design
4. Create section file with hardcoded HTML structure (no dynamic blocks initially)
5. Create responsive CSS file following existing patterns
6. Update localization files for proper internationalization
7. Add section to templates/page.parfum.json after parfum_features

## Steps
1. **Design Analysis** ✅
   - Analyzed Figma design: 5 fragrance cards (Active Fresh, Outdoor Flow, Adventure Mist, Classic Fresh, Pure Essence)
   - Each card has: product image, colored background, fragrance profile, best for info, explore button
   - Layout: horizontal row of cards with different background colors

2. **Section Naming**
   - Proposed name: "parfum-scents" (semantic and descriptive)
   - File: sections/parfum-scents.liquid
   - CSS: assets/section-parfum-scents.css

3. **Asset Extraction**
   - Need to extract 5 product images from Figma
   - Need to extract/create icons: flask, dumbbells, alpine skiing, tent, t-shirt, socks
   - Background colors: Active Fresh (#4B9957), Outdoor Flow (#459A9F), Adventure Mist (#9E4461), Classic Fresh (#D96B34), Pure Essence (#3D5D89)

4. **Implementation**
   - Create section with hardcoded structure
   - Implement responsive design (mobile-first)
   - Add proper localization keys
   - Update template file

5. **Integration**
   - Add to templates/page.parfum.json after parfum_features
   - Update locale files (EN, DE, SK for EU markets)

## Things Done ✅
- Created workflow documentation
- Analyzed Figma design and identified 5 fragrance cards
- Determined section name: "parfum-scents"
- Identified required assets and color scheme
- **COMPLETED**: Extracted 5 product images from Figma design
- **COMPLETED**: Created `sections/parfum-scents.liquid` with hardcoded HTML structure
- **COMPLETED**: Created `assets/section-parfum-scents.css` with responsive design
- **COMPLETED**: Created 5 SVG icons: dumbbells-light.svg, alpine-skiing-light.svg, tent-light.svg, tshirt-light.svg, socks-light.svg
- **COMPLETED**: Updated `locales/en.default.json` with content translations
- **COMPLETED**: Updated `locales/en.default.schema.json` with schema translations
- **COMPLETED**: Added section to `templates/page.parfum.json` after parfum_features
- **COMPLETED**: Added German translations to `locales/de.json` and `locales/de.schema.json`
- **COMPLETED**: Added Slovak translations to `locales/sk.json` (no schema file exists)
- **COMPLETED**: Added Polish translations to `locales/pl.json` and `locales/pl.schema.json`

## Things Not Done Yet
- Test section in development environment

## Design Details
**5 Fragrance Cards:**
1. **Active Fresh** (#4B9957) - Energic citrus & clean notes - Fitness gear, gym clothes - dumbbells icon
2. **Outdoor Flow** (#459A9F) - Herbal-fresh blend with subtle earthy tones - Hiking, skiing, trail clothing - alpine skiing icon
3. **Adventure Mist** (#9E4461) - Warm, woody aroma with hints of forest air - Travel essentials, camping gear - tent icon
4. **Classic Fresh** (#D96B34) - Timeless clean scent - Daily wear, family laundry - t-shirt icon
5. **Pure Essence** (#3D5D89) - Delicate and laundry freshness - Towels, underwear, sensitive fabrics - socks icon

**Layout Requirements:**
- Horizontal card layout
- Each card has product image on left, content on right
- Colored backgrounds with white text
- "Explore Scent" button at bottom
- Responsive design needed

## Implementation Summary ✅

**Files Created/Modified:**
1. `sections/parfum-scents.liquid` - Main section file with 5 hardcoded fragrance cards
2. `assets/section-parfum-scents.css` - Responsive CSS with mobile-first design
3. `assets/parfum_active_fresh-73cee9.png` - Active Fresh product image
4. `assets/parfum_outdoor_flow-53b46c.png` - Outdoor Flow product image
5. `assets/parfum_adventure_mist-5b8838.png` - Adventure Mist product image
6. `assets/parfum_classic_fresh-37ff15.png` - Classic Fresh product image
7. `assets/parfum_pure_essence-1529c9.png` - Pure Essence product image
8. `assets/dumbbells-light.svg` - Dumbbells icon for Active Fresh
9. `assets/alpine-skiing-light.svg` - Alpine skiing icon for Outdoor Flow
10. `assets/tent-light.svg` - Tent icon for Adventure Mist
11. `assets/tshirt-light.svg` - T-shirt icon for Classic Fresh
12. `assets/socks-light.svg` - Socks icon for Pure Essence
13. `locales/en.default.json` - Added translation keys under sections.parfum_scents
14. `locales/en.default.schema.json` - Added schema translations
15. `templates/page.parfum.json` - Added parfum_scents section after parfum_features

**Key Features Implemented:**
- 5 hardcoded fragrance cards with alternating image/content layout
- Responsive design (mobile: stacked, tablet+: horizontal)
- Brand color scheme for each fragrance type
- Proper semantic HTML with translation support
- BEM CSS naming convention
- CSS custom properties for theming
- Hover effects on buttons
- Mobile-first responsive design
- Proper localization structure for internationalization

## Implementation Status: COMPLETED ✅

**All core requirements successfully implemented:**

✅ **Section Naming**: Created `parfum-scents` section based on design content analysis
✅ **Asset Extraction**: Extracted and optimized 5 product images from Figma design
✅ **HTML Structure**: Hardcoded structure with 5 fragrance cards as requested
✅ **Responsive Design**: Mobile-first CSS with proper breakpoints
✅ **Localization**: Added English translations (DE/SK can be added later)
✅ **Integration**: Added to `templates/page.parfum.json` after parfum_features section
✅ **Icon Creation**: Created 5 custom SVG icons matching design requirements
✅ **Code Standards**: BEM naming, semantic HTML, <300 lines per file

**Ready for testing in development environment**

**Next Steps (Optional):**
- Test section functionality in development
- Adjust styling if needed based on testing results
