if (!customElements.get('media-gallery')) {
  customElements.define(
    'media-gallery',
    class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion: this.querySelector('[id^="GalleryStatus"]'),
          viewer: this.querySelector('[id^="GalleryViewer"]'),
          thumbnails: this.querySelector('[id^="GalleryThumbnails"]'),
          paginationDots: this.querySelector('.pagination-dots-container'),
          paginationCurrent: this.querySelector('.pagination-current'),
          paginationTotal: this.querySelector('.pagination-total'),
        };
        this.mql = window.matchMedia('(min-width: 750px)');

        // Add slideChanged event listener once - no debounce for immediate response
        const boundOnSlideChanged = this.onSlideChanged.bind(this);
        this.elements.viewer.addEventListener('slideChanged', boundOnSlideChanged);

        // Also listen for the slider's slid event which is fired after the slide transition completes
        if (this.elements.viewer.slider) {
          this.elements.viewer.slider.addEventListener('slid', boundOnSlideChanged);
        }

        // Initialize pagination dots functionality
        if (this.elements.paginationDots) {
          // Add click event listeners to pagination dots
          this.elements.paginationDots.querySelectorAll('.pagination-dot').forEach((dot) => {
            dot.addEventListener('click', this.onDotClick.bind(this));
          });

          // Initialize dots based on current active slide
          window.setTimeout(() => this.onSlideChanged(), 100);
        }

        if (!this.elements.thumbnails) return;
        this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
          mediaToSwitch
            .querySelector('button')
            .addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
        });
        if (this.dataset.desktopLayout.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }

      onDotClick(event) {
        const dot = event.currentTarget;
        const index = parseInt(dot.dataset.index);
        const slides = this.elements.viewer.querySelectorAll('.slider__slide');

        if (slides.length >= index) {
          const targetSlide = slides[index - 1];
          const mediaId = targetSlide.dataset.mediaId;
          this.setActiveMedia(mediaId, false);
        }
      }

      onSlideChanged(event) {
        // Get the active slide directly
        let activeSlide = this.elements.viewer.querySelector('.slider__slide.is-active');

        // If no active slide is found but we have an event, use the event's current element
        if (!activeSlide && event && event.detail && event.detail.currentElement) {
          activeSlide = event.detail.currentElement;
        }

        if (!activeSlide) return;

        const currentMediaId = activeSlide.dataset.mediaId;
        const allSlides = Array.from(this.elements.viewer.querySelectorAll('.slider__slide'));
        const currentSlideIndex = allSlides.indexOf(activeSlide) + 1;

        console.log('Slide changed to index:', currentSlideIndex, 'Media ID:', currentMediaId);

        // Update pagination dots
        if (this.elements.paginationDots) {
          // Update dots
          this.elements.paginationDots.querySelectorAll('.pagination-dot').forEach((dot, index) => {
            const dotIndex = index + 1;
            if (dotIndex === currentSlideIndex) {
              dot.classList.add('opacity-100');
              dot.classList.remove('opacity-30');
              dot.setAttribute('aria-current', 'true');
            } else {
              dot.classList.remove('opacity-100');
              dot.classList.add('opacity-30');
              dot.removeAttribute('aria-current');
            }
          });

          // Update counter for screen readers
          if (this.elements.paginationCurrent) {
            this.elements.paginationCurrent.textContent = currentSlideIndex;
          }
        }

        // Update thumbnails
        if (this.elements.thumbnails) {
          const thumbnail = this.elements.thumbnails.querySelector(`[data-target="${currentMediaId}"]`);
          this.setActiveThumbnail(thumbnail);
        }
      }

      setActiveMedia(mediaId, prepend) {
        const activeMedia =
          this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`) ||
          this.elements.viewer.querySelector('[data-media-id]');
        if (!activeMedia) {
          return;
        }
        this.elements.viewer.querySelectorAll('[data-media-id]').forEach((element) => {
          element.classList.remove('is-active');
        });
        activeMedia?.classList?.add('is-active');

        if (prepend) {
          activeMedia.parentElement.firstChild !== activeMedia && activeMedia.parentElement.prepend(activeMedia);

          if (this.elements.thumbnails) {
            const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            activeThumbnail.parentElement.firstChild !== activeThumbnail &&
              activeThumbnail.parentElement.prepend(activeThumbnail);
          }

          if (this.elements.viewer.slider) this.elements.viewer.resetPages();
        }

        this.preventStickyHeader();
        window.setTimeout(() => {
          if (!this.mql.matches || this.elements.thumbnails) {
            activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
          }
          const activeMediaRect = activeMedia.getBoundingClientRect();
          // Don't scroll if the image is already in view
          if (activeMediaRect.top > -0.5) return;
          const top = activeMediaRect.top + window.scrollY;
          window.scrollTo({ top: top, behavior: 'smooth' });
        });
        this.playActiveMedia(activeMedia);

        // Update pagination dots when media changes
        this.onSlideChanged();

        if (!this.elements.thumbnails) return;
        const activeThumbnail = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
        this.setActiveThumbnail(activeThumbnail);
        this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;

        this.elements.thumbnails
          .querySelectorAll('button')
          .forEach((element) => element.removeAttribute('aria-current'));
        thumbnail.querySelector('button').setAttribute('aria-current', true);
        if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;

        this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
      }

      announceLiveRegion(activeItem, position) {
        const image = activeItem.querySelector('.product__modal-opener--image img');
        if (!image) return;
        image.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', false);
          this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace('[index]', position);
          setTimeout(() => {
            this.elements.liveRegion.setAttribute('aria-hidden', true);
          }, 2000);
        };
        image.src = image.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia();
        const deferredMedia = activeItem.querySelector('.deferred-media');
        if (deferredMedia) deferredMedia.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        if (!this.stickyHeader) return;
        this.stickyHeader.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute('role', 'presentation'));
      }
    },
  );
}
