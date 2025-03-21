import { describe, test, expect } from "vitest";
import { parseImageUrl, sortImagesByDisplayRules } from "./product-utils.module.js";

describe("parseImageUrl", () => {
  // New format tests (NF-no-)
  test("parses main product image with NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "main",
    });
  });

  test("parses details image with sequence in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "details",
      sequence: 1,
    });
  });

  test("parses model image with sequence in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_2.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "model",
      sequence: 2,
    });
  });

  test("parses back main image in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-B.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "back_main",
    });
  });

  test("parses back variant image in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-BV.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "back_variant",
    });
  });

  test("handles different colors in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-red-D_1.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "red",
      image_type: "details",
      sequence: 1,
    });
  });

  test("handles complex color names in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-light-blue-D_1.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "light-blue",
      image_type: "details",
      sequence: 1,
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
    });
  });

  test("handles unknown type code as main in NF-no format", () => {
    const result = parseImageUrl("ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-X.jpg");
    expect(result).toEqual({
      product: "NF-no-5009snw",
      color: "darkblue",
      image_type: "main",
    });
  });

  test("handles malformed URLs gracefully", () => {
    const result = parseImageUrl("invalid-filename.jpg");
    expect(result).toEqual({
      product: "",
      color: "",
      image_type: "main",
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
    });
  });

  test("parses NF-mi format with underscore in color name", () => {
    const result = parseImageUrl("men-039-s-sweatshirt-promo-melange-salvatore--NF-mi-3267-1or-gray_seda-D_1.jpg");
    expect(result).toEqual({
      product: "NF-mi-3267-1or",
      color: "gray_seda",
      image_type: "details",
      sequence: 1,
    });
  });

  test("parses NF-mi format with dashed product code", () => {
    const result = parseImageUrl("men-039-s-sweatshirt-promo-melange-salvatore--NF-mi-3267-1or-flamescarlet-D_2.jpg");
    expect(result).toEqual({
      product: "NF-mi-3267-1or",
      color: "flamescarlet",
      image_type: "details",
      sequence: 2,
    });
  });
});

describe("sortImagesByDisplayRules", () => {
  test("sorts images according to display rules", () => {
    const imageUrls = [
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_2.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_1.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-B.jpg",
    ];

    const sortedUrls = sortImagesByDisplayRules(imageUrls);

    expect(sortedUrls).toEqual([
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-B.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_1.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_2.jpg",
    ]);
  });
});
