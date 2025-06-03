# Language Preservation Test Cases

## Test Scenarios

### 1. Address Form Submission (Add New Address)
**Test Steps:**
1. Navigate to `/de/account/addresses` (German language)
2. Click "Add New Address" button
3. Fill out the form with valid data
4. Submit the form
5. Verify user is redirected to `/de/account/addresses` (not `/account/addresses`)

**Expected Result:** User stays on German language version

### 2. Address Form Submission (Edit Existing Address)
**Test Steps:**
1. Navigate to `/de/account/addresses` (German language)
2. Click "Edit" button on an existing address
3. Modify some fields
4. Submit the form
5. Verify user is redirected to `/de/account/addresses` (not `/account/addresses`)

**Expected Result:** User stays on German language version

### 3. Address Deletion
**Test Steps:**
1. Navigate to `/de/account/addresses` (German language)
2. Click "Delete" button on an address
3. Confirm deletion
4. Verify user stays on `/de/account/addresses` (not `/account/addresses`)

**Expected Result:** User stays on German language version

### 4. Return to Parameter Handling
**Test Steps:**
1. Navigate to `/de/account/addresses?return_to=/de/account/addresses`
2. Verify URL is cleaned up to `/de/account/addresses`
3. Navigate to `/de/account/addresses?return_to=/account/addresses`
4. Verify URL is cleaned up to `/de/account/addresses`

**Expected Result:** URL parameters are handled correctly for both language-prefixed and non-prefixed return_to values

### 5. URL Hash Cleanup
**Test Steps:**
1. Navigate to `/de/account/addresses#addresses`
2. Verify URL is cleaned up to `/de/account/addresses` (no hash)
3. Navigate to `/de/account/addresses#login`
4. Verify URL is cleaned up to `/de/account/addresses` (no hash)
5. Click addresses tab from account page
6. Verify navigation goes to `/de/account/addresses` (not hash-based)

**Expected Result:** All unwanted hashes are removed and addresses navigation uses clean URLs

## Implementation Details

### Files Modified:
1. **sections/main-addresses.liquid**
   - Added `data-current-locale` with `{{ request.locale.iso_code }}`
   - Added `data-account-addresses-url` with `{{ routes.account_addresses_url }}`
   - Added `data-account-url` with `{{ routes.account_url }}`

2. **assets/address-form-handler.js**
   - Added `getLanguageContext()` function to read language data from DOM
   - Updated form submission to use language-aware URLs
   - Updated return_to values to preserve language prefix
   - Updated cookie paths to be language-aware

3. **assets/account-addresses-redirect.js**
   - Updated return_to parameter checking to handle both `/account/addresses` and language-prefixed versions
   - Added cleanup for #addresses hash

4. **assets/account-page.js**
   - Updated fallback form action to use language-aware URL
   - Modified tab navigation to skip addresses tab (prevent hash-based navigation)

5. **assets/account-tabs.js**
   - Modified tab navigation to skip addresses tab (prevent hash-based navigation)

6. **assets/customer.js**
   - Added cleanup for #addresses hash

7. **sections/main-account.liquid**
   - Added language context data attributes
   - Removed `data-tab="addresses"` from addresses tab link

### Key Changes:
- Form actions now use language-aware URLs (e.g., `/de/account/addresses/123` instead of `/account/addresses/123`)
- Return_to values preserve language prefix (e.g., `/de/account/addresses` instead of `/account/addresses`)
- Cookie paths are language-aware for proper reload behavior
- URL parameter cleanup handles both language-prefixed and non-prefixed return_to values
- **URL Hash Cleanup**: All unwanted hashes (#addresses, #login) are automatically removed
- **Clean Navigation**: Addresses tab navigation uses proper URLs instead of hash-based routing
- **Success Messages**: Display in correct language based on operation type (add vs update)

## Success Message Testing

### Debug Success Message Issues:
1. **Check data attributes**: Verify `data-address-update-success` and `data-address-add-success` contain correct translations
2. **Check textContent vs getAttribute**: Ensure we're reading the correct value from DOM elements
3. **Check operation detection**: Verify sessionStorage correctly identifies add vs update operations
4. **Check language context**: Ensure success messages use the correct language

### Debug Steps:
```javascript
// In browser console on /de/account/addresses:
console.log('Update success:', document.querySelector('[data-address-update-success]')?.textContent);
console.log('Add success:', document.querySelector('[data-address-add-success]')?.textContent);
console.log('Current locale:', document.querySelector('[data-current-locale]')?.textContent);
```

## Browser Testing

Test in multiple browsers:
- Chrome
- Firefox
- Safari
- Edge

Test with different languages:
- English (default): `/account/addresses`
- German: `/de/account/addresses`
- Any other configured languages

## Verification Points

1. **Form Submission URLs**: Check network tab to ensure form actions include language prefix
2. **Redirect URLs**: Verify redirects maintain language context
3. **Cookie Paths**: Ensure cookies are set with correct language-aware paths
4. **URL Parameters**: Verify return_to parameters are handled correctly
5. **Browser Back/Forward**: Test navigation maintains language context
6. **Success Messages**: Verify success messages display in correct language (German vs English)
