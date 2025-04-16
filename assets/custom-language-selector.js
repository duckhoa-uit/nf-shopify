document.addEventListener('DOMContentLoaded', function() {
  const languageButtons = document.querySelectorAll('.custom-language-button');
  
  languageButtons.forEach(button => {
    button.addEventListener('click', function() {
      const dropdown = this.nextElementSibling;
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      // Toggle aria-expanded
      this.setAttribute('aria-expanded', !isExpanded);
      
      // Toggle dropdown visibility
      if (isExpanded) {
        dropdown.setAttribute('hidden', '');
      } else {
        dropdown.removeAttribute('hidden');
      }
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.custom-language-disclosure')) {
      const dropdowns = document.querySelectorAll('.custom-language-dropdown');
      const buttons = document.querySelectorAll('.custom-language-button');
      
      dropdowns.forEach(dropdown => {
        dropdown.setAttribute('hidden', '');
      });
      
      buttons.forEach(button => {
        button.setAttribute('aria-expanded', 'false');
      });
    }
  });
  
  // Handle language selection
  const languageLinks = document.querySelectorAll('.custom-language-link');
  
  languageLinks.forEach(link => {
    link.addEventListener('click', function(event) {
      event.preventDefault();
      
      const form = this.closest('form');
      const input = form.querySelector('input[name="locale_code"]');
      
      input.value = this.getAttribute('data-value');
      form.submit();
    });
  });
});
