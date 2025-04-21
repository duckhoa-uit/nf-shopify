/**
 * Account forms functionality
 */
class AccountForms {
  constructor() {
    this.customerInfoForm = document.getElementById('CustomerInfoForm');
    this.customerPasswordForm = document.getElementById('CustomerPasswordForm');
    this.deleteAccountBtn = document.getElementById('DeleteAccountBtn');
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
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new AccountForms();
});
