# Workflow: Parfum Tabbed Section Implementation

## Current Tasks
- Create a new Shopify section below "parfum_recommendations" in `/templates/page.parfum.json`
- Based on Figma design: https://www.figma.com/design/g3AZxNYVeOtoj96UgzK2kB/NF-WEB-2025?node-id=762-33200&t=s3kcwLwIUTYYwWLX-4

## Plan (Simple)
1. Analyze Figma design to understand layout and functionality
2. Examine color system and CSS architecture
3. Study existing sections for container patterns
4. Create tabbed section with expandable cards
5. Implement JavaScript for tab switching and card expansion
6. Add to template JSON file

## Steps
1. Get Figma design data and analyze layout
2. Examine existing sections for container patterns
3. Study color system in theme.liquid and tailwind.css
4. Create section liquid file with schema
5. Implement tabbed navigation system
6. Create expandable card components
7. Add JavaScript for interactivity
8. Style with responsive design
9. Add section to page template
10. Test functionality

## Things Done
- Created workflow file
- Analyzed Figma design - FAQ section with header, tabs, and expandable cards
- Examined existing sections for container patterns
- Studied color system and CSS architecture
- Created parfum-care-guide.liquid section with:
  - Header with title and badge
  - Tabbed navigation system
  - Expandable cards with smooth animations
  - JavaScript for tab switching and card expansion
  - Responsive design with mobile-first approach
  - Proper ARIA labels for accessibility
- Created section-parfum-care-guide.css with complete styling
- Added section to page.parfum.json template
- Added translation keys to locales files

## Things Not Done Yet
- Test functionality and styling
- Make any necessary adjustments
