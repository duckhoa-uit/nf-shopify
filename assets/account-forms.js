/**
 * Account forms functionality
 */
class AccountForms {
  constructor() {
    this.deleteAccountBtn = document.getElementById('DeleteAccountBtn');
    this.birthdateField = document.getElementById('CustomerBirthdate');
    this.datePickerIcon = document.querySelector('.date-picker-icon');
    this.customerInfoForm = document.getElementById('CustomerInfoForm');
    this.init();
  }

  init() {
    // Set up delete account button
    if (this.deleteAccountBtn) {
      this.deleteAccountBtn.addEventListener('click', this.handleDeleteAccount.bind(this));
    }

    // Set up date picker for birthdate field
    if (this.birthdateField) {
      this.initDatePicker();
    }

    // Set up customer info form submission
    if (this.customerInfoForm) {
      this.setupCustomerInfoForm();
      this.setupFormFieldListeners();
    }
  }

  setupFormFieldListeners() {
    // Add input event listeners to form fields to clear messages when editing
    if (this.customerInfoForm) {
      const formInputs = this.customerInfoForm.querySelectorAll('input');
      formInputs.forEach(input => {
        input.addEventListener('input', () => {
          this.clearFormMessages();
        });
      });
    }
  }

  clearFormMessages() {
    if (!this.customerInfoForm) return;

    // Clear success message
    const successMessage = this.customerInfoForm.querySelector('.success-message');
    if (successMessage) {
      successMessage.style.display = 'none';
    }

    // Clear error message
    const errorMessage = this.customerInfoForm.querySelector('.form-error-message');
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }
  }



  validateCustomerInfoForm() {
    // Basic validation for the customer info form
    if (!this.customerInfoForm) return true;

    let isValid = true;

    // Get form fields
    const firstNameInput = this.customerInfoForm.querySelector('#CustomerFirstName');
    const lastNameInput = this.customerInfoForm.querySelector('#CustomerLastName');
    const emailInput = this.customerInfoForm.querySelector('#CustomerEmail');

    // Clear previous error messages
    const errorMessage = this.customerInfoForm.querySelector('.form-error-message');
    if (errorMessage) {
      errorMessage.style.display = 'none';
    }

    // Validate required fields
    if (firstNameInput && !firstNameInput.value.trim()) {
      const errorMsg = window.theme?.strings?.first_name_required || 'First name is required';
      this.showValidationError(errorMsg);
      isValid = false;
    }

    if (lastNameInput && !lastNameInput.value.trim()) {
      const errorMsg = window.theme?.strings?.last_name_required || 'Last name is required';
      this.showValidationError(errorMsg);
      isValid = false;
    }

    // Validate email format
    if (emailInput) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailInput.value.trim()) {
        const errorMsg = window.theme?.strings?.email_required || 'Email is required';
        this.showValidationError(errorMsg);
        isValid = false;
      } else if (!emailRegex.test(emailInput.value.trim())) {
        const errorMsg = window.theme?.strings?.email_invalid || 'Please enter a valid email address';
        this.showValidationError(errorMsg);
        isValid = false;
      }
    }

    // Phone validation is now handled by the intl-tel-input library

    return isValid;
  }

  showValidationError(errorText) {
    if (!this.customerInfoForm) return;

    let errorMessage = this.customerInfoForm.querySelector('.form-error-message');

    if (!errorMessage) {
      // Create error message if it doesn't exist
      errorMessage = document.createElement('div');
      errorMessage.className = 'form-error-message';
      errorMessage.setAttribute('role', 'alert');

      const errorHeading = document.createElement('h2');
      errorHeading.className = 'form-error-heading';
      errorHeading.textContent = 'Please correct the following errors:';

      errorMessage.appendChild(errorHeading);
      this.customerInfoForm.insertBefore(errorMessage, this.customerInfoForm.firstChild);
    }

    // Update error message content
    const errorHeading = errorMessage.querySelector('.form-error-heading');
    if (errorHeading) {
      errorHeading.textContent = 'Please correct the following errors:';
    }

    // Add error details
    let errorList = errorMessage.querySelector('ul');
    if (!errorList) {
      errorList = document.createElement('ul');
      errorMessage.appendChild(errorList);
    }

    const errorItem = document.createElement('li');
    errorItem.textContent = errorText;
    errorList.appendChild(errorItem);

    errorMessage.style.display = 'block';

    // Scroll to error message
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  setupCustomerInfoForm() {
    // Handle customer info form submission through proxy endpoint
    if (this.customerInfoForm) {
      // First, remove the form's native action and method attributes
      // This ensures it won't submit normally even if our handler fails
      this.customerInfoForm.removeAttribute('action');
      this.customerInfoForm.setAttribute('data-custom-submit', 'true');

      // Use the submit event with capture to ensure it's always caught first
      this.customerInfoForm.addEventListener('submit', this.handleCustomerInfoSubmit.bind(this), true);
    }
  }

  handleCustomerInfoSubmit(e) {
    // Always prevent default form submission
    e.preventDefault();
    e.stopPropagation();

    // Validate form before submission
    if (!this.validateCustomerInfoForm()) {
      return; // Stop if validation fails
    }

    const submitButton = this.customerInfoForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.classList.add('loading');
    }

    // Get form data
    const formData = new FormData(this.customerInfoForm);
    const customerData = {};

    // Transform form data to the required format
    let isCustomForm = false;
    for (const [key, value] of formData.entries()) {
      if (key === 'custom_form' && value === 'true') {
        isCustomForm = true;
      }
      if (key === 'customer[first_name]') customerData.first_name = value;
      if (key === 'customer[last_name]') customerData.last_name = value;
      if (key === 'customer[email]') customerData.email = value;
      if (key === 'customer[phone]') {
        // Get the intlTelInput instance
        const phoneInput = this.customerInfoForm.querySelector('#CustomerPhone');
        if (phoneInput && window.intlTelInputGlobals) {
          const iti = window.intlTelInputGlobals.getInstance(phoneInput);
          if (iti && iti.isValidNumber()) {
            customerData.phone = iti.getNumber(); // Use the full international format
          } else {
            customerData.phone = value;
          }
        } else {
          customerData.phone = value;
        }
      }
      if (key === 'birthdate') {
        // Transform birthdate from DD.MM.YYYY to YYYY-MM-DD format
        if (value) {
          const parts = value.split('.');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            // Ensure year is 4 digits
            const fullYear = year.length === 2 ? `20${year}` : year;
            customerData.birthdate = `${fullYear}-${month}-${day}`;
          } else {
            customerData.birthdate = value; // Keep original if format is unexpected
          }
        } else {
          customerData.birthdate = value;
        }
      }
    }

    // Double-check that this is our custom form
    if (!isCustomForm) {
      // Still prevent default and show an error
      let errorMessage = this.customerInfoForm.querySelector('.form-error-message');
      if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'form-error-message';
        errorMessage.setAttribute('role', 'alert');

        const errorHeading = document.createElement('h2');
        errorHeading.className = 'form-error-heading';
        errorHeading.textContent = 'There was an error processing your request.';

        errorMessage.appendChild(errorHeading);
        this.customerInfoForm.insertBefore(errorMessage, this.customerInfoForm.firstChild);
      }

      errorMessage.innerHTML = '<h2 class="form-error-heading">Form submission error</h2><p>Please refresh the page and try again.</p>';
      errorMessage.style.display = 'block';
      return;
    }

    // Send data to proxy endpoint
    fetch('/apps/nf-data-management/update_customer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      // Show success message
      let successMessage = this.customerInfoForm.querySelector('.success-message');

      if (!successMessage) {
        // Create success message if it doesn't exist
        successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.setAttribute('tabindex', '-1');
        successMessage.setAttribute('autofocus', '');
        this.customerInfoForm.insertBefore(successMessage, this.customerInfoForm.firstChild);
      }

      successMessage.textContent = data.message || 'Basic information updated successfully!';
      successMessage.style.display = 'block';

      // Scroll to success message
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
      successMessage.focus();
    })
    .catch(error => {
      // Show error message
      // Keep error logging for debugging purposes
      console.error('Error updating customer information:', error);

      let errorMessage = this.customerInfoForm.querySelector('.form-error-message');

      if (!errorMessage) {
        // Create error message if it doesn't exist
        errorMessage = document.createElement('div');
        errorMessage.className = 'form-error-message';
        errorMessage.setAttribute('role', 'alert');

        const errorHeading = document.createElement('h2');
        errorHeading.className = 'form-error-heading';
        errorHeading.textContent = 'There was an error processing your request.';

        errorMessage.appendChild(errorHeading);
        this.customerInfoForm.insertBefore(errorMessage, this.customerInfoForm.firstChild);
      }

      // Update error message content
      const errorHeading = errorMessage.querySelector('.form-error-heading');
      if (errorHeading) {
        errorHeading.textContent = 'There was an error processing your request.';
      }

      // Add error details if available
      const errorList = errorMessage.querySelector('ul') || document.createElement('ul');
      errorList.innerHTML = ''; // Clear existing errors

      const errorItem = document.createElement('li');
      errorItem.textContent = error.message || 'Please try again later.';
      errorList.appendChild(errorItem);

      if (!errorMessage.contains(errorList)) {
        errorMessage.appendChild(errorList);
      }

      errorMessage.style.display = 'block';

      // Scroll to error message
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    })
    .finally(() => {
      // Remove loading state
      if (submitButton) {
        submitButton.classList.remove('loading');
      }
    });
  }

  handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Here you would typically send the request to the server
      // For now, just show an alert
      alert('Account deletion request submitted.');
    }
  }

  transformInitialBirthdateValue() {
    if (!this.birthdateField || !this.birthdateField.value) return;

    const value = this.birthdateField.value.trim();

    // Check if the value is in YYYY-MM-DD format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDateRegex.test(value)) {
      try {
        // Split the date parts
        const [year, month, day] = value.split('-');

        // Transform to DD.MM.YYYY format
        const formattedDate = `${parseInt(day, 10)}.${parseInt(month, 10)}.${year}`;

        // Update the input value
        this.birthdateField.value = formattedDate;
      } catch (error) {
        // Keep error logging for debugging purposes
        console.error('Error transforming birthdate:', error);
      }
    }
  }

  initDatePicker() {
    if (!this.birthdateField) return;

    // Set placeholder with period separator
    const locale = document.documentElement.lang || 'en';
    // Use DD.MM.YYYY format for all locales
    let placeholder = 'DD.MM.YYYY';

    this.birthdateField.setAttribute('placeholder', placeholder);

    // Transform the initial value from YYYY-MM-DD to DD.MM.YYYY if needed
    this.transformInitialBirthdateValue();

    // Initialize Flatpickr
    const flatpickrInstance = flatpickr(this.birthdateField, {
      // Use d.m.Y format for all locales (day.month.year)
      dateFormat: 'd.m.Y',
      // Use Shopify's locale code to determine which Flatpickr locale to use
      locale: locale,
      disableMobile: true, // Disable the mobile-friendly interface
      allowInput: true, // Allow manual input
      static: false, // Don't position the calendar relative to the input
      positionElement: this.datePickerIcon, // Position relative to the calendar icon
      monthSelectorType: 'dropdown', // Use a dropdown for month selection
      yearSelectorType: 'dropdown', // Use a dropdown for year selection
      showMonths: 1, // Show only one month
      enableTime: false, // Disable time selection
      noCalendar: false, // Show the calendar
      prevArrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', // Show prev month button
      nextArrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', // Show next month button
      onChange: (_, dateStr) => {
        // Update the input value with the formatted date
        this.birthdateField.value = dateStr;
      },
      onOpen: function(_, __, instance) {
        // Add custom class to the calendar for styling
        instance.calendarContainer.classList.add('birthday-calendar');
      }
    });

    // Add click event to the date picker icon
    if (this.datePickerIcon) {
      this.datePickerIcon.addEventListener('click', () => {
        flatpickrInstance.open();
      });
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccountForms();
});
