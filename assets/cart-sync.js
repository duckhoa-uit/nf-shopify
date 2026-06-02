/**
 * Cart Synchronization Manager
 * Handles real-time cart synchronization between browser tabs using BroadcastChannel API
 * and stock validation before checkout.
 */

class CartSyncManager {
  #channel;
  #tabId;
  #lastCartHash;
  #isValidatingCheckout;
  #elements;

  /**
   * @param {Object|null} initialCartData - Initial cart data from Liquid ({{ cart | json }})
   */
  constructor(initialCartData = null) {
    this.#tabId = this.#generateTabId();
    this.#lastCartHash = initialCartData ? this.#generateCartHash(initialCartData) : null;
    this.#isValidatingCheckout = false;
    this.#channel = null;

    this.#cacheElements();
    this.#init();
  }

  #init() {
    if (!('BroadcastChannel' in window)) return;

    this.#channel = new BroadcastChannel('cart-sync');
    this.#setupEventListeners();
  }

  #cacheElements() {
    this.#elements = {
      iconBubble: document.querySelector('#cart-icon-bubble .cart-count-bubble')
    };
  }

  #generateTabId() {
    return 'tab_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  #setupEventListeners() {
    if (!this.#channel) return;

    this.#channel.onmessage = (event) => {
      const { type, data, tabId } = event.data;
      if (tabId === this.#tabId) return;

      switch (type) {
        case 'cart-updated':
          this.#handleCartUpdatedFromOtherTab(data);
          break;
        case 'checkout-started':
          this.#handleCheckoutStartedFromOtherTab(data);
          break;
      }
    };
  }

  /**
   * Broadcast cart update to other tabs (public API)
   */
  broadcastCartUpdate(cartData) {
    if (!this.#channel) return;

    const cartHash = this.#generateCartHash(cartData);

    if (this.#lastCartHash !== null && cartHash === this.#lastCartHash) return;

    this.#lastCartHash = cartHash;

    this.#channel.postMessage({
      type: 'cart-updated',
      data: {
        timestamp: Date.now(),
        cartHash: cartHash,
        itemCount: cartData.item_count || 0,
        totalPrice: cartData.total_price || 0
      },
      tabId: this.#tabId
    });
  }

  async #handleCartUpdatedFromOtherTab(data) {
    try {
      const response = await fetch(`${routes.cart_url}.js`);
      if (!response.ok) throw new Error('Failed to fetch cart');

      const freshCartData = await response.json();
      const freshCartHash = this.#generateCartHash(freshCartData);

      if (freshCartHash !== this.#lastCartHash) {
        this.#lastCartHash = freshCartHash;
        await this.#updateCartUI(freshCartData);
        this.#showSyncNotification();
      }
    } catch (error) {
      // Silently handle - cart sync is not critical
    }
  }

  #handleCheckoutStartedFromOtherTab(data) {
    // Reserved for future use
  }

  async #updateCartUI(cartData) {
    try {
      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'cart-sync',
          cartData: cartData
        });
      }

      this.#updateCartIconBubble(cartData);
    } catch (error) {
      // Silently handle
    }
  }

  #updateCartIconBubble(cartData) {
    const bubble = this.#elements.iconBubble;
    if (!bubble) return;

    const itemCount = cartData.item_count || 0;
    bubble.textContent = itemCount;
    bubble.style.display = itemCount > 0 ? 'inherit' : 'none';
  }

  #showSyncNotification() {
    const notification = document.createElement('div');
    notification.className = 'cart-sync-notification';
    notification.innerHTML = `
      <div class="cart-sync-notification__content">
        <span>${window.theme?.strings?.cart_updated_other_tab || 'Cart updated from another tab'}</span>
      </div>
    `;

    document.body.appendChild(notification);

    requestAnimationFrame(() => {
      notification.classList.add('cart-sync-notification--visible');
    });

    setTimeout(() => {
      notification.classList.remove('cart-sync-notification--visible');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  #generateCartHash(cartData) {
    if (!cartData?.items) return '';

    const cartString = cartData.items.map(item =>
      `${item.key}:${item.quantity}:${item.variant_id}`
    ).join('|') + `|total:${cartData.total_price}`;

    return this.#simpleHash(cartString);
  }

  #simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Validate stock availability for cart items
   */
  async #validateStock(cartData) {
    const variants = cartData.items.map(item => ({
      sku: item.sku,
      id: item.variant_id.toString()
    }));

    console.log('[cart-sync] validateStock request', {
      variants,
      cartItems: cartData.items.map(i => ({
        key: i.key,
        variant_id: i.variant_id,
        sku: i.sku,
        quantity: i.quantity
      }))
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch('/apps/nf-data-management/v1/shopify/proxy/sync_erp_at_checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variants }),
        signal: controller.signal
      });

      console.log('[cart-sync] validateStock response status', response.status);

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Stock validation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[cart-sync] validateStock body', result);
      const stockIssues = [];

      if (result.data && Array.isArray(result.data)) {
        for (const cartItem of cartData.items) {
          const stockData = result.data.find(stock => stock.sku === cartItem.sku);

          if (stockData && stockData.stock < cartItem.quantity) {
            stockIssues.push({
              cartItem,
              availableStock: stockData.stock,
              requestedQuantity: cartItem.quantity
            });
          }
        }
      }

      console.log('[cart-sync] validateStock result', {
        success: stockIssues.length === 0,
        stockIssues
      });

      return { success: stockIssues.length === 0, stockIssues };
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('[cart-sync] validateStock error', error);
      if (error.name === 'AbortError') {
        throw new Error('Stock validation timed out');
      }
      throw error;
    }
  }

  #showCheckoutLoading() {
    const mainBtn = document.querySelector('.nf-cart-checkout__button');
    if (mainBtn) {
      mainBtn.disabled = true;
      mainBtn.classList.add('loading');
      const buttonText = mainBtn.querySelector('.button-text');
      const buttonSpinner = mainBtn.querySelector('.button-spinner');
      if (buttonText) buttonText.textContent = window.theme?.strings?.validating_stock || 'Validating stock...';
      if (buttonSpinner) buttonSpinner.style.display = 'inline-flex';
    }

    const drawerBtn = document.querySelector('#CartDrawer-Checkout');
    if (drawerBtn) {
      drawerBtn.disabled = true;
      drawerBtn.classList.add('loading');
      drawerBtn.textContent = window.theme?.strings?.validating_stock || 'Validating stock...';
    }
  }

  #hideCheckoutLoading() {
    const mainBtn = document.querySelector('.nf-cart-checkout__button');
    if (mainBtn) {
      mainBtn.disabled = false;
      mainBtn.classList.remove('loading');
      const buttonText = mainBtn.querySelector('.button-text');
      const buttonSpinner = mainBtn.querySelector('.button-spinner');
      if (buttonText) buttonText.textContent = window.theme?.strings?.check_out || 'Check out';
      if (buttonSpinner) buttonSpinner.style.display = 'none';
    }

    const drawerBtn = document.querySelector('#CartDrawer-Checkout');
    if (drawerBtn) {
      drawerBtn.disabled = false;
      drawerBtn.classList.remove('loading');
      drawerBtn.textContent = window.theme?.strings?.check_out || 'Check out';
    }
  }

  /**
   * Validate cart before checkout (public API)
   */
  /**
   * Read item keys currently rendered in the cart form's update inputs.
   * Returns [] if no cart form is on the page (e.g., user came from a non-cart page).
   */
  #readDomCartKeys() {
    const cartForm = document.getElementById('cart');
    if (!cartForm) return null;
    const keys = [];
    for (const el of cartForm.querySelectorAll('[name^="updates["]')) {
      const match = el.name.match(/^updates\[(.+)\]$/);
      if (match && match[1]) keys.push(match[1]);
    }
    return keys;
  }

  /**
   * Pattern C: Re-render the main cart items section using Section Rendering API
   * so the form picks up fresh `updates[key]` inputs that match server cart.
   */
  async #refreshMainCartSection() {
    try {
      const mainCart = document.getElementById('main-cart-items');
      // Locate the <cart-items> wrapper that lives in main-cart-items.liquid
      const liveCartItems = document.querySelector('cart-items');
      const sectionId = mainCart?.dataset?.id || liveCartItems?.closest('[id^="shopify-section-"]')?.id?.replace(/^shopify-section-/, '');
      if (!sectionId) {
        console.warn('[cart-sync] cannot refresh section, missing section id');
        return false;
      }
      const url = `${routes.cart_url}?section_id=${sectionId}`;
      const html = await fetch(url, { headers: { Accept: 'text/html' } }).then(r => r.text());
      const newDoc = new DOMParser().parseFromString(html, 'text/html');

      // Preferred: replace the inner .js-contents region when cart is populated
      // (matches the target Dawn uses in cart.js getSectionsToRender).
      const newContents = newDoc.querySelector('#main-cart-items .js-contents');
      const liveContents = mainCart?.querySelector('.js-contents');
      if (newContents && liveContents) {
        liveContents.innerHTML = newContents.innerHTML;
        console.log('[cart-sync] refreshed main-cart-items section (contents)');
        return true;
      }

      // Fallback 1: replace the <cart-items> custom element (covers empty cart
      // state whose markup does not contain #main-cart-items).
      const newCartItems = newDoc.querySelector('cart-items');
      if (newCartItems && liveCartItems) {
        liveCartItems.outerHTML = newCartItems.outerHTML;
        console.log('[cart-sync] refreshed main-cart-items section (cart-items)');
        return true;
      }

      // Fallback 2: replace #main-cart-items if present (legacy structure).
      const newMainCart = newDoc.querySelector('#main-cart-items');
      if (newMainCart && mainCart) {
        mainCart.innerHTML = newMainCart.innerHTML;
        console.log('[cart-sync] refreshed main-cart-items section (full)');
        return true;
      }

      console.warn('[cart-sync] section response missing main-cart-items');
      return false;
    } catch (error) {
      console.warn('[cart-sync] refresh section failed', error);
      return false;
    }
  }

  #showCartOutOfSyncToast() {
    try {
      const message =
        window.theme?.strings?.cart_outdated ||
        window.theme?.strings?.cart_updated_review ||
        'Your cart has changed. Please review and try again.';
      const notification = document.createElement('div');
      notification.className = 'cart-sync-notification';
      notification.innerHTML = `
        <div class="cart-sync-notification__content">
          <span>${message}</span>
        </div>
      `;
      document.body.appendChild(notification);
      requestAnimationFrame(() => notification.classList.add('cart-sync-notification--visible'));
      setTimeout(() => {
        notification.classList.remove('cart-sync-notification--visible');
        setTimeout(() => notification.remove(), 300);
      }, 4000);
    } catch (_) {
      // Non-critical
    }
  }

  async validateBeforeCheckout() {
    if (this.#isValidatingCheckout) return true;

    this.#isValidatingCheckout = true;
    console.log('[cart-sync] validateBeforeCheckout start');

    try {
      this.#showCheckoutLoading();

      const response = await fetch(`${routes.cart_url}.js`);
      if (!response.ok) throw new Error('Failed to fetch cart for validation');

      const serverCart = await response.json();
      console.log('[cart-sync] serverCart snapshot', {
        token: serverCart.token,
        item_count: serverCart.item_count,
        items: serverCart.items.map(i => ({
          key: i.key,
          variant_id: i.variant_id,
          sku: i.sku,
          quantity: i.quantity,
          title: i.title
        }))
      });

      // Pattern B: detect stale DOM cart vs server cart.
      // Causes include: bfcache restore, multi-domain Markets cookie reset,
      // GA cross-domain navigation, or another tab modifying the cart.
      const domKeys = this.#readDomCartKeys();
      if (Array.isArray(domKeys)) {
        const serverKeys = new Set(serverCart.items.map(i => i.key));
        const staleKeys = domKeys.filter(k => !serverKeys.has(k));
        const missingFromDom = [...serverKeys].filter(k => !domKeys.includes(k));
        if (staleKeys.length > 0 || missingFromDom.length > 0 || domKeys.length === 0 && serverCart.item_count === 0) {
          // Real mismatch only if there is a non-empty difference
          if (staleKeys.length > 0 || missingFromDom.length > 0) {
            console.warn('[cart-sync] DOM cart out of sync with server', {
              domKeys,
              serverKeys: [...serverKeys],
              staleKeys,
              missingFromDom
            });
            // Pattern C: re-render the section to pick up correct keys
            const refreshed = await this.#refreshMainCartSection();
            this.#showCartOutOfSyncToast();
            // Abort checkout: user must click again with fresh form
            return false;
          }
        }
      }

      try {
        const stockValidation = await this.#validateStock(serverCart);

        if (!stockValidation.success && stockValidation.stockIssues.length > 0) {
          const shouldProceed = await this.#showStockValidationDialog(stockValidation, serverCart);

          if (!shouldProceed) return false;

          const updatedResponse = await fetch(`${routes.cart_url}.js`);
          if (updatedResponse.ok) {
            const updatedCart = await updatedResponse.json();
            this.#lastCartHash = this.#generateCartHash(updatedCart);
            await this.#updateCartUI(updatedCart);
          }

          return false;
        }
      } catch (stockError) {
        const shouldProceed = await this.#showStockValidationWarning(stockError.message);
        if (!shouldProceed) return false;
      }

      const serverCartHash = this.#generateCartHash(serverCart);

      if (this.#lastCartHash === null) {
        this.#lastCartHash = serverCartHash;
        return true;
      }

      if (serverCartHash !== this.#lastCartHash) {
        this.#lastCartHash = serverCartHash;
        await this.#updateCartUI(serverCart);
      }

      console.log('[cart-sync] validateBeforeCheckout success');
      return true;
    } catch (error) {
      console.warn('[cart-sync] validateBeforeCheckout failed (proceeding anyway)', error);
      return true;
    } finally {
      this.#hideCheckoutLoading();
      this.#isValidatingCheckout = false;
    }
  }

  /**
   * Centralized cart API call
   */
  async #performCartChange(bodyData) {
    const response = await fetch(`${routes.cart_change_url}`, {
      ...fetchConfig(),
      body: JSON.stringify({
        ...bodyData,
        sections: ['cart-drawer', 'cart-icon-bubble'],
        sections_url: window.location.pathname
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cart update failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    await this.#updateCartUI(result);
    this.broadcastCartUpdate(result);

    if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
      publish(PUB_SUB_EVENTS.cartUpdate, {
        source: 'cart-sync-stock-dialog',
        cartData: result
      });
    }

    return result;
  }

  async removeCartItem(itemKey) {
    return this.#performCartChange({ id: itemKey, quantity: 0 });
  }

  async updateCartItemQuantity(itemKey, quantity) {
    return this.#performCartChange({ id: itemKey, quantity });
  }

  /**
   * Create modal element with standard structure and accessibility
   */
  #createModal(className, content, options = {}) {
    const modal = document.createElement('div');
    modal.className = `cart-sync-modal ${className}`;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (options.ariaLabel) {
      modal.setAttribute('aria-label', options.ariaLabel);
    }

    modal.innerHTML = `
      <div class="cart-sync-modal__overlay" data-modal-overlay>
        <div class="cart-sync-modal__content" role="document">
          ${content}
        </div>
      </div>
    `;

    return modal;
  }

  /**
   * Show modal with animation
   */
  #showModal(modal, onClose) {
    document.body.appendChild(modal);

    // Store previously focused element
    const previouslyFocused = document.activeElement;

    // Trigger animation
    requestAnimationFrame(() => {
      modal.classList.add('cart-sync-modal--visible');
    });

    // Focus first button
    const firstButton = modal.querySelector('button');
    if (firstButton) {
      firstButton.focus();
    }

    // ESC key handler
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }

      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = modal.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    };

    // Overlay click handler
    const handleOverlayClick = (e) => {
      if (e.target.hasAttribute('data-modal-overlay')) {
        onClose?.();
      }
    };

    modal.addEventListener('keydown', handleKeyDown);
    modal.addEventListener('click', handleOverlayClick);

    // Cleanup function
    modal._cleanup = () => {
      modal.removeEventListener('keydown', handleKeyDown);
      modal.removeEventListener('click', handleOverlayClick);
      previouslyFocused?.focus();
    };
  }

  /**
   * Hide modal with animation
   */
  #hideModal(modal) {
    modal.classList.remove('cart-sync-modal--visible');
    modal._cleanup?.();

    setTimeout(() => modal.remove(), 200);
  }

  async #showStockValidationDialog(stockValidation, cartData) {
    return new Promise((resolve) => {
      let itemsHtml = '';

      for (const issue of stockValidation.stockIssues) {
        const { cartItem, availableStock, requestedQuantity } = issue;
        const title = cartItem.product_title || `Product ${cartItem.product_id}`;
        const variant = cartItem.variant_title ? ` - ${cartItem.variant_title}` : '';
        const imgSrc = cartItem.image || cartItem.featured_image?.url || '';

        itemsHtml += `
          <div class="cart-sync-modal__stock-item" data-item-key="${cartItem.key}">
            ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="cart-sync-modal__stock-image">` : ''}
            <div class="cart-sync-modal__stock-info">
              <p class="cart-sync-modal__stock-title">${title}${variant}</p>
              <p class="cart-sync-modal__stock-variant">SKU: ${cartItem.sku || 'N/A'}</p>
              <p class="cart-sync-modal__stock-status"><span class="cart-sync-modal__stock-status--warning">Requested: ${requestedQuantity}, Available: ${availableStock}</span></p>
            </div>
            <div class="cart-sync-modal__stock-actions">
              <button class="button button--small button--secondary" data-action="remove" data-item-key="${cartItem.key}">
                Remove
              </button>
              ${availableStock > 0 ? `
                <button class="button button--small button--primary" data-action="adjust" data-item-key="${cartItem.key}" data-quantity="${availableStock}">
                  Adjust to ${availableStock}
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }

      const modal = this.#createModal('cart-sync-modal--stock', `
        <h3 class="cart-sync-modal__title">${window.theme?.strings?.stock_unavailable || 'Stock Unavailable'}</h3>
        <p class="cart-sync-modal__text">${window.theme?.strings?.stock_issues_message || 'Some items in your cart are not available in the requested quantities:'}</p>
        <div class="cart-sync-modal__stock-list">${itemsHtml}</div>
        <div class="cart-sync-modal__actions">
          <button class="button button--secondary" data-action="cancel">${window.theme?.strings?.cancel_checkout || 'Cancel Checkout'}</button>
        </div>
      `, { ariaLabel: 'Stock validation' });

      const closeModal = () => {
        resolve(false);
        this.#hideModal(modal);
      };

      modal.addEventListener('click', async (e) => {
        const action = e.target.dataset.action;
        const itemKey = e.target.dataset.itemKey;
        const quantity = e.target.dataset.quantity;

        if (action === 'cancel') {
          closeModal();
        } else if (action === 'remove' && itemKey) {
          e.target.disabled = true;
          e.target.textContent = 'Removing...';

          try {
            await this.removeCartItem(itemKey);
            e.target.closest('.cart-sync-modal__stock-item')?.remove();

            if (!modal.querySelector('.cart-sync-modal__stock-item')) {
              resolve(true);
              this.#hideModal(modal);
            }
          } catch (error) {
            e.target.disabled = false;
            e.target.textContent = 'Remove';
            alert(window.theme?.strings?.failed_remove_item || 'Failed to remove item. Please try again.');
          }
        } else if (action === 'adjust' && itemKey && quantity) {
          e.target.disabled = true;
          e.target.textContent = 'Adjusting...';

          try {
            await this.updateCartItemQuantity(itemKey, parseInt(quantity));
            e.target.closest('.cart-sync-modal__stock-item')?.remove();

            if (!modal.querySelector('.cart-sync-modal__stock-item')) {
              resolve(true);
              this.#hideModal(modal);
            }
          } catch (error) {
            e.target.disabled = false;
            e.target.textContent = `Adjust to ${quantity}`;
            alert(window.theme?.strings?.failed_adjust_quantity || 'Failed to adjust quantity. Please try again.');
          }
        }
      });

      this.#showModal(modal, closeModal);
    });
  }

  async #showStockValidationWarning(errorMessage) {
    return new Promise((resolve) => {
      const modal = this.#createModal('', `
        <h3 class="cart-sync-modal__title">${window.theme?.strings?.stock_validation_warning || 'Stock Validation Warning'}</h3>
        <p class="cart-sync-modal__text">${window.theme?.strings?.stock_validation_error || "We couldn't verify stock availability"}: ${errorMessage}</p>
        <p class="cart-sync-modal__text">${window.theme?.strings?.stock_validation_continue || 'Your order may be subject to stock availability. Do you want to continue?'}</p>
        <div class="cart-sync-modal__actions">
          <button class="button button--secondary" data-action="cancel">${window.theme?.strings?.cancel_checkout || 'Cancel Checkout'}</button>
          <button class="button button--primary" data-action="proceed">${window.theme?.strings?.continue_anyway || 'Continue Anyway'}</button>
        </div>
      `, { ariaLabel: 'Stock validation warning' });

      const closeModal = (result) => {
        resolve(result);
        this.#hideModal(modal);
      };

      modal.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'proceed') closeModal(true);
        else if (action === 'cancel') closeModal(false);
      });

      this.#showModal(modal, () => closeModal(false));
    });
  }

  async showCheckoutValidationDialog(serverCart) {
    return new Promise((resolve) => {
      const modal = this.#createModal('', `
        <h3 class="cart-sync-modal__title">${window.theme?.strings?.cart_updated || 'Cart Updated'}</h3>
        <p class="cart-sync-modal__text">${window.theme?.strings?.cart_updated_review || 'Your cart has been updated from another tab. Please review the changes before proceeding to checkout.'}</p>
        <div class="cart-sync-modal__actions">
          <button class="button button--secondary" data-action="cancel">${window.theme?.strings?.review_cart || 'Review Cart'}</button>
          <button class="button button--primary" data-action="proceed">${window.theme?.strings?.continue_to_checkout || 'Continue to Checkout'}</button>
        </div>
      `, { ariaLabel: 'Cart updated notification' });

      const closeModal = (result) => {
        resolve(result);
        this.#hideModal(modal);
      };

      modal.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'proceed') closeModal(true);
        else if (action === 'cancel') closeModal(false);
      });

      this.#showModal(modal, () => closeModal(false));
    });
  }

  destroy() {
    if (this.#channel) {
      this.#channel.close();
      this.#channel = null;
    }
  }
}

// Initialize with cart data passed from Liquid
// Expected usage in theme.liquid: window.cartSyncManager = new CartSyncManager({{ cart | json }});
if (typeof window.initialCartData !== 'undefined') {
  window.cartSyncManager = new CartSyncManager(window.initialCartData);
} else {
  window.cartSyncManager = new CartSyncManager();
}

window.addEventListener('beforeunload', () => {
  window.cartSyncManager?.destroy();
});
