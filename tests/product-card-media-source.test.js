import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("product card media rendering", () => {
  test("matches the final image type token instead of product-code substrings", () => {
    const source = readProjectFile("snippets/card-product.liquid");

    expect(source).toContain("assign image_type_token = filename_parts | last");
    expect(source).toContain("if image_type == 'M'");
    expect(source).toContain("if image_type == 'H'");
    expect(source).not.toContain("parsed_url contains '-M'");
    expect(source).not.toContain("parsed_url contains '-B'");
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
