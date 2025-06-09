/**
 * Contact Form Validation
 * Handles client-side validation for contact forms
 */
class ContactFormValidation {
  constructor() {
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
      if (!this.validateForm(form)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    });
  }

  validateForm(form) {
    let isValid = true;

    // Clear all previous errors
    this.clearAllErrors(form);

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
  }
}

// Initialize when DOM is ready
new ContactFormValidation();
