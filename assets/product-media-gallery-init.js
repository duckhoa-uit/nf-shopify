/**
 * Product Media Gallery Initialization
 *
 * This module initializes the product media gallery with:
 * - Desktop grid gallery with show more/less toggle
 * - Mobile Swiper carousel
 * - Color-based media filtering
 * - Video autoplay handling
 * - Fancybox lightbox integration
 *
 * Dependencies:
 * - product-utils.js (parseImageUrl, sortImagesByDisplayRules, getNormalizedColorKey, filterMediaByColor)
 * - Swiper.js
 * - Fancybox v5
 */

// Configuration object for magic values
const GALLERY_CONFIG = {
  visibleCount: 6,
  debounceMs: 300,
  videoRetryDelays: [100, 300, 800],
  mobileBreakpoint: 768,
  tabletBreakpoint: 990,
  minColorPartLength: 3,
  swiperAutoplayInterval: 3000,
  initRetryDelay: 50,
  initMaxRetryDelay: 100
};

/**
 * Creates a media item element for the gallery
 * @param {string} url - Media URL
 * @param {number} index - Item index
 * @param {Object} config - Gallery configuration
 * @returns {HTMLElement} - Created media item element
 */
function createMediaItemElement(url, index, config) {
  const { allMedia, sectionId, placeholderSvg } = config;
  let mediaObject = null;

  // Find matching media object by comparing filenames
  const urlFilename = url.split('/').pop().split('?')[0].toLowerCase();

  for (const media of allMedia) {
    let mediaSrc, mediaFilename;
    if (media.media_type === 'video') {
      mediaSrc = media.preview_image.src;
    } else {
      mediaSrc = media.src;
    }

    mediaFilename = mediaSrc.split('/').pop().split('?')[0].toLowerCase();

    if (urlFilename === mediaFilename) {
      mediaObject = media;
      break;
    }
  }

  // Create container div
  const div = document.createElement('div');
  div.className = `swiper-slide product__media-item${index === 0 ? ' is-active' : ''} scroll-trigger animate--fade-in`;

  const mediaId = mediaObject ? mediaObject.id : `generated-${index}`;
  div.id = `Slide-${sectionId}-${mediaId}`;
  div.setAttribute('data-media-id', `${sectionId}-${mediaId}`);

  if (mediaObject) {
    div.setAttribute('data-media-object', JSON.stringify({
      id: mediaObject.id,
      position: mediaObject.position || index,
      media_type: mediaObject.media_type || 'image'
    }));
  }

  if (mediaObject && mediaObject.media_type !== 'image') {
    div.classList.add('product__media-item--full');
  }

  // Create media wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'product__media media relative w-full h-0';
  wrapper.style.cssText = '--ratio: 1.0; --preview-ratio: 1.0; padding-bottom: 100%;';

  // Create image container
  const imageContainer = document.createElement('div');
  imageContainer.className = 'absolute inset-0 w-full h-full';

  // Handle different media types
  if (mediaObject && mediaObject.media_type === 'video') {
    imageContainer.appendChild(createVideoElement(mediaObject));
  } else if (url === 'placeholder' || url.includes('placeholder_svg_tag') || (!mediaObject && url.includes('placeholder'))) {
    imageContainer.appendChild(createPlaceholderElement(placeholderSvg));
  } else {
    imageContainer.appendChild(createImageElement(url, mediaObject, mediaId, index, sectionId));
  }

  wrapper.appendChild(imageContainer);
  div.appendChild(wrapper);

  return div;
}

/**
 * Creates a video element for the gallery
 * @param {Object} mediaObject - Media object from Shopify
 * @returns {HTMLElement} - Video container element
 */
function createVideoElement(mediaObject) {
  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container relative w-full h-full';

  const video = document.createElement('video');
  video.className = 'w-full h-full object-cover';
  video.playsInline = true;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.controls = false;
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('disablePictureInPicture', '');
  video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
  video.setAttribute('webkit-playsinline', '');
  video.disablePictureInPicture = true;

  if (mediaObject.preview_image) {
    video.poster = mediaObject.preview_image.src;
  }

  if (mediaObject.sources) {
    for (const source of mediaObject.sources) {
      const sourceElement = document.createElement('source');
      sourceElement.src = source.url;
      sourceElement.type = source.mime_type;
      video.appendChild(sourceElement);
    }
  }

  // Fallback image
  const img = document.createElement('img');
  img.src = mediaObject.preview_image.src;
  img.alt = mediaObject.alt || mediaObject.preview_image.alt || 'Product video preview';
  img.className = 'absolute inset-0 w-full h-full object-cover';
  img.style.display = 'none';

  video.addEventListener('error', () => {
    video.style.display = 'none';
    img.style.display = 'block';
  });

  videoContainer.appendChild(video);
  videoContainer.appendChild(img);

  // Prevent lightbox from opening when clicking on video
  videoContainer.addEventListener('click', (e) => e.stopPropagation());

  return videoContainer;
}

/**
 * Creates a placeholder element
 * @param {string} placeholderSvg - SVG placeholder HTML
 * @returns {HTMLElement} - Placeholder element
 */
function createPlaceholderElement(placeholderSvg) {
  const placeholderDiv = document.createElement('div');
  placeholderDiv.className = 'w-full h-full bg-gray-100 flex items-center justify-center';

  const svgContainer = document.createElement('div');
  svgContainer.className = 'w-full h-full text-gray-400 max-w-[60%] max-h-[60%] flex items-center justify-center';
  svgContainer.innerHTML = placeholderSvg;

  placeholderDiv.appendChild(svgContainer);
  return placeholderDiv;
}

/**
 * Creates an image element for the gallery
 * @param {string} url - Image URL
 * @param {Object} mediaObject - Media object from Shopify
 * @param {string} mediaId - Media ID
 * @param {number} index - Item index
 * @param {string} sectionId - Section ID
 * @returns {HTMLElement} - Image element
 */
function createImageElement(url, mediaObject, mediaId, index, sectionId) {
  const img = document.createElement('img');
  img.src = mediaObject ? mediaObject.src : url;
  img.alt = mediaObject ? (mediaObject.alt || 'Product image') : 'Product image';
  img.id = `ProductMedia-${sectionId}-${mediaId}`;
  img.className = 'media-item w-full h-full object-cover product-lightbox-img';
  img.setAttribute('loading', index === 0 ? 'eager' : 'lazy');

  img.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof window.openProductLightbox === 'function') {
      window.openProductLightbox(index);
    }
  });

  if (mediaObject) {
    img.width = mediaObject.width;
    img.height = mediaObject.height;
  }

  return img;
}

/**
 * Attempts to play a video with retry mechanism
 * @param {HTMLVideoElement} video - Video element to play
 */
function attemptVideoPlay(video) {
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Autoplay was prevented, expected in some cases
    });
  }
}

/**
 * Ensures all videos in the gallery are playing
 * @param {Array<number>} retryDelays - Array of retry delays in ms
 */
function ensureVideosAutoplay(retryDelays) {
  const allVideos = document.querySelectorAll('.product__media video');

  for (const video of allVideos) {
    if (!video.hasAttribute('autoplay')) {
      video.setAttribute('autoplay', '');
      video.autoplay = true;
    }

    if (video.readyState >= 2) {
      attemptVideoPlay(video);
    } else {
      const onCanPlay = () => {
        attemptVideoPlay(video);
        video.removeEventListener('canplay', onCanPlay);
      };
      video.addEventListener('canplay', onCanPlay);
      setTimeout(() => {
        attemptVideoPlay(video);
        video.removeEventListener('canplay', onCanPlay);
      }, 2000);
    }
  }

  // Retry autoplay after delays
  for (const delay of retryDelays) {
    setTimeout(() => {
      const retryVideos = document.querySelectorAll('.product__media video');
      for (const video of retryVideos) {
        if (video.paused && video.hasAttribute('autoplay')) {
          attemptVideoPlay(video);
        }
      }
    }, delay);
  }
}

/**
 * Reorders images to move videos to position 2
 * @param {Array} sortedImages - Sorted image objects
 * @param {Array} videoMedia - Video media objects
 * @returns {Array} - Reordered images
 */
function reorderImagesWithVideos(sortedImages, videoMedia) {
  if (videoMedia.length === 0) {
    return sortedImages;
  }

  const videoItems = [];
  const nonVideoItems = [];

  for (const item of sortedImages) {
    const isVideo = videoMedia.some(video =>
      video.preview_image &&
      (item.url === video.preview_image.src ||
       item.url.includes(video.preview_image.src.split('?')[0]))
    );

    if (isVideo) {
      videoItems.push(item);
    } else {
      nonVideoItems.push(item);
    }
  }

  if (videoItems.length > 0 && nonVideoItems.length > 0) {
    const reorderedImages = [];
    reorderedImages.push(nonVideoItems[0]);
    reorderedImages.push(...videoItems);
    reorderedImages.push(...nonVideoItems.slice(1));
    return reorderedImages;
  }

  return sortedImages;
}

/**
 * Normalizes a color string for matching
 * @param {string} color - Color string to normalize
 * @returns {string} - Normalized color string
 */
function normalizeColorString(color) {
  if (!color) return '';

  const isReferenceId = !isNaN(parseInt(color, 10));
  if (isReferenceId) {
    return color;
  }

  let normalized = color.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/'/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '')
    .trim();

  if (normalized.endsWith('-')) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

// Export for use in liquid template
window.GALLERY_CONFIG = GALLERY_CONFIG;
window.createMediaItemElement = createMediaItemElement;
window.createVideoElement = createVideoElement;
window.createPlaceholderElement = createPlaceholderElement;
window.createImageElement = createImageElement;
window.attemptVideoPlay = attemptVideoPlay;
window.ensureVideosAutoplay = ensureVideosAutoplay;
window.reorderImagesWithVideos = reorderImagesWithVideos;
window.normalizeColorString = normalizeColorString;
