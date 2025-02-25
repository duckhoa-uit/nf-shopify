document.addEventListener('DOMContentLoaded', () => {
  // Get modal element
  const authModal = document.getElementById('auth-modal');

  // Handle auth trigger clicks
  document.querySelectorAll('[data-auth-trigger]').forEach((button) => {
    button.addEventListener('click', (e) => {
      const formType = e.currentTarget.dataset.authTrigger;
      showAuthForm(formType);
    });
  });

  // Handle close button
  authModal.querySelector('.close').addEventListener('click', hideAuthModal);

  // Show/hide functions
  function showAuthForm(formType) {
    authModal.classList.remove('hidden');
    document.querySelectorAll('#auth-modal > div > div > div').forEach((form) => {
      form.classList.add('hidden');
    });
    document.getElementById(`customer-${formType}-form`).classList.remove('hidden');
  }

  function hideAuthModal() {
    authModal.classList.add('hidden');
  }

  // Close modal when clicking outside
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      hideAuthModal();
    }
  });
});
