class CartNotification extends HTMLElement {
  constructor() {
    super();
    this.overlay = this.querySelector('.layer_cart_overlay');
    this.notification = this.querySelector('#cart-notification');
    this.wrapper = this.querySelector('.cart-notification-wrapper');
    this.closeButton = this.querySelector('.cart-notification__close');
    this.continueButton = this.querySelector('.continue-shopping');
    this.onBodyClick = this.handleBodyClick.bind(this);
    this.bindEvents();
  }

  bindEvents() {
    this.closeButton?.addEventListener('click', this.close.bind(this));
    this.continueButton?.addEventListener('click', this.close.bind(this));
    this.overlay?.addEventListener('click', this.close.bind(this));

    document.addEventListener('keyup', (event) => {
      if (event.code === 'Escape') this.close();
    });
  }

  open() {
    if (!this.notification || !this.wrapper || !this.overlay) return;

    // Remove inline styles
    this.style.display = 'block';
    this.notification.style.display = 'block';

    // Show all children elements
    const elements = this.querySelectorAll('[style*="display: none"]');
    elements.forEach(el => el.style.display = '');

    // Add active classes
    this.notification.classList.add('active');
    this.wrapper.classList.add('active');
    this.overlay.classList.add('active');

    document.body.style.overflow = 'hidden';
    document.addEventListener('click', this.onBodyClick);
  }

  close() {
    if (!this.notification || !this.wrapper || !this.overlay) return;

    this.notification.classList.remove('active');
    this.wrapper.classList.remove("active");
    this.overlay.classList.remove("active");

    document.body.style.overflow = "";
    document.removeEventListener("click", this.onBodyClick);

    // Reset inline styles to hide everything
    setTimeout(() => {
      this.style.display = "none";
      this.notification.style.display = "none";

      const elements = this.querySelectorAll(
        ".cart-notification__header, .cart-notification__success, .cart-notification__checkmark, .cart-notification__heading, .cart-notification__close, .cart-notification-product, .cart-notification__links, .button",
      );
      elements.forEach((el) => (el.style.display = "none"));
    }, 100);
  }

  renderContents(parsedState) {
    // If we're on cart page, don't show notification but trigger reload
    if (window.isCartPage) {
      // Trigger reload to refresh cart items
      setTimeout(() => {
        window.location.reload();
      }, 500); // Small delay to ensure cart update is processed

      return;
    }

    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      document.getElementById(section.id).innerHTML = this.getSectionInnerHTML(
        parsedState.sections[section.id],
        section.selector
      );
    });

    if (this.header) this.header.reveal();
    this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !this.notification.contains(target) &&
        target !== this.closeButton && !this.closeButton.contains(target)) {
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }

  continueShopping(event) {
    event.preventDefault();
    this.close();
  }
}

customElements.define('cart-notification', CartNotification);
