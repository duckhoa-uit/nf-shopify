/**
 * Address Form Handler
 *
 * This script ensures that address forms are submitted correctly,
 * especially when the URL has a hash.
 */
document.addEventListener('DOMContentLoaded', function() {
  // Remove any #login hash from the URL if present
  if (window.location.hash === '#login') {
    window.history.replaceState(null, null, window.location.pathname);
  }

  // Check if we need to reload the page after an address update
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  if (getCookie('reload_after_address_update') === 'true') {
    // Clear the cookie
    document.cookie = 'reload_after_address_update=; path=/account/addresses; expires=Thu, 01 Jan 1970 00:00:01 GMT';

    // Show a success message
    const addressSection = document.querySelector('.address-section');
    if (addressSection) {
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      successMessage.textContent = document.querySelector('[data-address-update-success]')?.getAttribute('data-address-update-success') || 'Address updated successfully';
      addressSection.prepend(successMessage);

      // Remove the message after 3 seconds
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    }
  }

  // Find all address forms
  const addressForms = document.querySelectorAll('form.address-form');

  // Handle the "Add Address" button
  const addAddressButton = document.getElementById('AddAddress');

  if (addAddressButton) {
    // Add a direct click handler
    addAddressButton.onclick = function() {
      // Toggle the aria-expanded attribute
      const isExpanded = addAddressButton.getAttribute('aria-expanded') === 'true';
      const newExpandedState = !isExpanded;
      addAddressButton.setAttribute('aria-expanded', newExpandedState.toString());

      // Find the new address form
      const newAddressForm = document.getElementById('AddressNewForm');

      if (newAddressForm) {
        // Toggle the form visibility
        newAddressForm.style.display = newExpandedState ? 'block' : 'none';

        // Scroll to the form if it's being shown
        if (newExpandedState) {
          setTimeout(() => {
            newAddressForm.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      }

      // Return false to prevent default behavior
      return false;
    };
  }

  // Add submit handler to each form
  function addSubmitHandler(form) {
    // Skip if already processed
    if (form.hasAttribute('data-form-handler-attached')) {
      return;
    }

    // Mark as processed
    form.setAttribute('data-form-handler-attached', 'true');

    // Add submit handler
    form.addEventListener('submit', function(e) {
      // Prevent default form submission
      e.preventDefault();

      // Get form action and ensure it's correct
      let formAction = form.action || '/account/addresses';

      // If the form is for editing an address, make sure the action is correct
      if (form.closest('.address-edit-form')) {
        const addressId = form.closest('.address-wrapper')?.getAttribute('data-address-id');
        if (addressId) {
          formAction = `/account/addresses/${addressId}`;
        }
      }

      // Create a new form element
      const submitForm = document.createElement('form');
      submitForm.method = 'POST';
      submitForm.action = formAction;
      submitForm.style.display = 'none';

      // Add a return_to hidden field to redirect back to the addresses page
      const returnToInput = document.createElement('input');
      returnToInput.type = 'hidden';
      returnToInput.name = 'return_to';
      returnToInput.value = '/account/addresses';
      submitForm.appendChild(returnToInput);

      // Copy all form data
      const formData = new FormData(form);
      for (const [name, value] of formData.entries()) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        submitForm.appendChild(input);
      }

      // Add the form to the document and submit it
      document.body.appendChild(submitForm);

      // Set a cookie to reload the page after redirect
      document.cookie = 'reload_after_address_update=true; path=/account/addresses';

      // Submit the form
      submitForm.submit();
    });
  }

  // Process all existing forms
  addressForms.forEach(addSubmitHandler);

  // Also handle dynamically added forms
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            // Check if this is a form or contains forms
            let forms = node.querySelectorAll ? node.querySelectorAll('form.address-form') : [];
            if (node.tagName === 'FORM' && node.classList.contains('address-form')) {
              forms = [node];
            }

            // Add submit handler to each form
            forms.forEach(addSubmitHandler);
          }
        });
      }
    });
  });

  // Observe the entire document for changes
  observer.observe(document.body, { childList: true, subtree: true });

  // Handle cancel buttons for the new address form
  const cancelButtons = document.querySelectorAll('#AddressNewForm button[type="reset"]');
  cancelButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Find the new address form
      const newAddressForm = document.getElementById('AddressNewForm');
      if (newAddressForm) {
        // Hide the form
        newAddressForm.style.display = 'none';

        // Update the Add Address button
        const addAddressButton = document.getElementById('AddAddress');
        if (addAddressButton) {
          addAddressButton.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });
});
