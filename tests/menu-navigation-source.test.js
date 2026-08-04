import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readSnippet = (name) =>
  readFileSync(
    fileURLToPath(new URL(`../snippets/${name}`, import.meta.url)),
    "utf8",
  );

describe("merchant-authored navigation links", () => {
  test("desktop renders nested links even when they share the parent URL", () => {
    const source = readSnippet("header-mega-menu.liquid");

    expect(source).not.toContain("grandchildlink.url == childlink.url");
    expect(source).toContain("{{ grandchildlink.title | escape }}");
  });

  test("mobile renders authored links and only falls back to generated CTAs", () => {
    const source = readSnippet("menu-drawer-panel.liquid");

    expect(source).not.toContain("childlink.url == link.url");
    expect(source).not.toContain("grandchild.url == childlink.url");
    expect(source).toContain(
      "assign authored_all_link = link.links | where: 'url', link.url | first",
    );
    expect(source).toContain(
      "assign authored_grandchild_all_link = childlink.links | where: 'url', childlink.url | first",
    );
    expect(source).toContain("if authored_all_link == blank");
    expect(source).toContain("if authored_grandchild_all_link == blank");
  });
});
