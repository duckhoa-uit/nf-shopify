import { filterMediaByColor, parseImageUrl, sortImagesByDisplayRules } from "./product-utils.module.js";

const VISIBLE_MEDIA_COUNT = 6;
const SQUARE_ASPECT_MIN = 0.85;

const videoAspect = (media) => {
  const preview = media?.preview_image;
  if (preview?.width && preview?.height) return preview.width / preview.height;

  const source = (media?.sources || []).find((item) => item?.width && item?.height);
  if (source) return source.width / source.height;

  if (typeof media?.aspect_ratio === "number" && media.aspect_ratio > 0) return media.aspect_ratio;
  return null;
};

const videoRole = (media) => {
  if (media?.media_type !== "video") return null;

  const aspect = videoAspect(media);
  if (aspect !== null && aspect < SQUARE_ASPECT_MIN) return "vertical";
  return "gallery";
};

const reelPayload = (media) => {
  if (!media) return null;

  const sources = (media.sources || [])
    .filter((source) => source?.url)
    .map((source) => ({
      url: source.url,
      mime_type: source.mime_type || "",
    }));

  if (!sources.length) return null;

  return {
    sources,
    poster: media.preview_image?.src || "",
  };
};

const mediaSource = (media) => {
  if (!media) return "";
  if (media.media_type === "image") return media.src || media.preview_image?.src || "";
  return media.preview_image?.src || media.src || "";
};

const mediaFilename = (url) => (url || "").split("/").pop().split("?")[0].toLowerCase();

const uniqueSources = (media) => {
  const sources = [];
  const seen = new Set();

  for (const item of media) {
    const source = mediaSource(item);
    if (!source || seen.has(source)) continue;
    seen.add(source);
    sources.push(source);
  }

  return sources;
};

const findMediaForSource = (media, source) => {
  const filename = mediaFilename(source);
  return media.find((item) => {
    const itemSource = mediaSource(item);
    return itemSource && (itemSource === source || mediaFilename(itemSource) === filename);
  });
};

const reelForGalleryVideo = (media, galleryVideoMedia, verticalMedia) => {
  if (media?.media_type !== "video") return null;
  if (videoRole(media) === "vertical" || !verticalMedia.length) return reelPayload(media);

  const index = Math.max(
    0,
    galleryVideoMedia.findIndex((item) => item.id === media.id),
  );
  return reelPayload(verticalMedia[Math.min(index, verticalMedia.length - 1)]);
};

const reorderVideos = (items) => {
  const videoItems = items.filter((item) => item.media?.media_type === "video");
  const imageItems = items.filter((item) => item.media?.media_type !== "video");

  if (!videoItems.length || !imageItems.length) return items;
  return [imageItems[0], ...videoItems, ...imageItems.slice(1)];
};

/**
 * Resolve the one gallery sequence used by both SSR metadata and hydration.
 *
 * The filtering and sorting functions are deliberately the existing product
 * utility functions. This keeps exact/partial/reference-id/fallback matching
 * and display priorities in one deterministic contract while retaining the
 * original Shopify media objects.
 */
export function resolveProductMediaSequence({
  media = [],
  activeColor = "",
  colorMappings = null,
  initialMediaId = null,
  visibleCount = VISIBLE_MEDIA_COUNT,
} = {}) {
  const allMedia = Array.isArray(media) ? media : [];
  const verticalMedia = allMedia.filter((item) => videoRole(item) === "vertical");
  const galleryVideoMedia = allMedia.filter((item) => videoRole(item) === "gallery");
  const visibleVideoMedia = galleryVideoMedia.length ? galleryVideoMedia : verticalMedia.slice(0, 1);
  const hiddenVideoSources = new Set(
    allMedia
      .filter((item) => item.media_type === "video" && !visibleVideoMedia.includes(item))
      .map(mediaSource)
      .filter(Boolean),
  );
  const allSources = uniqueSources(allMedia);
  let filteredSources = filterMediaByColor(allSources, activeColor, colorMappings).filter(
    (source) => !hiddenVideoSources.has(source),
  );

  const videoSources = visibleVideoMedia.map(mediaSource).filter(Boolean);
  filteredSources = [...new Set([...filteredSources, ...videoSources])];

  let sorted = sortImagesByDisplayRules(filteredSources, colorMappings);
  sorted = Array.isArray(sorted) ? sorted : [];

  let sequence = sorted
    .map((item) => {
      const source = typeof item === "string" ? item : item?.url;
      const matchedMedia = findMediaForSource(allMedia, source);
      if (!source || !matchedMedia) return null;

      return {
        media: matchedMedia,
        mediaId: matchedMedia.id,
        mediaType: matchedMedia.media_type || "image",
        source,
        hidden: false,
      };
    })
    .filter(Boolean);

  sequence = reorderVideos(sequence).map((item) => ({
    ...item,
    reel: reelForGalleryVideo(item.media, galleryVideoMedia, verticalMedia),
  }));

  if (!sequence.length) {
    sequence = allMedia
      .slice(0, 2)
      .map((item) => {
        const source = mediaSource(item);
        if (!source) return null;
        return {
          media: item,
          mediaId: item.id,
          mediaType: item.media_type || "image",
          source,
          reel: null,
          hidden: false,
        };
      })
      .filter(Boolean);
  }

  if (initialMediaId !== null && initialMediaId !== undefined && sequence.length > 1) {
    const initialIndex = sequence.findIndex((item) => String(item.mediaId) === String(initialMediaId));
    if (initialIndex > 0 && sequence[initialIndex].mediaType !== "video") {
      const parsed = parseImageUrl(sequence[initialIndex].source);
      const isBackType = parsed.image_type === "back_variant" || parsed.image_type === "back_main";

      if (!isBackType) {
        sequence = [sequence[initialIndex], ...sequence.slice(0, initialIndex), ...sequence.slice(initialIndex + 1)];
      }
    }
  }

  return sequence.map((item, index) => ({
    ...item,
    hidden: index >= visibleCount,
  }));
}

export { mediaSource };
