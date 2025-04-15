document.addEventListener('DOMContentLoaded', function() {
  // Listen for variant change events
  subscribe(PUB_SUB_EVENTS.variantChange, function(event) {
    const { data } = event;
    if (!data || !data.variant) return;
    
    const variant = data.variant;
    const priceContainer = document.querySelector('.price-wrapper');
    
    if (!priceContainer) return;
    
    const currentPrice = priceContainer.querySelector('.current-price');
    const originalPriceContainer = priceContainer.querySelector('.flex');
    const originalPrice = originalPriceContainer?.querySelector('.original-price');
    
    // Format money based on currency settings
    const formatMoney = function(cents) {
      if (window.Shopify && window.Shopify.formatMoney) {
        return window.Shopify.formatMoney(cents);
      }
      return (cents / 100).toFixed(2);
    };
    
    // Update current price
    if (currentPrice) {
      currentPrice.textContent = formatMoney(variant.price);
    }
    
    // Update or hide original price based on whether there's a compare at price
    if (variant.compare_at_price && variant.compare_at_price > variant.price) {
      if (originalPriceContainer) {
        originalPriceContainer.classList.remove('hidden');
        if (originalPrice) {
          originalPrice.textContent = formatMoney(variant.compare_at_price);
        }
      }
    } else if (originalPriceContainer) {
      originalPriceContainer.classList.add('hidden');
    }
  });
});
