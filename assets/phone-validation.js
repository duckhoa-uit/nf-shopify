/**
 * International Phone Input Initialization and Validation
 * Integrated with Shopify country data
 */
class PhoneInputHandler {
  constructor() {
    this.phoneInputs = document.querySelectorAll('input[data-intl-tel-input]');
    this.intlTelInputInstances = [];
    this.shopifyCountries = [];
    this.init();
  }

  cleanupExistingInstances() {
    // Clean up any existing instances to prevent memory leaks
    if (this.intlTelInputInstances && this.intlTelInputInstances.length) {
      this.intlTelInputInstances.forEach(instance => {
        if (instance && typeof instance.destroy === 'function') {
          instance.destroy();
        }
      });
      this.intlTelInputInstances = [];
    }
  }

  init() {
    // Get fresh list of phone inputs
    this.phoneInputs = document.querySelectorAll('input[data-intl-tel-input]');
    if (!this.phoneInputs.length) return;

    // Initialize each phone input
    this.phoneInputs.forEach(input => {
      if (input.classList.contains('iti-initialized')) return;

      // Get Shopify country data
      const countriesSelect = document.getElementById(`${input.id}_countries`);
      const shopCountry = input.getAttribute('data-shop-country') || 'US';

      // Build country data from Shopify's country list
      if (countriesSelect) {
        this.shopifyCountries = Array.from(countriesSelect.options).map(option => {
          return {
            name: option.getAttribute('data-name'),
            iso2: option.value,
            priority: option.value.toLowerCase() === shopCountry.toLowerCase() ? 1 : 0
          };
        });
      }

      // Determine preferred countries based on shop location
      let preferredCountries = [shopCountry.toLowerCase()];

      // Add common European countries if shop is in Europe
      const europeanCountries = ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se'];
      if (europeanCountries.includes(shopCountry.toLowerCase())) {
        // Add neighboring European countries but keep shop country first
        preferredCountries = preferredCountries.concat(
          europeanCountries.filter(c => c !== shopCountry.toLowerCase())
        );
      }

      // Initialize intl-tel-input with Shopify country data
      const iti = window.intlTelInput(input, {
        utilsScript: window.theme && window.theme.assets ? window.theme.assets.utilsScript : '/assets/intl-tel-input-utils.js',
        preferredCountries: preferredCountries,
        initialCountry: shopCountry.toLowerCase(),
        autoPlaceholder: 'aggressive',
        separateDialCode: true,
        formatOnDisplay: false, // Disable automatic formatting to handle it ourselves
        allowDropdown: !input.readOnly && !input.disabled,
        customContainer: "phone-field-container",
        // Use Shopify countries if available, otherwise use the library's default
        customPlaceholder: function(selectedCountryPlaceholder, selectedCountryData) {
          return "Phone number";
        }
      });

      this.intlTelInputInstances.push(iti);
      input.classList.add('iti-initialized');

      // Find the existing hidden input or create one if it doesn't exist
      let hiddenInput = document.getElementById(`${input.id}_international`);

      // If the hidden input doesn't exist, create it
      if (!hiddenInput) {
        hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.name = input.name;
        hiddenInput.id = `${input.id}_international`;
        hiddenInput.className = 'phone-international-format';
        input.after(hiddenInput);

        // Change the original input's name to prevent it from being submitted
        // Only do this if we created a new hidden input
        if (input.name.indexOf('_display') === -1) {
          input.name = `${input.name}_display`;
        }
      }

      // Format the initial value if it exists
      if (input.value) {
        this.formatPhoneNumber(input, iti, hiddenInput);
      }

      // Set up validation
      input.addEventListener('blur', () => {
        this.validatePhoneInput(input, iti);
        this.formatPhoneNumber(input, iti, hiddenInput);
      });

      // Handle input changes
      input.addEventListener('input', () => {
        input.setCustomValidity('');
        // Update the hidden input with the international format
        this.updateHiddenInput(input, iti, hiddenInput);
      });

      // Handle country changes
      input.addEventListener('countrychange', () => {
        this.formatPhoneNumber(input, iti, hiddenInput);
      });

      // Handle form submission
      const form = input.closest('form');
      if (form && !form.hasAttribute('data-phone-handler-initialized')) {
        // Mark the form as initialized to prevent attaching multiple listeners
        form.setAttribute('data-phone-handler-initialized', 'true');

        const originalSubmitHandler = form.onsubmit;

        form.addEventListener('submit', (e) => {
          const allInputsValid = Array.from(form.querySelectorAll('input[data-intl-tel-input]'))
            .every(phoneInput => {
              const instance = window.intlTelInputGlobals.getInstance(phoneInput);
              return instance ? this.validatePhoneInput(phoneInput, instance) : true;
            });

          if (!allInputsValid) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }

          // Make sure all hidden inputs are updated with the latest international format
          Array.from(form.querySelectorAll('input[data-intl-tel-input]')).forEach(phoneInput => {
            const instance = window.intlTelInputGlobals.getInstance(phoneInput);
            if (!instance) return;

            const hiddenInput = document.getElementById(`${phoneInput.id}_international`);

            if (instance && phoneInput.value.trim() && hiddenInput) {
              // Update the hidden input one last time before submission
              const internationalNumber = instance.getNumber();
              if (internationalNumber && instance.isValidNumber()) {
                hiddenInput.value = internationalNumber;
              }
            }
          });

          // Allow the form's original submit handler to run if it exists
          if (typeof originalSubmitHandler === 'function') {
            return originalSubmitHandler(e);
          }
        }, true);
      }
    });
  }

  updateHiddenInput(input, iti, hiddenInput) {
    if (!input.value.trim() || !iti || !hiddenInput) return;

    try {
      // Get the current number in international format
      const internationalNumber = iti.getNumber();

      if (internationalNumber) {
        // Update the hidden input with the international format
        hiddenInput.value = internationalNumber;
      }
    } catch (error) {
      console.error('Error updating hidden input:', error);
    }
  }

  formatPhoneNumber(input, iti, hiddenInput) {
    if (!input.value.trim() || !iti) return;

    try {
      // Get the current number in international format
      const internationalNumber = iti.getNumber();

      if (!internationalNumber) return;

      // Get the selected country data
      const countryData = iti.getSelectedCountryData();

      if (!countryData || !countryData.dialCode) return;

      // Get the national number (without country code)
      let nationalNumber = '';

      // Use the utils library if available
      if (window.intlTelInputUtils) {
        nationalNumber = window.intlTelInputUtils.formatNumber(
          internationalNumber,
          countryData.iso2,
          window.intlTelInputUtils.numberFormat.NATIONAL
        );

        // Remove any leading zeros from the national number
        if (nationalNumber.startsWith('0')) {
          nationalNumber = nationalNumber.substring(1);
        }
      } else {
        // Fallback if utils not available
        // Remove the country code and + symbol
        nationalNumber = internationalNumber.replace(`+${countryData.dialCode}`, '');

        // Remove any leading zeros
        nationalNumber = nationalNumber.replace(/^0+/, '');
      }

      // Update the hidden input with the international format
      if (hiddenInput) {
        hiddenInput.value = internationalNumber;
      }

      // Only update the display value if not focused
      if (document.activeElement !== input) {
        input.value = nationalNumber.trim();
      }
    } catch (error) {
      console.error('Error formatting phone number:', error);
    }
  }

  validatePhoneInput(input, iti) {
    if (!input.value.trim()) {
      // Empty is fine unless required
      if (input.hasAttribute('required')) {
        const errorMsg = window.theme?.strings?.phone_required || 'Please enter a phone number';
        input.setCustomValidity(errorMsg);
        this.showErrorMessage(input, errorMsg);
        return false;
      }
      return true;
    }

    if (!iti.isValidNumber()) {
      const errorCode = iti.getValidationError();
      let errorMsg = 'Invalid phone number';

      // Use localized error messages if available
      if (window.theme && window.theme.strings && window.theme.strings.phone_validation) {
        const errorMsgs = window.theme.strings.phone_validation;

        switch(errorCode) {
          case intlTelInputUtils.validationError.INVALID_COUNTRY_CODE:
            errorMsg = errorMsgs.invalid_country_code || 'Invalid country code';
            break;
          case intlTelInputUtils.validationError.TOO_SHORT:
            errorMsg = errorMsgs.too_short || 'Phone number is too short';
            break;
          case intlTelInputUtils.validationError.TOO_LONG:
            errorMsg = errorMsgs.too_long || 'Phone number is too long';
            break;
          case intlTelInputUtils.validationError.IS_POSSIBLE_LOCAL_ONLY:
            errorMsg = errorMsgs.local_only || 'Please enter an international format';
            break;
          default:
            errorMsg = errorMsgs.invalid || 'Invalid phone number';
        }
      }

      input.setCustomValidity(errorMsg);
      this.showErrorMessage(input, errorMsg);
      return false;
    }

    input.setCustomValidity('');
    this.hideErrorMessage(input);
    return true;
  }

  showErrorMessage(input, message) {
    // Find the error message element
    let errorId = input.getAttribute('data-error-for');
    if (!errorId) {
      errorId = `${input.id}-error`;
    }

    const errorElement = document.getElementById(errorId);

    // If error element exists, update it
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';

      // Add error class to input
      input.classList.add('field__input--error');
    }
  }

  hideErrorMessage(input) {
    // Find the error message element
    let errorId = input.getAttribute('data-error-for');
    if (!errorId) {
      errorId = `${input.id}-error`;
    }

    const errorElement = document.getElementById(errorId);

    // If error element exists, hide it
    if (errorElement) {
      errorElement.style.display = 'none';

      // Remove error class from input
      input.classList.remove('field__input--error');
    }
  }
}

// Function to handle backend error responses
function handlePhoneBackendErrors(form, responseData) {
  if (!window.phoneInputHandler || !form) return;

  try {
    // Check if the response has the expected format
    if (responseData && responseData.code === 10000 && responseData.message === "Phone is invalid") {
      // Find all phone inputs in the form
      const phoneInputs = form.querySelectorAll('input[data-intl-tel-input]');

      phoneInputs.forEach(input => {
        const instance = window.intlTelInputGlobals.getInstance(input);
        if (instance) {
          // Show the backend error message
          window.phoneInputHandler.showErrorMessage(input, responseData.message);

          // Add error class to the input
          input.classList.add('field__input--error');

          // Focus on the first invalid input
          input.focus();
        }
      });

      return true; // Error was handled
    }
  } catch (error) {
    console.error('Error handling phone backend errors:', error);
  }

  return false; // Error was not handled
}

// Make the handler available globally
window.handlePhoneBackendErrors = handlePhoneBackendErrors;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.phoneInputHandler = new PhoneInputHandler();
});

// Re-initialize when the Shopify section is reloaded
document.addEventListener('shopify:section:load', () => {
  if (window.phoneInputHandler) {
    // Clean up existing instances first
    window.phoneInputHandler.cleanupExistingInstances();
    window.phoneInputHandler.init();
  } else {
    window.phoneInputHandler = new PhoneInputHandler();
  }
});

// Also re-initialize on page transitions for SPA-like behavior
document.addEventListener('page:load', () => {
  if (window.phoneInputHandler) {
    window.phoneInputHandler.cleanupExistingInstances();
    window.phoneInputHandler.init();
  } else {
    window.phoneInputHandler = new PhoneInputHandler();
  }
});
