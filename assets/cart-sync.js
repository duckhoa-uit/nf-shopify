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
      console.log('[CartSync] Initialized with BroadcastChannel support');
    } else {
      console.log('[CartSync] BroadcastChannel not supported, sync disabled');
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
        console.log('[CartSync] Initialized cart hash:', this.lastCartHash);
      }
    } catch (error) {
      console.log('[CartSync] Could not initialize cart hash:', error);
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

      console.log('[CartSync] Received message:', { type, tabId });

      switch (type) {
        case 'cart-updated':
          this.handleCartUpdatedFromOtherTab(data);
          break;
        case 'checkout-started':
          this.handleCheckoutStartedFromOtherTab(data);
          break;
        default:
          console.log('[CartSync] Unknown message type:', type);
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
    console.log('[CartSync] Broadcasted cart update:', message);
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
        <span>Cart updated from another tab</span>
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
   * Validate cart before checkout
   */
  async validateBeforeCheckout() {
    if (this.isValidatingCheckout) return true;

    this.isValidatingCheckout = true;

    try {
      // Fetch latest cart from server
      const response = await fetch(`${routes.cart_url}.js`);
      if (!response.ok) throw new Error('Failed to fetch cart for validation');

      const serverCart = await response.json();
      const serverCartHash = this.generateCartHash(serverCart);

      // If lastCartHash is null (initialization failed), set it now and proceed
      if (this.lastCartHash === null) {
        this.lastCartHash = serverCartHash;
        console.log('[CartSync] Set initial cart hash during checkout validation:', this.lastCartHash);
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
      console.error('[CartSync] Error validating cart before checkout:', error);
      return true; // Allow checkout to proceed on error
    } finally {
      this.isValidatingCheckout = false;
    }
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
            <h3>Cart Updated</h3>
            <p>Your cart has been updated from another tab. Please review the changes before proceeding to checkout.</p>
            <div class="cart-validation-modal__actions">
              <button class="btn btn--secondary" data-action="cancel">Review Cart</button>
              <button class="btn btn--primary" data-action="proceed">Continue to Checkout</button>
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
