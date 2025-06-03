/**
 * Account addresses redirect functionality
 *
 * This script handles the redirection from the account page to the addresses page
 * when the addresses tab link is clicked.
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on the account page
  if (window.location.pathname.includes('/account') && !window.location.pathname.includes('/addresses')) {
    // Find the addresses tab link
    const addressesTabLink = document.querySelector('a[href*="/account/addresses"]');

    if (addressesTabLink) {
      // Make sure it doesn't have the data-tab attribute
      if (addressesTabLink.hasAttribute('data-tab')) {
        addressesTabLink.removeAttribute('data-tab');
      }

      // Add a click event listener to prevent the default tab behavior
      addressesTabLink.addEventListener('click', function(e) {
        // Let the default navigation happen, but make sure we don't trigger any tab behavior
        // This is just a safeguard in case other scripts try to handle this click
        e.stopPropagation();
      });
    }
  }

  // Check if we need to redirect back to the account page with a specific tab
  if (window.location.pathname.includes('/account/addresses')) {
    // Add event listener to the "Back to Account" link
    const backToAccountLink = document.querySelector('a[href*="/account"]');

    if (backToAccountLink) {
      // No need to modify this behavior, it will go back to the account page
    }

    // If we're on the addresses page, we need to add a class to the addresses tab in the account page
    // This is for when the user navigates back to the account page using browser back button
    // We'll store this in sessionStorage
    sessionStorage.setItem('lastAccountTab', 'addresses');

    // Check if the URL has unwanted hashes and remove them
    if (window.location.hash === '#login' || window.location.hash === '#addresses') {
      // Replace the URL without the hash
      window.history.replaceState(null, null, window.location.pathname);
    }

    // Check if we have a return_to parameter in the URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('return_to')) {
      const returnTo = urlParams.get('return_to');

      // Check if the return_to is pointing to the current addresses page (with or without language prefix)
      const currentPath = window.location.pathname;
      if (returnTo === '/account/addresses' || returnTo === currentPath) {
        // Replace the URL without the parameter
        window.history.replaceState(null, null, window.location.pathname);
      }
    }
  }

  // Check if we need to highlight the addresses tab
  if (sessionStorage.getItem('lastAccountTab') === 'addresses') {
    // Find the addresses tab link
    const addressesTabLink = document.querySelector('a[href*="/account/addresses"]');

    if (addressesTabLink) {
      // Add active class to highlight it
      addressesTabLink.classList.add('active');

      // Clear the session storage
      sessionStorage.removeItem('lastAccountTab');
    }
  }
});
