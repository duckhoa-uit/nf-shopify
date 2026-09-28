if (!customElements.get("collection-description-toggle")) {
  class CollectionDescriptionToggle extends HTMLElement {
    connectedCallback() {
      const button = this.querySelector("[data-collection-read-more]");
      const panel = this.querySelector("[data-collection-description-panel]");
      const preview = this.querySelector("[data-collection-description-preview]");

      if (!button || !panel || button.dataset.bound === "true") return;

      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        const willExpand = button.getAttribute("aria-expanded") !== "true";

        button.setAttribute("aria-expanded", willExpand ? "true" : "false");
        panel.hidden = !willExpand;

        if (preview) preview.hidden = willExpand;
      });
    }
  }

  customElements.define("collection-description-toggle", CollectionDescriptionToggle);
}
