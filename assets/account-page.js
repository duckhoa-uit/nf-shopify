document.addEventListener('DOMContentLoaded', function() {
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

  // Handle form submissions
  const customerInfoForm = document.getElementById('CustomerInfoForm');
  if (customerInfoForm) {
    customerInfoForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // Here you would typically send the form data to the server
      // For now, just show an alert
      const successMsg = document.querySelector('[data-info-update-success]')?.getAttribute('data-info-update-success') || 'Basic information updated successfully!';
      alert(successMsg);
    });
  }

  const customerPasswordForm = document.getElementById('CustomerPasswordForm');
  if (customerPasswordForm) {
    customerPasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      // Validate password match
      const newPassword = document.getElementById('CustomerNewPassword').value;
      const confirmPassword = document.getElementById('CustomerConfirmPassword').value;

      if (newPassword !== confirmPassword) {
        const passwordMismatchMsg = document.querySelector('[data-password-mismatch]')?.getAttribute('data-password-mismatch') || 'New password and confirmation do not match!';
        alert(passwordMismatchMsg);
        return;
      }

      // Here you would typically send the form data to the server
      // For now, just show an alert
      const passwordUpdateSuccessMsg = document.querySelector('[data-password-update-success]')?.getAttribute('data-password-update-success') || 'Password updated successfully!';
      alert(passwordUpdateSuccessMsg);
    });
  }

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

  // Add address functionality
  const addAddressButtons = [
    document.getElementById('AddBillingAddress'),
    document.getElementById('AddDeliveryAddress')
  ];
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

    // Set form title
    const formTitle = document.createElement('h3');
    formTitle.className = 'address-form-title';
    const addAddressTitle = document.querySelector('[data-add-address-title]')?.getAttribute('data-add-address-title') || 'Add a New Address';
    formTitle.textContent = addAddressTitle;
    addressFormCard.appendChild(formTitle);

    // Clone template content into the card
    const templateContent = addAddressTemplate.content.cloneNode(true);
    addressFormCard.appendChild(templateContent);

    // Find the target address cards container and append the form
    const addressCardsContainer = targetContainer || document.querySelector('.address-cards');
    addressCardsContainer.appendChild(addressFormCard);

    // Initialize country/province selectors
    initializeCountryProvinceSelectors();

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

  if (addAddressTemplate) {
    // Billing Address Add button
    if (addAddressButtons[0]) {
      addAddressButtons[0].addEventListener('click', function() {
        // Use the billing address cards container
        const container = document.getElementById('billing-address-cards');
        handleAddAddressClick(container);
      });
    }

    // Delivery Address Add button
    if (addAddressButtons[1]) {
      addAddressButtons[1].addEventListener('click', function() {
        // Use the delivery address cards container
        const container = document.getElementById('delivery-address-cards');
        handleAddAddressClick(container);
      });
    }

    // Automatically show add form for empty address sections
    // We use setTimeout to ensure the DOM is fully loaded
    setTimeout(() => {
      // Check if billing address section is empty
      if (billingAddressEmpty) {
        handleAddAddressClick(billingAddressCards);
      }
      // If billing address has form showing and delivery is empty, don't show another form
      else if (deliveryAddressEmpty && !document.getElementById('NewAddressForm')) {
        handleAddAddressClick(deliveryAddressCards);
      }
    }, 100);
  }

  // Edit address functionality
  const editButtons = document.querySelectorAll('.btn-edit');

  editButtons.forEach(button => {
    button.addEventListener('click', function() {
      const addressId = this.getAttribute('data-address-id');
      const addressWrapper = document.querySelector(`.address-wrapper[data-address-id="${addressId}"]`);
      const addressCard = addressWrapper.querySelector('.address-card');
      const editForm = addressWrapper.querySelector('.address-edit-form');

      if (addressCard && editForm) {
        // Toggle visibility
        addressCard.style.display = 'none';
        editForm.style.display = 'block';

        // Initialize country/province selectors
        initializeCountryProvinceSelectors();

        // Add form submission handler
        const form = editForm.querySelector('form');
        if (form && !form.hasAttribute('data-handler-attached')) {
          form.addEventListener('submit', handleFormSubmit);
          form.setAttribute('data-handler-attached', 'true');

          // Add validation listeners to form fields
          addFormValidationListeners(editForm);
        }

        // Add cancel button handler
        const cancelButton = editForm.querySelector('.cancel-edit');
        if (cancelButton && !cancelButton.hasAttribute('data-handler-attached')) {
          cancelButton.addEventListener('click', function() {
            // Hide form and show card
            editForm.style.display = 'none';
            addressCard.style.display = 'block';
          });
          cancelButton.setAttribute('data-handler-attached', 'true');
        }
      }
    });
  });

  // Delete address functionality
  const deleteButtons = document.querySelectorAll('.btn-delete');

  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const addressId = this.getAttribute('data-address-id');
      const addressWrapper = document.querySelector(`.address-wrapper[data-address-id="${addressId}"]`);

      // Show loading state on the button
      this.classList.add('loading');

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
      };

      xhr.onerror = function() {
        console.error('Request error');
        const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
        alert(errorMsg);
        button.classList.remove('loading');
      };

      // Send the request
      xhr.send(formData);
    });
  });

  // Set default address functionality is handled by direct links

  // Form submission handler
  function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const formCard = form.closest('.address-form-card, .address-edit-form');

    // Custom validation
    let isValid = true;

    // First name validation
    const firstNameInput = form.querySelector('input[name="address[first_name]"]');
    if (firstNameInput && !/^[A-Za-z\s]{2,}$/.test(firstNameInput.value)) {
      const firstNameError = document.querySelector('[data-firstname-error]')?.getAttribute('data-firstname-error') || 'First name should contain at least 2 letters';
      firstNameInput.setCustomValidity(firstNameError);
      isValid = false;
    } else if (firstNameInput) {
      firstNameInput.setCustomValidity('');
    }

    // Last name validation
    const lastNameInput = form.querySelector('input[name="address[last_name]"]');
    if (lastNameInput && !/^[A-Za-z\s]{2,}$/.test(lastNameInput.value)) {
      const lastNameError = document.querySelector('[data-lastname-error]')?.getAttribute('data-lastname-error') || 'Last name should contain at least 2 letters';
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
    if (cityInput && !/^[A-Za-z\s\-]{2,}$/.test(cityInput.value)) {
      cityInput.setCustomValidity('City name should contain at least 2 letters');
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
    }

    // For edit forms, find the address card
    const addressWrapper = form.closest('.address-wrapper');
    const addressCard = addressWrapper ? addressWrapper.querySelector('.address-card') : null;

    // Submit form
    fetch(form.action, {
      method: form.method || 'POST',
      body: formData,
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => {
      if (response.ok) {
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        // Get the success message from a data attribute in the DOM
        const successMessageText = document.querySelector('[data-address-update-success]')?.getAttribute('data-address-update-success') || 'Address updated successfully';
        successMessage.textContent = successMessageText;

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

        // Get the address ID (for edit) or generate a temporary one (for new)
        const addressId = form.querySelector('[name="address[id]"]')?.value ||
                         ('new_' + Date.now());

        // Determine if this is a billing or delivery address
        const isBillingAddress = form.closest('#billing-address-cards') !== null ||
                               formCard?.closest('#billing-address-cards') !== null;

        // If this is a new address form, create a new address card
        if (formCard && formCard.id === 'NewAddressForm') {
          // Create a new address wrapper
          const newAddressWrapper = document.createElement('div');
          newAddressWrapper.className = 'address-wrapper';
          newAddressWrapper.setAttribute('data-address-id', addressId);

          // Create the address card HTML
          const cardHtml = createAddressCardHtml(addressData, addressId);
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
        throw new Error('Form submission failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
      alert(errorMsg);
      if (submitButton) {
        submitButton.classList.remove('loading');
      }
    });
  }

  // Country/province selectors
  function initializeCountryProvinceSelectors() {
    const countrySelects = document.querySelectorAll('[data-address-country-select]');

    countrySelects.forEach(select => {
      // Handle both formats: AddressCountry_new and EditAddress_123_Country
      let formId;
      if (select.id.includes('_Country')) {
        // For edit forms: EditAddress_123_Country -> EditAddress_123_
        formId = select.id.substring(0, select.id.lastIndexOf('_') + 1);
      } else {
        // For new forms: AddressCountry_new -> Address_new
        formId = select.id.replace('Country', '');
      }

      const provinceSelect = document.getElementById(`${formId}Province`);
      const provinceContainer = document.getElementById(`${formId}ProvinceContainer`);

      if (provinceSelect && provinceContainer) {
        // Set the country to the default value if specified
        const defaultCountry = select.getAttribute('data-default');
        if (defaultCountry) {
          select.value = defaultCountry;
        }

        // Initialize provinces for the current country
        initializeProvinceSelector(select, provinceSelect, provinceContainer);

        // Update provinces when country changes
        select.addEventListener('change', function() {
          initializeProvinceSelector(select, provinceSelect, provinceContainer);
        });
      }
    });
  }

  function initializeProvinceSelector(countrySelect, provinceSelect, provinceContainer) {
    const selectedCountry = countrySelect.value;

    // Get provinces for the selected country
    const provinces = getProvinces(selectedCountry);

    if (provinces.length > 0) {
      // Clear existing options
      provinceSelect.innerHTML = '';

      // Add new options
      provinces.forEach(province => {
        const option = document.createElement('option');
        option.value = province.code;
        option.textContent = province.name;
        provinceSelect.appendChild(option);
      });

      // Set the province to the default value if specified
      const defaultProvince = provinceSelect.getAttribute('data-default');
      if (defaultProvince) {
        provinceSelect.value = defaultProvince;
      }

      // Show the province selector
      provinceContainer.style.display = 'block';
    } else {
      // Hide the province selector if no provinces
      provinceContainer.style.display = 'none';
    }
  }

  // Add real-time validation to form fields
  function addFormValidationListeners(formContainer) {
    if (!formContainer) return;

    // First name validation
    const firstNameInput = formContainer.querySelector('input[name="address[first_name]"]');
    if (firstNameInput) {
      firstNameInput.addEventListener('input', function() {
        if (!/^[A-Za-z\s]{2,}$/.test(this.value)) {
          const firstNameError = document.querySelector('[data-firstname-error]')?.getAttribute('data-firstname-error') || 'First name should contain at least 2 letters';
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
        if (!/^[A-Za-z\s]{2,}$/.test(this.value)) {
          const lastNameError = document.querySelector('[data-lastname-error]')?.getAttribute('data-lastname-error') || 'Last name should contain at least 2 letters';
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
        if (!/^[A-Za-z\s\-]{2,}$/.test(this.value)) {
          this.setCustomValidity('City name should contain at least 2 letters');
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
        <!-- Edit form will be added dynamically when needed -->
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
        // Since this is a new address, we need to reload the page to get the edit form
        // This is a limitation since we can't generate the full edit form with proper Shopify bindings
        window.location.href = window.location.pathname + window.location.hash;
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
        };

        xhr.onerror = () => {
          console.error('Request error');
          const errorMsg = document.querySelector('[data-form-error]')?.getAttribute('data-form-error') || 'There was an error processing your request. Please try again.';
          alert(errorMsg);
          this.classList.remove('loading');
        };

        xhr.send(formData);
      });
    }
  }

  function getProvinces(country) {
    // This is a real implementation with common provinces/states
    const provinces = {
      'US': [
        { code: 'AL', name: 'Alabama' },
        { code: 'AK', name: 'Alaska' },
        { code: 'AZ', name: 'Arizona' },
        { code: 'AR', name: 'Arkansas' },
        { code: 'CA', name: 'California' },
        { code: 'CO', name: 'Colorado' },
        { code: 'CT', name: 'Connecticut' },
        { code: 'DE', name: 'Delaware' },
        { code: 'DC', name: 'District of Columbia' },
        { code: 'FL', name: 'Florida' },
        { code: 'GA', name: 'Georgia' },
        { code: 'HI', name: 'Hawaii' },
        { code: 'ID', name: 'Idaho' },
        { code: 'IL', name: 'Illinois' },
        { code: 'IN', name: 'Indiana' },
        { code: 'IA', name: 'Iowa' },
        { code: 'KS', name: 'Kansas' },
        { code: 'KY', name: 'Kentucky' },
        { code: 'LA', name: 'Louisiana' },
        { code: 'ME', name: 'Maine' },
        { code: 'MD', name: 'Maryland' },
        { code: 'MA', name: 'Massachusetts' },
        { code: 'MI', name: 'Michigan' },
        { code: 'MN', name: 'Minnesota' },
        { code: 'MS', name: 'Mississippi' },
        { code: 'MO', name: 'Missouri' },
        { code: 'MT', name: 'Montana' },
        { code: 'NE', name: 'Nebraska' },
        { code: 'NV', name: 'Nevada' },
        { code: 'NH', name: 'New Hampshire' },
        { code: 'NJ', name: 'New Jersey' },
        { code: 'NM', name: 'New Mexico' },
        { code: 'NY', name: 'New York' },
        { code: 'NC', name: 'North Carolina' },
        { code: 'ND', name: 'North Dakota' },
        { code: 'OH', name: 'Ohio' },
        { code: 'OK', name: 'Oklahoma' },
        { code: 'OR', name: 'Oregon' },
        { code: 'PA', name: 'Pennsylvania' },
        { code: 'RI', name: 'Rhode Island' },
        { code: 'SC', name: 'South Carolina' },
        { code: 'SD', name: 'South Dakota' },
        { code: 'TN', name: 'Tennessee' },
        { code: 'TX', name: 'Texas' },
        { code: 'UT', name: 'Utah' },
        { code: 'VT', name: 'Vermont' },
        { code: 'VA', name: 'Virginia' },
        { code: 'WA', name: 'Washington' },
        { code: 'WV', name: 'West Virginia' },
        { code: 'WI', name: 'Wisconsin' },
        { code: 'WY', name: 'Wyoming' }
      ],
      'CA': [
        { code: 'AB', name: 'Alberta' },
        { code: 'BC', name: 'British Columbia' },
        { code: 'MB', name: 'Manitoba' },
        { code: 'NB', name: 'New Brunswick' },
        { code: 'NL', name: 'Newfoundland and Labrador' },
        { code: 'NT', name: 'Northwest Territories' },
        { code: 'NS', name: 'Nova Scotia' },
        { code: 'NU', name: 'Nunavut' },
        { code: 'ON', name: 'Ontario' },
        { code: 'PE', name: 'Prince Edward Island' },
        { code: 'QC', name: 'Quebec' },
        { code: 'SK', name: 'Saskatchewan' },
        { code: 'YT', name: 'Yukon' }
      ],
      'GB': [
        { code: 'ENG', name: 'England' },
        { code: 'NIR', name: 'Northern Ireland' },
        { code: 'SCT', name: 'Scotland' },
        { code: 'WLS', name: 'Wales' }
      ],
      'AU': [
        { code: 'ACT', name: 'Australian Capital Territory' },
        { code: 'NSW', name: 'New South Wales' },
        { code: 'NT', name: 'Northern Territory' },
        { code: 'QLD', name: 'Queensland' },
        { code: 'SA', name: 'South Australia' },
        { code: 'TAS', name: 'Tasmania' },
        { code: 'VIC', name: 'Victoria' },
        { code: 'WA', name: 'Western Australia' }
      ]
    };

    return provinces[country] || [];
  }
});
