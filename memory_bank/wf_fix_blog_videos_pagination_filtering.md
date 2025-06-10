# Fix Blog Videos Pagination Filtering Issue

## Current Task
Analyze and fix the blog tag filtering functionality in `/sections/blog-videos.liquid` where pagination causes filtered posts beyond the initial 4 posts to not display properly.

## Plan (Simple)
1. Investigate current client-side filtering implementation in blog-videos.liquid
2. Analyze pagination logic and identify root cause of filtering issue
3. Compare with main-blog.liquid to understand differences and avoid conflicts
4. Design solution that loads all posts for proper client-side filtering
5. Implement fix while maintaining existing UI/UX and scoping

## Steps
1. **Investigation Phase**
   - Examine `/sections/blog-videos.liquid` structure and filtering logic
   - Analyze JavaScript code for client-side tag filtering
   - Check pagination implementation and post loading mechanism
   - Review `/sections/main-blog.liquid` for comparison and conflict avoidance

2. **Root Cause Analysis**
   - Identify why posts beyond initial pagination aren't available for filtering
   - Understand the relationship between Liquid pagination and JavaScript filtering
   - Document current behavior vs expected behavior

3. **Solution Design**
   - Plan approach to ensure all posts are available for client-side filtering
   - Design proper scoping to avoid conflicts with main-blog section
   - Maintain existing client-side filtering approach
   - Preserve current UI/UX design

4. **Implementation**
   - Modify Liquid template to load sufficient posts for filtering
   - Update JavaScript filtering logic if needed
   - Ensure proper query selector scoping
   - Test filtering functionality across different scenarios

5. **Testing & Validation**
   - Test filtering with posts beyond initial pagination
   - Verify no conflicts with main-blog.liquid functionality
   - Confirm UI/UX consistency maintained

## Things Done
- Created workflow tracking file
- Investigated blog-videos.liquid implementation (637 lines)
- Analyzed main-blog.liquid for comparison (613 lines)
- Identified key differences between the two sections

## Root Cause Analysis
**Problem Identified:**
- blog-videos.liquid uses Shopify pagination (`{%- paginate blogs.video.articles by section.settings.posts_per_page -%}`) which only loads 4 posts initially
- Client-side filtering in JavaScript only works on currently loaded DOM elements
- When user filters by a tag that exists in post #5+, those posts aren't in the DOM yet, so filtering shows "no results"
- The load-more functionality loads additional posts, but user must manually click "view more" first

**Key Differences from main-blog.liquid:**
- main-blog.liquid uses server-side tag filtering via Shopify's native `/tagged/` URLs
- blog-videos.liquid uses client-side JavaScript filtering with `data-tags` attributes
- main-blog.liquid categories are `<a>` links that navigate to filtered URLs
- blog-videos.liquid categories are `<div>` elements with click handlers

## Solution Design

**Approach: Hybrid Loading Strategy**
Instead of loading all posts at once (which could be performance-heavy), we'll implement a smart loading strategy:

1. **Initial Load**: Keep current pagination (4 posts) for performance
2. **Smart Pre-loading**: When user clicks a filter tag, automatically load additional pages until we find posts with that tag OR reach a reasonable limit
3. **Progressive Enhancement**: Maintain existing load-more functionality for manual loading

**Technical Implementation Plan:**

### Phase 1: Modify Liquid Template
- Add a hidden data attribute to store total available posts count
- Add data attributes for all available tags across all posts (not just loaded ones)
- Keep existing pagination structure intact

### Phase 2: Enhance JavaScript Logic
- Modify `filterArticles()` function to detect when no results are found
- Add `loadPostsForTag()` function that automatically loads more posts when filtering
- Implement smart loading with reasonable limits (e.g., max 3 additional pages)
- Update load-more button logic to work with the new system

### Phase 3: Performance Optimizations
- Add loading states during automatic post loading
- Implement caching to avoid re-loading same pages
- Add error handling for failed requests

**Benefits:**
- ✅ Fixes the core issue: filtered posts beyond pagination will be found
- ✅ Maintains performance: doesn't load all posts upfront
- ✅ Preserves existing UI/UX: users can still manually load more
- ✅ Progressive enhancement: works better but doesn't break existing functionality
- ✅ Proper scoping: all selectors remain scoped to blog-videos section

## Things Done
- Created workflow tracking file
- Investigated blog-videos.liquid implementation (637 lines)
- Analyzed main-blog.liquid for comparison (613 lines)
- Identified key differences between the two sections
- **✅ Implemented Phase 1: Liquid template modifications**
  - Added data attributes to track total pages, current page, and posts per page
  - Modified blog-videos-grid container to include pagination metadata
- **✅ Implemented Phase 2: JavaScript enhancements**
  - Added `loadPostsFromPage()` async function for loading specific pages
  - Added `loadPostsForFilter()` function for smart pre-loading when filtering
  - Enhanced `filterArticles()` to automatically load more posts when no results found
  - Updated category click handlers to use async filtering
  - Modified load-more button to work with new page tracking system
  - Updated popstate handler for browser navigation
  - Added proper loading states and error handling

## Issues Fixed
- **✅ Fixed View More button visibility (Final Fix):**
  - **Root cause:** Shopify's `{% if paginate.pages <= 1 %}disabled{% endif %}` was disabling button on initial load
  - **Solution:** Remove disabled attribute in JavaScript and handle visibility entirely client-side
  - **New logic:** Show button if `hasMorePages` AND `hasVisibleContent` AND `hasMoreThanOnePage`
  - **Special handling for initial load:** `(currentCategory === 'all' && totalPages > 1)` ensures button shows on first load
  - **For filtered results:** `visibleCount > postsPerPage` ensures button only shows when needed

## Updated Implementation Details
- **Enhanced `updateLoadMoreButton()`:**
  - Added `postsPerPage` check from data attribute
  - Logic: `visibleCount > postsPerPage` ensures button only shows when there's more than one page worth of content
  - Proper debugging info (removed in final version)
- **Updated category click handlers:** Explicitly call `updateLoadMoreButton()` after filtering
- **Updated popstate handler:** Explicitly call `updateLoadMoreButton()` after browser navigation
- **Updated initial load:** Use `.then()` to call `updateLoadMoreButton()` after initial filtering
- **Removed duplicate calls:** `filterArticles()` no longer calls `updateLoadMoreButton()` directly

## Issues Being Fixed (Reset Approach)
- **🔧 "All" filter button disappears issue - Reset State Approach:**
  - **Previous approaches insufficient:** Complex logic still failed in edge cases
  - **Root cause identified:** Auto-loaded articles contaminate pagination state when switching back to "all"
  - **New approach:** Reset pagination state when switching to "all" filter
  - **Implementation:**
    - Reset `loadedPages` to only `[1]` when switching to "all"
    - Remove DOM articles beyond `postsPerPage` (keep only first 4)
    - Apply to both click handlers and popstate (browser navigation)
  - **Result:** Clean state for "all" filter, button should appear correctly

## Things Not Done Yet
- Test filtering with posts beyond initial pagination
- Validate no conflicts with main-blog.liquid functionality
- Confirm UI/UX consistency maintained
- Performance testing and optimization if needed
