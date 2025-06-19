/**
 * Account mobile menu functionality
 */
class AccountMobileMenu {
  constructor() {
    this.mobileMenu = document.getElementById('account-mobile-menu');
    this.mobileMenuButton = document.getElementById('account-mobile-menu-button');
    this.mobileMenuButtonText = this.mobileMenuButton ? this.mobileMenuButton.querySelector('.button-text') : null;
    this.mobileMenuCloseButton = document.querySelector('[data-account-mobile-menu-close]');
    this.mobileMenuOverlay = document.querySelector('.account-mobile-menu__overlay');
    this.mobileMenuTabs = document.querySelectorAll('[data-account-mobile-menu-tab]');
    this.accountTabs = document.querySelectorAll('.tab-link[data-tab]');

    if (!this.mobileMenu || !this.mobileMenuButton) return;

    this.init();
  }

  init() {
    // Open mobile menu
    this.mobileMenuButton.addEventListener('click', this.openMobileMenu.bind(this));

    // Close mobile menu
    this.mobileMenuCloseButton.addEventListener('click', this.closeMobileMenu.bind(this));
    this.mobileMenuOverlay.addEventListener('click', this.closeMobileMenu.bind(this));

    // Handle tab clicks in mobile menu
    this.mobileMenuTabs.forEach(tab => {
      tab.addEventListener('click', this.handleMobileTabClick.bind(this));
    });

    // Listen for tab changes from the main tabs
    this.accountTabs.forEach(tab => {
      tab.addEventListener('click', this.updateButtonText.bind(this));
    });

    // Close menu on escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });

    // Set initial button text based on active tab
    this.updateButtonText();
  }

  openMobileMenu() {
    this.mobileMenu.classList.add('active');
    document.body.classList.add('overflow-hidden');

    // Add animation classes
    setTimeout(() => {
      this.mobileMenu.classList.add('animate-in');
    }, 10);
  }

  closeMobileMenu() {
    this.mobileMenu.classList.remove('animate-in');

    // Wait for animation to complete before removing active class
    setTimeout(() => {
      this.mobileMenu.classList.remove('active');
      document.body.classList.remove('overflow-hidden');
    }, 300); // Match this with the CSS transition duration
  }

  handleMobileTabClick(event) {
    const tab = event.currentTarget;
    const tabId = tab.getAttribute('data-tab');

    // Special handling for addresses tab - let it navigate to the addresses page
    if (tabId === 'addresses') {
      // Don't prevent default, let it navigate normally
      this.closeMobileMenu();
      return;
    }

    // For external links (no data-tab), let default navigation happen
    if (!tabId) {
      this.closeMobileMenu();
      return;
    }

    // Check if we need to navigate to a different page
    const correspondingTab = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
    const isAddressesPage = window.location.pathname.includes('/account/addresses');
    
    if (isAddressesPage && correspondingTab) {
      // On addresses page, navigate to the account page with hash
      this.closeMobileMenu();
      const targetUrl = correspondingTab.getAttribute('href');
      if (targetUrl) {
        window.location.href = targetUrl;
      }
      return;
    }

    // For internal tab switching on main account page
    event.preventDefault();

    // Click the corresponding tab first to trigger content change
    if (correspondingTab) {
      correspondingTab.click();
    }

    // Update mobile menu active states after desktop tab has been clicked
    // Use a small delay to ensure the desktop tab click has processed
    setTimeout(() => {
      this.syncMobileMenuWithDesktop();
    }, 10);

    // Update the button text
    this.updateButtonText();

    // Close the mobile menu
    this.closeMobileMenu();
  }

  updateButtonText() {
    // Find the active tab
    const activeTab = document.querySelector('.tab-link.active');

    // Check if we're on the addresses page
    const isAddressesPage = window.location.pathname.includes('/account/addresses');

    if (this.mobileMenuButton) {
      let activeTabText = '';

      if (isAddressesPage) {
        // If we're on the addresses page, use the addresses text
        activeTabText = document.querySelector('.tab-link[href*="addresses"]')?.textContent.trim() ||
                        document.querySelector('.button-text')?.textContent.trim() ||
                        (window.theme?.strings?.addresses || 'Addresses');
      } else if (activeTab) {
        // Get the text content of the active tab
        activeTabText = activeTab.textContent.trim();

        // If the active tab has a bonus pill, remove it from the button text
        const bonusPill = activeTab.querySelector('.bonus-pill');
        if (bonusPill) {
          // Create a temporary element to get the text without the bonus pill
          const tempElement = document.createElement('div');
          tempElement.innerHTML = activeTab.innerHTML;
          const bonusPillInTemp = tempElement.querySelector('.bonus-pill');
          if (bonusPillInTemp) {
            bonusPillInTemp.remove();
          }
          activeTabText = tempElement.textContent.trim();
        }
      } else {
        // Fallback to the current button text or default
        activeTabText = this.mobileMenuButtonText?.textContent.trim() || (window.theme?.strings?.menu || 'Menu');
      }

      // Update the button text
      if (this.mobileMenuButtonText) {
        this.mobileMenuButtonText.textContent = activeTabText;
      } else {
        // If there's no specific text element, update the entire button
        this.mobileMenuButton.textContent = activeTabText;

        // Re-add the icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'svg-wrapper';
        iconSpan.innerHTML = document.querySelector('template[data-icon-caret]')?.innerHTML || '';
        this.mobileMenuButton.appendChild(iconSpan);
      }
    }
  }

  updateMobileActiveStates(activeTabId) {
    // Remove active class from all mobile menu tabs
    this.mobileMenuTabs.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to the specified tab
    const activeTab = document.querySelector(`.account-mobile-menu__tab-link[data-tab="${activeTabId}"]`);
    if (activeTab) {
      activeTab.classList.add('active');
    }
  }

  syncMobileMenuWithDesktop() {
    // Find the currently active desktop tab
    const activeDesktopTab = document.querySelector('.tab-link.active[data-tab]');
    if (activeDesktopTab) {
      const tabId = activeDesktopTab.getAttribute('data-tab');
      this.updateMobileActiveStates(tabId);
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccountMobileMenu();
});
