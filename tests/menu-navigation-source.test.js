import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readSnippet = (name) => readFileSync(fileURLToPath(new URL(`../snippets/${name}`, import.meta.url)), "utf8");

const readAsset = (name) => readFileSync(fileURLToPath(new URL(`../assets/${name}`, import.meta.url)), "utf8");

describe("responsive header navigation", () => {
  test.each(["header-mega-menu.liquid", "header-dropdown-menu.liquid"])(
    "%s keeps both top-level link types on one line without changing submenu wrapping",
    (name) => {
      const source = readSnippet(name);
      const nowrapClasses = source.match(/class="[^"]*whitespace-nowrap[^"]*"/g);

      expect(nowrapClasses).toHaveLength(2);

      for (const classes of nowrapClasses) {
        expect(classes).toContain("header__menu-item");
        expect(classes).not.toContain("caption-large");
        expect(classes).not.toContain("mega-menu__card-title");
      }
    },
  );

  test("search switches from modal trigger to inline field at the same wide-desktop breakpoint", () => {
    const inlineSearch = readSnippet("header-search.liquid");
    const modalSearch = readSnippet("header-search-mobile.liquid");

    expect(inlineSearch).toMatch(/class="[^"]*\bhidden\b[^"]*\bxl:flex\b/);
    expect(inlineSearch).not.toContain("lg:flex");
    expect(modalSearch).toContain("modal__toggle xl:hidden");
    expect(modalSearch).not.toContain("modal__toggle lg:hidden");
    expect(modalSearch).toContain('role="dialog"');
    expect(modalSearch).toContain("routes.search_url");
  });
});

describe("merchant-authored navigation links", () => {
  test("desktop renders nested links even when they share the parent URL", () => {
    const source = readSnippet("header-mega-menu.liquid");

    expect(source).not.toContain("grandchildlink.url == childlink.url");
    expect(source).toContain("{{ grandchildlink.title | escape }}");
  });

  test("desktop category headings stay links when they have child items", () => {
    const source = readSnippet("header-mega-menu.liquid");

    expect(source).not.toContain("childlink.links == blank and childlink.url != blank");
    expect(source).toContain("if childlink.url != blank");
    expect(source).toContain("mega-menu__heading mega-menu__heading--link");
  });

  test("image-card titles wrap and share a subgrid row with images", () => {
    const css = readAsset("component-mega-menu.css");
    const titleBlock = css.match(/\.mega-menu__card-title\s*\{[^}]+\}/)?.[0];

    expect(titleBlock).toBeTruthy();
    expect(titleBlock).not.toMatch(/text-overflow:\s*ellipsis/);
    expect(titleBlock).not.toMatch(/white-space:\s*nowrap/);
    expect(css).toContain("grid-template-rows: subgrid");
  });

  test("mobile renders authored links and only falls back to generated CTAs", () => {
    const source = readSnippet("menu-drawer-panel.liquid");

    expect(source).not.toContain("childlink.url == link.url");
    expect(source).not.toContain("grandchild.url == childlink.url");
    expect(source).toContain("assign authored_all_link = link.links | where: 'url', link.url | first");
    expect(source).toContain(
      "assign authored_grandchild_all_link = childlink.links | where: 'url', childlink.url | first",
    );
    expect(source).toContain("if authored_all_link == blank");
    expect(source).toContain("if authored_grandchild_all_link == blank");
  });
});
