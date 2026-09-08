import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("color marketplace filter badges", () => {
  test("desktop and mobile color filters render the marketplace badge", () => {
    const facets = readProjectFile("snippets/facets.liquid");

    expect(facets).toContain("filter.param_name contains 'color_marketplace'");
    expect(facets).toContain("render 'color-marketplace-badge'");
    expect(facets.match(/render 'color-marketplace-badge'/g)?.length).toBeGreaterThanOrEqual(2);
  });

  test("badge prefers a native swatch then a hex map for known marketplace colors", () => {
    const source = readProjectFile("snippets/color-marketplace-badge.liquid");

    expect(source).toContain("swatch.color");
    expect(source).toContain("shop.metaobjects.color_marketplace[color_key]");
    expect(source).toContain("marketplace_entry.hex_code.value");
    expect(source).toContain("when 'black'");
    expect(source).toContain("#000000");
    expect(source).toContain("when 'multicolor'");
    expect(source).toContain("color-marketplace-badge--multicolor");
  });
});
