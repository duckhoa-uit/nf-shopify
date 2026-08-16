if (!customElements.get("media-gallery")) {
  customElements.define(
    "media-gallery",
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
        };
        this.mql = window.matchMedia("(min-width: 750px)");

        if (!this.elements.thumbnails) return;
        this.elements.thumbnails.querySelectorAll("[data-target]").forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector("button")
            .addEventListener("click", this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia = this.querySelector(`[data-media-id="${mediaId}"]`);
        if (!activeMedia) return;

        this.querySelectorAll("[data-media-id]").forEach((element) => {
          element.classList.remove("is-active");
        });
        activeMedia.classList.add("is-active");

        this.preventStickyHeader();
        this.playActiveMedia(activeMedia);

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll("button")
          .forEach((element) => element.removeAttribute("aria-current"));
        thumbnail.querySelector("button").setAttribute("aria-current", true);
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector(".product__modal-opener--image img");
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute("aria-hidden", false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace("[index]", position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute("aria-hidden", true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector(".deferred-media");
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector("sticky-header");
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event("preventHeaderReveal"));
      }
    },
  );
}
