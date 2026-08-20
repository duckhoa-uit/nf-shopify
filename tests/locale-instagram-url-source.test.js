import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("locale-aware Instagram links", () => {
  test("resolves a merchant setting dynamically and falls back globally", () => {
    const source = readProjectFile("snippets/locale-instagram-url.liquid");

    expect(source).toContain("assign instagram_url = settings.social_instagram_link");
    expect(source).toContain("append: request.locale.iso_code");
    expect(source).toContain("settings[locale_setting_id]");
    expect(source).not.toContain("instagram.com/");
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

  test("exposes every regional URL to merchants and removes the obsolete setting", () => {
    const schemaSource = readProjectFile("config/settings_schema.json");
    const schema = JSON.parse(schemaSource);
    const socialSettings = schema.find((category) => category.name === "t:settings_schema.social-media.name").settings;
    const settingsById = Object.fromEntries(
      socialSettings.filter(({ id }) => id).map((setting) => [setting.id, setting]),
    );
    const regionalDefaults = {
      social_instagram_sk_link: "https://www.instagram.com/northfinder.sk/",
      social_instagram_bg_link: "https://www.instagram.com/northfinder.bg/",
      social_instagram_de_link: "https://www.instagram.com/northfinder.de/",
      social_instagram_sl_link: "https://www.instagram.com/northfinder.si/",
      social_instagram_hr_link: "https://www.instagram.com/northfinder_hr/",
    };

    expect(schemaSource).not.toContain('"id": "market_social_instagram_link"');

    for (const [settingId, defaultUrl] of Object.entries(regionalDefaults)) {
      expect(settingsById[settingId]?.default).toBe(defaultUrl);
    }
  });
});
