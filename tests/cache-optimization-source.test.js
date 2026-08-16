import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("cache optimization cleanup", () => {
  test("does not load or retain the removed service-worker asset", () => {
    const themeSource = readProjectFile("layout/theme.liquid");
    const assetPath = fileURLToPath(new URL("../assets/cache-optimization.js", import.meta.url));

    expect(existsSync(assetPath)).toBe(false);
    expect(themeSource).not.toContain("cache-optimization.js");
    expect(themeSource).not.toContain("/sw.js");
  });
});
