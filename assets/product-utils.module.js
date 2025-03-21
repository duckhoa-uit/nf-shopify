/**
 * Parses an image/video URL according to the nomenclature rules
 * @param {string} url - The image/video URL to parse
 * @returns {Object} - An object containing product, color, and image_type
 */
export function parseImageUrl(url) {
  // Initialize result with default values
  const result = {
    product: "",
    color: "",
    image_type: "main",
  };

  // Extract filename from URL and remove file extension
  const filename = url.split("/").pop()?.split("?")[0] || "";
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

  // Return default values for malformed URLs or files without proper naming convention
  if (!nameWithoutExt.includes("-")) {
    return result;
  }

  // Handle new formats (NF-no and NF-bu)
  const parts = nameWithoutExt.split("-");
  const nfIndex = parts.findIndex((part) => part === "NF");

  if (nfIndex !== -1) {
    // Extract product code (includes the prefix and additional parts)
    const prefix = parts[nfIndex + 1];
    const productParts = parts.slice(nfIndex + 2);

    // Find the index where the color/type section starts
    const typeIndex = productParts.findIndex((part) =>
      ["H", "D", "M", "B", "BV", "X"].some((code) => part.startsWith(code) && (part === code || part.includes("_"))),
    );

    // Find the product code by looking for the base code before any color parts
    const baseCodeEndIndex = productParts.findIndex(
      (part) => part.includes("-") || part === "light" || part === "dark",
    );
    const code =
      baseCodeEndIndex === -1
        ? productParts.slice(0, typeIndex === -1 ? productParts.length - 1 : typeIndex - 1).join("-")
        : productParts.slice(0, baseCodeEndIndex).join("-");

    if (!code) {
      return result;
    }

    // Set product code
    result.product = `NF-${prefix}-${code}`;

    // Extract color (everything between product code and type code)
    if (typeIndex !== -1) {
      const colorParts = productParts.slice(baseCodeEndIndex === -1 ? typeIndex - 1 : baseCodeEndIndex, typeIndex);
      result.color = colorParts.join("-");

      // Extract type code and sequence
      const [type, seq] = productParts[typeIndex].split("_");
      switch (type) {
        case "D":
          result.image_type = "details";
          if (seq) result.sequence = parseInt(seq, 10);
          break;
        case "M":
          result.image_type = "model";
          if (seq) result.sequence = parseInt(seq, 10);
          break;
        case "B":
          result.image_type = "back_main";
          break;
        case "BV":
          result.image_type = "back_variant";
          break;
        case "H":
        default:
          result.image_type = "main";
      }
    } else {
      // If no type code found, use the last part as color
      result.color = productParts[productParts.length - 1];
    }
  }

  return result;
}

/**
 * Sorts a list of image/video URLs according to the display rules
 * @param {Array<string>} imageUrls - List of image/video URLs
 * @returns {Array<string>} - Sorted list of image/video URLs
 */
export function sortImagesByDisplayRules(imageUrls) {
  // Parse all images
  const parsedImages = imageUrls.map((url) => ({
    url,
    ...parseImageUrl(url),
  }));

  // Group images by product and color
  const groupedImages = {};

  parsedImages.forEach((img) => {
    const key = `${img.product}-${img.color}`;
    if (!groupedImages[key]) {
      groupedImages[key] = [];
    }
    groupedImages[key].push(img);
  });

  // Sort each group according to the display rules
  Object.keys(groupedImages).forEach((key) => {
    groupedImages[key].sort((a, b) => {
      const getDisplayPriority = (img) => {
        // Main image always first
        if (img.image_type === "main") return 1;
        // Position 2 priorities
        if (img.image_type === "video") return 2;
        if (img.image_type === "back_main" || img.image_type === "back_variant") return 3;
        // Next positions (models have priority)
        if (img.image_type === "model") {
          return img.sequence ? 40 + img.sequence : 40;
        }
        // Details last
        if (img.image_type === "details") {
          return img.sequence ? 50 + img.sequence : 50;
        }
        // Everything else
        return 100;
      };

      const priorityA = getDisplayPriority(a);
      const priorityB = getDisplayPriority(b);

      return priorityA - priorityB;
    });
  });

  // Flatten the grouped images, keeping product-color groups together
  const sortedImages = [];
  Object.keys(groupedImages).forEach((key) => {
    sortedImages.push(...groupedImages[key].map((img) => img.url));
  });

  return sortedImages;
}
