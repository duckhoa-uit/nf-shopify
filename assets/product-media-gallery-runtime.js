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

  const mediaFilename = (url) => url.split("/").pop().split("?")[0].toLowerCase();

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
      if (!colorControl || !document.documentElement.contains(colorControl)) return;

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
      this.processMediaTimeout = setTimeout(() => {
        this.processMediaTimeout = null;
        this.render();
      }, CONFIG.debounceMs);
      this.timers.add(this.processMediaTimeout);
    }

    render() {
      if (this.isDestroyed) return;

      const mediaUrls = this.data.allMedia.map((media) =>
        media.media_type === "video" && media.preview_image ? media.preview_image.src : media.src,
      );
      const videos = this.data.allMedia.filter((media) => media.media_type === "video");
      let filteredUrls =
        typeof window.filterMediaByColor === "function"
          ? window.filterMediaByColor(mediaUrls, this.root.dataset.activeColor, this.data.colorMappings)
          : mediaUrls;

      const videoPreviewUrls = videos.map((video) => video.preview_image?.src).filter(Boolean);
      filteredUrls = [...new Set([...filteredUrls, ...videoPreviewUrls])];

      let images =
        typeof window.sortImagesByDisplayRules === "function"
          ? window.sortImagesByDisplayRules(filteredUrls, this.data.colorMappings)
          : filteredUrls.map((url) => ({ url, hidden: false }));
      images = this.reorderVideos(images, videos);
      images.forEach((image, index) => {
        image.hidden = index >= CONFIG.visibleCount;
      });

      if (!images.length) {
        images = this.fallbackImages();
      }

      this.renderImages(images);
    }

    reorderVideos(images, videos) {
      if (!videos.length) return images;

      const videoItems = images.filter((item) =>
        videos.some((video) => {
          const preview = video.preview_image?.src;
          return preview && (item.url === preview || item.url.includes(preview.split("?")[0]));
        }),
      );
      const imageItems = images.filter((item) => !videoItems.includes(item));
      if (!videoItems.length || !imageItems.length) return images;

      return [imageItems[0], ...videoItems, ...imageItems.slice(1)];
    }

    fallbackImages() {
      const fallback = this.data.allMedia
        .map((media) => (media.media_type === "video" && media.preview_image ? media.preview_image.src : media.src))
        .filter(Boolean)
        .slice(0, 2);

      return fallback.length
        ? fallback.map((url) => ({ url, hidden: false }))
        : [{ url: "placeholder", hidden: false }];
    }

    renderImages(images) {
      this.destroySwiper();
      this.sliderWrapper.replaceChildren();
      this.grid.replaceChildren();

      const normalizedImages = images.length === 1 ? [images[0], images[0]] : images;
      const firstUrl = normalizedImages[0]?.url;

      for (const [index, image] of normalizedImages.entries()) {
        const mediaItem = this.createMediaItem(image.url, index);
        if (!mediaItem) continue;

        this.sliderWrapper.appendChild(mediaItem.cloneNode(true));

        if (index === 0 || image.url !== firstUrl) {
          if (image.hidden && !this.isExpanded) mediaItem.classList.add("hidden");
          if (image.hidden) mediaItem.classList.add("expandable-item");
          this.grid.appendChild(mediaItem);
        }
      }

      this.updateToggle(normalizedImages);
      this.initializeSwiper();
      this.mobileGallery.classList.add("loaded");
      this.grid.classList.add("loaded");
      this.ensureVideosAutoplay();
    }

    createMediaItem(url, index) {
      const mediaObject = this.data.allMedia.find((media) => {
        const source = media.media_type === "video" ? media.preview_image?.src : media.src;
        return source && mediaFilename(url) === mediaFilename(source);
      });
      const mediaId = mediaObject?.id || `generated-${index}`;
      const item = document.createElement("div");
      item.className = `swiper-slide product__media-item${index === 0 ? " is-active" : ""}`;
      item.id = `Slide-${this.sectionId}-${mediaId}`;
      item.dataset.mediaId = `${this.sectionId}-${mediaId}`;
      item.dataset.mediaType = mediaObject?.media_type || "image";

      const wrapper = document.createElement("div");
      wrapper.className = "product__media media relative w-full h-0";
      wrapper.style.cssText = "--ratio: 1; --preview-ratio: 1; padding-bottom: 100%;";
      const content = document.createElement("div");
      content.className = "absolute inset-0 w-full h-full";

      if (mediaObject?.media_type === "video") {
        content.appendChild(this.createVideo(mediaObject));
      } else if (url === "placeholder") {
        content.appendChild(this.createPlaceholder());
      } else {
        const image = document.createElement("img");
        image.src = mediaObject?.src || url;
        image.alt = mediaObject?.alt || "Product image";
        image.className = "media-item w-full h-full object-cover product-lightbox-img";
        image.loading = index === 0 ? "eager" : "lazy";
        if (mediaObject?.width) image.width = mediaObject.width;
        if (mediaObject?.height) image.height = mediaObject.height;
        image.addEventListener("click", (event) => {
          event.preventDefault();
          this.openLightbox(index);
        });
        content.appendChild(image);
      }

      wrapper.appendChild(content);
      item.appendChild(wrapper);
      return item;
    }

    createPlaceholder() {
      const placeholder = document.createElement("div");
      placeholder.className = "w-full h-full bg-gray-100 flex items-center justify-center";
      placeholder.innerHTML = '<span aria-hidden="true"></span>';
      return placeholder;
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
      if (!window.Fancybox) return;

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
    }

    openVideoLightbox(sources, poster) {
      if (!window.Fancybox || !sources.length) return;

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

  const loadUtilities = async () => {
    if (
      typeof window.parseImageUrl === "function" &&
      typeof window.filterMediaByColor === "function" &&
      typeof window.sortImagesByDisplayRules === "function"
    ) {
      return;
    }

    const utils = await import("./product-utils.module.js");
    window.parseImageUrl = utils.parseImageUrl;
    window.sortImagesByDisplayRules = utils.sortImagesByDisplayRules;
    window.filterMediaByColor = utils.filterMediaByColor;
  };

  const bootstrap = () => {
    loadUtilities()
      .catch(() => {})
      .finally(initialize);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }

  window.ProductMediaGalleryController = ProductMediaGalleryController;
})();
