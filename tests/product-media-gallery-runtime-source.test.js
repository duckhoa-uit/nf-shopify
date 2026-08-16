import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("product media gallery runtime", () => {
  const runtime = readProjectFile("assets/product-media-gallery-runtime.js");
  const sequence = readProjectFile("assets/product-media-gallery-sequence.js");
  const mediaGallery = readProjectFile("assets/media-gallery.js");
  const snippet = readProjectFile("snippets/product-media-gallery.liquid");

  test("uses one external, section-scoped implementation without global config collisions", () => {
    expect(snippet).toContain("product-media-gallery-runtime.js");
    expect(snippet).not.toContain("const GALLERY_CONFIG");
    expect(snippet).not.toContain("function initProductGallery");
    expect(snippet).not.toContain("function createMediaItem");
    expect(runtime).toContain("class ProductMediaGalleryController");
    expect(runtime).toContain("const controllers = new Map()");
    expect(runtime).toContain("this.root.querySelector");
    expect(runtime).toContain("resolveProductMediaSequence");
    expect(runtime).not.toContain("cloneNode");
    expect(runtime).not.toContain("replaceChildren");
    expect(runtime).toContain("preserveFirstImage");
    expect(runtime).toContain("mediaItem.dataset.galleryHydrated");
  });

  test("uses the canonical variant pub/sub event exactly once per gallery", () => {
    expect(runtime).toContain("subscribe(PUB_SUB_EVENTS.variantChange, this.handleVariantChange)");
    expect(runtime).toContain("this.subscriptions.push(unsubscribe)");
    expect(runtime).not.toContain("variant:changed");
    expect(runtime).not.toContain("window.onVariantChange");
    expect(runtime).not.toContain("setInterval");
  });

  test("delegates controls and tears down listeners, timers, subscriptions, and Swiper", () => {
    expect(runtime).toContain('document.addEventListener("change", this.handleDocumentChange)');
    expect(runtime).toContain('document.removeEventListener("change", this.handleDocumentChange)');
    expect(runtime).toContain("for (const timer of this.timers) clearTimeout(timer)");
    expect(runtime).toContain("for (const unsubscribe of this.subscriptions)");
    expect(runtime).toContain("this.swiper.destroy(true, true)");
    expect(runtime).toContain("MutationObserver");
  });

  test("stores gallery state on each root instead of window globals", () => {
    expect(runtime).toContain("this.root.dataset.activeColor");
    expect(runtime).toContain("this.isExpanded");
    expect(runtime).not.toContain("window.slidesToCreate");
    expect(runtime).not.toContain("window.productSwiper");
    expect(runtime).not.toContain("window.isGalleryExpanded");
  });

  test("keeps legacy media selection scoped to its gallery root", () => {
    expect(mediaGallery).toContain('this.querySelector(`[data-media-id="${mediaId}"]`)');
    expect(mediaGallery).toContain('this.querySelectorAll("[data-media-id]")');
    expect(mediaGallery).not.toContain('document.querySelector(`[data-media-id="${mediaId}"]`)');
  });

  test("shares one deterministic sequence contract between SSR and hydration", () => {
    expect(sequence).toContain("export function resolveProductMediaSequence");
    expect(sequence).toContain("filterMediaByColor");
    expect(sequence).toContain("sortImagesByDisplayRules");
    expect(sequence).toContain("hidden: index >= visibleCount");
    expect(snippet).toContain("data-initial-media-id");
    expect(snippet).toContain('loading="eager"');
    expect(snippet).toContain('fetchpriority="high"');
    expect(snippet).toContain("srcset=");
    expect(snippet).toContain('sizes="(min-width: 990px) 66vw, 100vw"');
  });

  test("keeps the meaningful SSR fallback visible and aligns the image preload", () => {
    expect(snippet).toContain("data-gallery-item");
    expect(snippet).not.toContain("Loading gallery...");
    expect(snippet).not.toContain('class="swiper product-swiper loading-media');
    const alignedPreload =
      "product.selected_or_first_available_variant.featured_media.preview_image | default: product.selected_or_first_available_variant.featured_image | default: product.featured_image | image_url: width: 800";
    expect(readProjectFile("layout/theme.liquid")).toContain(alignedPreload);
    expect(readProjectFile("layout/theme.pagefly.liquid")).toContain(alignedPreload);
  });

  test("does not use global gallery selectors or state", () => {
    expect(runtime).not.toContain("document.querySelector(");
    expect(runtime).not.toContain("window.slidesToCreate");
    expect(runtime).not.toContain("window.productSwiper");
    expect(runtime).not.toContain("window.isGalleryExpanded");
    expect(runtime).not.toContain("window.ProductMediaGalleryController");
  });

  test("reserves a stable mobile gallery height from the initial media ratio", () => {
    const galleryCss = readProjectFile("assets/product-media-gallery.css");
    expect(snippet).toContain("--gallery-initial-ratio: {{ initial_media_ratio }}");
    expect(galleryCss).toContain(".product-swiper[data-gallery-mobile] .swiper-wrapper");
    expect(galleryCss).toContain("aspect-ratio: var(--gallery-initial-ratio, 1)");
  });
});
