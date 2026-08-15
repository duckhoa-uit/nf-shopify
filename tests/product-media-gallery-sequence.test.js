import { describe, expect, test } from "vitest";
import { resolveProductMediaSequence } from "../assets/product-media-gallery-sequence.js";

const image = (id, filename, overrides = {}) => ({
  id,
  media_type: "image",
  src: `https://cdn.shopify.com/${filename}`,
  width: 1200,
  height: 1200,
  alt: `Image ${id}`,
  ...overrides,
});

const video = (id, filename, overrides = {}) => ({
  id,
  media_type: "video",
  preview_image: {
    src: `https://cdn.shopify.com/${filename}`,
    width: 1200,
    height: 1200,
  },
  sources: [{ url: `https://cdn.shopify.com/${id}.mp4`, mime_type: "video/mp4" }],
  ...overrides,
});

const baseMedia = [
  image("main", "coat--NF-no-5009snw-darkblue-H.jpg"),
  image("model", "coat--NF-no-5009snw-darkblue-M_1.jpg"),
  image("detail", "coat--NF-no-5009snw-darkblue-D_1.jpg"),
  video("video", "coat--NF-no-5009snw-darkblue-BV.jpg"),
  image("other-color", "coat--NF-no-5009snw-red-H.jpg"),
];

describe("resolveProductMediaSequence", () => {
  test.each([
    ["zero media", [], "", [], []],
    ["one image", [image("one", "one--NF-no-1-black-H.jpg")], "", ["one"], [false]],
    [
      "sorted image and video sequence",
      baseMedia,
      "",
      ["main", "video", "model", "detail", "other-color"],
      [false, false, false, false, false],
    ],
    [
      "six visible and remaining hidden",
      [
        ...baseMedia,
        image("detail-2", "coat--NF-no-5009snw-darkblue-D_2.jpg"),
        image("detail-3", "coat--NF-no-5009snw-darkblue-D_3.jpg"),
      ],
      "",
      ["main", "video", "model", "detail", "detail-2", "detail-3", "other-color"],
      [false, false, false, false, false, false, true],
    ],
  ])("%s", (_, media, activeColor, ids, hidden) => {
    const resolved = resolveProductMediaSequence({ media, activeColor });
    expect(resolved.map((item) => item.mediaId)).toEqual(ids);
    expect(resolved.map((item) => item.hidden)).toEqual(hidden);
    expect(resolved.every((item) => item.media === media.find((source) => source.id === item.mediaId))).toBe(true);
  });

  test("keeps exact color filtering and reference-id mappings", () => {
    const media = [
      image("blue", "coat--NF-no-5009snw-42-H.jpg"),
      image("red", "coat--NF-no-5009snw-99-H.jpg"),
      image("fallback", "coat--NF-no-5009snw-green-H.jpg"),
    ];
    const colorMappings = [
      { reference_id: 42, name: "darkblue" },
      { reference_id: 99, name: "red" },
    ];

    expect(
      resolveProductMediaSequence({ media, activeColor: "42", colorMappings }).map((item) => item.mediaId),
    ).toEqual(["blue"]);
  });

  test("moves the server candidate to the authoritative first position", () => {
    const resolved = resolveProductMediaSequence({
      media: baseMedia,
      initialMediaId: "model",
    });

    expect(resolved[0].mediaId).toBe("model");
    expect(resolved.slice(1).map((item) => item.mediaId)).toEqual(["main", "video", "detail", "other-color"]);
  });

  test.each(["model", "external_video"])("retains non-image media objects: %s", (mediaType) => {
    const special =
      mediaType === "model"
        ? { id: "model", media_type: "model", preview_image: { src: "https://cdn/model.jpg" }, sources: [] }
        : { id: "external", media_type: "external_video", preview_image: { src: "https://cdn/ext.jpg" } };
    const resolved = resolveProductMediaSequence({ media: [special] });

    expect(resolved[0].media).toBe(special);
    expect(resolved[0].mediaType).toBe(mediaType);
  });
});
