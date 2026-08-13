import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("canonical product badge rendering", () => {
  test("uses the shared badge row on cards and maintained PDPs", () => {
    const callSites = [
      "snippets/card-product.liquid",
      "sections/main-product.liquid",
      "sections/main-product-parfums.liquid",
    ];

    for (const path of callSites) {
      expect(readProjectFile(path)).toContain("render 'product-badge-row'");
    }
  });

  test("renders promotions but never extra metadata in the canonical row", () => {
    const source = readProjectFile("snippets/product-badge-row.liquid");

    expect(source).toContain("metafields.custom_features.promotion.value");
    expect(source).toContain("promotion_count < maximum_promotions");
    expect(source).not.toContain("metafields.custom_features.extra.value");
  });

  test("wraps long badges without a horizontal scroller", () => {
    const sharedRow = readProjectFile("snippets/product-badge-row.liquid");
    const card = readProjectFile("snippets/card-product.liquid");

    expect(sharedRow).toContain("flex-wrap: wrap");
    expect(sharedRow).toContain("overflow-wrap: anywhere");
    expect(card).not.toContain("tag-container");
    expect(card).not.toContain("scrollbar-hide");
    expect(card).not.toContain("overflow-x-auto");
  });
});
