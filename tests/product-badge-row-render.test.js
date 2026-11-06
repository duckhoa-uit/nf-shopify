import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Liquid } from "liquidjs";
import { describe, expect, test } from "vitest";

const source = readFileSync(fileURLToPath(new URL("../snippets/product-badge-row.liquid", import.meta.url)), "utf8")
  .replace(/{% doc %}[\s\S]*?{% enddoc %}/g, "")
  .replace(/{% stylesheet %}[\s\S]*?{% endstylesheet %}/g, "");

const productWithBadges = (extras = [], promotions = []) => ({
  metafields: {
    custom_features: {
      extra_storefront: { value: extras.map((name) => ({ name })) },
      promotion_storefront: { value: promotions.map((name) => ({ name })) },
      extra: { value: [{ name: "Internal Extra" }] },
      promotion: { value: [{ name: "Internal Promotion" }] },
    },
  },
});

const renderRow = async (product, options = {}) => {
  const liquid = new Liquid();

  liquid.registerTag("render", {
    parse(token) {
      expect(token.args).toBe(
        "'discount-badge', product: product, variant: variant, badge_class: discount_badge_class",
      );
    },
    render(scope) {
      return scope.get(["discountBadges"]) ?? "";
    },
  });

  return liquid.parseAndRender(source, { product, ...options });
};

const labelsIn = (html) =>
  [...html.matchAll(/<span class="product-badge-row__label">([\s\S]*?)<\/span>/g)].map((match) => match[1]);

describe("public product badge Liquid rendering", () => {
  test.each(["card", "pdp"])("renders Extra before both promotions on %s", async (context) => {
    const html = await renderRow(productWithBadges(["-30% Extra"], ["Black Friday", "Bestsellers"]), { context });

    expect(labelsIn(html)).toEqual(["-30% Extra", "Black Friday", "Bestsellers"]);
    expect(html).toContain(`product-badge-row--${context}`);
    expect(html).not.toContain("Internal");
  });

  test.each([
    [[], [], []],
    [["-40% Extra"], [], ["-40% Extra"]],
    [[], ["Bestsellers"], ["Bestsellers"]],
    [["-50% Extra"], ["Black Friday"], ["-50% Extra", "Black Friday"]],
  ])("handles Extra %j and Promotion %j", async (extras, promotions, expected) => {
    expect(labelsIn(await renderRow(productWithBadges(extras, promotions)))).toEqual(expected);
  });

  test("handles absent Storefront fields without falling back to internal fields", async () => {
    const product = productWithBadges();
    delete product.metafields.custom_features.extra_storefront;
    delete product.metafields.custom_features.promotion_storefront;

    expect(labelsIn(await renderRow(product))).toEqual([]);
    expect(labelsIn(await renderRow({ metafields: {} }))).toEqual([]);
  });

  test.each(["card", "pdp"])(
    "renders arbitrary Extra option names without a percentage whitelist on %s",
    async (context) => {
      const extras = ["30% off", "-20% Extra", "Extra discount -30%", "Autumn Sale"];
      const html = await renderRow(productWithBadges(extras, ["Black Friday", "Bestsellers"]), { context });

      expect(labelsIn(html)).toEqual([...extras, "Black Friday", "Bestsellers"]);
    },
  );

  test("skips blank names without spending the promotion limit", async () => {
    const html = await renderRow(
      productWithBadges(
        ["", "   ", null, " -30% Extra "],
        ["", "  ", null, "Black Friday", "Bestsellers", "New arrival"],
      ),
    );

    expect(labelsIn(html)).toEqual(["-30% Extra", "Black Friday", "Bestsellers"]);
  });

  test("caps only promotions and preserves the reference order within both fields", async () => {
    const html = await renderRow(
      productWithBadges(["-50% Extra", "-30% Extra"], ["Bestsellers", "Black Friday", "New arrival"]),
      { promotion_limit: 1 },
    );

    expect(labelsIn(html)).toEqual(["-50% Extra", "-30% Extra", "Bestsellers"]);
  });

  test("keeps Extra when promotions are explicitly disabled", async () => {
    const html = await renderRow(productWithBadges(["-30% Extra"], ["Black Friday"]), { promotion_limit: 0 });

    expect(labelsIn(html)).toEqual(["-30% Extra"]);
  });

  test("escapes text and title attributes for both public badge types", async () => {
    const name = '<img src=x onerror="alert(1)"> & Offer';
    const html = await renderRow(productWithBadges([name], [name]));

    expect(labelsIn(html)).toEqual([
      "&lt;img src=x onerror=&#34;alert(1)&#34;&gt; &amp; Offer",
      "&lt;img src=x onerror=&#34;alert(1)&#34;&gt; &amp; Offer",
    ]);
    expect(html).not.toContain("<img");
    expect(html).not.toContain('title="<img');
  });

  test("keeps automatic and compare-at discount markup before public labels without changing it", async () => {
    const discountBadges =
      '<span data-discount-preview="true">-10%</span><div class="product-discount-badge">SALE</div>';
    const html = await renderRow(productWithBadges(["-30% Extra"], ["Black Friday", "Bestsellers"]), {
      context: "pdp",
      discountBadges,
    });

    expect(html).toContain(discountBadges);
    expect(html.indexOf(discountBadges)).toBeLessThan(html.indexOf("product-badge-row__badge--extra"));
    expect(labelsIn(html)).toEqual(["-30% Extra", "Black Friday", "Bestsellers"]);
  });
});
