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

  test("preserves the promotion metafield reference order", () => {
    const source = readProjectFile("snippets/product-badge-row.liquid");

    expect(source).toContain("for promotion in product.metafields.custom_features.promotion.value");
    expect(source).not.toMatch(/custom_features\.promotion\.value\s*\|\s*(sort|sort_natural|reverse)/);
    expect(source).not.toMatch(/assign\s+\w*promotions?\s*=.*\|\s*(sort|sort_natural|reverse)/);
    expect(source).not.toContain("promotion.name contains");
  });

  test("keeps badges on one clipped row without a horizontal scroller", () => {
    const sharedRow = readProjectFile("snippets/product-badge-row.liquid");
    const card = readProjectFile("snippets/card-product.liquid");

    expect(sharedRow).toContain("flex-wrap: nowrap");
    expect(sharedRow).toContain("overflow: hidden");
    expect(sharedRow).toContain("product-badge-row__label");
    expect(sharedRow).toContain("text-overflow: ellipsis");
    expect(sharedRow).toContain("white-space: nowrap");
    expect(card).not.toContain("tag-container");
    expect(card).not.toContain("scrollbar-hide");
    expect(card).not.toContain("overflow-x-auto");
  });

  test("uses semantic badge variants instead of styling promotions by position", () => {
    const source = readProjectFile("snippets/product-badge-row.liquid");

    expect(source).toContain("product-badge-row__badge--discount");
    expect(source).toContain("product-badge-row__badge--promotion");
    expect(source).not.toContain("product-badge-row__promotion--primary");
    expect(source).not.toContain("product-badge-row__promotion--secondary");
    expect(source).toContain("--product-badge-background-color");
    expect(source).toContain("--product-badge-border-color");
    expect(source).toContain("--product-badge-text-color");
  });

  test("refreshes PDP discounts after deferred pubsub initialization with lifecycle cleanup", () => {
    const badge = readProjectFile("snippets/discount-badge.liquid");
    const runtime = readProjectFile("assets/automatic-discount-badge.js");

    expect(badge).toContain("<automatic-discount-badge");
    expect(badge).toContain("automatic-discount-badge.js");
    expect(badge).not.toContain("subscribe(PUB_SUB_EVENTS");
    expect(runtime).toMatch(/typeof subscribe !== ["']function["']/);
    expect(runtime).toContain("subscribe(PUB_SUB_EVENTS.variantChange");
    expect(runtime).toContain("disconnectedCallback()");
    expect(runtime).toContain("this.variantChangeUnsubscriber?.()");
  });
});
