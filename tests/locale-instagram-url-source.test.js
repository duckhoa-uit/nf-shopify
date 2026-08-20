import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("locale-aware Instagram links", () => {
  test("maps regional locales and falls back to the global setting", () => {
    const source = readProjectFile("snippets/locale-instagram-url.liquid");

    expect(source).toContain("assign instagram_url = settings.social_instagram_link");
    expect(source).toContain("case request.locale.iso_code");
    expect(source).toContain("northfinder.sk");
    expect(source).toContain("northfinder.bg");
    expect(source).toContain("northfinder.de");
    expect(source).toContain("northfinder.si");
    expect(source).toContain("northfinder_hr");
  });

  test("uses the shared resolver on every social and metadata surface", () => {
    const callSites = [
      "snippets/social-icons.liquid",
      "snippets/meta-tags.liquid",
      "snippets/structured-data.liquid",
      "sections/header.liquid",
      "sections/footer.liquid",
      "sections/main-password-footer.liquid",
    ];

    for (const path of callSites) {
      expect(readProjectFile(path)).toContain("render 'locale-instagram-url'");
    }
  });

  test("removes the obsolete market-specific Instagram setting", () => {
    const schema = readProjectFile("config/settings_schema.json");

    expect(schema).not.toContain('"id": "market_social_instagram_link"');
  });
});
