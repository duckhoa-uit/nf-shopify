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

    // This is a tab link, prevent default navigation
    e.preventDefault();

    // Remove active class from all tabs
    this.tabLinks.forEach(tab => tab.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab
    link.classList.add('active');

    // Find the tab content and make it active
    const tabContent = document.getElementById(tabId);
    if (tabContent) {
      tabContent.classList.add('active');
    }

    // Update URL hash
    window.history.replaceState(null, null, '#' + tabId);
  }

  checkUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const activeTab = document.querySelector(`.tab-link[data-tab="${hash}"]`);
      if (activeTab) {
        // Only trigger click if it's a tab link (has data-tab attribute)
        if (activeTab.getAttribute('data-tab')) {
          activeTab.click();
        }
      }
    } else {
      // If no hash, default to first tab
      const firstTab = document.querySelector('.tab-link[data-tab]');
      if (firstTab) {
        firstTab.click();
      }
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccountTabs();
});
