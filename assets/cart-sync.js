/**
 * Cart Synchronization Manager
 * Handles real-time cart synchronization between browser tabs using BroadcastChannel API
 */

class CartSyncManager {
  constructor() {
    this.channel = null;
    this.isSupported = false;
    this.tabId = this.generateTabId();
    this.lastCartHash = null;
    this.isValidatingCheckout = false;

    this.init();
    this.initializeCartHash();
  }

  /**
   * Initialize the cart sync manager
   */
  init() {
    // Check if BroadcastChannel is supported
    if ('BroadcastChannel' in window) {
      this.isSupported = true;
      this.channel = new BroadcastChannel('cart-sync');
      this.setupEventListeners();
    }
  }

  /**
   * Initialize cart hash with current cart state
   */
  async initializeCartHash() {
    try {
      // Fetch current cart from server to initialize hash
      const response = await fetch(`${routes.cart_url}.js`);
      if (response.ok) {
        const cartData = await response.json();
        this.lastCartHash = this.generateCartHash(cartData);
      }
    } catch (error) {
      // Keep lastCartHash as null, validation will still work but may show dialog unnecessarily
    }
  }

  /**
   * Generate unique tab identifier
   */
  generateTabId() {
    return 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Setup event listeners for cross-tab communication
   */
  setupEventListeners() {
    if (!this.channel) return;

    this.channel.addEventListener('message', (event) => {
      const { type, data, tabId } = event.data;

      // Ignore messages from the same tab
      if (tabId === this.tabId) return;

      switch (type) {
        case 'cart-updated':
          this.handleCartUpdatedFromOtherTab(data);
          break;
        case 'checkout-started':
          this.handleCheckoutStartedFromOtherTab(data);
          break;
      }
    });
  }

  /**
   * Broadcast cart update to other tabs
   */
  broadcastCartUpdate(cartData) {
    if (!this.isSupported || !this.channel) return;

    const cartHash = this.generateCartHash(cartData);

    // Only broadcast if cart actually changed (skip check if lastCartHash is null)
    if (this.lastCartHash !== null && cartHash === this.lastCartHash) return;

    this.lastCartHash = cartHash;

    const message = {
      type: 'cart-updated',
      data: {
        timestamp: Date.now(),
        cartHash: cartHash,
        itemCount: cartData.item_count || 0,
        totalPrice: cartData.total_price || 0
      },
      tabId: this.tabId
    };

    this.channel.postMessage(message);
  }

  /**
   * Handle cart update from another tab
   */
  async handleCartUpdatedFromOtherTab(data) {
    try {
      // Fetch fresh cart data from server
      const response = await fetch(`${routes.cart_url}.js`);
      if (!response.ok) throw new Error('Failed to fetch cart');

      const freshCartData = await response.json();
      const freshCartHash = this.generateCartHash(freshCartData);

      // Only update if the cart actually changed
      if (freshCartHash !== this.lastCartHash) {
        this.lastCartHash = freshCartHash;
        await this.updateCartUI(freshCartData);
        this.showSyncNotification();
      }
    } catch (error) {
      console.error('[CartSync] Error handling cart update from other tab:', error);
    }
  }

  /**
   * Update cart UI with fresh data
   */
  async updateCartUI(cartData) {
    try {
      // Update main cart page if present
      const cartItems = document.querySelector('cart-items');
      if (cartItems) {
        // Trigger the existing cart update mechanism
        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'cart-sync',
            cartData: cartData
          });
        }
      }

      // Update cart drawer if present
      const cartDrawer = document.querySelector('cart-drawer');
      if (cartDrawer) {
        // Trigger cart drawer update
        if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
          publish(PUB_SUB_EVENTS.cartUpdate, {
            source: 'cart-sync',
            cartData: cartData
          });
        }
      }

      // Update cart icon bubble
      this.updateCartIconBubble(cartData);

    } catch (error) {
      console.error('[CartSync] Error updating cart UI:', error);
    }
  }

  /**
   * Update cart icon bubble with item count
   */
  updateCartIconBubble(cartData) {
    const cartBubble = document.querySelector('#cart-icon-bubble .cart-count-bubble');
    if (cartBubble) {
      const itemCount = cartData.item_count || 0;
      cartBubble.textContent = itemCount;
      cartBubble.style.display = itemCount > 0 ? 'inherit' : 'none';
    }
  }

  /**
   * Show sync notification to user
   */
  showSyncNotification() {
    // Create a subtle notification
    const notification = document.createElement('div');
    notification.className = 'cart-sync-notification';
    notification.innerHTML = `
      <div class="cart-sync-notification__content">
        <span>${window.theme?.strings?.cart_updated_other_tab || 'Cart updated from another tab'}</span>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000;
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Generate hash for cart data to detect changes
   */
  generateCartHash(cartData) {
    if (!cartData || !cartData.items) return '';

    const cartString = cartData.items.map(item =>
      `${item.key}:${item.quantity}:${item.variant_id}`
    ).join('|') + `|total:${cartData.total_price}`;

    return this.simpleHash(cartString);
  }

  /**
   * Simple hash function
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString();
  }

  /**
   * Validate stock availability for cart items
   */
  async validateStock(cartData) {
    console.log("🚀 ~ CartSyncManager ~ validateStock ~ cartData:", cartData)
    try {
      // Build variants array with sku and id from cart items
      const variants = cartData.items.map(item => ({
        sku: item.sku,
        id: item.variant_id.toString()
      }));

      console.log('[CartSync DEBUG] Starting stock validation...');
      console.log('[CartSync DEBUG] Cart items:', cartData.items.map(item => ({
        sku: item.sku,
        variant_id: item.variant_id,
        quantity: item.quantity,
        product_title: item.product_title,
        variant_title: item.variant_title
      })));
      console.log('[CartSync DEBUG] Request variants:', variants);

      // DEBUG: Check if we should use mock response (for testing)
      const shouldMockResponse = localStorage.getItem('cart-sync-mock-stock') === 'true';

      if (shouldMockResponse) {
        console.log('[CartSync DEBUG] Using MOCK response for testing');
        // Mock response with insufficient stock for testing
        const mockResult = {
          data: variants.map(variant => ({
            sku: variant.sku,
            stock: Math.floor(Math.random() * 3) // Random stock 0-2 (likely insufficient)
          }))
        };
        console.log('[CartSync DEBUG] Mock stock validation result:', mockResult);

        // Continue with normal processing using mock data
        const result = mockResult;

        // Check if any items have insufficient stock
        const stockIssues = [];

        if (result.data && Array.isArray(result.data)) {
          cartData.items.forEach(cartItem => {
            const stockData = result.data.find(stock => stock.sku === cartItem.sku);
            console.log(`[CartSync DEBUG] Item ${cartItem.sku}: requested=${cartItem.quantity}, available=${stockData?.stock || 'N/A'}`);

            if (stockData && stockData.stock < cartItem.quantity) {
              console.log(`[CartSync DEBUG] INSUFFICIENT STOCK for ${cartItem.sku}!`);
              stockIssues.push({
                cartItem: cartItem,
                availableStock: stockData.stock,
                requestedQuantity: cartItem.quantity
              });
            }
          });
        }

        console.log('[CartSync DEBUG] Stock issues found:', stockIssues);

        return {
          success: stockIssues.length === 0,
          stockIssues: stockIssues
        };
      }

      // Normal API call
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      console.log('[CartSync DEBUG] Making API request to stock validation endpoint...');
      const response = await fetch('/apps/nf-data-management/sync_erp_at_checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ variants: variants }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[CartSync DEBUG] API request failed:', response.status, response.statusText);
        throw new Error(`Stock validation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[CartSync DEBUG] API stock validation result:', result);

      // Check if any items have insufficient stock
      const stockIssues = [];

      if (result.data && Array.isArray(result.data)) {
        cartData.items.forEach(cartItem => {
          const stockData = result.data.find(stock => stock.sku === cartItem.sku);
          console.log(`[CartSync DEBUG] Item ${cartItem.sku}: requested=${cartItem.quantity}, available=${stockData?.stock || 'N/A'}`);

          if (stockData && stockData.stock < cartItem.quantity) {
            console.log(`[CartSync DEBUG] INSUFFICIENT STOCK for ${cartItem.sku}!`);
            stockIssues.push({
              cartItem: cartItem,
              availableStock: stockData.stock,
              requestedQuantity: cartItem.quantity
            });
          }
        });
      }

      console.log('[CartSync DEBUG] Stock issues found:', stockIssues);
      console.log('[CartSync DEBUG] Stock validation success:', stockIssues.length === 0);

      return {
        success: stockIssues.length === 0,
        stockIssues: stockIssues
      };

    } catch (error) {
      console.error('[CartSync DEBUG] Stock validation error:', error);
      if (error.name === 'AbortError') {
        console.error('[CartSync DEBUG] Stock validation timed out');
        throw new Error('Stock validation timed out');
      }
      throw error;
    }
  }

  /**
   * Show loading state on checkout buttons
   */
  showCheckoutLoading() {
    // Main cart checkout button
    const mainCheckoutBtn = document.querySelector('.nf-cart-checkout__button');
    if (mainCheckoutBtn) {
      mainCheckoutBtn.disabled = true;
      mainCheckoutBtn.classList.add('loading');
      const buttonText = mainCheckoutBtn.querySelector('.button-text');
      const buttonSpinner = mainCheckoutBtn.querySelector('.button-spinner');
      const validatingText = window.theme?.strings?.validating_stock || 'Validating stock...';
      if (buttonText) buttonText.textContent = validatingText;
      if (buttonSpinner) buttonSpinner.style.display = 'inline-flex';
    }

    // Cart drawer checkout button
    const drawerCheckoutBtn = document.querySelector('#CartDrawer-Checkout');
    if (drawerCheckoutBtn) {
      drawerCheckoutBtn.disabled = true;
      drawerCheckoutBtn.classList.add('loading');
      const validatingText = window.theme?.strings?.validating_stock || 'Validating stock...';
      drawerCheckoutBtn.textContent = validatingText;
    }
  }

  /**
   * Hide loading state on checkout buttons
   */
  hideCheckoutLoading() {
    // Main cart checkout button
    const mainCheckoutBtn = document.querySelector('.nf-cart-checkout__button');
    if (mainCheckoutBtn) {
      mainCheckoutBtn.disabled = false;
      mainCheckoutBtn.classList.remove('loading');
      const buttonText = mainCheckoutBtn.querySelector('.button-text');
      const buttonSpinner = mainCheckoutBtn.querySelector('.button-spinner');
      const checkoutText = window.theme?.strings?.check_out || 'Check out';
      if (buttonText) buttonText.textContent = checkoutText;
      if (buttonSpinner) buttonSpinner.style.display = 'none';
    }

    // Cart drawer checkout button
    const drawerCheckoutBtn = document.querySelector('#CartDrawer-Checkout');
    if (drawerCheckoutBtn) {
      drawerCheckoutBtn.disabled = false;
      drawerCheckoutBtn.classList.remove('loading');
      const checkoutText = window.theme?.strings?.check_out || 'Check out';
      drawerCheckoutBtn.textContent = checkoutText;
    }
  }

  /**
   * Validate cart before checkout
   */
  async validateBeforeCheckout() {
    console.log('[CartSync DEBUG] ===== CHECKOUT VALIDATION STARTED =====');

    if (this.isValidatingCheckout) {
      console.log('[CartSync DEBUG] Already validating checkout, returning true');
      return true;
    }

    this.isValidatingCheckout = true;

    try {
      // Show loading state
      console.log('[CartSync DEBUG] Showing checkout loading state...');
      this.showCheckoutLoading();

      // Fetch latest cart from server
      console.log('[CartSync DEBUG] Fetching latest cart from server...');
      const response = await fetch(`${routes.cart_url}.js`);
      if (!response.ok) throw new Error('Failed to fetch cart for validation');

      const serverCart = await response.json();
      console.log('[CartSync DEBUG] Server cart fetched:', {
        item_count: serverCart.item_count,
        total_price: serverCart.total_price,
        items: serverCart.items?.length || 0
      });

      // First, validate stock availability
      console.log('[CartSync DEBUG] Starting stock validation...');
      try {
        const stockValidation = await this.validateStock(serverCart);
        console.log('[CartSync DEBUG] Stock validation completed:', stockValidation);

        // Check if stock validation indicates any issues
        if (!stockValidation.success && stockValidation.stockIssues.length > 0) {
          console.log('[CartSync DEBUG] Stock issues detected, showing dialog...');
          const shouldProceed = await this.showStockValidationDialog(stockValidation, serverCart);
          console.log('[CartSync DEBUG] User dialog result:', shouldProceed ? 'proceed' : 'cancel');

          if (!shouldProceed) {
            console.log('[CartSync DEBUG] User cancelled checkout due to stock issues');
            return false;
          }

          // If user chose to proceed after stock adjustments, fetch updated cart
          console.log('[CartSync DEBUG] Fetching updated cart after stock adjustments...');
          const updatedResponse = await fetch(`${routes.cart_url}.js`);
          if (updatedResponse.ok) {
            const updatedCart = await updatedResponse.json();
            this.lastCartHash = this.generateCartHash(updatedCart);
            await this.updateCartUI(updatedCart);
            console.log('[CartSync DEBUG] Cart UI updated after stock adjustments');
          }

          console.log('[CartSync DEBUG] Blocking checkout - user made changes');
          return false; // Don't proceed to checkout, user made changes
        } else {
          console.log('[CartSync DEBUG] No stock issues found, continuing...');
        }
      } catch (stockError) {
        console.error('[CartSync DEBUG] Stock validation error:', stockError);
        // Show warning but allow checkout to proceed
        const shouldProceed = await this.showStockValidationWarning(stockError.message);
        console.log('[CartSync DEBUG] Stock error dialog result:', shouldProceed ? 'proceed' : 'cancel');

        if (!shouldProceed) {
          console.log('[CartSync DEBUG] User cancelled checkout due to stock validation error');
          return false;
        }
      }

      console.log('[CartSync DEBUG] Checking cart hash changes...');
      const serverCartHash = this.generateCartHash(serverCart);
      console.log('[CartSync DEBUG] Server cart hash:', serverCartHash);
      console.log('[CartSync DEBUG] Last cart hash:', this.lastCartHash);

      // If lastCartHash is null (initialization failed), set it now and proceed
      if (this.lastCartHash === null) {
        console.log('[CartSync DEBUG] Last cart hash is null, setting and proceeding...');
        this.lastCartHash = serverCartHash;
        return true;
      }

      // Compare with current UI state
      if (serverCartHash !== this.lastCartHash) {
        console.log('[CartSync DEBUG] Cart hash changed, syncing cart UI...');
        // Cart has changed, sync UI without showing dialog
        this.lastCartHash = serverCartHash;
        await this.updateCartUI(serverCart);
        console.log('[CartSync DEBUG] Cart UI synced, proceeding to checkout');

        /* COMMENTED OUT - Cart Updated dialog (just sync without dialog)
        const shouldProceed = await this.showCheckoutValidationDialog(serverCart);
        console.log('[CartSync DEBUG] Cart validation dialog result:', shouldProceed ? 'proceed' : 'cancel');

        if (shouldProceed) {
          await this.updateCartUI(serverCart);
          console.log('[CartSync DEBUG] Cart UI updated, proceeding to checkout');
          return true;
        } else {
          console.log('[CartSync DEBUG] User cancelled due to cart changes');
          return false;
        }
        */
      }

      console.log('[CartSync DEBUG] No cart changes detected, proceeding to checkout');
      return true;
    } catch (error) {
      console.error('[CartSync DEBUG] Checkout validation error:', error);
      console.log('[CartSync DEBUG] Allowing checkout to proceed despite error');
      return true; // Allow checkout to proceed on error
    } finally {
      // Always hide loading state
      console.log('[CartSync DEBUG] Hiding checkout loading state...');
      this.hideCheckoutLoading();
      this.isValidatingCheckout = false;
      console.log('[CartSync DEBUG] ===== CHECKOUT VALIDATION COMPLETED =====');
    }
  }

  /**
   * Show stock validation dialog when items are out of stock
   */
  async showStockValidationDialog(stockValidation, cartData) {
    console.log('[CartSync DEBUG] Showing stock validation dialog...');
    console.log('[CartSync DEBUG] Stock validation data:', stockValidation);

    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'stock-validation-modal';

      // Build the list of out-of-stock items
      let itemsList = '';
      if (stockValidation.stockIssues && Array.isArray(stockValidation.stockIssues)) {
        stockValidation.stockIssues.forEach(issue => {
          const cartItem = issue.cartItem;
          const productTitle = cartItem.product_title || `Product ${cartItem.product_id}`;
          const variantTitle = cartItem.variant_title ? ` - ${cartItem.variant_title}` : '';
          const currentQty = issue.requestedQuantity;
          const availableQty = issue.availableStock;

          itemsList += `
            <div class="stock-item" data-product-id="${cartItem.product_id}" data-item-key="${cartItem.key}">
              <div class="stock-item__info">
                <strong>${productTitle}${variantTitle}</strong>
                <p>Requested: ${currentQty}, Available: ${availableQty}</p>
              </div>
              <div class="stock-item__actions">
                <button class="button button--small button--secondary" data-action="remove" data-item-key="${cartItem.key}">
                  Remove
                </button>
                ${availableQty > 0 ? `
                  <button class="button button--small button--primary" data-action="adjust" data-item-key="${cartItem.key}" data-quantity="${availableQty}">
                    Adjust to ${availableQty}
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        });
      }

      modal.innerHTML = `
        <div class="stock-validation-modal__overlay">
          <div class="stock-validation-modal__content">
            <h3>Stock Unavailable</h3>
            <p>Some items in your cart are not available in the requested quantities:</p>
            <div class="stock-items-list">
              ${itemsList}
            </div>
            <div class="stock-validation-modal__actions">
              <button class="button button--secondary" data-action="cancel">Cancel Checkout</button>
            </div>
          </div>
        </div>
      `;

      // Add styles
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10001;
      `;

      const overlay = modal.querySelector('.stock-validation-modal__overlay');
      overlay.style.cssText = `
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
      `;

      const content = modal.querySelector('.stock-validation-modal__content');
      content.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 500px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
      `;

      // Style stock items
      const stockItems = modal.querySelectorAll('.stock-item');
      stockItems.forEach(item => {
        item.style.cssText = `
          border: 1px solid #ddd;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 4px;
        `;

        const info = item.querySelector('.stock-item__info');
        if (info) {
          info.style.cssText = 'margin-bottom: 12px;';
        }

        const actions = item.querySelector('.stock-item__actions');
        if (actions) {
          actions.style.cssText = 'display: flex; gap: 8px;';
        }
      });

      // Handle button clicks
      modal.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const itemKey = e.target.dataset.itemKey;
        const quantity = e.target.dataset.quantity;

        if (action === 'cancel') {
          resolve(false);
          document.body.removeChild(modal);
        } else if (action === 'remove' && itemKey) {
          // Remove item from cart
          e.target.disabled = true;
          e.target.textContent = 'Removing...';

          try {
            await this.removeCartItem(itemKey);
            // Remove the stock item from the dialog
            const stockItem = e.target.closest('.stock-item');
            if (stockItem) {
              stockItem.remove();
            }

            // Check if all items are resolved
            const remainingItems = modal.querySelectorAll('.stock-item');
            if (remainingItems.length === 0) {
              console.log('[CartSync DEBUG] All stock issues resolved, closing dialog...');
              resolve(true);
              document.body.removeChild(modal);
            }
          } catch (error) {
            e.target.disabled = false;
            e.target.textContent = 'Remove';
            const errorMsg = window.theme?.strings?.failed_remove_item || 'Failed to remove item. Please try again.';
            alert(errorMsg);
          }
        } else if (action === 'adjust' && itemKey && quantity) {
          // Adjust item quantity
          e.target.disabled = true;
          e.target.textContent = 'Adjusting...';

          try {
            await this.updateCartItemQuantity(itemKey, parseInt(quantity));
            // Remove the stock item from the dialog
            const stockItem = e.target.closest('.stock-item');
            if (stockItem) {
              stockItem.remove();
            }

            // Check if all items are resolved
            const remainingItems = modal.querySelectorAll('.stock-item');
            if (remainingItems.length === 0) {
              console.log('[CartSync DEBUG] All stock issues resolved, closing dialog...');
              resolve(true);
              document.body.removeChild(modal);
            }
          } catch (error) {
            e.target.disabled = false;
            e.target.textContent = `Adjust to ${quantity}`;
            const errorMsg = window.theme?.strings?.failed_adjust_quantity || 'Failed to adjust quantity. Please try again.';
            alert(errorMsg);
          }
        }
      });

      document.body.appendChild(modal);
    });
  }

  /**
   * Show stock validation warning when API fails
   */
  async showStockValidationWarning(errorMessage) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'stock-warning-modal';
      modal.innerHTML = `
        <div class="stock-warning-modal__overlay">
          <div class="stock-warning-modal__content">
            <h3>${window.theme?.strings?.stock_validation_warning || 'Stock Validation Warning'}</h3>
            <p>${window.theme?.strings?.stock_validation_error || 'We couldn\'t verify stock availability'}: ${errorMessage}</p>
            <p>${window.theme?.strings?.stock_validation_continue || 'Your order may be subject to stock availability. Do you want to continue?'}</p>
            <div class="stock-warning-modal__actions">
              <button class="button button--secondary" data-action="cancel">${window.theme?.strings?.cancel_checkout || 'Cancel Checkout'}</button>
              <button class="button button--primary" data-action="proceed">${window.theme?.strings?.continue_anyway || 'Continue Anyway'}</button>
            </div>
          </div>
        </div>
      `;

      // Add styles
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10001;
      `;

      const overlay = modal.querySelector('.stock-warning-modal__overlay');
      overlay.style.cssText = `
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const content = modal.querySelector('.stock-warning-modal__content');
      content.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 400px;
        text-align: center;
      `;

      // Handle button clicks
      modal.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'proceed') {
          resolve(true);
        } else if (action === 'cancel') {
          resolve(false);
        }
        document.body.removeChild(modal);
      });

      document.body.appendChild(modal);
    });
  }

  /**
   * Remove item from cart
   */
  async removeCartItem(itemKey) {
    console.log('[CartSync DEBUG] Removing cart item:', itemKey);

    const bodyData = {
      id: itemKey,
      quantity: 0,
      sections: ['cart-drawer', 'cart-icon-bubble'],
      sections_url: window.location.pathname
    };

    const body = JSON.stringify(bodyData);
    console.log('[CartSync DEBUG] Remove request body:', bodyData);

    const response = await fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } });

    console.log('[CartSync DEBUG] Remove response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CartSync DEBUG] Remove error response:', errorText);
      throw new Error(`Failed to remove item: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[CartSync DEBUG] Remove successful, result:', result);

    // Update cart UI
    await this.updateCartUI(result);

    // Broadcast cart update
    this.broadcastCartUpdate(result);

    // Trigger PUB_SUB_EVENTS for auto-reload (if on cart page)
    if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
      console.log('[CartSync DEBUG] Publishing cartUpdate event for auto-reload');
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'cart-sync-stock-dialog',
        cartData: result
      });
    }

    return result;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(itemKey, quantity) {
    console.log('[CartSync DEBUG] Updating cart item quantity:', itemKey, 'to', quantity);

    const bodyData = {
      id: itemKey,
      quantity: quantity,
      sections: ['cart-drawer', 'cart-icon-bubble'],
      sections_url: window.location.pathname
    };

    const body = JSON.stringify(bodyData);
    console.log('[CartSync DEBUG] Update quantity request body:', bodyData);

    const response = await fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } });

    console.log('[CartSync DEBUG] Update quantity response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CartSync DEBUG] Update quantity error response:', errorText);
      throw new Error(`Failed to update quantity: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('[CartSync DEBUG] Update quantity successful, result:', result);

    // Update cart UI
    await this.updateCartUI(result);

    // Broadcast cart update
    this.broadcastCartUpdate(result);

    // Trigger PUB_SUB_EVENTS for auto-reload (if on cart page)
    if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
      console.log('[CartSync DEBUG] Publishing cartUpdate event for auto-reload');
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'cart-sync-stock-dialog',
        cartData: result
      });
    }

    return result;
  }

  /**
   * Show checkout validation dialog
   */
  async showCheckoutValidationDialog(serverCart) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'cart-validation-modal';
      modal.innerHTML = `
        <div class="cart-validation-modal__overlay">
          <div class="cart-validation-modal__content">
            <h3>${window.theme?.strings?.cart_updated || 'Cart Updated'}</h3>
            <p>${window.theme?.strings?.cart_updated_review || 'Your cart has been updated from another tab. Please review the changes before proceeding to checkout.'}</p>
            <div class="cart-validation-modal__actions">
              <button class="button button--secondary" data-action="cancel">${window.theme?.strings?.review_cart || 'Review Cart'}</button>
              <button class="button button--primary" data-action="proceed">${window.theme?.strings?.continue_to_checkout || 'Continue to Checkout'}</button>
            </div>
          </div>
        </div>
      `;

      // Add styles
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10001;
      `;

      const overlay = modal.querySelector('.cart-validation-modal__overlay');
      overlay.style.cssText = `
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const content = modal.querySelector('.cart-validation-modal__content');
      content.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 8px;
        max-width: 400px;
        text-align: center;
      `;

      // Handle button clicks
      modal.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'proceed') {
          resolve(true);
        } else if (action === 'cancel') {
          resolve(false);
        }
        document.body.removeChild(modal);
      });

      document.body.appendChild(modal);
    });
  }

  /**
   * Enable mock stock response for testing (insufficient stock)
   */
  enableMockStock() {
    localStorage.setItem('cart-sync-mock-stock', 'true');
    console.log('[CartSync DEBUG] Mock stock mode ENABLED - will simulate insufficient stock');
    console.log('[CartSync DEBUG] To disable: cartSyncManager.disableMockStock()');
  }

  /**
   * Disable mock stock response (use real API)
   */
  disableMockStock() {
    localStorage.removeItem('cart-sync-mock-stock');
    console.log('[CartSync DEBUG] Mock stock mode DISABLED - will use real API');
  }

  /**
   * Check if mock stock mode is enabled
   */
  isMockStockEnabled() {
    return localStorage.getItem('cart-sync-mock-stock') === 'true';
  }

  /**
   * Cleanup when page unloads
   */
  destroy() {
    if (this.channel) {
      this.channel.close();
    }
  }
}

// Initialize cart sync manager
window.cartSyncManager = new CartSyncManager();

// Debug helper functions for console
window.enableMockStock = () => window.cartSyncManager.enableMockStock();
window.disableMockStock = () => window.cartSyncManager.disableMockStock();
window.checkMockStock = () => {
  const enabled = window.cartSyncManager.isMockStockEnabled();
  console.log(`[CartSync DEBUG] Mock stock mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);
  return enabled;
};

// Show debug instructions
console.log(`
[CartSync DEBUG] Stock Validation Debug Mode Ready!

Available console commands:
- enableMockStock()  : Enable mock insufficient stock responses
- disableMockStock() : Disable mock mode (use real API)
- checkMockStock()   : Check current mock mode status

To test insufficient stock:
1. Add items to cart
2. Run: enableMockStock()
3. Try to checkout
4. Check console for debug logs
5. Run: disableMockStock() when done testing
`);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.cartSyncManager) {
    window.cartSyncManager.destroy();
  }
});
