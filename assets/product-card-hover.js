/**
 * Product Card Hover Functionality
 * Handles hover effects for product cards with event delegation
 * to work with dynamically loaded content (AJAX filters/sorting)
 */

class ProductCardHover {
  constructor() {
    this.imageCache = new Map();
    this.preloadQueue = new Set();
    this.intersectionObserver = null;
    this.initialized = false;

    this.init();
  }

  init() {
    if (this.initialized) return;

    // Setup intersection observer for viewport-based preloading
    this.setupIntersectionObserver();

    // Setup event delegation for hover effects
    this.setupEventDelegation();

    // Initialize existing product cards
    this.initializeProductCards();

    this.initialized = true;
  }

  // Preload image function with caching
  preloadImage(src, srcset = '') {
    if (this.imageCache.has(src) || this.preloadQueue.has(src)) {
      return this.imageCache.get(src) || Promise.resolve();
    }

    this.preloadQueue.add(src);

    const promise = new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.imageCache.set(src, img);
        this.preloadQueue.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        this.preloadQueue.delete(src);
        reject(new Error(`Failed to load ${src}`));
      };

      // Set srcset first if available for responsive loading
      if (srcset) {
        img.srcset = srcset;
      }
      img.src = src;
    });

    this.imageCache.set(src, promise);
    return promise;
  }

  // Hover intent detection with delay
  addHoverIntent(element, onIntent, delay = 150) {
    let hoverTimer;

    const handleMouseEnter = () => {
      hoverTimer = setTimeout(() => {
        onIntent();
      }, delay);
    };

    const handleMouseLeave = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // Return cleanup function
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      if (hoverTimer) {
        clearTimeout(hoverTimer);
      }
    };
  }

  // Setup Intersection Observer for viewport-based preloading
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const card = entry.target;
            this.preloadCardImages(card);
            // Stop observing this card after preloading
            this.intersectionObserver.unobserve(card);
          }
        });
      },
      {
        rootMargin: '50px', // Start preloading 50px before entering viewport
        threshold: 0.1,
      }
    );
  }

  // Preload images for a specific card
  preloadCardImages(card) {
    const productId = card.dataset.productId;
    const sectionId = card.dataset.sectionId;
    if (!productId || !sectionId) return;

    // Preload main hover image
    const mainImageSrc = card.dataset.mainImageSrc;
    const mainImageSrcset = card.dataset.mainImageSrcset;

    if (mainImageSrc) {
      this.preloadImage(mainImageSrc, mainImageSrcset).catch(() => {});
    }

    // Preload variant images (scoped to this section)
    const variantSwatches = document.querySelectorAll(`[data-product-id="${productId}"][data-section-id="${sectionId}"].variant-swatch`);
    variantSwatches.forEach((swatch) => {
      const variantImage = swatch.dataset.variantImage;
      const variantImageSrcset = swatch.dataset.variantImageSrcset;

      if (variantImage && variantImage !== 'placeholder') {
        this.preloadImage(variantImage, variantImageSrcset).catch(() => {});
      }
    });
  }

  // Setup event delegation for hover effects
  setupEventDelegation() {
    // Use event delegation on document body to catch all hover events
    document.body.addEventListener('mouseenter', this.handleMouseEnter.bind(this), true);
    document.body.addEventListener('mouseleave', this.handleMouseLeave.bind(this), true);
  }

  // Handle mouse enter events with delegation
  handleMouseEnter(event) {
    const productLink = event.target.closest('.card-product-northfinder__link');
    const variantSwatch = event.target.closest('.variant-swatch');

    if (productLink) {
      this.handleProductCardHover(productLink, true);
    } else if (variantSwatch) {
      this.handleVariantSwatchHover(variantSwatch, true);
    }
  }

  // Handle mouse leave events with delegation
  handleMouseLeave(event) {
    const productLink = event.target.closest('.card-product-northfinder__link');
    const variantSwatch = event.target.closest('.variant-swatch');

    if (productLink) {
      this.handleProductCardHover(productLink, false);
    } else if (variantSwatch) {
      this.handleVariantSwatchHover(variantSwatch, false);
    }
  }

  // Handle product card hover
  handleProductCardHover(card, isEntering) {
    const productId = card.dataset.productId;
    const sectionId = card.dataset.sectionId;
    if (!productId || !sectionId) return;

    const mainImageContainer = document.getElementById(`main-image-${sectionId}-${productId}`);
    if (!mainImageContainer) return;

    const mainImage = mainImageContainer.querySelector('img');
    if (!mainImage) return;

    // Store original image data
    const originalSrc = mainImageContainer.dataset.originalSrc;
    const originalSrcset = mainImageContainer.dataset.originalSrcset;

    // Get main image data (with -H suffix) from data attributes
    const mainImageSrc = card.dataset.mainImageSrc;
    const mainImageSrcset = card.dataset.mainImageSrcset;

    // Check if this product has a real main image (different from model image)
    const hasRealMainImage = card.dataset.hasRealMainImage === 'true';

    if (isEntering) {
      // Preload main image on hover intent
      if (mainImageSrc && !this.imageCache.has(mainImageSrc)) {
        this.preloadImage(mainImageSrc, mainImageSrcset).catch(() => {});
      }

      // Show main image (only if has real main image)
      if (hasRealMainImage && mainImageSrc && mainImageSrc !== originalSrc) {
        // Check if we're already showing the target image to avoid unnecessary reloads
        const currentImageUrl = new URL(mainImage.src, window.location.origin);
        const targetImageUrl = new URL(mainImageSrc, window.location.origin);

        // Compare base URLs without query parameters to avoid flash
        const currentBase = currentImageUrl.pathname;
        const targetBase = targetImageUrl.pathname;

        if (currentBase !== targetBase) {
          // Update img element
          mainImage.src = mainImageSrc;
          if (mainImageSrcset) {
            mainImage.srcset = mainImageSrcset;
          }
        }
      }
    } else {
      // Mouse leave - reset to original image
      if (hasRealMainImage) {
        // Preload original image if not cached (for faster reset next time)
        if (!this.imageCache.has(originalSrc)) {
          this.preloadImage(originalSrc, originalSrcset).catch(() => {});
        }

        // Always reset to the original model image on mouseleave
        mainImage.src = originalSrc;
        mainImage.srcset = originalSrcset;
      }
    }
  }

  // Handle variant swatch hover
  handleVariantSwatchHover(swatch, isEntering) {
    const productId = swatch.dataset.productId;
    const sectionId = swatch.dataset.sectionId;
    const variantImage = swatch.dataset.variantImage;
    const variantImageSrcset = swatch.dataset.variantImageSrcset;
    const mainImageContainer = document.getElementById(`main-image-${sectionId}-${productId}`);

    if (!mainImageContainer || !variantImage || !sectionId) return;

    const mainImage = mainImageContainer.querySelector('img');
    if (!mainImage) return;

    // Store original image data
    const originalSrc = mainImageContainer.dataset.originalSrc;
    const originalSrcset = mainImageContainer.dataset.originalSrcset;

    if (isEntering) {
      // Preload variant image
      if (variantImage && variantImage !== 'placeholder' && !this.imageCache.has(variantImage)) {
        this.preloadImage(variantImage, variantImageSrcset).catch(() => {});
      }

      // Show variant image
      if (variantImage && variantImage !== 'placeholder') {
        // Check if we're already showing the target variant image to avoid unnecessary reloads
        const currentImageUrl = new URL(mainImage.src, window.location.origin);
        const targetImageUrl = new URL(variantImage, window.location.origin);

        // Compare base URLs without query parameters to avoid flash
        const currentBase = currentImageUrl.pathname;
        const targetBase = targetImageUrl.pathname;

        if (currentBase !== targetBase) {
          // Update img element
          mainImage.src = variantImage;
          mainImage.srcset = variantImageSrcset || '';
        }
      } else {
        // For placeholder variants, show a placeholder in main image
        this.showPlaceholderImage(mainImage);
      }
    } else {
      // Mouse leave - restore original image
      this.removePlaceholderImage(mainImage);
      mainImage.src = originalSrc;
      mainImage.srcset = originalSrcset || '';
    }
  }

  // Show placeholder image for variants without images
  showPlaceholderImage(mainImage) {
    const placeholderContainer = mainImage.closest('picture') || mainImage.parentElement;
    const existingPlaceholder = placeholderContainer.querySelector('.main-image-placeholder');

    if (!existingPlaceholder) {
      // Hide the main image and show placeholder
      mainImage.style.display = 'none';

      // Create placeholder element with proper SVG
      const placeholder = document.createElement('div');
      placeholder.className = 'main-image-placeholder absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center';

      // Create SVG placeholder
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'w-3/5 h-3/5 text-gray-400 opacity-70');
      svg.setAttribute('fill', 'currentColor');
      svg.setAttribute('viewBox', '0 0 20 20');
      svg.innerHTML = '<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>';

      placeholder.appendChild(svg);
      placeholderContainer.appendChild(placeholder);
    }
  }

  // Remove placeholder image
  removePlaceholderImage(mainImage) {
    const placeholderContainer = mainImage.closest('picture') || mainImage.parentElement;
    const existingPlaceholder = placeholderContainer.querySelector('.main-image-placeholder');

    if (existingPlaceholder) {
      existingPlaceholder.remove();
      mainImage.style.display = 'block';
    }
  }

  // Initialize existing product cards (for viewport-based preloading)
  initializeProductCards() {
    if (!this.intersectionObserver) return;

    const productCards = document.querySelectorAll('.card-product-northfinder__link');
    productCards.forEach((card) => {
      const productId = card.dataset.productId;
      if (productId) {
        this.intersectionObserver.observe(card);
      }
    });
  }

  // Re-initialize after dynamic content updates
  reinitialize() {
    // Re-initialize product cards for intersection observer
    this.initializeProductCards();
  }

  // Public method to trigger re-initialization
  static reinitialize() {
    if (window.productCardHover) {
      window.productCardHover.reinitialize();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  window.productCardHover = new ProductCardHover();
});

// Export for use in other scripts
window.ProductCardHover = ProductCardHover;
