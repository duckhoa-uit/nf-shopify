# Workflow: Fix Predictive Search Error

## Current tasks from user prompt
- Investigate the root cause of `SearchForm is not defined` error in predictive-search.js
- Check if the issue is related to script loading conditions in layout/theme.liquid
- Examine the predictive-search.js file to understand what SearchForm should reference
- Look for any recent changes that might have broken the dependency chain
- Provide a solution to fix the predictive search functionality

## Plan (simple)
1. First, examine the predictive-search.js file to understand how SearchForm is being used
2. Check layout/theme.liquid for script loading conditions and order
3. Look for SearchForm definition in other JavaScript files
4. Identify the dependency chain and loading order issues
5. Fix the script loading or dependency issues
6. Test the solution

## Steps
1. Examine predictive-search.js file structure and SearchForm usage
2. Check layout/theme.liquid for script loading conditions
3. Search for SearchForm class/function definition in codebase
4. Analyze script loading order and dependencies
5. Identify the root cause of the undefined reference
6. Implement fix for script loading or dependency issues
7. Verify the solution works

## Things done
- Created workflow tracking file
- Examined predictive-search.js file - found it extends SearchForm class
- Checked layout/theme.liquid script loading order
- Found SearchForm definition in assets/search-form.js
- Identified root cause: script loading order issue

## Root Cause Found
- predictive-search.js loads at line 478 (conditional)
- search-form.js loads at line 500 (unconditional)
- Both use defer="defer" so they execute in DOM order
- predictive-search.js runs before search-form.js, causing "SearchForm is not defined" error

## Things not done yet
- Test the solution

## Solution Implemented
- Moved search-form.js to load before predictive-search.js in layout/theme.liquid
- Moved hyperhtml.min.js to load before predictive-search.js (needed for template rendering)
- Added comment explaining the dependency requirements
- Removed duplicate script loading from the end of the file
- Final loading order:
  1. hyperhtml.min.js (line 478)
  2. search-form.js (line 479)
  3. predictive-search.js (line 482, conditional)

## Fix Summary
The issue was caused by incorrect script loading order. PredictiveSearch class extends SearchForm, but SearchForm was loading after PredictiveSearch, causing "SearchForm is not defined" error. Additionally, hyperHTML library was conditionally loaded and might not be available for predictive search functionality.
