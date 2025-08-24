/**
 * User Menu Hover Popup
 * Extends BaseHoverPopup for user account menu functionality
 *
 * Features:
 * - Customer account menu items
 * - Dynamic user information display
 * - Instant display performance
 * - Responsive behavior
 */

class UserMenuPopup extends (window.BaseHoverPopup || HTMLElement) {
  constructor() {
    // Check if BaseHoverPopup is available
    if (!window.BaseHoverPopup) {
      console.error('[User Menu Popup] BaseHoverPopup not available');
      super();
      return;
    }

    super({
      hoverDelay: 150,
      hideDelay: 100,
      cacheTTL: 600000, // 10 minutes for user data
      backgroundUpdateDebounce: 200,
      updateDebounce: 150
    });

    // User-specific state
    this.isLoggedIn = false;
    this.customerData = null;
  }

  // Required abstract method implementations
  getContentSelector() {
    return '.user-menu-popup__content';
  }

  getTriggerSelector() {
    return '#user-menu-trigger';
  }

  getUpdateEventName() {
    return 'customerUpdate'; // Listen for customer data updates
  }

  getPopupName() {
    return 'user-menu-popup';
  }

  // Initialize user-specific functionality
  init() {
    if (!window.BaseHoverPopup) {
      console.error('[User Menu Popup] BaseHoverPopup not available during init');
      return;
    }

    super.init();

    // Check initial login state
    this.checkLoginState();

    // Listen for auth state changes
    this.subscribeToAuthUpdates();
  }

  checkLoginState() {
    // Check multiple ways to detect login state
    const hasCustomerObject = !!window.customer;
    const hasCustomerClass = document.body.classList.contains('customer-logged-in');
    const popupExists = !!document.querySelector('user-menu-popup');

    // Use popup existence as primary indicator since it's only rendered for logged in users
    // If popup exists in DOM, user must be logged in (Liquid template logic)
    this.isLoggedIn = popupExists || hasCustomerObject || hasCustomerClass;

    // IMPORTANT: If popup element exists, user is definitely logged in
    // because Liquid template only renders it when customer object exists
    if (popupExists && !this.isLoggedIn) {
      this.isLoggedIn = true;
    }

    if (this.isLoggedIn && window.customer) {
      this.customerData = window.customer;
      this.cache = this.customerData;
      this.cacheTimestamp = Date.now();
    }
  }

  subscribeToAuthUpdates() {
    // Listen for login/logout events
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS === 'object') {
      const authUnsubscriber = subscribe(PUB_SUB_EVENTS.customerUpdate || 'customer-update', (event) => {
        this.handleAuthUpdate(event);
      });

      this.eventUnsubscribers.push(authUnsubscriber);
    }
  }

  handleAuthUpdate(event) {
    const wasLoggedIn = this.isLoggedIn;
    this.checkLoginState();

    // If login state changed, update popup content
    if (wasLoggedIn !== this.isLoggedIn) {
      this.invalidateCache();
      this.scheduleBackgroundDOMUpdate({ data: this.customerData });
    }
  }

  // Data management methods
  async fetchFreshData() {
    // For user menu, we typically don't need to fetch fresh data
    // as customer info is relatively static and provided by Shopify
    return this.customerData || null;
  }

  generateDataHash(data) {
    if (!data) return 'logged-out';

    // Generate hash based on customer data that might change
    const hashData = {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      isLoggedIn: this.isLoggedIn
    };

    return JSON.stringify(hashData);
  }

  needsStructuralDOMUpdate(data) {
    // User menu is static - no structural updates needed
    return false;
  }

  async performBackgroundStructuralUpdate(data) {
    // User menu is static - no structural updates needed
    // Just update dynamic content (user name, email)
    this.updateDynamicContent(data);
  }

  updateDynamicContent(data) {
    // Update dynamic user information
    if (!this.isLoggedIn || !data) {
      return;
    }

    // Update user name display
    const nameElement = this.querySelector('.user-menu-popup__user-name');
    if (nameElement && data.first_name) {
      nameElement.textContent = data.first_name;
    }

    // Update email display
    const emailElement = this.querySelector('.user-menu-popup__user-email');
    if (emailElement && data.email) {
      emailElement.textContent = data.email;
    }

    // Update any other dynamic content
    this.updateMenuItemStates();
  }

  updateMenuItemStates() {
    // Update menu item states based on current context
    const menuItems = this.querySelectorAll('.user-menu-popup__item');

    menuItems.forEach(item => {
      const link = item.querySelector('a');
      if (!link) return;

      // Add active state for current page
      if (link.href === window.location.href) {
        item.classList.add('user-menu-popup__item--active');
      } else {
        item.classList.remove('user-menu-popup__item--active');
      }
    });
  }

  attachEventListeners() {
    // Attach click handlers for menu items
    const menuItems = this.querySelectorAll('.user-menu-popup__item a');

    menuItems.forEach(link => {
      link.addEventListener('click', (event) => {
        // Close popup when menu item is clicked
        this.hide();

        // Allow default navigation to proceed
        // Add any additional tracking or logic here if needed
      });
    });

    // Attach logout handler if present
    const logoutButton = this.querySelector('.user-menu-popup__logout');
    if (logoutButton) {
      logoutButton.addEventListener('click', (event) => {
        event.preventDefault();
        this.handleLogout();
      });
    }
  }

  handleLogout() {
    // Handle logout process
    this.hide();

    // Redirect to logout URL or trigger logout process
    const logoutUrl = this.querySelector('.user-menu-popup__logout')?.href || '/account/logout';
    window.location.href = logoutUrl;
  }

  // Override show method to add user-specific logic
  show() {
    // Re-check login state in case it changed
    if (!this.isLoggedIn) {
      this.checkLoginState();
    }

    // Don't show popup if not logged in - maintain default link behavior
    if (!this.isLoggedIn) {
      // Let the default link behavior handle navigation to login page
      return;
    }

    super.show();
  }


}

// Define custom element with dependency check
function initUserMenuPopup() {
  if (!window.BaseHoverPopup) {
    setTimeout(initUserMenuPopup, 100);
    return;
  }

  if (!customElements.get('user-menu-popup')) {
    customElements.define('user-menu-popup', UserMenuPopup);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUserMenuPopup);
} else {
  initUserMenuPopup();
}
