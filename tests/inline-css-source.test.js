import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("inline render-blocking CSS", () => {
  const layout = readProjectFile("layout/theme.liquid");

  test("inlines list-menu and breadcrumb CSS into the layout head", () => {
    expect(layout).toContain(".list-menu--disclosure");
    expect(layout).toContain(".breadcrumb-container");
    expect(layout).toContain(".breadcrumb__divider");
  });

  test("removes the external render-blocking stylesheet loads", () => {
    expect(readProjectFile("sections/header.liquid")).not.toContain("component-list-menu.css");
    expect(readProjectFile("sections/footer.liquid")).not.toContain("component-list-menu.css");
    expect(readProjectFile("sections/breadcrumb.liquid")).not.toContain("component-breadcrumb.css");
  });
});
