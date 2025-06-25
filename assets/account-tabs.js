/**
 * Account tabs functionality
 */
class AccountTabs {
  constructor() {
    this.tabLinks = document.querySelectorAll('.tab-link');
    this.tabContents = document.querySelectorAll('.tab-content');
    this.init();
  }

  init() {
    // Set up tab switching
    this.tabLinks.forEach(link => {
      link.addEventListener('click', this.handleTabClick.bind(this));
    });

    // Check URL hash on page load
    this.checkUrlHash();
  }

  handleTabClick(e) {
    const link = e.currentTarget;
    const tabId = link.getAttribute('data-tab');

    // Check if this is an external link (no data-tab attribute)
    if (!tabId) {
      // This is an external link, let the default navigation happen
      return;
    }

    // Skip addresses tab as it should navigate to a separate page
    if (tabId === 'addresses') {
      // Let the default navigation happen
      return;
    }

    // Check if we're on the addresses page and trying to navigate to another tab
    const isAddressesPage = window.location.pathname.includes('/account/addresses');
    const tabContent = document.getElementById(tabId);

    if (isAddressesPage && !tabContent) {
      // We're on addresses page and the target tab content doesn't exist
      // Let the default navigation happen (href should point to account page with hash)
      return;
    }

    // This is a tab link on the main account page, prevent default navigation
    e.preventDefault();

    // Remove active class from all tabs
    this.tabLinks.forEach(tab => tab.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab
    link.classList.add('active');

    // Find the tab content and make it active
    if (tabContent) {
      tabContent.classList.add('active');
    }

    // Update URL hash
    window.history.replaceState(null, null, '#' + tabId);
  }

  checkUrlHash() {
    const hash = window.location.hash.substring(1);
    const isAddressesPage = window.location.pathname.includes('/account/addresses');

    if (hash) {
      const activeTab = document.querySelector(`.tab-link[data-tab="${hash}"]`);
      const tabContent = document.getElementById(hash);

      // If we're on addresses page and trying to access a hash that doesn't have content
      if (isAddressesPage && hash !== 'addresses' && !tabContent) {
        // Get the account URL from data attribute or construct it
        const accountUrlElement = document.querySelector('[data-account-url]');
        const accountUrl = accountUrlElement ?
          accountUrlElement.textContent.trim() :
          this.getAccountUrl();

        // Redirect to main account page with the hash
        window.location.href = `${accountUrl}#${hash}`;
        return;
      }

      if (activeTab) {
        // Only trigger click if it's a tab link (has data-tab attribute)
        if (activeTab.getAttribute('data-tab')) {
          activeTab.click();
        }
      }
    } else {
      // If no hash, default to first tab (only on main account page)
      if (!isAddressesPage) {
        const firstTab = document.querySelector('.tab-link[data-tab]');
        if (firstTab) {
          firstTab.click();
        }
      }
    }
  }

  // Helper method to construct account URL with language prefix
  getAccountUrl() {
    const currentPath = window.location.pathname;
    // Extract language prefix if it exists (e.g., /de/account/addresses -> /de)
    const languageMatch = currentPath.match(/^\/([a-z]{2})\/account/);
    return languageMatch ? `/${languageMatch[1]}/account` : '/account';
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccountTabs();
});
