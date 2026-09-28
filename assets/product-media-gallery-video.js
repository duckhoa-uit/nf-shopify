import { parseImageUrl } from "./product-utils.module.js";

const VERTICAL_ASPECT_MAX = 0.75;
const VIEWER_ID = "ProductVideoLightbox";

const PLAY_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 14" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M1.482.815A1 1 0 0 0 0 1.69v10.517a1 1 0 0 0 1.525.851L10.54 7.5a1 1 0 0 0-.043-1.728z" clip-rule="evenodd"/></svg>';
const CLOSE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 17" aria-hidden="true" focusable="false"><path fill="currentColor" d="M.865 15.978a.5.5 0 0 0 .707.707l7.433-7.431 7.579 7.282a.501.501 0 0 0 .846-.37.5.5 0 0 0-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 1 0-.707-.708L8.991 7.853 1.413.573a.5.5 0 1 0-.693.72l7.563 7.268z"/></svg>';
const MUTE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M5 9v6h4l5 5V4L9 9H5zm12.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
const UNMUTE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>';

/** @type {HTMLDialogElement | null} */
let activeDialog = null;

/**
 * @param {object} [media]
 * @returns {number}
 */
export function mediaAspectRatio(media) {
  if (!media) return 1;

  const source = (media.sources || []).find((item) => item?.width && item?.height);
  if (source) return source.width / source.height;

  if (Number.isFinite(media.aspect_ratio) && media.aspect_ratio > 0) return media.aspect_ratio;

  const preview = media.preview_image;
  if (preview?.width && preview?.height) return preview.width / preview.height;
  if (Number.isFinite(preview?.aspect_ratio) && preview.aspect_ratio > 0) return preview.aspect_ratio;

  return 1;
}

/**
 * @param {object} [media]
 * @returns {boolean}
 */
export function isVerticalVideo(media) {
  return media?.media_type === "video" && mediaAspectRatio(media) < VERTICAL_ASPECT_MAX;
}

/**
 * Square (or landscape) clips stay in the gallery. 9:16 clips are fullscreen-only
 * unless they are the only product video, in which case the tile crops them.
 *
 * @param {object[]} [allMedia]
 * @returns {{ galleryVideos: object[], fullscreenOnly: object[] }}
 */
export function partitionProductVideos(allMedia = []) {
  const videos = allMedia.filter((item) => item?.media_type === "video");
  const vertical = videos.filter(isVerticalVideo);
  const gallery = videos.filter((item) => !isVerticalVideo(item));

  if (gallery.length) {
    return { galleryVideos: gallery, fullscreenOnly: vertical };
  }

  if (vertical.length) {
    return { galleryVideos: [vertical[0]], fullscreenOnly: vertical.slice(1) };
  }

  return { galleryVideos: [], fullscreenOnly: [] };
}

/**
 * @param {object} galleryVideo
 * @param {object[]} [allMedia]
 * @returns {object}
 */
export function resolveFullscreenMedia(galleryVideo, allMedia = []) {
  if (!galleryVideo) return galleryVideo;
  if (isVerticalVideo(galleryVideo)) return galleryVideo;

  const { fullscreenOnly } = partitionProductVideos(allMedia);
  if (!fullscreenOnly.length) return galleryVideo;

  const gallerySource = galleryVideo.preview_image?.src || galleryVideo.src || "";
  const galleryColor = parseImageUrl(gallerySource).color;

  if (galleryColor) {
    const colorMatch = fullscreenOnly.find((item) => {
      const source = item.preview_image?.src || item.src || "";
      return parseImageUrl(source).color === galleryColor;
    });
    if (colorMatch) return colorMatch;
  }

  return fullscreenOnly[0];
}

/**
 * @param {object[]} sources
 * @param {HTMLVideoElement} video
 */
const appendVideoSources = (sources, video) => {
  for (const source of sources || []) {
    if (!source?.url) continue;

    const sourceElement = document.createElement("source");
    sourceElement.src = source.url;
    if (source.mime_type) sourceElement.type = source.mime_type;
    video.appendChild(sourceElement);
  }
};

const defaultLabels = {
  playVideo: "Play video",
  pauseVideo: "Pause video",
  muteVideo: "Mute video",
  unmuteVideo: "Unmute video",
  close: "Close",
};

/**
 * @param {object} options
 * @param {string} options.label
 * @param {string} options.className
 * @param {string} options.svg
 * @returns {HTMLButtonElement}
 */
const createControlButton = ({ label, className, svg }) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.setAttribute("aria-label", label);
  button.innerHTML = svg;
  return button;
};

export function closeProductVideoViewer() {
  activeDialog?.close();
}

/**
 * Instagram-style fullscreen viewer for the vertical product clip.
 * Starts muted, can pause / unmute / close, and restores gallery focus.
 *
 * @param {object} options
 * @param {Array<{ url?: string, mime_type?: string }>} options.sources
 * @param {string} [options.poster]
 * @param {object} [options.labels]
 * @param {HTMLElement} [options.returnFocusTo]
 * @param {() => void} [options.onClose]
 */
export function openProductVideoViewer({ sources = [], poster = "", labels = {}, returnFocusTo = null, onClose } = {}) {
  const usableSources = (sources || []).filter((source) => source?.url);
  if (!usableSources.length || typeof HTMLDialogElement !== "function") return;

  closeProductVideoViewer();

  const resolvedLabels = {
    playVideo: labels.playVideoText || labels.playVideo || defaultLabels.playVideo,
    pauseVideo: labels.pauseVideoText || labels.pauseVideo || defaultLabels.pauseVideo,
    muteVideo: labels.muteVideoText || labels.muteVideo || defaultLabels.muteVideo,
    unmuteVideo: labels.unmuteVideoText || labels.unmuteVideo || defaultLabels.unmuteVideo,
    close: labels.closeText || labels.close || defaultLabels.close,
  };

  const dialog = document.createElement("dialog");
  dialog.id = VIEWER_ID;
  dialog.className = "product-video-lightbox";
  dialog.setAttribute("aria-label", resolvedLabels.playVideo);
  dialog._returnFocusTo = returnFocusTo;

  const stage = document.createElement("div");
  stage.className = "product-video-lightbox__stage";

  const video = document.createElement("video");
  video.className = "product-video-lightbox__player";
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback noplaybackrate");
  video.disablePictureInPicture = true;
  if (poster) video.poster = poster;
  appendVideoSources(usableSources, video);

  const closeButton = createControlButton({
    label: resolvedLabels.close,
    className: "product-video-lightbox__close",
    svg: CLOSE_ICON_SVG,
  });
  const muteButton = createControlButton({
    label: resolvedLabels.unmuteVideo,
    className: "product-video-lightbox__mute",
    svg: UNMUTE_ICON_SVG,
  });
  muteButton.setAttribute("aria-pressed", "true");

  const pausedBadge = document.createElement("span");
  pausedBadge.className = "product-video-lightbox__paused";
  pausedBadge.setAttribute("aria-hidden", "true");
  pausedBadge.innerHTML = PLAY_ICON_SVG;

  const setPausedState = (paused) => {
    dialog.classList.toggle("is-paused", paused);
    video.setAttribute("aria-label", paused ? resolvedLabels.playVideo : resolvedLabels.pauseVideo);
  };

  const togglePlayback = () => {
    if (video.paused) {
      video.play().catch(() => {});
      setPausedState(false);
      return;
    }

    video.pause();
    setPausedState(true);
  };

  const toggleMute = () => {
    video.muted = !video.muted;
    muteButton.setAttribute("aria-pressed", video.muted ? "true" : "false");
    muteButton.setAttribute("aria-label", video.muted ? resolvedLabels.unmuteVideo : resolvedLabels.muteVideo);
    muteButton.innerHTML = video.muted ? UNMUTE_ICON_SVG : MUTE_ICON_SVG;
  };

  closeButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeProductVideoViewer();
  });
  muteButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleMute();
  });
  video.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    togglePlayback();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeProductVideoViewer();
  });
  dialog.addEventListener("close", () => {
    video.pause();
    if (activeDialog === dialog) {
      dialog.remove();
      activeDialog = null;
      returnFocusTo?.focus?.();
    }
    onClose?.();
  });

  stage.append(video, closeButton, muteButton, pausedBadge);
  dialog.appendChild(stage);
  document.body.appendChild(dialog);
  activeDialog = dialog;
  dialog.showModal();
  setPausedState(false);
  video.play().catch(() => setPausedState(true));
  closeButton.focus();
}
