/**
 * Order Reorder Functionality
 *
 * This script handles the reorder functionality for past orders.
 * It adds all items from a past order to the cart and redirects to the cart page.
 */
class OrderReorder {
  constructor() {
    // Get translation strings from the DOM
    this.strings = {
      reorderError: document.getElementById('orders')?.getAttribute('data-reorder-error') ||
                   (window.theme?.strings?.reorder_error || 'Failed to reorder items. Please try again.')
    };

    this.initEventListeners();
  }

  initEventListeners() {
    // Find all reorder buttons
    const reorderButtons = document.querySelectorAll('.btn-reorder');

    // Add click event listener to each button
    reorderButtons.forEach(button => {
      button.addEventListener('click', this.handleReorder.bind(this));
    });
  }

  async handleReorder(event) {
    event.preventDefault();

    const button = event.currentTarget;
    const variantsData = button.getAttribute('data-variants');

    if (!variantsData) {
      console.error('No variant data found for this order');
      return;
    }

    // Parse the variants data
    const variantItems = this.parseVariantsData(variantsData);

    if (variantItems.length === 0) {
      console.error('Failed to parse variant data');
      return;
    }

    // Show loading state
    button.classList.add('loading');
    button.setAttribute('disabled', 'disabled');

    try {
      // Get current cart
      const currentCart = await this.getCart();

      // Merge items with current cart
      const updatedItems = this.mergeWithCart(currentCart, variantItems);

      // Update cart with merged items
      await this.updateCart(updatedItems);

      // Redirect to cart page
      window.location.href = '/cart';

    } catch (error) {
      console.error('Error reordering items:', error);

      // Show specific error message if available, otherwise show generic message
      const errorMessage = error.message || this.strings.reorderError;

      // Create and show notification
      this.showNotification(errorMessage, 'error', button);

      // Remove loading state
      button.classList.remove('loading');
      button.removeAttribute('disabled');
    }
  }

  /**
   * Shows a notification message to the user
   * @param {string} message - The message to display
   * @param {string} type - The type of notification (error, success, etc.)
   * @param {HTMLElement} targetElement - The element to position the notification near
   */
  showNotification(message, type, targetElement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `reorder-notification reorder-notification--${type}`;
    notification.textContent = message;

    // Position the notification near the target element
    const targetRect = targetElement.getBoundingClientRect();
    const orderItem = targetElement.closest('.order-item');

    if (orderItem) {
      // Append to the order item for proper positioning
      orderItem.style.position = 'relative';
      orderItem.appendChild(notification);

      // Position the notification
      notification.style.position = 'absolute';
      notification.style.bottom = '10px';
      notification.style.left = '50%';
      notification.style.transform = 'translateX(-50%)';
      notification.style.zIndex = '100';

      // Auto-remove after 5 seconds
      setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
          notification.remove();
        }, 500);
      }, 4000);
    } else {
      // Fallback to alert if we can't position properly
      alert(message);
    }
  }

  parseVariantsData(variantsData) {
    try {
      // Format: "variantId:quantity,variantId:quantity,..."
      return variantsData.split(',').map(item => {
        const [variantId, quantity] = item.split(':');
        return {
          id: parseInt(variantId, 10),
          quantity: parseInt(quantity, 10)
        };
      }).filter(item => !isNaN(item.id) && !isNaN(item.quantity));
    } catch (error) {
      console.error('Error parsing variants data:', error);
      return [];
    }
  }

  async getCart() {
    try {
      const response = await fetch('/cart.js');

      if (!response.ok) {
        throw new Error('Failed to get cart');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting cart:', error);
      throw error;
    }
  }

  mergeWithCart(cart, newItems) {
    // Create a map of existing items in the cart by variant ID
    const existingItems = {};
    cart.items.forEach(item => {
      existingItems[item.variant_id] = item;
    });

    // Create an array to hold the updated items
    const updatedItems = [];

    // Process the new items
    newItems.forEach(newItem => {
      // If the variant already exists in the cart, use the quantity from the reorder
      if (existingItems[newItem.id]) {
        updatedItems.push({
          id: newItem.id,
          quantity: newItem.quantity
        });
        // Remove from existingItems so we don't add it again
        delete existingItems[newItem.id];
      } else {
        // If the variant doesn't exist in the cart, add it as a new item
        updatedItems.push({
          id: newItem.id,
          quantity: newItem.quantity
        });
      }
    });

    // Add remaining items from the cart that weren't in the reorder
    Object.values(existingItems).forEach(item => {
      updatedItems.push({
        id: item.variant_id,
        quantity: item.quantity
      });
    });

    return updatedItems;
  }

  async updateCart(items) {
    try {
      // First clear the cart
      const clearResponse = await fetch('/cart/clear.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!clearResponse.ok) {
        throw new Error('Failed to clear cart');
      }

      // Then add all the merged items
      const addResponse = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
      });

      if (!addResponse.ok) {
        // Try to get the detailed error message from the response
        const errorData = await addResponse.json();
        if (errorData && errorData.message) {
          throw new Error(errorData.message);
        } else {
          throw new Error('Failed to add items to cart');
        }
      }

      return await addResponse.json();
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  }
}

// Initialize the reorder functionality when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OrderReorder();
});
