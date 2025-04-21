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
    e.preventDefault();

    // Remove active class from all tabs
    this.tabLinks.forEach(tab => tab.classList.remove('active'));
    this.tabContents.forEach(content => content.classList.remove('active'));

    // Add active class to clicked tab
    const link = e.currentTarget;
    link.classList.add('active');
    const tabId = link.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

    // Update URL hash
    window.history.replaceState(null, null, '#' + tabId);
  }

  checkUrlHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const activeTab = document.querySelector(`.tab-link[data-tab="${hash}"]`);
      if (activeTab) {
        activeTab.click();
      }
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccountTabs();
});
