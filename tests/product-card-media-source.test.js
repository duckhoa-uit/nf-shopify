import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("product card media rendering", () => {
  test("picks the selected color front-first instead of a global model shot", () => {
    const source = readProjectFile("snippets/card-product.liquid");

    expect(source).toContain("selected_or_first_available_variant");
    expect(source).toContain("featured_is_back");
    expect(source).toContain("hero_media | default: model_media | default: model_sequence_media");
    expect(source).toContain("assign type_name = type_parts.first");
    expect(source).not.toContain("parsed_url contains '-M'");
    expect(source).not.toContain("assign image_type_token = filename_parts | last");
  });

  test("adds a white background to native and EComposer product media wrappers", () => {
    const snippet = readProjectFile("snippets/card-product.liquid");
    const sourceStyles = readProjectFile("assets/tailwind.css");
    const compiledStyles = readProjectFile("assets/application.css");

    expect(snippet).toContain("card-product-northfinder__media");

    for (const styles of [sourceStyles, compiledStyles]) {
      expect(styles).toContain(".card-product-northfinder__media");
      expect(styles).toContain(".ecom-collection__product-media--container");
      expect(styles).toContain("background-color: var(--color-white)");
    }
  });
});
