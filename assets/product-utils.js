/**
 * Parses an image/video URL according to the nomenclature rules
 * @param {string} url - The image/video URL to parse
 * @returns {Object} - An object containing product, color, and image_type
 */
window.parseImageUrl = function (url) {
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
  if (!nameWithoutExt.includes("-") && !nameWithoutExt.includes("$")) {
    return result;
  }

  // Handle legacy format (e.g., NO-4403OR-300$H.jpg)
  if (nameWithoutExt.includes("$")) {
    const parts = nameWithoutExt.split("$");

    // Handle legacy stylized image or video format
    if (parts[0].startsWith("NO-") && parts[1].startsWith("NO-")) {
      result.product = parts[0];
      result.color = parts[1];
      result.image_type = filename.toLowerCase().endsWith(".mp4") ? "video" : "stylized";
      return result;
    }

    // Handle other legacy formats
    const productColorParts = parts[0].split("-");
    if (productColorParts.length >= 2) {
      result.product = productColorParts.slice(0, 2).join("-");
      result.color = productColorParts.slice(2).join("-");
    }

    // Parse type and sequence
    if (parts[1]) {
      const [type, seq] = parts[1].split("_");
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
    }

    return result;
  }

  // Handle simple legacy format (e.g., NO-4403OR-300.jpg)
  if (nameWithoutExt.startsWith("NO-")) {
    const parts = nameWithoutExt.split("-");
    if (parts.length >= 2) {
      result.product = parts.slice(0, 2).join("-");
      result.color = parts.slice(2).join("-");
    }
    return result;
  }

  // Handle new format (e.g., ishaan-men-039-s-ski-softshell-winter-pants--NF-no-5009snw-darkblue-D_1.jpg)
  const parts = nameWithoutExt.split("-");
  const nfIndex = parts.findIndex((part) => part === "NF");

  if (nfIndex !== -1 && parts[nfIndex + 1] === "no") {
    // Extract product code
    const productCode = parts[nfIndex + 2];
    if (!productCode) {
      return result;
    }

    // Set product code with prefix
    result.product = `NF-no-${productCode}`;

    // Extract color (join all parts between product code and type code)
    const typeIndex = parts.findIndex(
      (part, index) =>
        index > nfIndex + 2 &&
        ["H", "D", "M", "B", "BV", "X"].some((code) => part.startsWith(code) && (part === code || part.includes("_"))),
    );

    if (typeIndex !== -1) {
      result.color = parts.slice(nfIndex + 3, typeIndex).join("-");

      // Extract type code and sequence
      const [type, seq] = parts[typeIndex].split("_");
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
      result.color = parts.slice(nfIndex + 3).join("-");
    }
  }

  return result;
};

/**
 * Sorts a list of image/video URLs according to the display rules
 * @param {Array<string>} imageUrls - List of image/video URLs
 * @returns {Array<string>} - Sorted list of image/video URLs
 */
window.sortImagesByDisplayRules = function (imageUrls) {
  // Parse all images
  const parsedImages = imageUrls.map((url) => ({
    url,
    ...window.parseImageUrl(url),
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
};
