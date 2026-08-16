if (!customElements.get("automatic-discount-badge")) {
  customElements.define(
    "automatic-discount-badge",
    class AutomaticDiscountBadge extends HTMLElement {
      connectedCallback() {
        if (this.variantChangeUnsubscriber || !this.dataset.sectionId) return;
        if (typeof subscribe !== "function" || typeof PUB_SUB_EVENTS !== "object") return;

        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (event.data.sectionId !== this.dataset.sectionId) return;

          const source = event.data.html?.getElementById(this.id);
          if (source) this.innerHTML = source.innerHTML;
        });
      }

      disconnectedCallback() {
        this.variantChangeUnsubscriber?.();
        this.variantChangeUnsubscriber = undefined;
      }
    },
  );
}
