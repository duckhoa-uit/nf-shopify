/**
 * Cart Hover Popup Component
 * Displays cart items in a hover popup with Popper.js positioning
 */

class CartHoverPopup extends HTMLElement {
  constructor() {
    super();

    // Popper.js integration
    this.popperInstance = null;
    this.isPopperAvailable = false;
    this.isMobile = window.innerWidth <= 749;

    // Check for Popper.js availability after DOM is ready
    this.checkPopperAvailability();

    // Cart data caching (optimized for server-side rendering)
    this.cartCache = null;
    this.cacheTimestamp = 0;
    this.CACHE_TTL = 300000; // 5 minutes - longer cache for better performance

    // Performance optimization
    this.updateDebounceTimer = null;
    this.isUpdating = false;

    // Background update system
    this.backgroundUpdateTimer = null;
    this.isBackgroundUpdating = false;
    this.pendingBackgroundUpdate = null;

    // State management
    this.isOpen = false;
    this.isLoading = false;
    this.hoverTimer = null;
    this.leaveTimer = null;

    // DOM state tracking
    this.domSyncTimestamp = 0;
    this.lastDOMCartHash = null;

    // DOM elements (simplified - server-side rendered content)
    this.content = this.querySelector('.cart-hover-popup__content');

    // Cart icon reference
    this.cartIcon = document.getElementById('cart-icon-bubble');

    // Delay initialization to ensure all scripts are loaded
    setTimeout(() => {
      this.init();
    }, 100);
  }

  checkPopperAvailability() {
    // Check for Popper.js in different possible locations
    this.isPopperAvailable = !!(
      (typeof window.Popper !== 'undefined' && window.Popper.createPopper) ||
      (typeof window.PopperJS !== 'undefined' && window.PopperJS.createPopper) ||
      (window.Popper && typeof window.Popper.createPopper === 'function')
    );

    // If not immediately available, wait a bit for deferred scripts to load
    if (!this.isPopperAvailable) {
      setTimeout(() => {
        this.isPopperAvailable = !!(
          (typeof window.Popper !== 'undefined' && window.Popper.createPopper) ||
          (typeof window.PopperJS !== 'undefined' && window.PopperJS.createPopper) ||
          (window.Popper && typeof window.Popper.createPopper === 'function')
        );
      }, 500);
    }
  }

  init() {
    // Re-check DOM elements in case they weren't available during construction
    this.cartIcon = this.cartIcon || document.getElementById('cart-icon-bubble');
    this.itemTemplate = this.itemTemplate || document.getElementById('cart-hover-popup-item-template');

    if (!this.cartIcon) {
      console.warn('Cart icon not found, cart hover popup disabled');
      return;
    }

    this.setupEventListeners();
    this.setupResizeListener();
    this.subscribeToCartUpdates();
  }

  setupEventListeners() {
    // Escape key to close
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && this.isOpen) {
        this.hide();
      }
    });

    // Cart icon hover events (desktop only)
    if (!this.isMobile) {
      this.setupHoverEvents();
    }

    // Popup hover events to keep it open
    this.addEventListener('mouseenter', () => {
      this.clearLeaveTimer();
    });

    this.addEventListener('mouseleave', () => {
      this.scheduleHide();
    });
  }

  setupHoverEvents() {
    // Hover intent detection with delay
    this.cartIcon.addEventListener('mouseenter', () => {
      this.clearLeaveTimer();
      this.hoverTimer = setTimeout(() => {
        if (!this.isMobile) {
          this.show();
        }
      }, 150); // 150ms delay
    });

    this.cartIcon.addEventListener('mouseleave', () => {
      this.clearHoverTimer();
      this.scheduleHide();
    });
  }

  setupResizeListener() {
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 749;

      // If switched to mobile, close popup and remove hover events
      if (!wasMobile && this.isMobile) {
        this.hide();
        this.removeHoverEvents();
      }
      // If switched to desktop, add hover events
      else if (wasMobile && !this.isMobile) {
        this.setupHoverEvents();
      }
      // Update positioning if popup is open
      else if (this.isOpen && !this.isMobile) {
        this.updatePositioning();
      }
    });
  }

  removeHoverEvents() {
    // Remove existing hover event listeners
    const newCartIcon = this.cartIcon.cloneNode(true);
    this.cartIcon.parentNode.replaceChild(newCartIcon, this.cartIcon);
    this.cartIcon = newCartIcon;
  }

  subscribeToCartUpdates() {
    // Listen for cart update events with enhanced background DOM updates
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS === 'object') {
      this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
        // Always invalidate cache when cart updates
        this.invalidateCache();

        // Update cache with fresh cart data if available
        if (event?.cartData) {
          this.cartCache = event.cartData;
          this.cacheTimestamp = Date.now();
        }

        // Always update DOM in background, regardless of popup state
        this.scheduleBackgroundDOMUpdate(event);

        // If popup is open, also handle immediate visual updates
        if (this.isOpen) {
          this.debouncedHandleCartUpdate(event);
        }
      });
    } else {
      console.error('[Cart Hover Popup] PUB_SUB system not available');
    }
  }

  scheduleBackgroundDOMUpdate(event) {
    // Debounce background DOM updates to prevent excessive operations
    if (this.backgroundUpdateTimer) {
      clearTimeout(this.backgroundUpdateTimer);
    }

    // Store the latest event for processing
    this.pendingBackgroundUpdate = event;

    this.backgroundUpdateTimer = setTimeout(() => {
      this.performBackgroundDOMUpdate(this.pendingBackgroundUpdate);
    }, 100); // Faster debounce for background updates (100ms vs 150ms)
  }

  async performBackgroundDOMUpdate(event) {
    if (this.isBackgroundUpdating) return;

    this.isBackgroundUpdating = true;

    try {
      let cartData = event?.cartData;
      if (!cartData) {
        const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`);
        if (response.ok) {
          cartData = await response.json();
          this.cartCache = cartData;
          this.cacheTimestamp = Date.now();
        } else {
          throw new Error(`Failed to fetch cart data: ${response.status}`);
        }
      }

      // Generate cart hash for change detection
      const cartHash = this.generateCartHash(cartData);

      // Skip update if DOM is already in sync
      if (this.lastDOMCartHash === cartHash && this.isDOMSyncValid()) {
        return;
      }

      // Determine update strategy
      const needsStructuralUpdate = this.needsStructuralDOMUpdate(cartData);

      if (needsStructuralUpdate) {
        await this.performBackgroundStructuralUpdate(cartData);
      } else {
        this.updateDynamicContent(cartData);
      }

      // Update DOM sync tracking
      this.lastDOMCartHash = cartHash;
      this.domSyncTimestamp = Date.now();

    } catch (error) {
      console.error('[Cart Hover Popup] Background update failed:', error);
    } finally {
      this.isBackgroundUpdating = false;
    }
  }

  debouncedHandleCartUpdate(event) {
    // Debounce rapid cart updates to prevent excessive API calls (for open popup)
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.updateDebounceTimer = setTimeout(() => {
      this.handleCartUpdate(event);
    }, 150); // 150ms debounce
  }

  clearHoverTimer() {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  clearLeaveTimer() {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
  }

  scheduleHide() {
    this.leaveTimer = setTimeout(() => {
      this.hide();
    }, 100); // Small delay to prevent flicker
  }

  show() {
    if (this.isOpen || this.isMobile) return;

    this.isOpen = true;
    this.setAttribute('open', '');

    // Setup positioning
    this.setupPositioning();

    // Attach event listeners to server-rendered content
    this.attachRemoveButtonListeners();

    // DOM is already synced in background, just ensure dynamic content is fresh
    this.ensureFreshDynamicContent();
  }

  hide() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.removeAttribute('open');

    // Cleanup Popper instance
    this.destroyPopper();

    // Clear timers
    this.clearHoverTimer();
    this.clearLeaveTimer();
  }

  setupPositioning() {
    if (this.isMobile) {
      // Mobile: completely disabled
      return;
    } else if (this.isPopperAvailable) {
      this.createPopperInstance();
    } else {
      this.setupFallbackPositioning();
    }
  }

  updatePositioning() {
    this.destroyPopper();
    this.setupPositioning();
  }

  createPopperInstance() {
    if (this.popperInstance) {
      this.destroyPopper();
    }

    const referenceElement = this.cartIcon;
    const popperElement = this;

    // Add Popper class for styling
    this.classList.add('cart-hover-popup--popper');

    // Try different Popper.js API locations
    const createPopper =
      (window.Popper && window.Popper.createPopper) ||
      (window.PopperJS && window.PopperJS.createPopper) ||
      window.createPopper;

    if (!createPopper) {
      this.setupFallbackPositioning();
      return;
    }

    this.popperInstance = createPopper(referenceElement, popperElement, {
      placement: 'bottom-end',
      strategy: 'absolute',
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['top-end', 'bottom-start', 'top-start'],
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    });
  }

  setupFallbackPositioning() {
    this.classList.remove('cart-hover-popup--popper');

    const cartIconRect = this.cartIcon.getBoundingClientRect();
    this.style.position = 'fixed';
    this.style.top = `${cartIconRect.bottom + 8}px`;
    this.style.right = `${window.innerWidth - cartIconRect.right}px`;
    this.style.zIndex = '1000';
  }

  destroyPopper() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
    this.classList.remove('cart-hover-popup--popper');
  }

  async handleCartUpdate(event) {
    // Prevent concurrent updates
    if (this.isUpdating) {
      return;
    }

    this.isUpdating = true;

    try {
      let cartData;

      // Use event cart data if available (faster, no API call needed)
      if (event && event.cartData) {
        cartData = event.cartData;
      } else {
        // Fallback to fetching fresh cart data
        const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        cartData = await response.json();
      }

      // Store old cache for comparison
      const oldCartData = this.cartCache;

      // Check if we need full re-render (new items added)
      // Use old cache for comparison, not current cache
      const needsFullRender = this.needsFullRerenderComparison(oldCartData, cartData);

      if (needsFullRender) {
        await this.performFullRerender();
      } else {
        // Only update dynamic content for existing items
        this.updateDynamicContent(cartData);
      }

      // Update cache after comparison
      this.cartCache = cartData;
      this.cacheTimestamp = Date.now();



    } catch (error) {
      console.error('Failed to handle cart update:', error);
      // Fallback to basic dynamic update
      this.loadCartData();
    } finally {
      this.isUpdating = false;
    }
  }

  async checkAndUpdateContent() {
    // Check if we need full rerender when showing popup
    // This handles cases where cart was updated while popup was closed
    try {
      // Get current cart data
      const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const currentCartData = await response.json();

      // Compare with server-side rendered content to see if we need full rerender
      const needsFullRender = this.needsFullRerenderForShow(currentCartData);

      if (needsFullRender) {
        // Update cache first
        this.cartCache = currentCartData;
        this.cacheTimestamp = Date.now();
        // Perform full rerender
        await this.performFullRerender();
      } else {
        // Just update dynamic content
        this.loadCartData();
      }
    } catch (error) {
      console.error('Failed to check cart content on show:', error);
      // Fallback to normal load
      this.loadCartData();
    }
  }

  needsFullRerenderForShow(currentCartData) {
    // Get server-side rendered items from DOM
    const renderedItems = this.querySelectorAll('.cart-hover-popup__item');
    const renderedItemKeys = new Set();

    renderedItems.forEach(item => {
      const key = item.getAttribute('data-item-key');
      if (key) renderedItemKeys.add(key);
    });

    const currentItems = currentCartData.items || [];
    const currentItemKeys = new Set(currentItems.map(item => item.key));

    // Check if item count changed
    if (renderedItems.length !== currentItems.length) {
      return true;
    }

    // Check if any new items exist
    for (const key of currentItemKeys) {
      if (!renderedItemKeys.has(key)) {
        return true;
      }
    }

    // Check if any items were removed
    for (const key of renderedItemKeys) {
      if (!currentItemKeys.has(key)) {
        return true;
      }
    }

    return false;
  }

  async loadCartData() {
    // Server-side rendering eliminates need for complex loading
    // Only update dynamic content (quantities, totals) via cart.js

    // Check cache first for dynamic updates
    if (this.isCartCacheValid()) {
      this.updateDynamicContent(this.cartCache);
      return;
    }

    try {
      // Only fetch cart.js for real-time updates
      const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const cartData = await response.json();

      // Update cache
      this.cartCache = cartData;
      this.cacheTimestamp = Date.now();

      // Update only dynamic elements
      this.updateDynamicContent(cartData);
    } catch (error) {
      console.error('Failed to update cart data:', error);
      // Server-side content still available, no need to show error
    }
  }

  isCartCacheValid() {
    return this.cartCache &&
           this.cacheTimestamp &&
           (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
  }

  invalidateCache() {
    this.cartCache = null;
    this.cacheTimestamp = 0;
  }

  generateCartHash(cartData) {
    // Generate a simple hash for cart state comparison
    if (!cartData || !cartData.items) return 'empty';

    const items = cartData.items.map(item => `${item.key}:${item.quantity}`).join('|');
    return `${items}:${cartData.total_price}`;
  }

  isDOMSyncValid() {
    // Check if DOM sync is still valid (within 30 seconds)
    return this.domSyncTimestamp &&
           (Date.now() - this.domSyncTimestamp) < 30000;
  }

  needsStructuralDOMUpdate(cartData) {
    // Check if we need structural DOM changes (add/remove items)
    const currentItems = this.querySelectorAll('.cart-hover-popup__item');
    const currentItemKeys = new Set();

    currentItems.forEach(item => {
      const key = item.getAttribute('data-item-key');
      if (key) currentItemKeys.add(key);
    });

    const newItems = cartData.items || [];
    const newItemKeys = new Set(newItems.slice(0, 5).map(item => item.key)); // Only first 5 items

    // Check if item count changed
    if (currentItems.length !== Math.min(newItems.length, 5)) {
      return true;
    }

    // Check if any items were added/removed
    for (const key of newItemKeys) {
      if (!currentItemKeys.has(key)) {
        return true;
      }
    }

    for (const key of currentItemKeys) {
      if (!newItemKeys.has(key)) {
        return true;
      }
    }

    return false; // Only quantities/prices changed
  }

  ensureFreshDynamicContent() {
    // Ensure dynamic content is fresh when showing popup (non-async)
    if (this.cartCache && this.isCartCacheValid()) {
      this.updateDynamicContent(this.cartCache);
    } else if (this.cartCache) {
      // Cache exists but might be stale, update dynamic content anyway
      this.updateDynamicContent(this.cartCache);
    }
  }

  needsFullRerender(newCartData) {
    // Legacy method - use needsFullRerenderComparison instead
    return this.needsFullRerenderComparison(this.cartCache, newCartData);
  }

  needsFullRerenderComparison(oldCartData, newCartData) {
    // Check if we need full re-render by comparing cart items
    if (!oldCartData || !oldCartData.items) {
      return true; // No cache, need full render
    }

    const currentItems = oldCartData.items || [];
    const newItems = newCartData.items || [];

    // Check if item count changed (new items added/removed)
    if (currentItems.length !== newItems.length) {
      return true;
    }

    // Check if any new item keys exist (different products)
    const currentKeys = new Set(currentItems.map(item => item.key));
    const newKeys = new Set(newItems.map(item => item.key));

    for (const key of newKeys) {
      if (!currentKeys.has(key)) {
        return true; // New item found
      }
    }

    // Check if any items were removed
    for (const key of currentKeys) {
      if (!newKeys.has(key)) {
        return true; // Item removed
      }
    }

    return false; // Only quantities/prices changed
  }

  async performBackgroundStructuralUpdate(cartData) {
    // Perform structural DOM update in background using section rendering
    try {
      // Use section rendering to get fresh HTML
      const sectionsUrl = `${window.location.pathname}?section_id=cart-hover-popup-content`;
      const response = await fetch(sectionsUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch section: ${response.status}`);
      }

      const sectionHtml = await response.text();

      // Parse and update content in background
      const parser = new DOMParser();
      const doc = parser.parseFromString(sectionHtml, 'text/html');
      const newContent = doc.querySelector('.cart-hover-popup__content');

      if (newContent) {
        // Preserve arrow element
        const arrow = this.content.querySelector('.base-hover-popup__arrow');

        // Clear current content but keep arrow
        const elementsToRemove = [];
        for (const child of this.content.children) {
          if (!child.classList.contains('base-hover-popup__arrow')) {
            elementsToRemove.push(child);
          }
        }
        elementsToRemove.forEach(el => el.remove());

        // Add arrow first if it existed
        if (arrow) {
          this.content.appendChild(arrow);
        }

        // Add all new content elements
        const newChildren = Array.from(newContent.children);
        newChildren.forEach(child => {
          // Skip arrow if it exists in new content (we already have it)
          if (!child.classList.contains('base-hover-popup__arrow')) {
            this.content.appendChild(child.cloneNode(true));
          }
        });

        // Re-attach event listeners
        this.attachRemoveButtonListeners();
      } else {
        throw new Error('No content found in section response');
      }
    } catch (error) {
      console.error('[Cart Hover Popup] Background structural update failed:', error);
      // Fallback to dynamic update only
      this.updateDynamicContent(cartData);
    }
  }

  async performFullRerender() {
    // Perform full re-render using section rendering for new items
    try {
      const sectionsUrl = `${window.location.pathname}?section_id=cart-hover-popup-content`;
      const response = await fetch(sectionsUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch section: ${response.status}`);
      }

      const sectionHtml = await response.text();

      // Parse and update content
      const parser = new DOMParser();
      const doc = parser.parseFromString(sectionHtml, 'text/html');
      const newContent = doc.querySelector('.cart-hover-popup__content');

      if (newContent) {
        // Preserve arrow element
        const arrow = this.content.querySelector('.base-hover-popup__arrow');

        // Clear current content but keep arrow
        const elementsToRemove = [];
        for (const child of this.content.children) {
          if (!child.classList.contains('base-hover-popup__arrow')) {
            elementsToRemove.push(child);
          }
        }
        elementsToRemove.forEach(el => el.remove());

        // Add arrow first if it existed
        if (arrow) {
          this.content.appendChild(arrow);
        }

        // Add all new content elements
        const newChildren = Array.from(newContent.children);
        newChildren.forEach(child => {
          // Skip arrow if it exists in new content (we already have it)
          if (!child.classList.contains('base-hover-popup__arrow')) {
            this.content.appendChild(child.cloneNode(true));
          }
        });

        // Re-attach event listeners
        this.attachRemoveButtonListeners();
      } else {
        throw new Error('No content found in section response');
      }
    } catch (error) {
      console.error('[Cart Hover Popup] Full rerender failed:', error);
      // Fallback to dynamic update only
      try {
        const cartData = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`).then(r => r.json());
        this.updateDynamicContent(cartData);
      } catch (fallbackError) {
        console.error('[Cart Hover Popup] Fallback update failed:', fallbackError);
      }
    }
  }

  showLoading() {
    this.isLoading = true;
    if (this.loadingElement) {
      this.loadingElement.style.display = 'flex';
    }
    if (this.emptyElement) {
      this.emptyElement.style.display = 'none';
    }
    this.itemsContainer.style.display = 'none';
  }

  hideLoading() {
    this.isLoading = false;
    if (this.loadingElement) {
      this.loadingElement.style.display = 'none';
    }
  }

  showError() {
    // Show empty state as fallback for errors
    if (this.emptyElement) {
      this.emptyElement.style.display = 'flex';
      this.emptyElement.querySelector('.cart-hover-popup__empty-text').textContent =
        'Failed to load cart items';
    }
    this.itemsContainer.style.display = 'none';
  }

  updateDynamicContent(cartData) {
    // Server-side content is already rendered
    // Only update dynamic elements like quantities and totals

    if (!cartData || !cartData.items) {
      return;
    }

    // Update item quantities
    cartData.items.forEach((item, index) => {
      if (index >= 5) return; // Only first 5 items shown

      const itemElement = this.querySelector(`[data-item-key="${item.key}"]`);
      if (itemElement) {
        const quantityElement = itemElement.querySelector('.cart-hover-popup__item-quantity-value');
        if (quantityElement) {
          quantityElement.textContent = item.quantity;
        }
      }
    });

    // Update summary totals
    const totalElement = this.querySelector('.cart-hover-popup__summary-total-value');
    if (totalElement) {
      totalElement.textContent = this.formatPrice(cartData.total_price);
    }

    // Attach event listeners to remove buttons
    this.attachRemoveButtonListeners();
  }



  attachRemoveButtonListeners() {
    // Attach event listeners to all remove buttons in server-rendered content
    const removeButtons = this.querySelectorAll('.cart-hover-popup__item-remove');
    removeButtons.forEach(button => {
      const itemKey = button.dataset.itemKey;
      if (itemKey) {
        // Remove existing listeners to prevent duplicates
        button.replaceWith(button.cloneNode(true));
        const newButton = this.querySelector(`[data-item-key="${itemKey}"] .cart-hover-popup__item-remove`);

        newButton.addEventListener('click', (e) => {
          e.preventDefault();
          this.removeCartItem(itemKey);
        });
      }
    });
  }

  updateCartSummary(cartData) {
    if (!this.summaryTotalValue) return;

    // Format total price
    const totalPrice = this.formatPrice(cartData.total_price);
    this.summaryTotalValue.textContent = totalPrice;

    // Calculate and display savings if applicable
    if (this.summarySavingsValue && cartData.total_discount > 0) {
      const savings = this.formatPrice(cartData.total_discount);
      this.summarySavingsValue.textContent = `-${savings}`;
    } else if (this.summarySavingsValue) {
      this.summarySavingsValue.textContent = '€0,00';
    }
  }

  formatPrice(price) {
    if (typeof price !== 'number') return '€0,00';

    // Use Shopify's money formatting if available
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(price);
    }

    // Fallback formatting
    const euros = (price / 100).toFixed(2).replace('.', ',');
    return `€${euros}`;
  }



  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }





  updateCartIconBubble(cartData) {
    // Update cart icon bubble immediately for better UX
    const cartBubble = document.querySelector('#cart-icon-bubble .cart-count-bubble');

    if (cartBubble) {
      const itemCount = cartData.item_count || 0;

      // Update count
      const countSpan = cartBubble.querySelector('span[aria-hidden="true"]');
      if (countSpan) {
        countSpan.textContent = itemCount;
      }

      // Update visibility
      cartBubble.style.display = itemCount > 0 ? 'inherit' : 'none';

      // Update visually hidden text
      const hiddenSpan = cartBubble.querySelector('.visually-hidden');
      if (hiddenSpan) {
        // Use simple text since we can't use Liquid in JavaScript
        hiddenSpan.textContent = `Cart (${itemCount} items)`;
      }
    }
  }



  async removeCartItem(itemKey) {
    try {
      const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart/change.js`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get updated cart data from response
      const updatedCartData = await response.json();

      // Update cache with fresh data
      this.cartCache = updatedCartData;
      this.cacheTimestamp = Date.now();

      // Update popup content
      if (this.needsFullRerender(updatedCartData)) {
        await this.performFullRerender();
      } else {
        this.updateDynamicContent(updatedCartData);
      }

      // Publish cart update event WITH cart data for other components
      if (typeof publish === 'function' && typeof PUB_SUB_EVENTS === 'object') {
        publish(PUB_SUB_EVENTS.cartUpdate, {
          source: 'cart-hover-popup',
          cartData: updatedCartData
        });
      }

      // Broadcast to other tabs via CartSyncManager
      if (window.cartSyncManager) {
        window.cartSyncManager.broadcastCartUpdate(updatedCartData);
      }

      // Update cart icon bubble directly (immediate feedback)
      this.updateCartIconBubble(updatedCartData);

    } catch (error) {
      console.error('Failed to remove cart item:', error);
    }
  }

  disconnectedCallback() {
    // Cleanup
    this.destroyPopper();
    this.clearHoverTimer();
    this.clearLeaveTimer();
    this.clearBackgroundUpdateTimer();

    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  clearBackgroundUpdateTimer() {
    if (this.backgroundUpdateTimer) {
      clearTimeout(this.backgroundUpdateTimer);
      this.backgroundUpdateTimer = null;
    }
  }
}

// Define custom element
if (!customElements.get('cart-hover-popup')) {
  customElements.define('cart-hover-popup', CartHoverPopup);
}
