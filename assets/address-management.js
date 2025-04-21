/**
 * Address management functionality
 */
class AddressManagement {
  constructor() {
    // Modal elements
    this.addressModal = document.getElementById('addressModal');
    this.deleteConfirmModal = document.getElementById('deleteConfirmModal');
    
    // Add address elements
    this.addAddressButtons = [
      document.getElementById('AddBillingAddress'),
      document.getElementById('AddDeliveryAddress')
    ];
    this.addAddressTemplate = document.getElementById('AddAddressFormTemplate');
    
    // Edit and delete buttons
    this.editButtons = document.querySelectorAll('.btn-edit');
    this.deleteButtons = document.querySelectorAll('.btn-delete');
    this.deleteAddressForm = document.getElementById('deleteAddressForm');
    
    this.init();
  }

  init() {
    // Set up modal functionality
    this.setupModalHandlers();
    
    // Set up add address functionality
    if (this.addAddressTemplate) {
      this.setupAddAddressHandlers();
    }
    
    // Set up edit address functionality
    this.setupEditAddressHandlers();
    
    // Set up delete address functionality
    this.setupDeleteAddressHandlers();
  }

  setupModalHandlers() {
    // Close modal when clicking on overlay or close button
    document.querySelectorAll('.modal-overlay, .modal-close, .modal-cancel').forEach(element => {
      element.addEventListener('click', () => this.closeAllModals());
    });

    // Prevent clicks inside modal container from closing the modal
    document.querySelectorAll('.modal-container').forEach(container => {
      container.addEventListener('click', e => e.stopPropagation());
    });
  }

  setupAddAddressHandlers() {
    // Billing Address Add button
    if (this.addAddressButtons[0]) {
      this.addAddressButtons[0].addEventListener('click', () => {
        // Use the billing address cards container
        const container = document.getElementById('billing-address-cards');
        this.handleAddAddressClick(container);
      });
    }

    // Delivery Address Add button
    if (this.addAddressButtons[1]) {
      this.addAddressButtons[1].addEventListener('click', () => {
        // Use the delivery address cards container
        const container = document.getElementById('delivery-address-cards');
        this.handleAddAddressClick(container);
      });
    }
  }

  setupEditAddressHandlers() {
    this.editButtons.forEach(button => {
      button.addEventListener('click', () => {
        const addressId = button.getAttribute('data-address-id');
        const addressWrapper = document.querySelector(`.address-wrapper[data-address-id="${addressId}"]`);
        const addressCard = addressWrapper.querySelector('.address-card');
        const editForm = addressWrapper.querySelector('.address-edit-form');

        if (addressCard && editForm) {
          // Toggle visibility
          addressCard.style.display = 'none';
          editForm.style.display = 'block';

          // Initialize country/province selectors
          this.initializeCountryProvinceSelectors();

          // Add form submission handler
          const form = editForm.querySelector('form');
          if (form && !form.hasAttribute('data-handler-attached')) {
            form.addEventListener('submit', this.handleFormSubmit.bind(this));
            form.setAttribute('data-handler-attached', 'true');

            // Add validation listeners to form fields
            this.addFormValidationListeners(editForm);
          }

          // Add cancel button handler
          const cancelButton = editForm.querySelector('.cancel-edit');
          if (cancelButton && !cancelButton.hasAttribute('data-handler-attached')) {
            cancelButton.addEventListener('click', () => {
              // Hide form and show card
              editForm.style.display = 'none';
              addressCard.style.display = 'block';
            });
            cancelButton.setAttribute('data-handler-attached', 'true');
          }
        }
      });
    });
  }

  setupDeleteAddressHandlers() {
    this.deleteButtons.forEach(button => {
      button.addEventListener('click', () => {
        const addressId = button.getAttribute('data-address-id');

        // Set form action
        if (this.deleteAddressForm) {
          this.deleteAddressForm.action = `/account/addresses/${addressId}`;

          // Add form submission handler
          this.deleteAddressForm.addEventListener('submit', this.handleFormSubmit.bind(this));

          // Open modal
          this.openModal(this.deleteConfirmModal);
        }
      });
    });
  }

  handleAddAddressClick(targetContainer) {
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
    formTitle.textContent = 'Add a New Address';
    addressFormCard.appendChild(formTitle);

    // Clone template content into the card
    const templateContent = this.addAddressTemplate.content.cloneNode(true);
    addressFormCard.appendChild(templateContent);

    // Find the target address cards container and append the form
    const addressCardsContainer = targetContainer || document.querySelector('.address-cards');
    addressCardsContainer.appendChild(addressFormCard);

    // Initialize country/province selectors
    this.initializeCountryProvinceSelectors();

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
    if (form) {
      form.addEventListener('submit', this.handleFormSubmit.bind(this));

      // Add validation listeners to form fields
      this.addFormValidationListeners(addressFormCard);
    }

    // Add cancel button handler
    const cancelButton = addressFormCard.querySelector('.modal-cancel');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        // Remove the form card
        addressFormCard.remove();
      });
    }

    // Scroll to the form
    addressFormCard.scrollIntoView({ behavior: 'smooth' });
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    const formCard = form.closest('.address-form-card, .address-edit-form');

    // Custom validation
    let isValid = this.validateForm(form);

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
        successMessage.textContent = 'Address updated successfully';

        // If this is a new address form, remove it
        if (formCard && formCard.id === 'NewAddressForm') {
          formCard.remove();
        }
        // If this is an edit form, hide it and show the card
        else if (addressCard && formCard) {
          formCard.style.display = 'none';
          addressCard.style.display = 'block';
        }

        // Reload the page to show updated addresses
        window.location.href = window.location.pathname + window.location.hash;
      } else {
        throw new Error('Form submission failed');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('There was an error processing your request. Please try again.');
      if (submitButton) {
        submitButton.classList.remove('loading');
      }
    });
  }

  validateForm(form) {
    let isValid = true;

    // First name validation
    const firstNameInput = form.querySelector('input[name="address[first_name]"]');
    if (firstNameInput && !/^[A-Za-z\s]{2,}$/.test(firstNameInput.value)) {
      firstNameInput.setCustomValidity('First name should contain at least 2 letters');
      isValid = false;
    } else if (firstNameInput) {
      firstNameInput.setCustomValidity('');
    }

    // Last name validation
    const lastNameInput = form.querySelector('input[name="address[last_name]"]');
    if (lastNameInput && !/^[A-Za-z\s]{2,}$/.test(lastNameInput.value)) {
      lastNameInput.setCustomValidity('Last name should contain at least 2 letters');
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

    return isValid;
  }

  addFormValidationListeners(formContainer) {
    if (!formContainer) return;

    // First name validation
    const firstNameInput = formContainer.querySelector('input[name="address[first_name]"]');
    if (firstNameInput) {
      firstNameInput.addEventListener('input', function() {
        if (!/^[A-Za-z\s]{2,}$/.test(this.value)) {
          this.setCustomValidity('First name should contain at least 2 letters');
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
          this.setCustomValidity('Last name should contain at least 2 letters');
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

  initializeCountryProvinceSelectors() {
    const countrySelects = document.querySelectorAll('[data-address-country-select]');

    countrySelects.forEach(select => {
      const formId = select.id.replace('Country', '');
      const provinceSelect = document.getElementById(`${formId}Province`);
      const provinceContainer = document.getElementById(`${formId}ProvinceContainer`);

      if (provinceSelect && provinceContainer) {
        // Set the country to the default value if specified
        const defaultCountry = select.getAttribute('data-default');
        if (defaultCountry) {
          select.value = defaultCountry;
        }

        // Initialize provinces for the current country
        this.initializeProvinceSelector(select, provinceSelect, provinceContainer);

        // Update provinces when country changes
        select.addEventListener('change', () => {
          this.initializeProvinceSelector(select, provinceSelect, provinceContainer);
        });
      }
    });
  }

  initializeProvinceSelector(countrySelect, provinceSelect, provinceContainer) {
    const selectedCountry = countrySelect.value;

    // Get provinces for the selected country
    const provinces = this.getProvinces(selectedCountry);

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

  getProvinces(country) {
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

  openModal(modal) {
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => this.closeModal(modal));
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AddressManagement();
});
