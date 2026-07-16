
import { describe, test, expect } from "vitest";
import { filterMediaByColor, parseImageUrl, sortImagesByDisplayRules } from "./product-utils.module.js";

describe("parseImageUrl", () => {
  // New format tests (NF-no-)
  test("parses main product image with NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "main",
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses details image with sequence in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses model image with sequence in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_2.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "model",
      sequence: 2,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses back main image in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-B.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "back_main",
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("handles different colors in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-red-D_1.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "red",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("handles complex color names in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-light-blue-D_1.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "light-blue",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("handles query parameters in URL", () => {
    const result = parseImageUrl(
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg?v=1741944400",
    );
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: "1741944400"
    });
  });

  test("handles full CDN URL", () => {
    const result = parseImageUrl(
      "//northfinder-1.myshopify.com/cdn/shop/files/ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg?v=1741944400",
    );
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: "1741944400"
    });
  });

  test("handles unknown type code as main in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-X.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "main",
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("handles malformed URLs gracefully", () => {
    const result = parseImageUrl("invalid-filename.jpg");
    expect(result).toEqual({
      product: "",
      color: "",
      image_type: "main",
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses NF-bu format with details images", () => {
    const result = parseImageUrl(
      "men-039-s-waterproof-multisport-jacket-stowable-2l-northkit--NF-bu-32682sii-black-D_1.jpg",
    );
    expect(result).toEqual({
      product: "NF-bu-32682sii",
      color: "black",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses NF-bu format with different file extensions", () => {
    const result = parseImageUrl(
      "men-039-s-waterproof-multisport-jacket-stowable-2l-northkit--NF-bu-32682sii-brightred-D_1.png",
    );
    expect(result).toEqual({
      product: "NF-bu-32682sii",
      color: "brightred",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses NF-bu format with high sequence numbers", () => {
    const result = parseImageUrl(
      "men-039-s-waterproof-multisport-jacket-stowable-2l-northkit--NF-bu-32682sii-black-D_10.jpg",
    );
    expect(result).toEqual({
      product: "NF-bu-32682sii",
      color: "black",
      image_type: "details",
      sequence: 10,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses NF-bu format with complex color names", () => {
    const result = parseImageUrl(
      "men-039-s-waterproof-multisport-jacket-stowable-2l-northkit--NF-bu-32682sii-macawgreen2-D_1.png",
    );
    expect(result).toEqual({
      product: "NF-bu-32682sii",
      color: "macawgreen2",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses NF-mi format with underscore in color name", () => {
    const result = parseImageUrl("men-039-s-sweatshirt-promo-melange-salvatore--NF-mi-3267-1or-gray_seda-D_1.jpg");
    expect(result).toEqual({
      product: "NF-mi-3267-1or",
      color: "gray_seda",
      image_type: "details",
      sequence: 1,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  test("parses NF-mi format with dashed product code", () => {
    const result = parseImageUrl("men-039-s-sweatshirt-promo-melange-salvatore--NF-mi-3267-1or-flamescarlet-D_2.jpg");
    expect(result).toEqual({
      product: "NF-mi-3267-1or",
      color: "flamescarlet",
      image_type: "details",
      sequence: 2,
      reference_id: null,
      unique_id: expect.any(String)
    });
  });

  // Shopify appends a UUID v4 suffix when the same filename is uploaded again.
  // The parser must ignore that suffix and still recover the type code +
  // reference_id, otherwise the gallery falls back to its 2-image safety net.
  test("strips Shopify UUID suffix on main image with reference_id", () => {
    const result = parseImageUrl(
      "to-2011or-women-s-barefoot-hiking-low-cut-shoes-vibram-danda-NF-TO-2011OR-696-H_af20023b-df1e-4f99-ab45-f20191769853.jpg?v=1779428694",
    );
    expect(result).toEqual({
      product: "NF-TO-2011OR",
      color: "color-696",
      image_type: "main",
      reference_id: 696,
      unique_id: "1779428694",
    });
  });

  test("strips Shopify UUID suffix on details image with sequence", () => {
    const result = parseImageUrl(
      "to-2011or-women-s-barefoot-hiking-low-cut-shoes-vibram-danda-NF-TO-2011OR-696-D_2_769c7f2c-ffd6-429d-8db2-26d28162145e.jpg",
    );
    expect(result).toEqual({
      product: "NF-TO-2011OR",
      color: "color-696",
      image_type: "details",
      sequence: 2,
      reference_id: 696,
      unique_id: expect.any(String),
    });
  });

  test("strips Shopify UUID suffix on back_variant image", () => {
    const result = parseImageUrl(
      "to-2011or-women-s-barefoot-hiking-low-cut-shoes-vibram-danda-NF-TO-2011OR-696-BV_74c1ed04-6bfa-4486-a12a-b4edbc1e6a81.jpg",
    );
    expect(result).toEqual({
      product: "NF-TO-2011OR",
      color: "color-696",
      image_type: "back_variant",
      reference_id: 696,
      unique_id: expect.any(String),
    });
  });

  test("parses a normalized duplicate suffix after a model sequence", () => {
    const result = parseImageUrl(
      "no-4894snw-women-s-ski-comfortable-trousers-with-braces-alma-NF-NO-4894SNW-526-M_1_2.jpg",
    );
    expect(result).toEqual({
      product: "NF-NO-4894SNW",
      color: "color-526",
      image_type: "model",
      sequence: 1,
      reference_id: 526,
      unique_id: expect.any(String),
    });
  });
});

describe("filterMediaByColor", () => {
  test("keeps ALMA model images with normalized duplicate suffixes in the selected color", () => {
    const mediaUrls = [
      "no-4894snw-women-s-ski-comfortable-trousers-with-braces-alma-NF-NO-4894SNW-526-H.jpg",
      "no-4894snw-women-s-ski-comfortable-trousers-with-braces-alma-NF-NO-4894SNW-526-M_1_2.jpg",
      "no-4894snw-women-s-ski-comfortable-trousers-with-braces-alma-NF-NO-4894SNW-526-M_2_2.jpg",
      "no-4894snw-women-s-ski-comfortable-trousers-with-braces-alma-NF-NO-4894SNW-269-H.jpg",
    ];
    const colorMappings = [
      { name: "black", reference_id: 269 },
      { name: "inkblue", reference_id: 526 },
    ];

    expect(filterMediaByColor(mediaUrls, "526", colorMappings)).toEqual(mediaUrls.slice(0, 3));
  });
});

describe("sortImagesByDisplayRules", () => {
  test("sorts images according to display rules and marks hidden images", () => {
    const imageUrls = [
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_2.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_1.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-B.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_2.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_3.jpg",
    ];

    const sortedImages = sortImagesByDisplayRules(imageUrls);

    // Check that the result is an array of objects with url and hidden properties
    expect(sortedImages).toBeInstanceOf(Array);
    expect(sortedImages.length).toBe(imageUrls.length);
    expect(sortedImages[0]).toHaveProperty('url');
    expect(sortedImages[0]).toHaveProperty('hidden');

    // Check the order of URLs
    const sortedUrls = sortedImages.map(img => img.url);

    // First position should be H.jpg (main)
    expect(sortedUrls[0]).toBe("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg");

    // Check that the first image is not hidden
    expect(sortedImages[0].hidden).toBe(false);

    // Check that we have all the expected images
    expect(sortedUrls).toContain("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg");
    expect(sortedUrls).toContain("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-B.jpg");
    expect(sortedUrls).toContain("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_1.jpg");
    expect(sortedUrls).toContain("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg");
  });

  test("handles single image correctly - should not be hidden", () => {
    const imageUrls = [
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg"
    ];

    const sortedImages = sortImagesByDisplayRules(imageUrls);

    // Check that we get exactly one image back
    expect(sortedImages).toBeInstanceOf(Array);
    expect(sortedImages.length).toBe(1);

    // Check that the single image has the correct properties
    expect(sortedImages[0]).toHaveProperty('url');
    expect(sortedImages[0]).toHaveProperty('hidden');

    // Most importantly: the single image should NOT be hidden
    expect(sortedImages[0].hidden).toBe(false);
    expect(sortedImages[0].url).toBe("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg");
  });
});
