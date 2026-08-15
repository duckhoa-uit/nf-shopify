import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("issue 66 source cleanup contracts", () => {
  test("deduplicates identical configured theme font preloads", () => {
    const source = readProjectFile("layout/theme.liquid");

    expect(source).toContain("assign body_font_url = ''");
    expect(source).toContain("assign header_font_url = ''");
    expect(source).toContain("if header_font_url != blank and header_font_url != body_font_url");
    expect(source).not.toContain('href="{{ settings.type_body_font | font_url }}"');
    expect(source).not.toContain('href="{{ settings.type_header_font | font_url }}"');
  });

  test("uses bounded responsive dimensions for icon images", () => {
    const source = readProjectFile("snippets/icon-with-text.liquid");

    expect(source).not.toMatch(/image_url\s*}}/);
    expect(source).not.toContain('height="auto"');
    expect(source).not.toContain('width="auto"');
    expect(source.match(/image_url: width: 32/g)).toHaveLength(3);
    expect(source.match(/image_url: width: 48/g)).toHaveLength(6);
    expect(source.match(/image_url: width: 64/g)).toHaveLength(3);
    expect(source.match(/height="48"/g)).toHaveLength(3);
    expect(source.match(/width="48"/g)).toHaveLength(3);
    expect(source.match(/sizes="\(max-width: 749px\) 32px, 48px"/g)).toHaveLength(3);
  });

  test("loads Swiper locally only when product layout does not already provide it", () => {
    const theme = readProjectFile("layout/theme.liquid");
    const related = readProjectFile("sections/related-products.liquid");
    const recent = readProjectFile("sections/recent-products.liquid");
    const localAssetBlock = /unless template\.name == 'product'[\s\S]*?endunless/;

    expect(theme).toContain("{%- if template.name == 'product' or needs_swiper -%}");
    for (const source of [related, recent]) {
      expect(source).toMatch(localAssetBlock);
      expect(source).toContain("swiper-bundle.min.css");
      expect(source).toContain("swiper.css");
      expect(source).toContain("swiper-bundle.min.js");
      expect(source.match(/swiper-bundle\.min\.js/g)).toHaveLength(2);
    }
  });

  test("uses the theme Archivo variable in the Northkit template", () => {
    const source = readProjectFile("templates/product.northkit.json").replace(/^\s*\/\*[\s\S]*?\*\/\s*/, "");
    const template = JSON.parse(source);
    const customLiquid = template.sections.main.blocks.custom_liquid_Fhf3iy.settings.custom_liquid;

    expect(customLiquid).not.toContain("fonts.googleapis.com");
    expect(customLiquid).not.toContain("font-family: 'Archivo'");
    expect(customLiquid.match(/font-family: var\(--font-archivo-expanded\);/g)).toHaveLength(2);
  });

  test("documents measurable baseline-relative performance targets", () => {
    const theme = readProjectFile("layout/theme.liquid");
    const guide = readProjectFile("docs/performance-optimization-guide.md");

    expect(theme).not.toContain("Critical CSS inlined");
    expect(guide).not.toContain("asset_content");
    expect(guide).not.toContain("80%");
    expect(guide).not.toContain("90+");
    expect(guide).not.toContain("20-30%");
    expect(guide).not.toContain("15-25%");
    expect(guide).toContain("recorded baseline");
    expect(guide).toContain("baseline-relative");
    expect(guide).toContain("No regression in p75 LCP, INP, or CLS");
  });
});
