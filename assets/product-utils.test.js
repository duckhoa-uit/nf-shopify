import { describe, test, expect } from "vitest";
import { parseImageUrl, sortImagesByDisplayRules } from "./product-utils.js";

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

  // Legacy format tests
  test("parses legacy stylized image", () => {
    const result = parseImageUrl("NO-4403OR$NO-344124RO.jpg");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "NO-344124RO",
      image_type: "stylized",
    });
  });

  test("parses legacy video", () => {
    const result = parseImageUrl("NO-4403OR$NO-344124RO.mp4");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "NO-344124RO",
      image_type: "video",
    });
  });

  test("parses legacy main photo", () => {
    const result = parseImageUrl("NO-4403OR-300.jpg");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "300",
      image_type: "main",
    });
  });

  test("parses legacy main photo with type indicator", () => {
    const result = parseImageUrl("NO-4403OR-300$H.jpg");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "300",
      image_type: "main",
    });
  });

  test("parses legacy back main photo", () => {
    const result = parseImageUrl("NO-4403OR-300$B.jpg");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "300",
      image_type: "back_main",
    });
  });

  test("parses legacy back variant photo", () => {
    const result = parseImageUrl("NO-4403OR-300$BV.jpg");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "300",
      image_type: "back_variant",
    });
  });

  test("parses legacy details photo with sequence", () => {
    const result = parseImageUrl("NO-4403OR-300$D_1.jpg");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "300",
      image_type: "details",
      sequence: 1,
    });
  });

  test("parses legacy model photo with sequence", () => {
    const result = parseImageUrl("NO-4403OR-300$M_2.jpg");
    expect(result).toEqual({
      product: "NO-4403OR",
      color: "300",
      image_type: "model",
      sequence: 2,
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
});

describe("sortImagesByDisplayRules", () => {
  test("sorts images according to display rules", () => {
    const urls = [
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_2.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-H.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-M_1.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-B.jpg",
      "ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg",
    ];

    const sorted = sortImagesByDisplayRules(urls);

    // Expected order: main (H) -> back (B) -> model (M) -> details (D)
    expect(sorted[0]).toContain("-H.jpg");
    expect(sorted[1]).toContain("-B.jpg");
    expect(sorted[2]).toContain("-M_1.jpg");
    expect(sorted[3]).toContain("-D_1.jpg");
    expect(sorted[4]).toContain("-D_2.jpg");
  });
});
