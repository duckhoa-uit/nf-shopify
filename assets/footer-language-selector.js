document.addEventListener('DOMContentLoaded', function() {
  const footerLanguageSelectors = document.querySelectorAll('[data-footer-language-selector]');
  
  footerLanguageSelectors.forEach(selector => {
    const button = selector.querySelector('.footer-language-button');
    const dropdown = selector.querySelector('.footer-language-dropdown');
    const links = selector.querySelectorAll('.footer-language-link');
    
    if (!button || !dropdown) return;
    
    // Toggle dropdown on button click
    button.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      
      // Close all other dropdowns first
      footerLanguageSelectors.forEach(otherSelector => {
        if (otherSelector !== selector) {
          const otherButton = otherSelector.querySelector('.footer-language-button');
          const otherDropdown = otherSelector.querySelector('.footer-language-dropdown');
          if (otherButton && otherDropdown) {
            otherButton.setAttribute('aria-expanded', 'false');
            otherDropdown.setAttribute('hidden', '');
          }
        }
      });
      
      // Toggle current dropdown
      button.setAttribute('aria-expanded', !isExpanded);
      if (isExpanded) {
        dropdown.setAttribute('hidden', '');
      } else {
        dropdown.removeAttribute('hidden');
      }
    });
    
    // Handle language selection
    links.forEach(link => {
      link.addEventListener('click', function(event) {
        event.preventDefault();
        
        const form = selector.closest('form');
        const input = form.querySelector('input[name="locale_code"]');
        
        if (input) {
          input.value = this.getAttribute('data-value');
          form.submit();
        }
      });
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('[data-footer-language-selector]')) {
      footerLanguageSelectors.forEach(selector => {
        const button = selector.querySelector('.footer-language-button');
        const dropdown = selector.querySelector('.footer-language-dropdown');
        
        if (button && dropdown) {
          button.setAttribute('aria-expanded', 'false');
          dropdown.setAttribute('hidden', '');
        }
      });
    }
  });
  
  // Close dropdown on escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      footerLanguageSelectors.forEach(selector => {
        const button = selector.querySelector('.footer-language-button');
        const dropdown = selector.querySelector('.footer-language-dropdown');
        
        if (button && dropdown) {
          button.setAttribute('aria-expanded', 'false');
          dropdown.setAttribute('hidden', '');
          button.focus();
        }
      });
    }
  });
});
