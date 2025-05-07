document.addEventListener('DOMContentLoaded', function() {
  // Initialize country/province selectors on page load using Shopify's built-in functionality
  // Wait for the DOM to be fully loaded
  setTimeout(() => {
    setupCountryProvinceSelectors();
  }, 100);

  // Tab functionality
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');

  tabLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();

      // Remove active class from all tabs
      tabLinks.forEach(tab => tab.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');

      // Update URL hash
      window.history.replaceState(null, null, '#' + tabId);
    });
  });

  // Check URL hash on page load
  const hash = window.location.hash.substring(1);
  if (hash) {
    const activeTab = document.querySelector(`.tab-link[data-tab="${hash}"]`);
    if (activeTab) {
      activeTab.click();
    }
  }

  // Form submissions are now handled by Shopify's native form handling

  // Handle delete account button
  const deleteAccountBtn = document.getElementById('DeleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', function() {
      const deleteConfirmMsg = document.querySelector('[data-delete-account-confirm]')?.getAttribute('data-delete-account-confirm') || 'Are you sure you want to delete your account? This action cannot be undone.';
      if (confirm(deleteConfirmMsg)) {
        // Here you would typically send the request to the server
        // For now, just show an alert
        const deleteSuccessMsg = document.querySelector('[data-delete-account-success]')?.getAttribute('data-delete-account-success') || 'Account deletion request submitted.';
        alert(deleteSuccessMsg);
      }
    });
  }

  // Modal functionality for other modals if needed in the future
  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => closeModal(modal));
  }

  // Close modal when clicking on overlay or close button
  document.querySelectorAll('.modal-overlay, .modal-close, .modal-cancel').forEach(element => {
    element.addEventListener('click', function() {
      closeAllModals();
    });
  });

  // Prevent clicks inside modal container from closing the modal
  document.querySelectorAll('.modal-container').forEach(container => {
    container.addEventListener('click', function(e) {
      e.stopPropagation();
    });
  });

  // Address functionality
  const addAddressTemplate = document.getElementById('AddAddressFormTemplate');

  // Check if address sections are empty and show add form automatically
  const billingAddressCards = document.getElementById('billing-address-cards');
  const deliveryAddressCards = document.getElementById('delivery-address-cards');
  const billingAddressEmpty = billingAddressCards && billingAddressCards.children.length === 0;
  const deliveryAddressEmpty = deliveryAddressCards && deliveryAddressCards.children.length === 0;

  function handleAddAddressClick(targetContainer) {
    // Check if add form already exists
    const existingAddForm = document.getElementById('NewAddressForm');
    if (existingAddForm) {
      // Form already visible, just scroll to it
      existingAddForm.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    // Create a new address form card
    const addressFormCard = document.createElement('div');
    addressFormCard.className = 'address-form-card';
    addressFormCard.id = 'NewAddressForm';

    // Clone template content into the card
    const templateContent = addAddressTemplate.content.cloneNode(true);
    addressFormCard.appendChild(templateContent);

    // Find the target address cards container and append the form
    const addressCardsContainer = targetContainer || document.querySelector('.address-cards');
    addressCardsContainer.appendChild(addressFormCard);

    // Wait a moment for the DOM to update before initializing selectors
    setTimeout(() => {
      // Initialize country/province selectors using Shopify's built-in functionality
      setupCountryProvinceSelectors();
    }, 50);

    // Set default country if available
    const countrySelect = addressFormCard.querySelector('select[data-address-country-select]');
    if (countrySelect && countrySelect.options.length > 0) {
      // Set to first country in the list
      countrySelect.selectedIndex = 0;
      // Trigger change event to load provinces
      const event = new Event('change');
      countrySelect.dispatchEvent(event);
    }

    // Add form submission handler
    const form = addressFormCard.querySelector('form');
    form.addEventListener('submit', handleFormSubmit);

    // Add validation listeners to form fields
    addFormValidationListeners(addressFormCard);

    // Add cancel button handler
    const cancelButton = addressFormCard.querySelector('.modal-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', function() {
        // Remove the form card
        addressFormCard.remove();
      });
    }

    // Scroll to the form
    addressFormCard.scrollIntoView({ behavior: 'smooth' });
  }

  // Add address button handlers are also handled by event delegation
  document.addEventListener('click', function(e) {
    // Handle add billing address button click
    if (e.target.closest('#AddBillingAddress')) {
      const container = document.getElementById('billing-address-cards');
      handleAddAddressClick(container);
    }

    // Handle add delivery address button click
    if (e.target.closest('#AddDeliveryAddress')) {
      const container = document.getElementById('delivery-address-cards');
      handleAddAddressClick(container);
    }

    // Handle modal cancel button click
    if (e.target.closest('.modal-cancel')) {
      const addressFormCard = e.target.closest('.address-form-card');
      if (addressFormCard) {
        addressFormCard.remove();
      }
    }
  });

  // Automatically show add form for empty address sections
  // We use setTimeout to ensure the DOM is fully loaded
  setTimeout(() => {
    // Check if billing address section is empty
    if (billingAddressEmpty) {
      const container = document.getElementById('billing-address-cards');
      handleAddAddressClick(container);
    }
    // If billing address has form showing and delivery is empty, don't show another form
    else if (deliveryAddressEmpty && !document.getElementById('NewAddressForm')) {
      const container = document.getElementById('delivery-address-cards');
      handleAddAddressClick(container);
    }
  }, 100);

  // Use event delegation for edit and delete buttons

  // Add event listener to the address cards container for edit buttons
  document.addEventListener('click', function(e) {
    // Handle edit button clicks
    if (e.target.closest('.btn-edit')) {
      const button = e.target.closest('.btn-edit');
      const addressId = button.getAttribute('data-address-id');
      const addressWrapper = document.querySelector(`.address-wrapper[data-address-id="${addressId}"]`);
      const addressCard = addressWrapper.querySelector('.address-card');
      const editForm = addressWrapper.querySelector('.address-edit-form');

      if (addressCard && editForm) {
        // Toggle visibility
        addressCard.style.display = 'none';
        editForm.style.display = 'block';

        // Wait a moment for the DOM to update before initializing selectors
        setTimeout(() => {
          // Initialize country/province selectors using Shopify's built-in functionality
          setupCountryProvinceSelectors();
        }, 50);

        // Add form submission handler
        const form = editForm.querySelector('form');
        if (form && !form.hasAttribute('data-handler-attached')) {
          form.addEventListener('submit', handleFormSubmit);
          form.setAttribute('data-handler-attached', 'true');

          // Add validation listeners to form fields
          addFormValidationListeners(editForm);
        }
      }
    }

    // Handle cancel button clicks
    if (e.target.closest('.cancel-edit')) {
      const button = e.target.closest('.cancel-edit');
      const addressId = button.getAttribute('data-address-id');
      const addressWrapper = document.querySelector(`.address-wrapper[data-address-id="${addressId}"]`);
      const addressCard = addressWrapper.querySelector('.address-card');
      const editForm = addressWrapper.querySelector('.address-edit-form');

      if (addressCard && editForm) {
        // Hide form and show card
        editForm.style.display = 'none';
        addressCard.style.display = 'block';
      }
    }

    // Handle delete button clicks
    if (e.target.closest('.btn-delete')) {
      e.preventDefault();
      const button = e.target.closest('.btn-delete');
      const addressId = button.getAttribute('data-address-id');
      const addressWrapper = document.querySelector(`.address-wrapper[data-address-id="${addressId}"]`);

      // For newly added addresses that don't have a real ID yet, just remove the card
      if (addressId.startsWith('new_')) {
        if (addressWrapper) addressWrapper.remove();
        return;
      }

      // Show loading state on the button
      button.classList.add('loading');
      const spinner = button.querySelector('.btn-spinner');
      if (spinner) {
        spinner.style.display = 'inline-block';
      }

      // Instead of using fetch, we'll use the form directly but prevent navigation
      // Set the form data and action
      const accountAddressesUrl = '/account/addresses';
      const formAction = `${accountAddressesUrl}/${addressId}`;

      // Create a form data object with the necessary fields
      const formData = new FormData();
      formData.append('_method', 'delete');
      formData.append('form_type', 'customer_address');
      formData.append('utf8', '✓');

      // Use XMLHttpRequest instead of fetch to avoid redirect issues
      const xhr = new XMLHttpRequest();
      xhr.open('POST', formAction, true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      xhr.onload = function() {
        // Status 200 or 302 (redirect) are both considered successful
        if (xhr.status >= 200 && xhr.status < 400) {
          // Remove the address card from the DOM
          if (addressWrapper) {
            addressWrapper.remove();
          }
        } else {
          console.error('Error:', xhr.statusText);
          const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
          alert(errorMsg);
        }

        // Remove loading state
        button.classList.remove('loading');
        const spinner = button.querySelector('.btn-spinner');
        if (spinner) {
          spinner.style.display = 'none';
        }
      };

      xhr.onerror = function() {
        console.error('Request error');
        const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
        alert(errorMsg);
        button.classList.remove('loading');
        const spinner = button.querySelector('.btn-spinner');
        if (spinner) {
          spinner.style.display = 'none';
        }
      };

      // Send the request
      xhr.send(formData);
    }
  });

  // Set default address functionality is handled by direct links

  // Form submission handler
  function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const formCard = form.closest('.address-form-card, .address-edit-form');
    const addressId = form.querySelector('[name="address[id]"]')?.value;

    console.log('Form submission started:', {
      formId: form.id,
      formAction: form.action,
      formMethod: form.method,
      formCardId: formCard ? formCard.id : 'null',
      addressId: addressId
    });

    // Log form data for debugging
    console.log('Form data:');
    for (const pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    // Custom validation
    let isValid = true;

    // First name validation
    const firstNameInput = form.querySelector('input[name="address[first_name]"]');
    if (firstNameInput && firstNameInput.value.length < 2) {
      const firstNameError = 'First name should contain at least 2 characters';
      firstNameInput.setCustomValidity(firstNameError);
      isValid = false;
    } else if (firstNameInput) {
      firstNameInput.setCustomValidity('');
    }

    // Last name validation
    const lastNameInput = form.querySelector('input[name="address[last_name]"]');
    if (lastNameInput && lastNameInput.value.length < 2) {
      const lastNameError = 'Last name should contain at least 2 characters';
      lastNameInput.setCustomValidity(lastNameError);
      isValid = false;
    } else if (lastNameInput) {
      lastNameInput.setCustomValidity('');
    }

    // Phone validation (if provided)
    const phoneInput = form.querySelector('input[name="address[phone]"]');
    if (phoneInput && phoneInput.value && !/^[0-9\+\-\s]{7,}$/.test(phoneInput.value)) {
      phoneInput.setCustomValidity('Phone number should contain at least 7 digits');
      isValid = false;
    } else if (phoneInput) {
      phoneInput.setCustomValidity('');
    }

    // Address validation
    const addressInput = form.querySelector('input[name="address[address1]"]');
    if (addressInput && addressInput.value.length < 5) {
      addressInput.setCustomValidity('Address should be at least 5 characters long');
      isValid = false;
    } else if (addressInput) {
      addressInput.setCustomValidity('');
    }

    // City validation
    const cityInput = form.querySelector('input[name="address[city]"]');
    if (cityInput && cityInput.value.length < 2) {
      const cityError = document.querySelector('[data-city-error]')?.getAttribute('data-city-error') || 'City name should contain at least 2 characters';
      cityInput.setCustomValidity(cityError);
      isValid = false;
    } else if (cityInput) {
      cityInput.setCustomValidity('');
    }

    // ZIP/Postal code validation
    const zipInput = form.querySelector('input[name="address[zip]"]');
    if (zipInput && !/^[0-9A-Za-z\s\-]{3,10}$/.test(zipInput.value)) {
      zipInput.setCustomValidity('Postal/ZIP code should be 3-10 characters');
      isValid = false;
    } else if (zipInput) {
      zipInput.setCustomValidity('');
    }

    // Validate form
    if (!isValid || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Show loading state
    if (submitButton) {
      submitButton.classList.add('loading');
      const spinner = submitButton.querySelector('.btn-spinner');
      if (spinner) {
        spinner.style.display = 'inline-block';
      }
    }

    // For edit forms, find the address card
    const addressWrapper = form.closest('.address-wrapper');
    const addressCard = addressWrapper ? addressWrapper.querySelector('.address-card') : null;

    // Check if this is a newly added address (ID starts with 'new_')
    const isNewlyAddedAddress = addressId && addressId.startsWith('new_');

    // Extract form data for creating/updating address card
    const addressData = {};
    const formFields = [
      'first_name', 'last_name', 'company', 'address1', 'address2',
      'city', 'country', 'province', 'zip', 'phone'
    ];

    formFields.forEach(field => {
      const input = form.querySelector(`[name="address[${field}]"]`);
      addressData[field] = input ? input.value : '';
    });

    // For newly added addresses that are being edited, we need to handle the form submission differently
    if (isNewlyAddedAddress && formCard && formCard.id.startsWith('EditAddress_')) {
      console.log('Handling edit for newly added address');

      // Update the address card content
      if (addressCard) {
        updateAddressCardContent(addressCard, addressData);
      }

      // Hide the form and show the updated card
      formCard.style.display = 'none';
      if (addressCard) {
        addressCard.style.display = 'block';
      }

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className = 'success-message';
      const successMessageText = document.querySelector('[data-address-update-success]')?.getAttribute('data-address-update-success') || 'Address updated successfully';
      successMessage.textContent = successMessageText;

      // Show success message temporarily
      const addressSection = form.closest('.address-section');
      if (addressSection) {
        const existingMessage = addressSection.querySelector('.success-message');
        if (existingMessage) {
          existingMessage.remove();
        }
        addressSection.prepend(successMessage);
        setTimeout(() => {
          successMessage.remove();
        }, 3000);
      }

      // Remove loading state
      if (submitButton) {
        submitButton.classList.remove('loading');
        const spinner = submitButton.querySelector('.btn-spinner');
        if (spinner) {
          spinner.style.display = 'none';
        }
      }

      return; // Exit early, no need to submit to server
    }

    // For regular forms, submit to server
    console.log('Submitting form to:', form.action, 'with method:', form.method || 'POST');

    // Determine if this is a billing or delivery address
    const isBillingAddress = form.closest('#billing-address-cards') !== null ||
                           formCard?.closest('#billing-address-cards') !== null;

    // For normal forms, use the standard fetch approach
    fetch(form.action, {
      method: form.method || 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        redirected: response.redirected,
        url: response.url
      });
      // Remove loading state regardless of response status
      if (submitButton) {
        submitButton.classList.remove('loading');
        const spinner = submitButton.querySelector('.btn-spinner');
        if (spinner) {
          spinner.style.display = 'none';
        }
      }

      if (response.ok) {
        console.log('Form submission successful');
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        // Get the success message from a data attribute in the DOM
        const successMessageText = document.querySelector('[data-address-update-success]')?.getAttribute('data-address-update-success') || 'Address updated successfully';
        successMessage.textContent = successMessageText;

        // If this is a new address form, create a new address card
        if (formCard && formCard.id === 'NewAddressForm') {
          // Create a new address wrapper
          const newAddressWrapper = document.createElement('div');
          newAddressWrapper.className = 'address-wrapper';
          newAddressWrapper.setAttribute('data-address-id', addressId || ('new_' + Date.now()));

          // Create the address card HTML
          const cardHtml = createAddressCardHtml(addressData, addressId || ('new_' + Date.now()));
          newAddressWrapper.innerHTML = cardHtml;

          // Add the new address card to the appropriate container
          const container = isBillingAddress ?
            document.getElementById('billing-address-cards') :
            document.getElementById('delivery-address-cards');

          if (container) {
            container.appendChild(newAddressWrapper);
            // Remove the form
            formCard.remove();

            // Add event listeners to the new buttons
            addButtonEventListeners(newAddressWrapper);
          }
        }
        // If this is an edit form, update the existing card
        else if (addressCard && formCard) {
          // Update the address card content
          updateAddressCardContent(addressCard, addressData);

          // Hide the form and show the updated card
          formCard.style.display = 'none';
          addressCard.style.display = 'block';
        }

        // Show success message temporarily
        const addressSection = form.closest('.address-section');
        if (addressSection) {
          const existingMessage = addressSection.querySelector('.success-message');
          if (existingMessage) {
            existingMessage.remove();
          }
          addressSection.prepend(successMessage);
          setTimeout(() => {
            successMessage.remove();
          }, 3000);
        }
      } else {
        console.error('Form submission failed with status:', response.status);
        throw new Error(`Form submission failed with status: ${response.status}`);
      }
    })
    .catch(error => {
      console.error('Error during form submission:', error);
      console.error('Error stack:', error.stack);
      console.error('Form details:', {
        action: form.action,
        method: form.method,
        id: form.id,
        className: form.className
      });
      const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
      alert(errorMsg);
      if (submitButton) {
        submitButton.classList.remove('loading');
        const spinner = submitButton.querySelector('.btn-spinner');
        if (spinner) {
          spinner.style.display = 'none';
        }
      }
    });
  }

  // Country/province selectors using Shopify's built-in functionality
  function setupCountryProvinceSelectors() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      try {
        // Check if the elements exist before initializing
        const countryElement = document.getElementById('AddressCountryNew');
        const provinceElement = document.getElementById('AddressProvinceNew');
        const containerElement = document.getElementById('AddressProvinceContainerNew');

        if (countryElement && provinceElement) {
          console.log('Initializing new address form selector:', {
            countryElement: countryElement.id,
            provinceElement: provinceElement.id,
            containerElement: containerElement ? containerElement.id : 'null'
          });

          // Add change event listener to log provinces
          countryElement.addEventListener('change', function() {
            console.log('Country changed to:', this.value);
            console.log('Province element:', provinceElement);

            // Log the provinces after a short delay to allow them to be populated
            setTimeout(() => {
              const provinces = Array.from(provinceElement.options).map(option => ({
                value: option.value,
                text: option.text
              }));
              console.log('Provinces for', this.value, ':', provinces);
              console.log('Province container visibility:', containerElement ? containerElement.style.display : 'N/A');
            }, 100);
          });

          // Initialize the new address form
          new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
            hideElement: containerElement ? 'AddressProvinceContainerNew' : null,
          });
        } else {
          console.warn('New address form elements not found:', {
            countryElement: countryElement ? countryElement.id : 'null',
            provinceElement: provinceElement ? provinceElement.id : 'null',
            containerElement: containerElement ? containerElement.id : 'null'
          });
        }
      } catch (e) {
        console.warn('Error initializing new address form selector:', e);
      }

      // Initialize existing address forms
      const countrySelects = document.querySelectorAll('[data-address-country-select]');
      console.log('Found country selects:', countrySelects.length);

      countrySelects.forEach((select) => {
        try {
          if (select.id === 'AddressCountryNew') return; // Skip the new form as it's already initialized

          console.log('Processing country select:', select.id);
          const formId = select.id.match(/EditAddress_(\d+)_Country/);
          if (formId && formId[1]) {
            const addressId = formId[1];
            const provinceId = `EditAddress_${addressId}_Province`;
            const containerId = `EditAddress_${addressId}_ProvinceContainer`;

            // Check if the province element exists
            const provinceElement = document.getElementById(provinceId);
            const containerElement = document.getElementById(containerId);

            console.log('Edit form elements:', {
              addressId,
              provinceElement: provinceElement ? provinceElement.id : 'null',
              containerElement: containerElement ? containerElement.id : 'null'
            });

            if (provinceElement) {
              // Add change event listener to log provinces
              select.addEventListener('change', function() {
                console.log('Country changed to:', this.value, 'for address ID:', addressId);

                // Log the provinces after a short delay to allow them to be populated
                setTimeout(() => {
                  const provinces = Array.from(provinceElement.options).map(option => ({
                    value: option.value,
                    text: option.text
                  }));
                  console.log('Provinces for', this.value, 'in address', addressId, ':', provinces);
                  console.log('Province container visibility:', containerElement ? containerElement.style.display : 'N/A');
                }, 100);
              });

              new Shopify.CountryProvinceSelector(
                select.id,
                provinceId,
                {
                  hideElement: containerElement ? containerId : null,
                }
              );
            } else {
              console.warn('Province element not found for address ID:', addressId);
            }
          } else {
            console.warn('Could not extract address ID from select ID:', select.id);
          }
        } catch (e) {
          console.warn('Error initializing country selector:', e, select.id);
        }
      });
    } else {
      console.warn('Shopify.CountryProvinceSelector is not available');
    }
  }

  // Add real-time validation to form fields
  function addFormValidationListeners(formContainer) {
    if (!formContainer) return;

    // First name validation
    const firstNameInput = formContainer.querySelector('input[name="address[first_name]"]');
    if (firstNameInput) {
      firstNameInput.addEventListener('input', function() {
        if (this.value.length < 2) {
          const firstNameError = 'First name should contain at least 2 characters';
          this.setCustomValidity(firstNameError);
        } else {
          this.setCustomValidity('');
        }
      });
    }

    // Last name validation
    const lastNameInput = formContainer.querySelector('input[name="address[last_name]"]');
    if (lastNameInput) {
      lastNameInput.addEventListener('input', function() {
        if (this.value.length < 2) {
          const lastNameError = 'Last name should contain at least 2 characters';
          this.setCustomValidity(lastNameError);
        } else {
          this.setCustomValidity('');
        }
      });
    }

    // Phone validation
    const phoneInput = formContainer.querySelector('input[name="address[phone]"]');
    if (phoneInput) {
      phoneInput.addEventListener('input', function() {
        if (this.value && !/^[0-9\+\-\s]{7,}$/.test(this.value)) {
          this.setCustomValidity('Phone number should contain at least 7 digits');
        } else {
          this.setCustomValidity('');
        }
      });
    }

    // Address validation
    const addressInput = formContainer.querySelector('input[name="address[address1]"]');
    if (addressInput) {
      addressInput.addEventListener('input', function() {
        if (this.value.length < 5) {
          this.setCustomValidity('Address should be at least 5 characters long');
        } else {
          this.setCustomValidity('');
        }
      });
    }

    // City validation
    const cityInput = formContainer.querySelector('input[name="address[city]"]');
    if (cityInput) {
      cityInput.addEventListener('input', function() {
        if (this.value.length < 2) {
          const cityError = document.querySelector('[data-city-error]')?.getAttribute('data-city-error') || 'City name should contain at least 2 characters';
          this.setCustomValidity(cityError);
        } else {
          this.setCustomValidity('');
        }
      });
    }

    // ZIP/Postal code validation
    const zipInput = formContainer.querySelector('input[name="address[zip]"]');
    if (zipInput) {
      zipInput.addEventListener('input', function() {
        if (!/^[0-9A-Za-z\s\-]{3,10}$/.test(this.value)) {
          this.setCustomValidity('Postal/ZIP code should be 3-10 characters');
        } else {
          this.setCustomValidity('');
        }
      });
    }
  }

  // Add validation to all existing forms
  document.querySelectorAll('.address-form-card, .address-edit-form').forEach(form => {
    addFormValidationListeners(form);
  });

  // Helper function to create HTML for a new address card
  function createAddressCardHtml(addressData, addressId) {
    const fullName = `${addressData.first_name} ${addressData.last_name}`.trim();
    const addressSummary = addressData.address1 ?
      `${addressData.address1}${addressData.city ? ', ' + addressData.city : ''}` :
      (addressData.city || 'N/A');

    return `
      <div class="address-card">
        <h3 class="address-card-title">
          ${addressData.company ? addressData.company + ',' : fullName ? fullName + ',' : 'N/A,'}
        </h3>
        <p class="address-card-summary">${addressSummary}</p>

        <div class="address-divider"></div>

        <div class="address-details">
          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-name-label]')?.getAttribute('data-name-label') || 'Name'}</span>
            <span class="field-value">${fullName || 'N/A'}</span>
          </div>

          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-email-label]')?.getAttribute('data-email-label') || 'Email'}</span>
            <span class="field-value">${document.querySelector('[data-customer-email]')?.getAttribute('data-customer-email') || 'N/A'}</span>
          </div>

          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-phone-label]')?.getAttribute('data-phone-label') || 'Phone'}</span>
            <span class="field-value">${addressData.phone || 'N/A'}</span>
          </div>

          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-address1-label]')?.getAttribute('data-address1-label') || 'Address'}</span>
            <span class="field-value">${addressData.address1 || 'N/A'}</span>
          </div>

          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-city-label]')?.getAttribute('data-city-label') || 'City'}</span>
            <span class="field-value">${addressData.city || 'N/A'}</span>
          </div>

          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-zip-label]')?.getAttribute('data-zip-label') || 'ZIP/Postal Code'}</span>
            <span class="field-value">${addressData.zip || 'N/A'}</span>
          </div>

          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-country-label]')?.getAttribute('data-country-label') || 'Country'}</span>
            <span class="field-value">${addressData.country || 'N/A'}</span>
          </div>

          <div class="address-field">
            <span class="field-label">${document.querySelector('[data-company-label]')?.getAttribute('data-company-label') || 'Company'}</span>
            <span class="field-value">${addressData.company || 'N/A'}</span>
          </div>

          <!-- Company ID and Tax ID fields removed -->
        </div>

        <div class="address-actions">
          <button
            type="button"
            class="button btn-edit"
            aria-controls="EditAddress_${addressId}"
            aria-expanded="false"
            data-address-id="${addressId}"
          >
            <span class="svg-wrapper">
              ${document.querySelector('[data-edit-icon]')?.innerHTML || '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 11.5V14H4.5L11.8733 6.62667L9.37333 4.12667L2 11.5ZM13.8067 4.69333C14.0667 4.43333 14.0667 4.01333 13.8067 3.75333L12.2467 2.19333C11.9867 1.93333 11.5667 1.93333 11.3067 2.19333L10.0867 3.41333L12.5867 5.91333L13.8067 4.69333Z" fill="currentColor"/></svg>'}
            </span>
            ${document.querySelector('[data-edit-label]')?.getAttribute('data-edit-label') || 'Edit'}
          </button>

          <button
            type="button"
            class="button button--tertiary btn-delete"
            data-address-id="${addressId}"
          >
            <span class="svg-wrapper">
              ${document.querySelector('[data-delete-icon]')?.innerHTML || '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4.66667 12.6667C4.66667 13.4 5.26667 14 6 14H10C10.7333 14 11.3333 13.4 11.3333 12.6667V4.66667H4.66667V12.6667ZM12 2.66667H9.66667L9 2H7L6.33333 2.66667H4V4H12V2.66667Z" fill="currentColor"/></svg>'}
            </span>
            <span class="btn-spinner"></span>
          </button>
        </div>
      </div>

      <div class="address-edit-form" id="EditAddress_${addressId}" style="display: none;">
        <form class="address-form" data-address-form method="post" action="/account/addresses">
          <input type="hidden" name="form_type" value="customer_address">
          <input type="hidden" name="utf8" value="✓">
          <input type="hidden" name="address[id]" value="${addressId}">

          <div class="address-form">
            <div class="form-row">
              <div class="form-group">
                <div class="field">
                  <input
                    type="text"
                    id="EditAddress_${addressId}_FirstName"
                    name="address[first_name]"
                    class="field__input"
                    value="${addressData.first_name || ''}"
                    placeholder=" "
                    required
                    minlength="2"
                    title="First name should contain at least 2 characters"
                  >
                  <label class="field__label" for="EditAddress_${addressId}_FirstName">
                    ${document.querySelector('[data-name-label]')?.getAttribute('data-name-label')?.split(' ')[0] || 'First Name'}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <div class="field">
                  <input
                    type="text"
                    id="EditAddress_${addressId}_LastName"
                    name="address[last_name]"
                    class="field__input"
                    value="${addressData.last_name || ''}"
                    placeholder=" "
                    required
                    minlength="2"
                    title="Last name should contain at least 2 characters"
                  >
                  <label class="field__label" for="EditAddress_${addressId}_LastName">
                    ${document.querySelector('[data-name-label]')?.getAttribute('data-name-label')?.split(' ')[1] || 'Last Name'}
                  </label>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <div class="field">
                  <input
                    type="text"
                    id="EditAddress_${addressId}_Company"
                    name="address[company]"
                    class="field__input"
                    value="${addressData.company || ''}"
                    placeholder=" "
                  >
                  <label class="field__label" for="EditAddress_${addressId}_Company">
                    ${document.querySelector('[data-company-label]')?.getAttribute('data-company-label') || 'Company'}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <div class="field">
                  <input
                    type="tel"
                    id="EditAddress_${addressId}_Phone"
                    name="address[phone]"
                    class="field__input"
                    value="${addressData.phone || ''}"
                    placeholder=" "
                    pattern="[0-9\\+\\-\\s]{7,}"
                    title="Phone number should contain at least 7 digits"
                  >
                  <label class="field__label" for="EditAddress_${addressId}_Phone">
                    ${document.querySelector('[data-phone-label]')?.getAttribute('data-phone-label') || 'Phone'}
                  </label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <div class="field">
                <input
                  type="text"
                  id="EditAddress_${addressId}_Address1"
                  name="address[address1]"
                  class="field__input"
                  value="${addressData.address1 || ''}"
                  placeholder=" "
                  required
                  minlength="5"
                  title="Address should be at least 5 characters long"
                >
                <label class="field__label" for="EditAddress_${addressId}_Address1">
                  ${document.querySelector('[data-address1-label]')?.getAttribute('data-address1-label') || 'Address'}
                </label>
              </div>
            </div>

            <div class="form-group">
              <div class="field">
                <input
                  type="text"
                  id="EditAddress_${addressId}_Address2"
                  name="address[address2]"
                  class="field__input"
                  value="${addressData.address2 || ''}"
                  placeholder=" "
                >
                <label class="field__label" for="EditAddress_${addressId}_Address2">
                  Address 2
                </label>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <div class="field">
                  <input
                    type="text"
                    id="EditAddress_${addressId}_City"
                    name="address[city]"
                    class="field__input"
                    value="${addressData.city || ''}"
                    placeholder=" "
                    required
                    minlength="2"
                    title="City name should contain at least 2 characters"
                  >
                  <label class="field__label" for="EditAddress_${addressId}_City">
                    ${document.querySelector('[data-city-label]')?.getAttribute('data-city-label') || 'City'}
                  </label>
                </div>
              </div>

              <div class="form-group">
                <div class="field">
                  <input
                    type="text"
                    id="EditAddress_${addressId}_Zip"
                    name="address[zip]"
                    class="field__input"
                    value="${addressData.zip || ''}"
                    placeholder=" "
                    required
                    pattern="[0-9A-Za-z\\s\\-]{3,10}"
                    title="Postal/ZIP code should be 3-10 characters"
                  >
                  <label class="field__label" for="EditAddress_${addressId}_Zip">
                    ${document.querySelector('[data-zip-label]')?.getAttribute('data-zip-label') || 'Postal/ZIP code'}
                  </label>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="EditAddress_${addressId}_Country">${document.querySelector('[data-country-label]')?.getAttribute('data-country-label') || 'Country'}</label>
                <div class="select-wrapper">
                  <select
                    id="EditAddress_${addressId}_Country"
                    name="address[country]"
                    data-address-country-select
                    data-default="${addressData.country || ''}"
                  >
                    ${document.getElementById('AddressCountryNew')?.innerHTML || ''}
                  </select>
                </div>
              </div>

              <div class="form-group" id="EditAddress_${addressId}_ProvinceContainer" style="display:none;">
                <label for="EditAddress_${addressId}_Province">Province</label>
                <div class="select-wrapper">
                  <select
                    id="EditAddress_${addressId}_Province"
                    name="address[province]"
                    data-default="${addressData.province || ''}"
                  ></select>
                </div>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="button btn">
                <span class="btn-text">Update</span>
                <span class="btn-spinner"></span>
              </button>
              <button type="button" class="button button--tertiary cancel-edit" data-address-id="${addressId}">
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    `;
  }

  // Helper function to update an existing address card content
  function updateAddressCardContent(addressCard, addressData) {
    const fullName = `${addressData.first_name} ${addressData.last_name}`.trim();
    const addressSummary = addressData.address1 ?
      `${addressData.address1}${addressData.city ? ', ' + addressData.city : ''}` :
      (addressData.city || 'N/A');

    // Update title and summary
    const titleElement = addressCard.querySelector('.address-card-title');
    if (titleElement) {
      titleElement.textContent = addressData.company ?
        `${addressData.company},` :
        fullName ? `${fullName},` : 'N/A,';
    }

    const summaryElement = addressCard.querySelector('.address-card-summary');
    if (summaryElement) {
      summaryElement.textContent = addressSummary;
    }

    // Update field values
    const nameValue = addressCard.querySelector('.address-field:nth-child(1) .field-value');
    if (nameValue) nameValue.textContent = fullName || 'N/A';

    const phoneValue = addressCard.querySelector('.address-field:nth-child(3) .field-value');
    if (phoneValue) phoneValue.textContent = addressData.phone || 'N/A';

    const address1Value = addressCard.querySelector('.address-field:nth-child(4) .field-value');
    if (address1Value) address1Value.textContent = addressData.address1 || 'N/A';

    const cityValue = addressCard.querySelector('.address-field:nth-child(5) .field-value');
    if (cityValue) cityValue.textContent = addressData.city || 'N/A';

    const zipValue = addressCard.querySelector('.address-field:nth-child(6) .field-value');
    if (zipValue) zipValue.textContent = addressData.zip || 'N/A';

    const countryValue = addressCard.querySelector('.address-field:nth-child(7) .field-value');
    if (countryValue) countryValue.textContent = addressData.country || 'N/A';

    const companyValue = addressCard.querySelector('.address-field:nth-child(8) .field-value');
    if (companyValue) companyValue.textContent = addressData.company || 'N/A';

    // Company ID and Tax ID fields removed
  }

  // Order details expand/collapse functionality
  function initializeOrderToggle() {
    const orderToggles = document.querySelectorAll('[data-order-toggle]');

    // Add click event to the toggle buttons
    orderToggles.forEach(toggle => {
      toggle.addEventListener('click', function() {
        const orderItem = this.closest('.order-item');
        const orderDetails = orderItem.querySelector('.order-details');

        // Toggle the active class on the details section and toggle button
        orderDetails.classList.toggle('active');
        this.classList.toggle('active');
      });
    });
  }

  // Initialize order toggle functionality
  initializeOrderToggle();

  // Helper function to add event listeners to buttons in a new address card
  function addButtonEventListeners(addressWrapper) {
    // Add edit button event listener
    const editButton = addressWrapper.querySelector('.btn-edit');
    if (editButton) {
      editButton.addEventListener('click', function() {
        // We don't need the addressId variable here, but we keep the attribute for consistency
        const addressCard = addressWrapper.querySelector('.address-card');
        const editForm = addressWrapper.querySelector('.address-edit-form');

        if (addressCard && editForm) {
          // Toggle visibility
          addressCard.style.display = 'none';
          editForm.style.display = 'block';

          // Wait a moment for the DOM to update before initializing selectors
          setTimeout(() => {
            // Initialize country/province selectors using Shopify's built-in functionality
            setupCountryProvinceSelectors();
          }, 50);

          // Add form submission handler
          const form = editForm.querySelector('form');
          if (form && !form.hasAttribute('data-handler-attached')) {
            form.addEventListener('submit', handleFormSubmit);
            form.setAttribute('data-handler-attached', 'true');

            // Add validation listeners to form fields
            addFormValidationListeners(editForm);
          }
        }
      });
    }

    // Add delete button event listener
    const deleteButton = addressWrapper.querySelector('.btn-delete');
    if (deleteButton) {
      deleteButton.addEventListener('click', function(e) {
        e.preventDefault();
        const addressId = this.getAttribute('data-address-id');

        // For newly added addresses that don't have a real ID yet, just remove the card
        if (addressId.startsWith('new_')) {
          const wrapper = this.closest('.address-wrapper');
          if (wrapper) wrapper.remove();
          return;
        }

        // Otherwise use the same delete logic as other addresses
        this.classList.add('loading');
        const spinner = this.querySelector('.btn-spinner');
        if (spinner) {
          spinner.style.display = 'inline-block';
        }

        const accountAddressesUrl = '/account/addresses';
        const formAction = `${accountAddressesUrl}/${addressId}`;

        const formData = new FormData();
        formData.append('_method', 'delete');
        formData.append('form_type', 'customer_address');
        formData.append('utf8', '✓');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', formAction, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 400) {
            const wrapper = this.closest('.address-wrapper');
            if (wrapper) wrapper.remove();
          } else {
            console.error('Error:', xhr.statusText);
            const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
            alert(errorMsg);
          }
          this.classList.remove('loading');
          const spinner = this.querySelector('.btn-spinner');
          if (spinner) {
            spinner.style.display = 'none';
          }
        };

        xhr.onerror = () => {
          console.error('Request error');
          const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
          alert(errorMsg);
          this.classList.remove('loading');
          const spinner = this.querySelector('.btn-spinner');
          if (spinner) {
            spinner.style.display = 'none';
          }
        };

        xhr.send(formData);
      });
    }

    // Add cancel button event listener for the edit form
    const cancelButton = addressWrapper.querySelector('.cancel-edit');
    if (cancelButton) {
      cancelButton.addEventListener('click', function() {
        // We don't need the addressId variable here, but we keep the attribute for consistency
        const addressCard = addressWrapper.querySelector('.address-card');
        const editForm = addressWrapper.querySelector('.address-edit-form');

        if (addressCard && editForm) {
          // Hide form and show card
          editForm.style.display = 'none';
          addressCard.style.display = 'block';
        }
      });
    }
  }

  // We're now using Shopify's built-in CountryProvinceSelector
});
