class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items') {
        return;
      }
      this.onCartUpdate();
    });
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index || event.target.dataset.itemKey;
    let message = '';

    // Check if we're dealing with a select element (dropdown) or an input element
    const isSelect = event.target.tagName.toLowerCase() === 'select';

    // Only perform these validations for number inputs, not for select dropdowns
    if (!isSelect) {
      // Make sure we have the required strings defined to avoid errors
      if (window.quickOrderListStrings) {
        if (inputValue < event.target.dataset.min) {
          message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
        } else if (inputValue > parseInt(event.target.max)) {
          message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
        } else if (inputValue % parseInt(event.target.step) !== 0) {
          message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
        }
      }
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      if (!isSelect) {
        event.target.setCustomValidity('');
        event.target.reportValidity();
      }

      this.updateQuantity(
        index,
        inputValue,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.tagName === 'CART-DRAWER-ITEMS') {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
      // We still need to update the cart footer for totals, but we'll handle it differently
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      },
    ];
  }

  updateQuantity(line, quantity, name, variantId) {
    this.enableLoading(line);

    // Check if line is a cart item key (string) or a line number (integer)
    const isItemKey = typeof line === 'string' && line.includes(':');

    // Prepare the request body based on whether we're using item key or line number
    const bodyData = {
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    };

    // Add either line or id parameter based on what we have
    if (isItemKey) {
      bodyData.id = line;
    } else {
      bodyData.line = line;
    }

    const body = JSON.stringify(bodyData);

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        // Check if the response is ok (status in the range 200-299)
        if (!response.ok) {
          // If we get a 422 Unprocessable Entity or other error
          if (response.status === 422) {
            return response.json().then(errorData => {
              // Extract the error message from the response
              // The error can be in different formats depending on the endpoint
              const errorMessage =
                typeof errorData.errors === 'string' ? errorData.errors :
                errorData.description ? errorData.description :
                Array.isArray(errorData.errors) ? errorData.errors.join(', ') :
                typeof errorData.errors === 'object' ? Object.values(errorData.errors).join(', ') :
                'Error updating cart. Please try again.';

              console.log('Cart error response:', errorData);
              throw new Error(errorMessage);
            });
          }
          throw new Error('Error updating cart. Please try again.');
        }
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);

        // Find the quantity element using either line number or item key
        let quantityElement;
        // Use the isItemKey variable that was already defined earlier

        if (isItemKey) {
          quantityElement = document.querySelector(`[data-item-key="${line}"]`);
        } else {
          quantityElement = document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
        }

        const items = document.querySelectorAll('.cart-item');

        if (parsedState.errors) {
          // Extract the error message from the response
          // The error can be in different formats depending on the endpoint
          const errorMessage =
            typeof parsedState.errors === 'string' ? parsedState.errors :
            Array.isArray(parsedState.errors) ? parsedState.errors.join(', ') :
            typeof parsedState.errors === 'object' ? Object.values(parsedState.errors).join(', ') :
            'Error updating cart. Please try again.';

          console.log('Cart error in response:', parsedState.errors);

          // Reset the quantity selector to its previous value
          if (quantityElement) {
            // First try to use the data-previous-value attribute which should contain the old value
            const previousValue = quantityElement.getAttribute('data-previous-value');
            if (previousValue) {
              console.log(`Reverting to previous value: ${previousValue}`);
              quantityElement.value = previousValue;
            } else if (quantityElement.getAttribute('data-old-value')) {
              // Try the data-old-value attribute
              const oldValue = quantityElement.getAttribute('data-old-value');
              console.log(`Reverting to old value: ${oldValue}`);
              quantityElement.value = oldValue;
            } else if (quantityElement.getAttribute('value')) {
              // Fallback to the value attribute
              console.log(`Reverting to value attribute: ${quantityElement.getAttribute('value')}`);
              quantityElement.value = quantityElement.getAttribute('value');
            } else {
              // Last resort: fetch the current cart state
              fetch(`${routes.cart_url}.js`)
                .then(response => response.json())
                .then(cart => {
                  const item = cart.items.find(item => item.key === line);
                  if (item) {
                    console.log(`Reverting to current cart value: ${item.quantity}`);
                    quantityElement.value = item.quantity;
                  }
                })
                .catch(e => console.error('Error fetching current cart:', e));
            }

            // Re-enable the select immediately
            quantityElement.disabled = false;

            // Show the dropdown arrow
            const arrow = quantityElement.parentNode.querySelector('.nf-cart-item__variant-arrow');
            if (arrow) {
              arrow.classList.remove('hidden');
            }

            // Hide the loading indicator
            const loadingIndicator = quantityElement.parentNode.querySelector('.quantity-loading-indicator');
            if (loadingIndicator) {
              loadingIndicator.classList.add('hidden');
            }
          }

          this.updateLiveRegions(line, errorMessage);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');

        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

          // Special handling for main-cart-footer to prevent duplicate line items
          if (section.id === 'main-cart-footer') {
            // Get the HTML content
            const footerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );

            // Create a temporary element to parse the HTML
            const tempElement = document.createElement('div');
            tempElement.innerHTML = footerHTML;

            // Remove any cart line items that might be in the footer
            const cartItems = tempElement.querySelectorAll('.nf-cart-items, .cart-item');
            cartItems.forEach(item => item.remove());

            // Set the cleaned HTML to the footer
            elementToReplace.innerHTML = tempElement.innerHTML;
          } else {
            // For other sections, update normally
            elementToReplace.innerHTML = this.getSectionInnerHTML(
              parsedState.sections[section.section],
              section.selector
            );
          }
        });
        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        let message = '';
        if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
          if (typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }
        this.updateLiveRegions(line, message);

        // Use the isItemKey variable that was already defined earlier
        let lineItem;

        if (isItemKey) {
          // Find cart item by data attribute
          lineItem = document.querySelector(`[data-item-key="${line}"]`) ||
                     document.querySelector(`[data-drawer-item-key="${line}"]`);
        } else {
          // Find cart item by ID
          lineItem = document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        }

        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
        } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch((error) => {
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));

        // Display the error message
        let errorMessage = error.message || window.cartStrings?.error || 'An error occurred while updating your cart. Please try again.';

        // Clean up error message if it's a JSON string (sometimes happens with Shopify errors)
        if (errorMessage.startsWith('{') && errorMessage.endsWith('}')) {
          try {
            const errorObj = JSON.parse(errorMessage);
            if (errorObj.errors) {
              errorMessage = typeof errorObj.errors === 'string' ? errorObj.errors :
                Array.isArray(errorObj.errors) ? errorObj.errors.join(', ') :
                typeof errorObj.errors === 'object' ? Object.values(errorObj.errors).join(', ') :
                errorMessage;
            }
          } catch (e) {
            console.error('Error parsing error message JSON:', e);
          }
        }

        console.log('Cart error caught:', errorMessage);

        // Find the error element for this line item
        let errorElement;

        if (isItemKey) {
          // Try to find the error element by data attribute
          errorElement = document.querySelector(`[data-item-key="${line}"] .cart-item__error-text`) ||
                         document.querySelector(`#Line-item-error-${line}`);
        } else {
          // Try to find the error element by ID
          errorElement = document.getElementById(`Line-item-error-${line}`);
        }

        // If we found an error element for this line item, show the error there
        if (errorElement) {
          errorElement.textContent = errorMessage;
          errorElement.classList.remove('hidden');

          // Hide the error after 5 seconds
          setTimeout(() => {
            errorElement.classList.add('hidden');
          }, 5000);
        } else {
          // Fallback to a general cart error display
          const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
          if (errors) {
            errors.textContent = errorMessage;
            errors.classList.remove('hidden');

            // Hide the error after 5 seconds
            setTimeout(() => {
              errors.classList.add('hidden');
            }, 5000);
          } else {
            // Last resort: alert
            console.error('Cart update error:', errorMessage);
          }
        }

        // Reset the quantity selector to its previous value
        const quantityElement = document.querySelector(`[data-item-key="${line}"].nf-cart-item__variant-select`);
        if (quantityElement) {
          // First try to use the data-previous-value attribute which should contain the old value
          const previousValue = quantityElement.getAttribute('data-previous-value');
          if (previousValue) {
            console.log(`Reverting to previous value: ${previousValue}`);
            quantityElement.value = previousValue;
          } else if (quantityElement.getAttribute('data-old-value')) {
            // Try the data-old-value attribute
            const oldValue = quantityElement.getAttribute('data-old-value');
            console.log(`Reverting to old value: ${oldValue}`);
            quantityElement.value = oldValue;
          } else {
            // Fallback to fetching the current cart state
            fetch(`${routes.cart_url}.js`)
              .then(response => response.json())
              .then(cart => {
                const item = cart.items.find(item => item.key === line);
                if (item) {
                  console.log(`Reverting to current cart value: ${item.quantity}`);
                  quantityElement.value = item.quantity;
                }
              })
              .catch(e => console.error('Error fetching current cart:', e));
          }

          // Re-enable the select immediately
          quantityElement.disabled = false;

          // Show the dropdown arrow
          const arrow = quantityElement.parentNode.querySelector('.nf-cart-item__variant-arrow');
          if (arrow) {
            arrow.classList.remove('hidden');
          }

          // Hide the loading indicator
          const loadingIndicator = quantityElement.parentNode.querySelector('.quantity-loading-indicator');
          if (loadingIndicator) {
            loadingIndicator.classList.add('hidden');
          }
        }
      })
      .finally(() => {
        this.disableLoading(line);

        // Re-enable the quantity selector and restore UI
        if (isItemKey) {
          const quantitySelector = document.querySelector(`[data-item-key="${line}"].nf-cart-item__variant-select`);
          if (quantitySelector) {
            quantitySelector.disabled = false;

            // Show the dropdown arrow
            const arrow = quantitySelector.parentNode.querySelector('.nf-cart-item__variant-arrow');
            if (arrow) {
              arrow.classList.remove('hidden');
            }

            // Hide the loading indicator
            const loadingIndicator = quantitySelector.parentNode.querySelector('.quantity-loading-indicator');
            if (loadingIndicator) {
              loadingIndicator.classList.add('hidden');
            }
          }
        }
      });
  }

  updateLiveRegions(line, message) {
    // Check if line is an item key
    const isItemKey = typeof line === 'string' && line.includes(':');

    let lineItemError;

    if (isItemKey) {
      // Find error element by data attribute
      lineItemError = document.querySelector(`[data-item-key="${line}"] .cart-item__error-text`) ||
                      document.querySelector(`[data-drawer-item-key="${line}"] .cart-item__error-text`);
    } else {
      // Find error element by ID
      lineItemError =
        document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    }

    // Update error message if element exists
    if (lineItemError) {
      if (lineItemError.classList.contains('cart-item__error-text')) {
        lineItemError.textContent = message;
      } else if (lineItemError.querySelector('.cart-item__error-text')) {
        lineItemError.querySelector('.cart-item__error-text').textContent = message;
      }
    }

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.add('cart__items--disabled');

    // If line is an item key, we need to find the corresponding cart item
    const isItemKey = typeof line === 'string' && line.includes(':');

    let cartItemElements = [];
    let cartDrawerItemElements = [];

    if (isItemKey) {
      // Find loading spinners by data-item-key attribute - only select the spinners, not the cart items
      cartItemElements = this.querySelectorAll(`[data-item-key="${line}"] .loading__spinner`);
      cartDrawerItemElements = this.querySelectorAll(`[data-drawer-item-key="${line}"] .loading__spinner`);
    } else {
      // Find loading spinners by ID
      cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
      cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);
    }

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => {
      if (overlay) overlay.classList.remove('hidden');
    });

    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading(line) {
    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems.classList.remove('cart__items--disabled');

    // If line is an item key, we need to find the corresponding cart item
    const isItemKey = typeof line === 'string' && line.includes(':');

    let cartItemElements = [];
    let cartDrawerItemElements = [];

    if (isItemKey) {
      // Find loading spinners by data-item-key attribute - only select the spinners, not the cart items
      cartItemElements = this.querySelectorAll(`[data-item-key="${line}"] .loading__spinner`);
      cartDrawerItemElements = this.querySelectorAll(`[data-drawer-item-key="${line}"] .loading__spinner`);
    } else {
      // Find loading spinners by ID
      cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
      cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);
    }

    cartItemElements.forEach((overlay) => {
      if (overlay) overlay.classList.add('hidden');
    });

    cartDrawerItemElements.forEach((overlay) => {
      if (overlay) overlay.classList.add('hidden');
    });
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}
