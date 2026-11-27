import { describe, expect, test } from "vitest";
import {
  isVerticalVideo,
  mediaAspectRatio,
  orderFullscreenSources,
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

describe("fullscreen video source order", () => {
  // Shopify's real order for a 9:16 clip: 480p first, HLS last.
  const sd = { format: "mp4", mime_type: "video/mp4", width: 270, height: 480, url: "sd.mp4" };
  const fhd = { format: "mp4", mime_type: "video/mp4", width: 606, height: 1080, url: "1080.mp4" };
  const hd = { format: "mp4", mime_type: "video/mp4", width: 404, height: 720, url: "720.mp4" };
  const hls = { format: "m3u8", mime_type: "application/x-mpegURL", width: 606, height: 1080, url: "x.m3u8" };
  const shopify = [sd, fhd, hd, hls];

  test("plays 1080p on a retina laptop and a phone, not the 480p Shopify lists first", () => {
    expect(orderFullscreenSources(shopify, 812 * 2)[0]).toBe(fhd); // MacBook viewport in the bug report
    expect(orderFullscreenSources(shopify, 844 * 3)[0]).toBe(fhd); // iPhone
  });

  test("picks the smallest MP4 tall enough for the screen", () => {
    expect(orderFullscreenSources(shopify, 700)).toEqual([hd, fhd, sd, hls]);
  });

  test("falls back to the tallest MP4 on screens taller than every source", () => {
    expect(orderFullscreenSources(shopify, 2200)).toEqual([fhd, hd, sd, hls]);
  });

  test("keeps sources without sizes untouched", () => {
    const unsized = [{ url: "a.mp4", mime_type: "video/mp4" }, hls];
    expect(orderFullscreenSources(unsized, 1000)).toEqual(unsized);
  });
});
