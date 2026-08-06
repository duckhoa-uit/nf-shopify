import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

const previewSource = readFile("snippets/automatic-discount-preview.liquid");
const productSource = readFile("sections/main-product.liquid");
const parfumProductSource = readFile("sections/main-product-parfums.liquid");
const cardSource = readFile("snippets/card-product.liquid");
const productInfoSource = readFile("assets/product-info.js");
const settingsSource = readFile("config/settings_schema.json");

describe("automatic discount preview contract", () => {
  test("uses the versioned product and variant JSON metafield contract", () => {
    expect(previewSource).toContain("target_variant.metafields.custom.automatic_discount_preview.value");
    expect(previewSource).toContain("product.metafields.custom.automatic_discount_preview.value");
    expect(previewSource).toContain("preview_payload.version == 1");
    expect(previewSource).toContain("rule.preview == 'EXACT_PRICE'");
  });

  test("supports only the verified audience types and never discloses campaign metadata", () => {
    expect(previewSource).toContain("when 'ALL'");
    expect(previewSource).toContain("when 'AUTHENTICATED_CUSTOMER'");
    expect(previewSource).toContain("when 'CUSTOMER_TAG'");
    expect(previewSource).toContain("customer.tags contains rule.audience.value");
    expect(previewSource).not.toContain("campaign");
    expect(previewSource).not.toContain("login");
    expect(previewSource).not.toContain("segment.name");
  });

  test("calculates percentage and fixed-amount previews in minor units", () => {
    expect(previewSource).toContain("when 'PERCENTAGE'");
    expect(previewSource).toContain("when 'FIXED_AMOUNT'");
    expect(previewSource).toContain("rule.value.currency");
    expect(previewSource).toContain("fixed_currency == current_currency");
    expect(previewSource).toContain("| round");
  });

  test("fails closed for inactive, quantity-dependent, unsupported, and ambiguous rules", () => {
    expect(previewSource).toContain("rule.startsAt");
    expect(previewSource).toContain("rule.endsAt");
    expect(previewSource).toContain("current_quantity < rule_minimum_quantity");
    expect(previewSource).toContain("preview_rule_count == 1");
    expect(previewSource).toContain("if rule.preview == 'EXACT_PRICE'");
  });

  test("integrates the same preview component on standard PDP, perfume PDP, and main cards", () => {
    expect(productSource).toContain("render 'automatic-discount-preview'");
    expect(parfumProductSource).toContain("render 'automatic-discount-preview'");
    expect(cardSource).toContain("render 'automatic-discount-preview'");
    expect(cardSource).toContain("presentation: 'card'");
  });

  test("keeps variant refresh server-rendered through the existing price target", () => {
    expect(productInfoSource).toContain("updateSourceFromDestination('price')");
    expect(productInfoSource).toContain("this.updateVariantInputs(variant?.id)");
  });

  test("provides a default-on kill switch for release rollback", () => {
    expect(settingsSource).toContain("automatic_discount_preview_enabled");
    expect(settingsSource).toContain('"default": true');
    expect(previewSource).toContain("settings.automatic_discount_preview_enabled");
  });
});
