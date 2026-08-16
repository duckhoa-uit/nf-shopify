import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("product media gallery runtime", () => {
  const runtime = readProjectFile("assets/product-media-gallery-runtime.js");
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
});
