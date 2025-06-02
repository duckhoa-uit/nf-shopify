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
    try {
      const productIds = cartData.items.map(item => item.product_id);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch('/apps/nf-data-management/sync_erp_at_checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product_ids: productIds }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Note: Response handling commented out - we now just call the API without processing result
      /* COMMENTED OUT - Response processing for potential future re-enabling
      if (!response.ok) {
        throw new Error(`Stock validation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[CartSync] Stock validation result:', result);

      return result;
      */

      // API call made, proceeding to checkout without processing response
    } catch (error) {
      // Note: Error throwing commented out - we now proceed to checkout even if API fails

      /* COMMENTED OUT - Error throwing for potential future re-enabling
      if (error.name === 'AbortError') {
        throw new Error('Stock validation timed out');
      }

      throw error;
      */

      // Stock validation failed, but proceeding to checkout anyway
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
    if (this.isValidatingCheckout) return true;

    this.isValidatingCheckout = true;

    try {
      // Show loading state
      this.showCheckoutLoading();

      // Fetch latest cart from server
      const response = await fetch(`${routes.cart_url}.js`);
      if (!response.ok) throw new Error('Failed to fetch cart for validation');

      const serverCart = await response.json();

      // First, validate stock availability - just call the API without handling response
      try {
        await this.validateStock(serverCart);
        // Note: Response handling commented out - we now proceed directly to checkout

        /* COMMENTED OUT - Response handling for potential future re-enabling
        // Check if stock validation indicates any issues
        if (stockValidation && stockValidation.errors) {
          const shouldProceed = await this.showStockValidationDialog(stockValidation, serverCart);
          if (!shouldProceed) {
            return false;
          }

          // If user chose to proceed after stock adjustments, fetch updated cart
          const updatedResponse = await fetch(`${routes.cart_url}.js`);
          if (updatedResponse.ok) {
            const updatedCart = await updatedResponse.json();
            this.lastCartHash = this.generateCartHash(updatedCart);
            await this.updateCartUI(updatedCart);
          }

          return false; // Don't proceed to checkout, user made changes
        }
        */
      } catch (stockError) {
        // Note: Error handling commented out - we now proceed directly to checkout

        /* COMMENTED OUT - Error handling for potential future re-enabling
        // Show warning but allow checkout to proceed
        const shouldProceed = await this.showStockValidationWarning(stockError.message);
        if (!shouldProceed) {
          return false;
        }
        */
      }

      const serverCartHash = this.generateCartHash(serverCart);

      // If lastCartHash is null (initialization failed), set it now and proceed
      if (this.lastCartHash === null) {
        this.lastCartHash = serverCartHash;
        return true;
      }

      // Compare with current UI state
      if (serverCartHash !== this.lastCartHash) {
        // Cart has changed, show warning and update UI
        const shouldProceed = await this.showCheckoutValidationDialog(serverCart);
        if (shouldProceed) {
          await this.updateCartUI(serverCart);
          return true;
        } else {
          return false;
        }
      }

      return true;
    } catch (error) {
      return true; // Allow checkout to proceed on error
    } finally {
      // Always hide loading state
      this.hideCheckoutLoading();
      this.isValidatingCheckout = false;
    }
  }

  /**
   * Show stock validation dialog when items are out of stock
   */
  async showStockValidationDialog(stockValidation, cartData) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'stock-validation-modal';

      // Build the list of out-of-stock items
      let itemsList = '';
      if (stockValidation.errors && Array.isArray(stockValidation.errors)) {
        stockValidation.errors.forEach(error => {
          const cartItem = cartData.items.find(item => item.product_id === error.product_id);
          const productTitle = cartItem ? cartItem.product_title : `Product ${error.product_id}`;
          const variantTitle = cartItem && cartItem.variant_title ? ` - ${cartItem.variant_title}` : '';
          const currentQty = cartItem ? cartItem.quantity : 0;
          const availableQty = error.available_quantity || 0;

          itemsList += `
            <div class="stock-item" data-product-id="${error.product_id}" data-item-key="${cartItem ? cartItem.key : ''}">
              <div class="stock-item__info">
                <strong>${productTitle}${variantTitle}</strong>
                <p>Requested: ${currentQty}, Available: ${availableQty}</p>
              </div>
              <div class="stock-item__actions">
                <button class="btn btn--small btn--secondary" data-action="remove" data-item-key="${cartItem ? cartItem.key : ''}">
                  Remove
                </button>
                ${availableQty > 0 ? `
                  <button class="btn btn--small btn--primary" data-action="adjust" data-item-key="${cartItem ? cartItem.key : ''}" data-quantity="${availableQty}">
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
              <button class="btn btn--secondary" data-action="cancel">Cancel Checkout</button>
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
              <button class="btn btn--secondary" data-action="cancel">${window.theme?.strings?.cancel_checkout || 'Cancel Checkout'}</button>
              <button class="btn btn--primary" data-action="proceed">${window.theme?.strings?.continue_anyway || 'Continue Anyway'}</button>
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
    const body = JSON.stringify({
      id: itemKey,
      quantity: 0,
      sections: ['cart-drawer', 'cart-icon-bubble'],
      sections_url: window.location.pathname
    });

    const response = await fetch(`${routes.cart_change_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });

    if (!response.ok) {
      throw new Error(`Failed to remove item: ${response.status}`);
    }

    const result = await response.json();

    // Update cart UI
    await this.updateCartUI(result);

    // Broadcast cart update
    this.broadcastCartUpdate(result);

    return result;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItemQuantity(itemKey, quantity) {
    const body = JSON.stringify({
      id: itemKey,
      quantity: quantity,
      sections: ['cart-drawer', 'cart-icon-bubble'],
      sections_url: window.location.pathname
    });

    const response = await fetch(`${routes.cart_change_url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body
    });

    if (!response.ok) {
      throw new Error(`Failed to update quantity: ${response.status}`);
    }

    const result = await response.json();

    // Update cart UI
    await this.updateCartUI(result);

    // Broadcast cart update
    this.broadcastCartUpdate(result);

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
              <button class="btn btn--secondary" data-action="cancel">${window.theme?.strings?.review_cart || 'Review Cart'}</button>
              <button class="btn btn--primary" data-action="proceed">${window.theme?.strings?.continue_to_checkout || 'Continue to Checkout'}</button>
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

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.cartSyncManager) {
    window.cartSyncManager.destroy();
  }
});
