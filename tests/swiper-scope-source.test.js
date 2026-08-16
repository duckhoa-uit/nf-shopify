import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("swiper scoping", () => {
  const layout = readProjectFile("layout/theme.liquid");

  test("detects top-level swiper section types for the global load", () => {
    for (const type of ["blog-posts-slider", "featured-blog", "related-products", "recent-products"]) {
      expect(layout).toContain(`section.type == '${type}'`);
    }
    // feature-products / discover-northfinder are intentionally left out of the
    // global detection: they self-load Swiper (kept as-is to minimize diff).
    expect(layout).not.toContain("section.type == 'feature-products'");
    expect(layout).not.toContain("section.type == 'discover-northfinder'");
    expect(layout).toContain("template.name == 'product' or needs_swiper");
  });

  test("removes redundant per-section swiper loads for stack-covered sections", () => {
    for (const section of ["sections/related-products.liquid", "sections/recent-products.liquid"]) {
      const source = readProjectFile(section);
      expect(source).not.toContain("<script src=\"{{ 'swiper-bundle.min.js' | asset_url }}\"");
      expect(source).not.toContain("{{ 'swiper-bundle.min.css' | asset_url | stylesheet_tag }}");
    }
    // Unscoped sections keep their self-load; must be untouched by this PR.
    for (const section of ["sections/feature-products.liquid", "sections/discover-northfinder.liquid"]) {
      const source = readProjectFile(section);
      expect(source).toContain("<script src=\"{{ 'swiper-bundle.min.js' | asset_url }}\"");
    }
  });

  test("keeps self-load for nested related-articles snippet", () => {
    const source = readProjectFile("snippets/related-articles.liquid");
    expect(source).toContain("swiper-bundle.min.js");
  });
});
