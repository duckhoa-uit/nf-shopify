/**
 * Account forms functionality
 */
class AccountForms {
  constructor() {
    this.customerInfoForm = document.getElementById('CustomerInfoForm');
    this.customerPasswordForm = document.getElementById('CustomerPasswordForm');
    this.deleteAccountBtn = document.getElementById('DeleteAccountBtn');
    this.birthdateField = document.getElementById('CustomerBirthdate');
    this.datePickerIcon = document.querySelector('.date-picker-icon');
    this.init();
  }

  init() {
    // Set up form submission handlers
    if (this.customerInfoForm) {
      this.customerInfoForm.addEventListener('submit', this.handleInfoFormSubmit.bind(this));
    }

    if (this.customerPasswordForm) {
      this.customerPasswordForm.addEventListener('submit', this.handlePasswordFormSubmit.bind(this));
    }

    // Set up delete account button
    if (this.deleteAccountBtn) {
      this.deleteAccountBtn.addEventListener('click', this.handleDeleteAccount.bind(this));
    }

    // Set up date picker for birthdate field
    if (this.birthdateField) {
      this.initDatePicker();
    }
  }

  handleInfoFormSubmit(e) {
    e.preventDefault();
    // Here you would typically send the form data to the server
    // For now, just show an alert
    alert('Basic information updated successfully!');
  }

  handlePasswordFormSubmit(e) {
    e.preventDefault();
    // Validate password match
    const newPassword = document.getElementById('CustomerNewPassword').value;
    const confirmPassword = document.getElementById('CustomerConfirmPassword').value;

    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match!');
      return;
    }

    // Here you would typically send the form data to the server
    // For now, just show an alert
    alert('Password updated successfully!');
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
