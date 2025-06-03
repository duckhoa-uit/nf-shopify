const selectors = {
  customerAddresses: '[data-customer-addresses]',
  addressCountrySelect: '[data-address-country-select]',
  addressContainer: '[data-address]',
  toggleAddressButton: 'button[aria-expanded]',
  cancelAddressButton: 'button[type="reset"]',
  deleteAddressButton: 'button[data-confirm-message]',
  addAddressButton: '#AddAddress',
  newAddressForm: '#AddressNewForm',
  editAddressForm: '.address-edit-form',
  addressCard: '.address-card'
};

const attributes = {
  expanded: 'aria-expanded',
  confirmMessage: 'data-confirm-message',
  addressId: 'data-address-id',
  formId: 'data-form-id',
  target: 'data-target'
};

class CustomerAddresses {
  constructor() {
    try {
      this.elements = this._getElements();

      if (!this.elements || Object.keys(this.elements).length === 0) {
        return;
      }

      // Initialize functionality
      this._setupCountries();
      this._setupEventListeners();
    } catch (error) {
      console.error('Error in CustomerAddresses constructor:', error);
    }
  }

  _getElements() {
    const container = document.querySelector(selectors.customerAddresses);
    return container
      ? {
          container,
          addressContainers: container.querySelectorAll(selectors.addressContainer),
          toggleButtons: container.querySelectorAll(selectors.toggleAddressButton),
          cancelButtons: container.querySelectorAll(selectors.cancelAddressButton),
          deleteButtons: container.querySelectorAll(selectors.deleteAddressButton),
          countrySelects: container.querySelectorAll(selectors.addressCountrySelect),
          addAddressButton: container.querySelector(selectors.addAddressButton),
          newAddressForm: container.querySelector(selectors.newAddressForm),
          editAddressForms: container.querySelectorAll(selectors.editAddressForm),
          addressCards: container.querySelectorAll(selectors.addressCard)
        }
      : {};
  }

  _setupCountries() {
    if (Shopify && Shopify.CountryProvinceSelector) {
      try {
        // Check if the new address form elements exist
        const countryNewElement = document.getElementById('AddressCountryNew');
        const provinceNewElement = document.getElementById('AddressProvinceNew');
        const containerNewElement = document.getElementById('AddressProvinceContainerNew');

        if (countryNewElement && provinceNewElement) {
          // eslint-disable-next-line no-new
          new Shopify.CountryProvinceSelector('AddressCountryNew', 'AddressProvinceNew', {
            hideElement: containerNewElement ? 'AddressProvinceContainerNew' : null,
          });
        }

        // Setup country/province selectors for edit address forms
        if (this.elements.countrySelects && this.elements.countrySelects.length > 0) {
          this.elements.countrySelects.forEach((select) => {
            try {
              const formId = select.getAttribute('data-form-id') || select.dataset.formId;
              if (!formId) {
                return;
              }

              const countryId = `AddressCountry_${formId}`;
              const provinceId = `AddressProvince_${formId}`;
              const containerId = `AddressProvinceContainer_${formId}`;

              const provinceElement = document.getElementById(provinceId);
              const containerElement = document.getElementById(containerId);

              if (provinceElement) {
                // eslint-disable-next-line no-new
                new Shopify.CountryProvinceSelector(countryId, provinceId, {
                  hideElement: containerElement ? containerId : null,
                });
              }
            } catch (error) {
              console.error('Error initializing country selector:', error);
            }
          });
        }
      } catch (error) {
        console.error('Error in _setupCountries:', error);
      }
    } else {
      console.warn('Shopify.CountryProvinceSelector is not available');
    }
  }

  _setupEventListeners() {
    try {
      // Toggle buttons (show/hide forms)
      if (this.elements.toggleButtons && this.elements.toggleButtons.length > 0) {
        this.elements.toggleButtons.forEach((element) => {
          element.addEventListener('click', this._handleAddEditButtonClick);
        });
      }

      // Cancel buttons
      if (this.elements.cancelButtons && this.elements.cancelButtons.length > 0) {
        this.elements.cancelButtons.forEach((element) => {
          element.addEventListener('click', this._handleCancelButtonClick);
        });
      }

      // Delete buttons
      if (this.elements.deleteButtons && this.elements.deleteButtons.length > 0) {
        this.elements.deleteButtons.forEach((element) => {
          element.addEventListener('click', this._handleDeleteButtonClick);
        });
      }
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  }

  _toggleExpanded(target) {
    const currentState = target.getAttribute(attributes.expanded) === 'true';
    target.setAttribute(attributes.expanded, (!currentState).toString());

    // Find the form or address container that needs to be toggled
    const container = target.closest(selectors.addressContainer);
    if (container) {
      const form = container.querySelector(selectors.editAddressForm);
      const addressCard = container.querySelector(selectors.addressCard);

      if (form && addressCard) {
        if (!currentState) {
          // Expanding - show form, hide card
          form.style.display = 'block';
          addressCard.style.display = 'none';
        } else {
          // Collapsing - hide form, show card
          form.style.display = 'none';
          addressCard.style.display = 'block';
        }
      }
    } else if (target === this.elements.addAddressButton && this.elements.newAddressForm) {
      // We'll let address-form-handler.js handle this
      // No need to do anything here as address-form-handler.js will handle it
    }
  }

  _handleAddEditButtonClick = ({ currentTarget }) => {
    this._toggleExpanded(currentTarget);
  };

  _handleCancelButtonClick = ({ currentTarget }) => {
    // Check if this is in an address container
    const addressContainer = currentTarget.closest(selectors.addressContainer);
    if (addressContainer) {
      const toggleButton = addressContainer.querySelector(`[${attributes.expanded}]`);
      if (toggleButton) {
        this._toggleExpanded(toggleButton);
      }
    }
    // Check if this is the new address form
    else if (currentTarget.closest(selectors.newAddressForm)) {
      if (this.elements.addAddressButton) {
        this._toggleExpanded(this.elements.addAddressButton);

        // Reset the form
        const form = currentTarget.closest('form');
        if (form) {
          form.reset();
        }
      }
    }
  };

  _handleDeleteButtonClick = ({ currentTarget }) => {
    const confirmMessage = currentTarget.getAttribute(attributes.confirmMessage) ||
                          document.querySelector('[data-delete-confirm]')?.textContent ||
                          'Are you sure you want to delete this address?';

    if (confirm(confirmMessage)) {
      // Show loading state
      currentTarget.classList.add('loading');
      const spinner = currentTarget.querySelector('.btn-spinner');
      if (spinner) {
        spinner.style.display = 'inline-block';
      }

      // Get the target URL
      const target = currentTarget.getAttribute(attributes.target) || currentTarget.dataset.target;

      if (target) {
        Shopify.postLink(target, {
          parameters: { _method: 'delete' },
        });
      } else {
        console.error('No target URL found for delete button');

        // Remove loading state
        currentTarget.classList.remove('loading');
        if (spinner) {
          spinner.style.display = 'none';
        }
      }
    }
  };
}

// Wait for Shopify to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
  // Check if we're on the addresses page
  const isAddressesPage = window.location.pathname.includes('/account/addresses') ||
                          document.querySelector('[data-customer-addresses]') !== null;

  // Remove any unwanted hashes from the URL if present
  if (window.location.hash === '#login' || window.location.hash === '#addresses') {
    window.history.replaceState(null, null, window.location.pathname);
  }

  if (!isAddressesPage) {
    return;
  }

  // Function to initialize when Shopify is ready
  const initializeWhenReady = () => {
    try {
      // Check if Shopify and CountryProvinceSelector are available
      if (typeof Shopify === 'undefined' || typeof Shopify.CountryProvinceSelector === 'undefined') {
        setTimeout(initializeWhenReady, 100);
        return;
      }

      // Initialize CustomerAddresses
      window.customerAddresses = new CustomerAddresses();
    } catch (error) {
      console.error('Error initializing CustomerAddresses:', error);
    }
  };

  // Start the initialization process
  initializeWhenReady();
});