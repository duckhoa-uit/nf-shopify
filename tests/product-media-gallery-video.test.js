import { describe, expect, test } from "vitest";
import {
  isVerticalVideo,
  mediaAspectRatio,
  partitionProductVideos,
  resolveFullscreenMedia,
} from "../assets/product-media-gallery-video.js";

const square = {
  id: "square",
  media_type: "video",
  aspect_ratio: 1,
  preview_image: { src: "https://cdn.shopify.com/square-darkblue.jpg", width: 1080, height: 1080 },
  sources: [{ url: "https://cdn.shopify.com/square.mp4", mime_type: "video/mp4", width: 1080, height: 1080 }],
};

const vertical = {
  id: "vertical",
  media_type: "video",
  aspect_ratio: 9 / 16,
  preview_image: { src: "https://cdn.shopify.com/vertical-darkblue.jpg", width: 1080, height: 1920 },
  sources: [{ url: "https://cdn.shopify.com/vertical.mp4", mime_type: "video/mp4", width: 1080, height: 1920 }],
};

describe("product gallery video pairing", () => {
  test("classifies 9:16 sources as vertical even when the poster is square", () => {
    const media = {
      media_type: "video",
      aspect_ratio: 1,
      preview_image: { src: "https://cdn.shopify.com/poster.jpg", width: 1080, height: 1080 },
      sources: [{ url: "https://cdn.shopify.com/reel.mp4", mime_type: "video/mp4", width: 1080, height: 1920 }],
    };

    expect(mediaAspectRatio(media)).toBeCloseTo(9 / 16);
    expect(isVerticalVideo(media)).toBe(true);
  });

  test("keeps square clips in the gallery and vertical clips fullscreen-only", () => {
    expect(partitionProductVideos([square, vertical])).toEqual({
      galleryVideos: [square],
      fullscreenOnly: [vertical],
    });
    expect(resolveFullscreenMedia(square, [square, vertical])).toBe(vertical);
  });

  test("falls back to the gallery clip when no vertical version exists", () => {
    expect(partitionProductVideos([square])).toEqual({
      galleryVideos: [square],
      fullscreenOnly: [],
    });
    expect(resolveFullscreenMedia(square, [square])).toBe(square);
  });

  test("uses a lone vertical clip as the gallery tile", () => {
    expect(partitionProductVideos([vertical])).toEqual({
      galleryVideos: [vertical],
      fullscreenOnly: [],
    });
    expect(resolveFullscreenMedia(vertical, [vertical])).toBe(vertical);
  });
});
