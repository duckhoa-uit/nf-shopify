# Size Fit Modal - Troubleshooting Guide

## 🔍 Quick Diagnostics

### Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Look for JavaScript errors
4. Note any error messages

### Step 2: Verify Modal Elements
```javascript
// Run in browser console
console.log('Modal element:', document.getElementById('size-fit-modal'));
console.log('Button element:', document.querySelector('[data-modal-target="size-fit-modal"]'));
console.log('JavaScript loaded:', typeof SizeFitModal !== 'undefined');
```

### Step 3: Check Metafields
```liquid
<!-- Add to product page for debugging -->
<div style="background: yellow; padding: 10px; margin: 10px;">
  <h4>Debug Info:</h4>
  <p>Product ID: {{ product.id }}</p>
  <p>Body measurements: {{ product.metafields.size_fit.body_measurements.value != blank }}</p>
  <p>Product measurements: {{ product.metafields.size_fit.measurements.value != blank }}</p>
  <p>Body data: {{ product.metafields.size_fit.body_measurements.value | json }}</p>
</div>
```

## 🚨 Common Issues & Solutions

### Issue 1: Size Fit Button Not Appearing

**Symptoms:**
- No size fit button on product page
- Button area is empty

**Possible Causes & Solutions:**

1. **Missing Metafields**
   ```liquid
   <!-- Check if metafields exist -->
   {% if product.metafields.size_fit.body_measurements.value or product.metafields.size_fit.measurements.value %}
     <p>✅ Metafields found</p>
   {% else %}
     <p>❌ No metafields found</p>
   {% endif %}
   ```

2. **Incorrect Conditional Logic**
   - Check `sections/main-product.liquid` for size fit button logic
   - Verify the conditional statement is correct

3. **Product Has No Variants**
   - Size fit only shows for products with variants
   - Add variants to the product

**Quick Fix:**
```liquid
<!-- Force show button for testing -->
{% comment %} Remove conditional temporarily {% endcomment %}
<button type="button" data-modal-target="size-fit-modal">
  Size Guide & Fit Recommender
</button>
```

### Issue 2: Modal Not Opening

**Symptoms:**
- Button exists but clicking does nothing
- No modal appears

**Possible Causes & Solutions:**

1. **JavaScript Not Loaded**
   ```html
   <!-- Check if script is loaded -->
   <script>
   document.addEventListener('DOMContentLoaded', function() {
     console.log('Size fit JS loaded:', typeof SizeFitModal !== 'undefined');
   });
   </script>
   ```

2. **Missing Modal HTML**
   - Verify `size-fit-modal.liquid` is being rendered
   - Check modal HTML exists in DOM

3. **Event Listener Issues**
   ```javascript
   // Test manual modal open
   document.getElementById('size-fit-modal').classList.remove('hidden');
   ```

**Quick Fix:**
```javascript
// Add to browser console for testing
document.querySelector('[data-modal-target="size-fit-modal"]').addEventListener('click', function() {
  document.getElementById('size-fit-modal').classList.remove('hidden');
});
```

### Issue 3: Data Not Displaying

**Symptoms:**
- Modal opens but shows no data
- Tables are empty
- "No data available" messages

**Possible Causes & Solutions:**

1. **Invalid JSON Format**
   ```javascript
   // Test JSON parsing
   try {
     const data = JSON.parse('{{ product.metafields.size_fit.body_measurements.value | json }}');
     console.log('Valid JSON:', data);
   } catch (e) {
     console.error('Invalid JSON:', e);
   }
   ```

2. **Incorrect Data Structure**
   - Verify JSON matches expected schema
   - Check field names are correct

3. **Metafield Type Issues**
   - Ensure metafield type is set to "JSON"
   - Re-save metafield definition if needed

**Quick Fix:**
```liquid
<!-- Debug data output -->
<script>
console.log('Body measurements:', {{ product.metafields.size_fit.body_measurements.value | json }});
console.log('Product measurements:', {{ product.metafields.size_fit.measurements.value | json }});
</script>
```

### Issue 4: Unit Conversion Not Working

**Symptoms:**
- CM/Inches toggle doesn't change values
- Values don't update when switching units

**Possible Causes & Solutions:**

1. **Missing Data Attributes**
   ```html
   <!-- Verify measurement elements have data attributes -->
   <span class="measurement-value" data-cm="86-94" data-in="33.9-37.0">86-94</span>
   ```

2. **JavaScript Event Issues**
   ```javascript
   // Test unit conversion manually
   document.querySelectorAll('.measurement-value').forEach(el => {
     console.log('CM:', el.dataset.cm, 'IN:', el.dataset.in);
   });
   ```

**Quick Fix:**
```javascript
// Manual unit conversion test
function testUnitConversion() {
  const isInches = document.querySelector('[data-unit="in"]').classList.contains('active');
  document.querySelectorAll('.measurement-value').forEach(el => {
    el.textContent = isInches ? el.dataset.in : el.dataset.cm;
  });
}
```

### Issue 5: Size Recommender Not Working

**Symptoms:**
- Form doesn't submit
- No recommendation results
- Error messages appear

**Possible Causes & Solutions:**

1. **Form Validation Issues**
   ```javascript
   // Check form validation
   const form = document.getElementById('size-recommender-form');
   console.log('Form valid:', form.checkValidity());
   ```

2. **Missing Algorithm Logic**
   - Verify size recommendation JavaScript is present
   - Check algorithm implementation

**Quick Fix:**
```javascript
// Test basic recommendation
function testRecommendation() {
  document.getElementById('recommended-size').textContent = 'M';
  document.getElementById('confidence-score').textContent = '85% confidence';
  document.getElementById('recommendation-results').classList.remove('hidden');
}
```

### Issue 6: Mobile Responsiveness Issues

**Symptoms:**
- Modal too large on mobile
- Text too small
- Buttons not clickable

**Solutions:**

1. **Check Viewport Meta Tag**
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. **Test CSS Media Queries**
   ```css
   @media (max-width: 768px) {
     .size-fit-modal .modal-content {
       inset: 1rem;
     }
   }
   ```

## 🛠️ Debug Tools

### Browser Console Commands

```javascript
// Check modal state
console.log('Modal hidden:', document.getElementById('size-fit-modal').classList.contains('hidden'));

// Test button click
document.querySelector('[data-modal-target="size-fit-modal"]').click();

// Check metafield data
console.log('Product data:', window.productData || 'Not available');

// Test tab switching
document.querySelector('[data-tab="body-measurements"]').click();

// Check unit conversion
document.querySelector('[data-unit="in"]').click();
```

### Liquid Debug Snippets

```liquid
<!-- Add to product page for debugging -->
<div class="debug-info" style="background: #f0f0f0; padding: 1rem; margin: 1rem; font-family: monospace;">
  <h4>Size Fit Debug Info</h4>
  <p><strong>Product ID:</strong> {{ product.id }}</p>
  <p><strong>Product Handle:</strong> {{ product.handle }}</p>
  <p><strong>Has Variants:</strong> {{ product.variants.size > 1 }}</p>
  <p><strong>Body Measurements:</strong> {{ product.metafields.size_fit.body_measurements.value != blank }}</p>
  <p><strong>Product Measurements:</strong> {{ product.metafields.size_fit.measurements.value != blank }}</p>
  
  {% if product.metafields.size_fit.body_measurements.value %}
    <details>
      <summary>Body Measurements Data</summary>
      <pre>{{ product.metafields.size_fit.body_measurements.value | json }}</pre>
    </details>
  {% endif %}
  
  {% if product.metafields.size_fit.measurements.value %}
    <details>
      <summary>Product Measurements Data</summary>
      <pre>{{ product.metafields.size_fit.measurements.value | json }}</pre>
    </details>
  {% endif %}
</div>
```

## 📋 Validation Checklist

### Pre-Troubleshooting Checklist
- [ ] Browser console is open and checked
- [ ] Product has metafields configured
- [ ] JSON data is valid format
- [ ] Modal HTML is present in DOM
- [ ] JavaScript file is loaded
- [ ] No network errors in Network tab

### Step-by-Step Debugging
1. **Verify Setup**
   - [ ] Metafields exist in Shopify Admin
   - [ ] Product has metafield data
   - [ ] JSON format is valid

2. **Check Frontend**
   - [ ] Size fit button appears
   - [ ] Modal HTML is rendered
   - [ ] JavaScript is loaded

3. **Test Functionality**
   - [ ] Modal opens on button click
   - [ ] Tabs switch correctly
   - [ ] Data displays in tables
   - [ ] Unit conversion works
   - [ ] Size recommender submits

4. **Mobile Testing**
   - [ ] Modal is responsive
   - [ ] Touch interactions work
   - [ ] Text is readable

## 🆘 Emergency Fixes

### Quick Modal Test
```html
<!-- Add to product page for immediate testing -->
<button onclick="document.getElementById('size-fit-modal').classList.remove('hidden')">
  Test Modal Open
</button>
```

### Force Show Button
```liquid
<!-- Temporarily force button to appear -->
<div class="size-fit-button-container">
  <button type="button" class="size-fit-button" data-modal-target="size-fit-modal">
    Size Guide & Fit Recommender (Debug)
  </button>
</div>
```

### Basic Modal HTML
```html
<!-- Minimal modal for testing -->
<div id="size-fit-modal" class="fixed inset-0 z-50 hidden bg-black bg-opacity-50">
  <div class="fixed inset-4 bg-white rounded-lg p-6">
    <h2>Size Fit Modal (Debug)</h2>
    <button onclick="this.closest('#size-fit-modal').classList.add('hidden')">Close</button>
    <p>Modal is working!</p>
  </div>
</div>
```

## 📞 Getting Help

If issues persist:
1. Document the exact error messages
2. Note browser and device information
3. Provide product ID and metafield data
4. Include console errors and network logs
5. Test with multiple products and browsers
