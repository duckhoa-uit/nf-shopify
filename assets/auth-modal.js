/**
 * <auth-modal> — Login / Register / Recover dialog for unauthenticated customers.
 *
 * Wraps a native <dialog> element. Triggers are delegated:
 *   • Any [data-auth-trigger="login|register|recover"] click opens that panel.
 *   • Any [data-auth-required] click (account/wishlist icons, wishlist buttons)
 *     opens the login panel and prevents the default link nav for guests.
 *
 * Falls back gracefully:
 *   • If the user is on /account/login, /account/register, or /account/recover,
 *     the trigger's default link navigation is allowed.
 *   • If <dialog> is somehow unsupported, the original `href` on the trigger
 *     navigates to Shopify's standalone customer pages.
 */

const PASSWORD_RULES = {
  length: (v) => v.length >= 8,
  lowercase: (v) => /[a-z]/.test(v),
  uppercase: (v) => /[A-Z]/.test(v),
  number: (v) => /\d/.test(v),
  special: (v) => /[^A-Za-z0-9]/.test(v),
};

const AUTH_PATH_RE = /^\/account(\/(login|register|recover))?\/?$/;

class AuthModal extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    this.heading = this.querySelector('.auth-modal__heading');
    this.inner = this.querySelector('.auth-modal__inner');
    this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
    this.panels = {
      login: this.querySelector('[data-panel="login"]'),
      register: this.querySelector('[data-panel="register"]'),
      recover: this.querySelector('[data-panel="recover"]'),
    };
    this.headings = {
      login: this.dataset.headingLogin,
      register: this.dataset.headingRegister,
      recover: this.dataset.headingRecover,
    };
    this.triggerEl = null;
    this.activePanel = 'login';

    // Close button
    this.querySelector('[data-auth-close]')?.addEventListener('click', () => this.close());

    // Tab clicks + arrow-key navigation (WAI-ARIA Tabs pattern)
    for (const tab of this.tabs) {
      tab.addEventListener('click', () => this.switchTo(tab.dataset.tab));
      tab.addEventListener('keydown', (e) => this.#onTabKey(e));
    }

    // In-modal switch links (forgot password / back to login)
    this.addEventListener('click', (e) => {
      const link = e.target.closest('[data-auth-switch]');
      if (!link || !this.dialog.open) return;
      e.preventDefault();
      this.switchTo(link.dataset.authSwitch);
    });

    // Light-dismiss: click on ::backdrop area (target === dialog)
    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) this.close();
    });

    // Native <dialog> close (ESC, form method=dialog, .close())
    this.dialog.addEventListener('close', () => this.#onClose());

    // Global trigger delegation — works for dynamically inserted nodes too.
    document.addEventListener('click', (e) => this.#onDocumentClick(e));

    // Real-time password requirement feedback
    this.#wirePasswordValidation();
  }

  /* --------------------------------------------------------------------- *
   *  Public API
   * --------------------------------------------------------------------- */

  open(panel = 'login', trigger = null) {
    this.triggerEl = trigger ?? document.activeElement;
    this.switchTo(panel, { focusFirst: false });
    this.dialog.showModal(); // ✨ native focus trap, ESC, top-layer, inert siblings
    document.documentElement.classList.add('overflow-hidden');

    // Move focus to the first input *after* the entrance animation settles.
    requestAnimationFrame(() => {
      const target = this.panels[panel].querySelector('input:not([type="hidden"])');
      if (target) target.focus();
      else this.inner.focus();
    });
  }

  close() {
    if (!this.dialog.open) return;
    this.dialog.close();
  }

  switchTo(panel, { focusFirst = true } = {}) {
    if (!this.panels[panel]) return;
    this.activePanel = panel;

    for (const [name, el] of Object.entries(this.panels)) {
      el.toggleAttribute('hidden', name !== panel);
    }

    // Tabs only reflect login/register; recover hides the active state on both.
    for (const tab of this.tabs) {
      const selected = tab.dataset.tab === panel;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.setAttribute('tabindex', selected ? '0' : '-1');
    }

    if (this.headings[panel]) this.heading.textContent = this.headings[panel];

    if (focusFirst) {
      const target = this.panels[panel].querySelector('input:not([type="hidden"])');
      target?.focus();
    }
  }

  /* --------------------------------------------------------------------- *
   *  Private
   * --------------------------------------------------------------------- */

  #onClose() {
    document.documentElement.classList.remove('overflow-hidden');
    if (this.triggerEl && typeof this.triggerEl.focus === 'function') {
      this.triggerEl.focus();
    }
    this.triggerEl = null;
  }

  #onDocumentClick(e) {
    // Guests trying to access account / wishlist features.
    const required = e.target.closest('[data-auth-required]');
    if (required && !this.#isOnAuthPage()) {
      e.preventDefault();
      const panel = required.dataset.authRequired || 'login';
      this.open(panel, required);
      return;
    }

    // Explicit triggers anywhere on the page.
    const trigger = e.target.closest('[data-auth-trigger]');
    if (trigger && !this.#isOnAuthPage()) {
      e.preventDefault();
      this.open(trigger.dataset.authTrigger || 'login', trigger);
    }
  }

  #onTabKey(e) {
    const idx = this.tabs.indexOf(e.target);
    if (idx === -1) return;
    let next = null;

    switch (e.key) {
      case 'ArrowLeft':
        next = this.tabs[(idx - 1 + this.tabs.length) % this.tabs.length];
        break;
      case 'ArrowRight':
        next = this.tabs[(idx + 1) % this.tabs.length];
        break;
      case 'Home':
        next = this.tabs[0];
        break;
      case 'End':
        next = this.tabs[this.tabs.length - 1];
        break;
      default:
        return;
    }

    e.preventDefault();
    next.focus();
    this.switchTo(next.dataset.tab);
  }

  #isOnAuthPage() {
    return AUTH_PATH_RE.test(window.location.pathname);
  }

  #wirePasswordValidation() {
    // Live password-rule feedback applies ONLY to the register form.
    // The login form's password input must keep its native validity so that
    // legacy passwords (which may not satisfy the new register rules) still
    // submit successfully.
    const requirementsEl = this.panels.register?.querySelector('[data-password-requirements]');
    const passwordEl = this.panels.register?.querySelector(
      'input[type="password"][name="customer[password]"]'
    );
    if (!requirementsEl || !passwordEl) return;

    const items = Object.fromEntries(
      Array.from(requirementsEl.querySelectorAll('[data-rule]')).map((el) => [el.dataset.rule, el])
    );

    // Progressive disclosure: only reveal once user has interacted.
    const reveal = () => requirementsEl.setAttribute('data-touched', '');
    passwordEl.addEventListener('focus', reveal, { once: true });

    passwordEl.addEventListener('input', () => {
      let allValid = true;
      for (const [rule, test] of Object.entries(PASSWORD_RULES)) {
        const valid = test(passwordEl.value);
        items[rule]?.classList.toggle('is-valid', valid);
        items[rule]?.classList.toggle('is-invalid', !valid && passwordEl.value.length > 0);
        if (!valid) allValid = false;
      }
      passwordEl.setCustomValidity(
        allValid || passwordEl.value.length === 0 ? '' : 'Password must meet all requirements'
      );
    });
  }
}

customElements.define('auth-modal', AuthModal);
