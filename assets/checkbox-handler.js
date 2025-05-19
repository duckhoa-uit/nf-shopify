/**
 * Checkbox Handler
 * 
 * Enhances checkbox functionality to ensure labels are clickable
 * and provides consistent behavior across browsers and devices.
 */

if (!customElements.get('checkbox-handler')) {
  customElements.define(
    'checkbox-handler',
    class CheckboxHandler extends HTMLElement {
      constructor() {
        super();
        this.checkboxInput = this.querySelector('input[type="checkbox"]');
        this.label = this.querySelector('label');
        this.init();
      }

      init() {
        if (!this.checkboxInput || !this.label) return;

        // Make sure the label's 'for' attribute matches the checkbox's 'id'
        if (this.checkboxInput.id && !this.label.getAttribute('for')) {
          this.label.setAttribute('for', this.checkboxInput.id);
        }

        // Add click event to the label to toggle the checkbox
        this.label.addEventListener('click', this.handleLabelClick.bind(this));
        
        // Add click event to the wrapper to improve touch device experience
        this.addEventListener('click', this.handleWrapperClick.bind(this));
      }

      handleLabelClick(event) {
        // Prevent default behavior to handle it manually
        // This helps with some mobile browsers where label clicks don't always work
        event.preventDefault();
        
        // Toggle the checkbox if it's not disabled
        if (!this.checkboxInput.disabled) {
          this.checkboxInput.checked = !this.checkboxInput.checked;
          
          // Dispatch a change event to trigger any listeners
          this.checkboxInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      handleWrapperClick(event) {
        // Only handle clicks directly on the wrapper (not on child elements)
        if (event.target === this) {
          // Toggle the checkbox if it's not disabled
          if (!this.checkboxInput.disabled) {
            this.checkboxInput.checked = !this.checkboxInput.checked;
            
            // Dispatch a change event to trigger any listeners
            this.checkboxInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
      }
    }
  );
}
