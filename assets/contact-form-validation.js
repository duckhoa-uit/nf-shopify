/**
 * Contact Form Validation
 * Handles client-side validation for contact forms
 */
class ContactFormValidation {
  constructor() {
    this.isSubmitting = false;
    this.hasValidationErrors = false;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupValidation());
    } else {
      this.setupValidation();
    }
  }

  setupValidation() {
    const contactForm = document.getElementById('ContactForm');
    if (!contactForm) return;

    // Add validation listeners
    this.addFieldValidation(contactForm);
    this.addSubmitValidation(contactForm);
    this.addFormResetListeners(contactForm);
  }

  addFormResetListeners(form) {
    // Reset submission state when page loads (in case of form errors)
    window.addEventListener('load', () => {
      this.resetSubmissionState(form);
    });

    // Reset submission state if form has server errors
    if (form.querySelector('.form-status-list') || form.querySelector('.form__message')) {
      this.resetSubmissionState(form);
    }
  }

  resetSubmissionState(form) {
    this.isSubmitting = false;

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      const buttonText = submitButton.querySelector('.button-text');
      const buttonSpinner = submitButton.querySelector('.button-spinner');

      if (buttonText) buttonText.style.display = 'inline-block';
      if (buttonSpinner) buttonSpinner.style.display = 'none';

      submitButton.disabled = false;
    }
  }

  addFieldValidation(form) {
    // Name field validation
    const nameField = form.querySelector('#ContactForm-name');
    if (nameField) {
      nameField.addEventListener('blur', () => this.validateName(nameField));
      nameField.addEventListener('input', () => this.clearFieldError(nameField));
    }

    // Email field validation
    const emailField = form.querySelector('#ContactForm-email');
    if (emailField) {
      emailField.addEventListener('blur', () => this.validateEmail(emailField));
      emailField.addEventListener('input', () => this.clearFieldError(emailField));
    }

    // Message field validation
    const messageField = form.querySelector('#ContactForm-body');
    if (messageField) {
      messageField.addEventListener('blur', () => this.validateMessage(messageField));
      messageField.addEventListener('input', () => this.clearFieldError(messageField));
    }
  }

  addSubmitValidation(form) {
    form.addEventListener('submit', (e) => {
      // Prevent multiple submissions
      if (this.isSubmitting) {
        e.preventDefault();
        e.stopPropagation();
        this.showSubmissionBlockedMessage(form);
        return false;
      }

      // Validate form without clearing existing errors first
      if (!this.validateForm(form)) {
        e.preventDefault();
        e.stopPropagation();
        this.hasValidationErrors = true;
        this.showValidationErrorMessage(form);
        return false;
      }

      // If validation passes, set submitting state
      this.isSubmitting = true;
      this.hasValidationErrors = false;
      this.showSubmissionInProgress(form);
    });
  }

  validateForm(form) {
    let isValid = true;

    // Only clear errors if we don't already have validation errors showing
    // This prevents clearing errors during resubmission attempts
    if (!this.hasValidationErrors) {
      this.clearAllErrors(form);
    }

    // Validate required fields
    const nameField = form.querySelector('#ContactForm-name');
    const emailField = form.querySelector('#ContactForm-email');
    const messageField = form.querySelector('#ContactForm-body');

    if (nameField && !this.validateName(nameField)) {
      isValid = false;
    }

    if (emailField && !this.validateEmail(emailField)) {
      isValid = false;
    }

    if (messageField && !this.validateMessage(messageField)) {
      isValid = false;
    }

    return isValid;
  }

  validateName(field) {
    const value = field.value.trim();

    if (!value) {
      this.showFieldError(field, 'Name is required');
      return false;
    }

    if (value.length < 2) {
      this.showFieldError(field, 'Name must be at least 2 characters');
      return false;
    }

    return true;
  }

  validateEmail(field) {
    const value = field.value.trim();

    if (!value) {
      this.showFieldError(field, 'Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.showFieldError(field, 'Please enter a valid email address');
      return false;
    }

    return true;
  }



  validateMessage(field) {
    const value = field.value.trim();

    if (!value) {
      this.showFieldError(field, 'Message is required');
      return false;
    }

    if (value.length < 10) {
      this.showFieldError(field, 'Message must be at least 10 characters');
      return false;
    }

    return true;
  }

  showFieldError(field, message) {
    // Add error class to form group container
    const formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.classList.add('form-group--with-error');
    }

    // Add error class to field container
    const fieldContainer = field.closest('.field');
    if (fieldContainer) {
      fieldContainer.classList.add('field--with-error');
    }

    // Add error class to input
    field.classList.add('field__input--error');

    // Find or create error element
    let errorElement = formGroup ? formGroup.querySelector('.field__error') :
                      fieldContainer ? fieldContainer.querySelector('.field__error') :
                      field.parentNode.querySelector('.field__error');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'field__error';
      if (formGroup) {
        formGroup.appendChild(errorElement);
      } else if (fieldContainer) {
        fieldContainer.appendChild(errorElement);
      } else {
        field.parentNode.appendChild(errorElement);
      }
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';

    // Set custom validity for browser validation
    field.setCustomValidity(message);
  }

  clearFieldError(field) {
    // Remove error class from form group container
    const formGroup = field.closest('.form-group');
    if (formGroup) {
      formGroup.classList.remove('form-group--with-error');
    }

    // Remove error class from field container
    const fieldContainer = field.closest('.field');
    if (fieldContainer) {
      fieldContainer.classList.remove('field--with-error');
    }

    // Remove error class from input
    field.classList.remove('field__input--error');

    // Hide error message
    const errorElement = formGroup ? formGroup.querySelector('.field__error') :
                         fieldContainer ? fieldContainer.querySelector('.field__error') :
                         field.parentNode.querySelector('.field__error');
    if (errorElement) {
      errorElement.style.display = 'none';
    }

    // Clear custom validity
    field.setCustomValidity('');

    // Check if all errors are cleared, reset validation error state
    const form = field.closest('form');
    if (form && !this.hasAnyVisibleErrors(form)) {
      this.hasValidationErrors = false;
    }
  }

  clearAllErrors(form) {
    // Remove all error classes from form groups
    const errorFormGroups = form.querySelectorAll('.form-group--with-error');
    errorFormGroups.forEach(group => {
      group.classList.remove('form-group--with-error');
    });

    // Remove all error classes from field containers
    const errorContainers = form.querySelectorAll('.field--with-error');
    errorContainers.forEach(container => {
      container.classList.remove('field--with-error');
    });

    // Remove all error classes from inputs
    const errorFields = form.querySelectorAll('.field__input--error');
    errorFields.forEach(field => {
      field.classList.remove('field__input--error');
      field.setCustomValidity('');
    });

    // Hide all error messages
    const errorElements = form.querySelectorAll('.field__error');
    errorElements.forEach(element => {
      element.style.display = 'none';
    });

    // Clear form-level error messages
    this.clearFormMessages(form);
  }

  hasAnyVisibleErrors(form) {
    const errorElements = form.querySelectorAll('.field__error');
    return Array.from(errorElements).some(element =>
      element.style.display !== 'none' && element.textContent.trim() !== ''
    );
  }

  showSubmissionBlockedMessage(form) {
    this.showFormMessage(form, 'Please wait, your message is being sent...', 'info');
  }

  showValidationErrorMessage(form) {
    this.showFormMessage(form, 'Please fix the errors above before submitting.', 'error');
  }

  showSubmissionInProgress(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      const buttonText = submitButton.querySelector('.button-text');
      const buttonSpinner = submitButton.querySelector('.button-spinner');

      if (buttonText) buttonText.style.display = 'none';
      if (buttonSpinner) buttonSpinner.style.display = 'inline-block';

      submitButton.disabled = true;
    }
  }

  showFormMessage(form, message, type = 'error') {
    // Remove existing form messages
    this.clearFormMessages(form);

    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `form__message form__message--${type}`;

    const statusDiv = document.createElement('div');
    statusDiv.className = 'form-status caption-large text-body';
    statusDiv.setAttribute('role', 'alert');
    statusDiv.textContent = message;

    messageElement.appendChild(statusDiv);

    // Insert message at the top of the form
    const firstChild = form.firstElementChild;
    form.insertBefore(messageElement, firstChild);
  }

  clearFormMessages(form) {
    const existingMessages = form.querySelectorAll('.form__message--error, .form__message--info');
    existingMessages.forEach(message => message.remove());
  }
}

// Initialize when DOM is ready
new ContactFormValidation();
