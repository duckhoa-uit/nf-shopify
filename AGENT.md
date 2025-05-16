# AGENT.md - Northfinder Shopify Theme Development

## Build & Test Commands
- Start development server: `pnpm dev` (starts Shopify theme dev + Tailwind watch)
- Run all tests: `pnpm test`
- Run a single test: `pnpm test -- assets/product-utils.test.js`
- Run CI tests: `pnpm test:ci`

## Code Style & Conventions
- **Formatting**: Uses Prettier with 120 character line width, double quotes
- **CSS**: Uses Tailwind CSS for styling (see tailwind.config.js)
- **Naming**:
  - Variables & properties: `snake_case`
  - CSS classes: Tailwind utilities or kebab-case for custom
  - Files: kebab-case (.liquid, .js, .css)
- **Testing**: Uses Vitest for JavaScript testing (see assets/*.test.js for examples)
- **Import order**: Third-party libraries first, then internal modules

## Project Structure
- `/assets`: JavaScript and CSS files
- `/sections`: Shopify theme sections (Liquid templates)
- `/snippets`: Reusable Liquid components
- `/templates`: Main page templates

Follow conventions in existing files when adding new code. Check Cursor rules in .cursor/rules/ for detailed guidelines.