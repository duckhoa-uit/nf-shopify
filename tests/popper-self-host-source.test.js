import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("popper self-hosting", () => {
  const layout = readProjectFile("layout/theme.liquid");
  const header = readProjectFile("sections/header.liquid");
  const popper = readProjectFile("assets/popper.min.js");

  test("self-hosts Popper instead of loading from unpkg CDN", () => {
    expect(layout).toContain("{{ 'popper.min.js' | asset_url }}");
    expect(layout).not.toContain("https://unpkg.com/@popperjs/core@2");
    expect(header).toContain("{{ 'popper.min.js' | asset_url }}");
    expect(header).not.toContain("https://unpkg.com/@popperjs/core@2");
  });

  test("vendored popper exposes createPopper and is pinned to v2.11.8", () => {
    expect(popper).toContain("@popperjs/core v2.11.8");
    expect(popper).toContain("createPopper");
  });
});
