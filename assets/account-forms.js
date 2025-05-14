/**
 * Account forms functionality
 */
class AccountForms {
  constructor() {
    this.deleteAccountBtn = document.getElementById('DeleteAccountBtn');
    this.birthdateField = document.getElementById('CustomerBirthdate');
    this.datePickerIcon = document.querySelector('.date-picker-icon');
    this.newPasswordField = document.getElementById('CustomerNewPassword');
    this.confirmPasswordField = document.getElementById('CustomerConfirmPassword');
    this.passwordForm = document.getElementById('CustomerPasswordForm');
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

    // Set up password confirmation validation
    if (this.passwordForm && this.newPasswordField && this.confirmPasswordField) {
      this.setupPasswordConfirmation();
    }

    // Set up customer info form submission
    if (this.customerInfoForm) {
      this.setupCustomerInfoForm();
    }
  }

  setupPasswordConfirmation() {
    // Handle password form submission
    this.passwordForm.addEventListener('submit', (e) => {
      // Check if passwords match
      if (this.newPasswordField.value !== this.confirmPasswordField.value) {
        e.preventDefault();
        const passwordMismatchMsg = 'New password and confirmation do not match!';
        alert(passwordMismatchMsg);
        return;
      }
    });
  }

  setupCustomerInfoForm() {
    // Using Shopify's native form handling for the customer info form
    // No need to add event listeners as Shopify will handle the form submission
    // and CAPTCHA verification

    // Just add loading state when the form is submitted
    if (this.customerInfoForm) {
      this.customerInfoForm.addEventListener('submit', () => {
        const submitButton = this.customerInfoForm.querySelector('button[type="submit"]');
        if (submitButton) {
          submitButton.classList.add('loading');
          if (submitButton.querySelector('.btn-spinner')) {
            submitButton.querySelector('.btn-spinner').style.display = 'inline-block';
          }
        }
      });
    }
  }

  handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // Here you would typically send the request to the server
      // For now, just show an alert
      alert('Account deletion request submitted.');
    }
  }

  initDatePicker() {
    if (!this.birthdateField) return;

    // Set placeholder with period separator
    const locale = document.documentElement.lang || 'en';
    // Use DD.MM.YYYY format for all locales
    let placeholder = 'DD.MM.YYYY';

    this.birthdateField.setAttribute('placeholder', placeholder);

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
