/**
 * Product media gallery runtime.
 *
 * The gallery is intentionally section-scoped. Shopify can replace a product
 * section without reloading the page, so every controller owns its listeners,
 * subscriptions, timers, and Swiper instance.
 */

(() => {
  "use strict";

  if (window.__productMediaGalleryRuntimeLoaded) return;
  window.__productMediaGalleryRuntimeLoaded = true;

  const CONFIG = Object.freeze({
    visibleCount: 6,
    mobileBreakpoint: 768,
    videoRetryDelays: [100, 300, 800],
    debounceMs: 300,
  });

  const parseJson = (element, fallback) => {
    if (!element?.textContent) return fallback;

    try {
      return JSON.parse(element.textContent);
    } catch {
      return fallback;
    }
  };

  const getGalleryData = (root) => ({
    allMedia: parseJson(root.querySelector("[data-gallery-media]"), []),
    colorMappings: parseJson(root.querySelector("[data-gallery-colors]"), null),
    options: parseJson(root.querySelector("[data-gallery-options]"), {}),
  });

  // Shared Fancybox loader shared across all gallery instances on the page, so a
  // single <script>/<link> is injected the first time any lightbox opens.
  let fancyboxPromise = null;

  class ProductMediaGalleryController {
    constructor(root) {
      this.root = root;
      this.data = getGalleryData(root);
      this.sectionId = root.dataset.sectionId;
      this.subscriptions = [];
      this.timers = new Set();
      this.swiper = null;
      this.processMediaTimeout = null;
      this.isDestroyed = false;
      this.isExpanded = false;
      this.sequence = [];
      this.hasHydrated = false;

      this.handleDocumentChange = this.handleDocumentChange.bind(this);
      this.handleVariantChange = this.handleVariantChange.bind(this);
      this.handleResize = this.handleResize.bind(this);
      this.handleSectionUnload = this.handleSectionUnload.bind(this);
    }

    init() {
      if (this.isDestroyed || this.root.dataset.galleryInitialized === "true") return;

      this.sliderWrapper = this.root.querySelector("[data-gallery-slider]");
      this.grid = this.root.querySelector("[data-gallery-grid]");
      this.mobileGallery = this.root.querySelector("[data-gallery-mobile]");
      this.toggleContainer = this.root.querySelector("[data-gallery-toggle-container]");
      this.toggleButton = this.root.querySelector("[data-gallery-toggle]");

      if (!this.sliderWrapper || !this.grid || !this.mobileGallery) return;

      this.root.dataset.galleryInitialized = "true";
      this.bindListeners();
      this.processMedia();
    }

    destroy() {
      if (this.isDestroyed) return;

      this.isDestroyed = true;
      this.root.dataset.galleryInitialized = "false";
      document.removeEventListener("change", this.handleDocumentChange);
      document.removeEventListener("shopify:section:unload", this.handleSectionUnload);
      window.removeEventListener("resize", this.handleResize);

      if (this.processMediaTimeout) {
        clearTimeout(this.processMediaTimeout);
        this.processMediaTimeout = null;
      }

      for (const timer of this.timers) clearTimeout(timer);
      this.timers.clear();

      for (const unsubscribe of this.subscriptions) {
        if (typeof unsubscribe === "function") unsubscribe();
      }
      this.subscriptions = [];

      if (this.swiper?.destroy) this.swiper.destroy(true, true);
      this.swiper = null;
    }

    bindListeners() {
      document.addEventListener("change", this.handleDocumentChange);
      document.addEventListener("shopify:section:unload", this.handleSectionUnload);
      window.addEventListener("resize", this.handleResize);

      if (typeof subscribe === "function" && typeof PUB_SUB_EVENTS === "object") {
        const unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, this.handleVariantChange);
        if (typeof unsubscribe === "function") this.subscriptions.push(unsubscribe);
      }
    }

    handleSectionUnload(event) {
      if (event.detail?.sectionId === this.sectionId) this.destroy();
    }

    handleDocumentChange(event) {
      const colorControl = event.target.closest?.('[data-option-type="color"]');
      if (!colorControl || !this.root.contains(colorControl)) return;

      const value = event.target.value;
      if (value) this.handleColorChange(value);
    }

    handleVariantChange(event) {
      const data = event?.data;
      if (!data || data.sectionId !== this.sectionId || !data.variant) return;

      const { options, title } = data.variant;
      const colorIndex = Number(this.data.options.colorOptionIndex);
      const color = colorIndex >= 0 && options?.[colorIndex] ? options[colorIndex] : title?.split("/")[0]?.trim();

      if (color) this.handleColorChange(color);
    }

    handleColorChange(value) {
      const resolvedColor = this.resolveColor(value);
      if (!resolvedColor || resolvedColor === this.root.dataset.activeColor) return;

      this.root.dataset.activeColor = resolvedColor;
      this.processMedia();
    }

    resolveColor(value) {
      if (value === null || value === undefined || value === "") return "";

      const rawValue = value.toString().trim();
      const numericValue = Number.parseInt(rawValue, 10);
      if (!Number.isNaN(numericValue) && numericValue.toString() === rawValue) {
        return rawValue;
      }

      const normalized = rawValue
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/['.,]/g, "")
        .replace(/\/+/g, "-")
        .replace(/-+$/, "");
      const referenceId = this.data.options.colorValueToReferenceId?.[normalized];

      return referenceId === undefined || referenceId === null ? normalized : referenceId.toString();
    }

    processMedia() {
      if (this.isDestroyed) return;

      if (this.processMediaTimeout) clearTimeout(this.processMediaTimeout);
      const timer = setTimeout(() => {
        this.processMediaTimeout = null;
        this.timers.delete(timer);
        this.render();
      }, CONFIG.debounceMs);
      this.processMediaTimeout = timer;
      this.timers.add(timer);
    }

    render() {
      if (this.isDestroyed) return;

      this.loadSequenceResolver().then((resolveProductMediaSequence) => {
        if (this.isDestroyed) return;
        const initialMediaId = this.hasHydrated ? null : this.root.dataset.initialMediaId;
        this.sequence = resolveProductMediaSequence({
          media: this.data.allMedia,
          activeColor: this.root.dataset.activeColor,
          colorMappings: this.data.colorMappings,
          initialMediaId,
          visibleCount: CONFIG.visibleCount,
        });
        this.renderImages(this.sequence);
        this.hasHydrated = true;
      });
    }

    async loadSequenceResolver() {
      const module = await import("./product-media-gallery-sequence.js");
      return module.resolveProductMediaSequence;
    }

    renderImages(sequence) {
      this.destroySwiper();
      if (!sequence.length) {
        this.mobileGallery.classList.add("loaded");
        this.grid.classList.add("loaded");
        return;
      }

      this.reconcileContainer(this.sliderWrapper, sequence, true);
      this.reconcileContainer(this.grid, sequence, false);
      this.updateToggle(sequence);
      this.initializeSwiper();
      this.mobileGallery.classList.add("loaded");
      this.grid.classList.add("loaded");
      this.ensureVideosAutoplay();
    }

    reconcileContainer(container, sequence, isMobile) {
      container.querySelector("#desktop-gallery-loading")?.remove();
      const existingItems = [...container.children].filter((child) => child.matches?.("[data-gallery-item]"));
      const existingById = new Map(existingItems.map((item) => [item.dataset.galleryMediaId, item]));
      const retained = new Set();
      const fragment = document.createDocumentFragment();

      for (const [index, item] of sequence.entries()) {
        const mediaId = String(item.mediaId || `generated-${index}`);
        let mediaItem = existingById.get(mediaId);
        if (!mediaItem) mediaItem = this.createMediaItem(item, index);
        if (!mediaItem) continue;

        const preserveFirstImage =
          index === 0 &&
          !mediaItem.dataset.galleryHydrated &&
          mediaItem.dataset.galleryMediaId === mediaId &&
          item.mediaType === "image";
        this.updateMediaItem(mediaItem, item, index, isMobile, preserveFirstImage);
        mediaItem.dataset.galleryHydrated = "true";
        retained.add(mediaItem);
        fragment.appendChild(mediaItem);
      }

      for (const existingItem of existingItems) {
        if (!retained.has(existingItem)) existingItem.remove();
      }
      container.appendChild(fragment);
    }

    createMediaItem(sequenceItem, index) {
      const mediaId = sequenceItem.mediaId || `generated-${index}`;
      const mediaItem = document.createElement("div");
      mediaItem.className = "swiper-slide product__media-item";
      mediaItem.dataset.galleryItem = "true";

      const wrapper = document.createElement("div");
      wrapper.className = "product__media media relative w-full h-0";
      wrapper.style.cssText = "--ratio: 1; --preview-ratio: 1; aspect-ratio: 1; padding-bottom: 100%;";
      const content = document.createElement("div");
      content.className = "absolute inset-0 w-full h-full";

      wrapper.appendChild(content);
      mediaItem.appendChild(wrapper);
      this.updateMediaItem(mediaItem, sequenceItem, index, true);
      return mediaItem;
    }

    updateMediaItem(item, sequenceItem, index, isMobile, preserveFirstImage = false) {
      const media = sequenceItem.media;
      const mediaId = String(sequenceItem.mediaId || `generated-${index}`);
      item.id = `Slide-${this.sectionId}-${isMobile ? "mobile" : "desktop"}-${mediaId}`;
      item.dataset.mediaId = mediaId;
      item.dataset.galleryMediaId = mediaId;
      item.dataset.mediaType = sequenceItem.mediaType || "image";
      item.classList.toggle("is-active", index === 0);
      item.classList.toggle("hidden", Boolean(sequenceItem.hidden && !this.isExpanded && !isMobile));
      item.classList.toggle("expandable-item", Boolean(sequenceItem.hidden && !isMobile));

      const wrapper = item.querySelector(".product__media") || item.firstElementChild;
      const content = wrapper?.firstElementChild;
      if (!wrapper || !content) return;
      const image = media?.media_type === "image" ? media : media?.preview_image;
      const ratio = image?.width && image?.height ? image.width / image.height : 1;
      wrapper.style.cssText = `--ratio: ${ratio}; --preview-ratio: ${ratio}; aspect-ratio: ${ratio}; padding-bottom: ${100 / ratio}%;`;

      if (media?.media_type === "video") {
        if (!content.querySelector("video")) {
          this.setContent(content, this.createVideo(media));
        }
        return;
      }

      if (media?.media_type === "model") {
        this.setContent(content, this.createModel(media));
        return;
      }

      if (media?.media_type === "external_video") {
        this.setContent(content, this.createExternalVideo(media));
        return;
      }

      if (!image?.src) {
        this.setContent(content, this.createPlaceholder());
        return;
      }

      let imageElement = content.querySelector("img");
      if (!imageElement) {
        imageElement = document.createElement("img");
        this.setContent(content, imageElement);
      }
      if (!preserveFirstImage) {
        imageElement.src = this.buildImageUrl(image.src, 800);
        imageElement.srcset = this.buildImageSrcset(image.src);
        imageElement.sizes = "(min-width: 990px) 66vw, 100vw";
      }
      imageElement.alt = image.alt || this.data.options.productTitle || "Product image";
      imageElement.className = "media-item w-full h-full object-cover product-lightbox-img";
      imageElement.loading = index === 0 ? "eager" : "lazy";
      imageElement.decoding = "async";
      if (index === 0) imageElement.fetchPriority = "high";
      if (image.width) imageElement.width = image.width;
      if (image.height) imageElement.height = image.height;
      imageElement.onclick = (event) => {
        event.preventDefault();
        this.openLightbox(index);
      };
    }

    buildImageUrl(src, width) {
      if (!src) return src;
      const separator = src.includes("?") ? "&" : "?";
      return `${src}${separator}width=${width}`;
    }

    buildImageSrcset(src) {
      if (!src) return "";
      const widths = [360, 540, 720, 900, 1080, 1296, 1512, 1800];
      return widths.map((width) => `${this.buildImageUrl(src, width)} ${width}w`).join(", ");
    }

    setContent(container, content) {
      while (container.firstChild) container.removeChild(container.firstChild);
      container.appendChild(content);
    }

    createPlaceholder() {
      const placeholder = document.createElement("div");
      placeholder.className = "w-full h-full bg-gray-100 flex items-center justify-center";
      placeholder.innerHTML = '<span aria-hidden="true"></span>';
      return placeholder;
    }

    createModel(media) {
      const model = document.createElement("model-viewer");
      model.className = "w-full h-full";
      model.setAttribute("alt", media.alt || this.data.options.productTitle || "Product model");
      if (media.sources?.[0]?.url) model.setAttribute("src", media.sources[0].url);
      if (media.preview_image?.src) model.setAttribute("poster", media.preview_image.src);
      return model;
    }

    createExternalVideo(media) {
      const frame = document.createElement("div");
      frame.className = "external-video-container relative w-full h-full";
      const image = media.preview_image;
      if (image?.src) {
        const poster = document.createElement("img");
        poster.src = image.src;
        poster.alt = media.alt || this.data.options.productTitle || "Product video";
        poster.className = "w-full h-full object-cover";
        poster.loading = "lazy";
        frame.appendChild(poster);
      }
      return frame;
    }

    createVideo(media) {
      const container = document.createElement("div");
      container.className = "video-container relative w-full h-full";
      const video = document.createElement("video");
      video.className = "w-full h-full object-cover";
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute("playsinline", "");
      video.setAttribute("muted", "");
      video.setAttribute("autoplay", "");
      if (media.preview_image?.src) video.poster = media.preview_image.src;

      for (const source of media.sources || []) {
        const sourceElement = document.createElement("source");
        sourceElement.src = source.url;
        sourceElement.type = source.mime_type;
        video.appendChild(sourceElement);
      }

      video.addEventListener("error", () => {
        video.hidden = true;
      });
      container.appendChild(video);
      container.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.openVideoLightbox(media.sources || [], media.preview_image?.src);
      });
      return container;
    }

    updateToggle(images) {
      if (!this.toggleContainer || !this.toggleButton) return;

      const hasHidden = images.some((image) => image.hidden);
      this.toggleContainer.classList.toggle("hidden", !hasHidden);
      this.toggleContainer.classList.toggle("visible", hasHidden && window.innerWidth >= CONFIG.mobileBreakpoint);
      this.toggleButton.textContent = this.isExpanded
        ? this.data.options.lessImagesText
        : this.data.options.moreImagesText;
      this.toggleButton.onclick = hasHidden
        ? () => {
            this.isExpanded = !this.isExpanded;
            this.grid.querySelectorAll(".expandable-item").forEach((item) => {
              item.classList.toggle("hidden", !this.isExpanded);
            });
            this.toggleButton.textContent = this.isExpanded
              ? this.data.options.lessImagesText
              : this.data.options.moreImagesText;
          }
        : null;
    }

    initializeSwiper() {
      if (typeof Swiper !== "function") return;

      const pagination = this.mobileGallery.querySelector(".swiper-pagination");
      this.swiper = new Swiper(this.mobileGallery, {
        slidesPerView: 1,
        spaceBetween: 0,
        watchOverflow: false,
        pagination: {
          el: pagination,
          type: "bullets",
          clickable: true,
        },
      });
    }

    destroySwiper() {
      if (this.swiper?.destroy) this.swiper.destroy(true, true);
      this.swiper = null;
    }

    ensureVideosAutoplay() {
      const videos = this.root.querySelectorAll(".product__media video");
      for (const video of videos) {
        const play = () => video.play().catch(() => {});
        if (video.readyState >= 2) {
          play();
        } else {
          video.addEventListener("canplay", play, { once: true });
        }

        for (const delay of CONFIG.videoRetryDelays) {
          const timer = setTimeout(() => {
            if (!this.isDestroyed && video.paused) play();
            this.timers.delete(timer);
          }, delay);
          this.timers.add(timer);
        }
      }
    }

    openLightbox(startIndex) {
      this.loadFancybox().then(() => {
        if (this.isDestroyed || !window.Fancybox) return;

        const items = [...this.grid.querySelectorAll("img.product-lightbox-img")].map((image) => ({
          src: image.currentSrc || image.src,
          type: "image",
          caption: image.alt || "",
        }));
        if (!items.length) return;

        window.Fancybox.show(items, {
          startIndex: Math.min(startIndex, items.length - 1),
          dragToClose: false,
          Thumbs: { type: "classic" },
          Caption: false,
        });
      });
    }

    openVideoLightbox(sources, poster) {
      if (!sources.length) return;

      this.loadFancybox().then(() => {
        if (this.isDestroyed || !window.Fancybox) return;

        const sourceTags = sources
          .filter((source) => source?.url)
          .map((source) => `<source src="${source.url}" type="${source.mime_type || ""}">`)
          .join("");
        const posterAttribute = poster ? ` poster="${poster}"` : "";

        window.Fancybox.show(
          [
            {
              src: `<video controls autoplay playsinline${posterAttribute}>${sourceTags}</video>`,
              type: "html",
            },
          ],
          {
            dragToClose: false,
            Toolbar: false,
            Caption: false,
          },
        );
      });
    }

    loadFancybox() {
      if (window.Fancybox) return Promise.resolve();
      if (fancyboxPromise) return fancyboxPromise;

      fancyboxPromise = new Promise((resolve) => {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.css";
        document.head.appendChild(css);

        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@fancyapps/ui@5.0/dist/fancybox/fancybox.umd.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
      });

      return fancyboxPromise;
    }

    handleResize() {
      if (!this.toggleContainer) return;

      const hasHidden = this.grid.querySelector(".expandable-item");
      this.toggleContainer.classList.toggle(
        "visible",
        Boolean(hasHidden) && window.innerWidth >= CONFIG.mobileBreakpoint,
      );
    }
  }

  const controllers = new Map();

  const initializeGalleries = (scope = document) => {
    const roots = [];
    if (scope.matches?.("media-gallery[data-section-id]")) roots.push(scope);
    roots.push(...(scope.querySelectorAll?.("media-gallery[data-section-id]") || []));

    for (const root of roots) {
      if (!controllers.has(root)) {
        const controller = new ProductMediaGalleryController(root);
        controllers.set(root, controller);
        controller.init();
      }
    }
  };

  const destroyGallery = (root) => {
    const controller = controllers.get(root);
    if (!controller) return;
    controller.destroy();
    controllers.delete(root);
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) initializeGalleries(node);
      }
      for (const node of mutation.removedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        for (const [root] of controllers) {
          if (root === node || node.contains(root)) destroyGallery(root);
        }
      }
    }
  });

  const initialize = () => {
    initializeGalleries(document);
    observer.observe(document.body, { childList: true, subtree: true });
  };

  const bootstrap = () => {
    initialize();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
