/**
 * Parses an image/video URL according to the nomenclature rules
 * @param {string} url - The image/video URL to parse
 * @param {Array} colorMappings - Optional array of color mappings from product.metafields.custom.color.value
 * @returns {Object} - An object containing product, color, and image_type
 */
export function parseImageUrl(url, colorMappings = null) {
  // Initialize result with default values
  const result = {
    product: "",
    color: "",
    image_type: "main",
    reference_id: null
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

    // Extract color or reference_id (everything between product code and type code)
    if (typeIndex !== -1) {
      const colorParts = productParts.slice(baseCodeEndIndex === -1 ? typeIndex - 1 : baseCodeEndIndex, typeIndex);

      // Check if this is a reference_id (numeric) or color name
      const potentialReferenceId = parseInt(colorParts.join(""), 10);

      if (!isNaN(potentialReferenceId)) {
        result.reference_id = potentialReferenceId;

        // Try to map reference_id to color name if mappings are provided
        if (colorMappings) {
          const mapping = colorMappings.find(m => m.reference_id === potentialReferenceId);
          result.color = mapping ? mapping.name : `color-${potentialReferenceId}`;
        } else {
          result.color = `color-${potentialReferenceId}`;
        }
      } else {
        result.color = colorParts.join("-");
      }

      // Extract type code and sequence
      const typePart = productParts[typeIndex];

      // Check for BV first (since it's two characters)
      if (typePart === "BV" || typePart.startsWith("BV_")) {
        result.image_type = "back_variant";
        const seq = typePart.split("_")[1];
        if (seq) result.sequence = parseInt(seq, 10);
      } else if (typePart === "B" || typePart.startsWith("B_")) {
        // Handle B (back main) specifically
        result.image_type = "back_main";
        const seq = typePart.split("_")[1];
        if (seq) result.sequence = parseInt(seq, 10);
      } else {
        // Handle other single-character codes
        const [type, seq] = typePart.split("_");

        switch (type) {
          case "D":
            result.image_type = "details";
            if (seq) result.sequence = parseInt(seq, 10);
            break;
          case "M":
            result.image_type = "model";
            if (seq) result.sequence = parseInt(seq, 10);
            break;
          case "H":
            result.image_type = "main";
            break;
          default:
            // If we can't determine the type, default to main
            result.image_type = "main";
        }
      }
    } else {
      // If no type code found, check if the last part is numeric (reference_id) or string (color)
      const lastPart = productParts[productParts.length - 1];
      const potentialReferenceId = parseInt(lastPart, 10);

      if (!isNaN(potentialReferenceId)) {
        result.reference_id = potentialReferenceId;

        // Try to map reference_id to color name if mappings are provided
        if (colorMappings) {
          const mapping = colorMappings.find(m => m.reference_id === potentialReferenceId);
          result.color = mapping ? mapping.name : `color-${potentialReferenceId}`;
        } else {
          result.color = `color-${potentialReferenceId}`;
        }
      } else {
        result.color = lastPart;
      }
    }
  }

  return result;
}

/**
 * Returns a normalized color key from either a color name or reference_id
 * @param {string|number} colorValue - Color name or reference_id
 * @param {Array} colorMappings - Array of color mappings from product.metafields.custom.color.value
 * @returns {string} - Normalized color name
 */
export function getNormalizedColorKey(colorValue, colorMappings) {
  if (!colorMappings || !colorValue) {
    return colorValue?.toString() || '';
  }

  // If colorValue is a number or numeric string, treat as reference_id
  const refId = parseInt(colorValue, 10);

  if (!isNaN(refId)) {
    const mapping = colorMappings.find(m => m.reference_id === refId);
    return mapping ? mapping.name : colorValue.toString();
  }

  // If it's a string, check if it matches any color name
  const mapping = colorMappings.find(m =>
    m.name.toLowerCase() === colorValue.toString().toLowerCase());

  return mapping ? mapping.name : colorValue.toString();
}

/**
 * Maps reference_ids in image URLs to color names based on color mappings
 * @param {string} url - Image URL that may contain reference_id
 * @param {Array} colorMappings - Array of color mappings from product.metafields.custom.color.value
 * @returns {string} - URL with reference_id replaced by color name
 */
export function mapReferenceIdToColorInUrl(url, colorMappings) {
  if (!url || !colorMappings || !colorMappings.length) return url;

  try {
    // Parse the URL to find the reference_id
    const parsed = parseImageUrl(url);
    if (!parsed.reference_id) return url; // No reference_id found

    // Find the matching color
    const mapping = colorMappings.find(m => m.reference_id === parsed.reference_id);
    if (!mapping) return url; // No mapping found

    // Replace the reference_id with the color name in the URL
    // Extract filename from URL
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('?')[0];

    // Replace reference_id with color name in filename
    const updatedFilename = filename.replace(
      new RegExp(`-${parsed.reference_id}-`),
      `-${mapping.name}-`
    );

    // Update URL with new filename
    const urlWithoutFilename = url.substring(0, url.lastIndexOf('/') + 1);
    const queryParams = url.includes('?') ? url.substring(url.indexOf('?')) : '';
    return urlWithoutFilename + updatedFilename + queryParams;
  } catch (e) {
    console.error('Error mapping reference_id to color:', e);
    return url; // Return original URL on error
  }
}

/**
 * Sorts a list of image/video URLs according to the display rules
 * @param {Array<string>} imageUrls - List of image/video URLs
 * @param {Array} colorMappings - Optional array of color mappings from product.metafields.custom.color.value
 * @returns {Array<string>} - Sorted list of image/video URLs
 */
export function sortImagesByDisplayRules(imageUrls, colorMappings = null) {
  // Parse all images
  const parsedImages = imageUrls.map((url) => {
    const parsed = parseImageUrl(url, colorMappings);
    return {
      url,
      ...parsed,
    };
  });

  // Group images by product and color
  const groupedImages = {};

  parsedImages.forEach((img) => {
    const key = `${img.product}-${img.color}`;
    if (!groupedImages[key]) {
      groupedImages[key] = [];
    }
    groupedImages[key].push(img);
  });

  // Sort each group according to the new display rules
  Object.keys(groupedImages).forEach((key) => {
    // First, check if we have a BV (back variant) image in this group
    const hasBV = groupedImages[key].some(img => img.image_type === "back_variant");
    // Check if we have a B (back main) image in this group
    const hasB = groupedImages[key].some(img => img.image_type === "back_main");

    groupedImages[key].sort((a, b) => {
      const getDisplayPriority = (img) => {
        // Position 1: H.jpg (Main product photo)
        if (img.image_type === "main") return 1;

        // Position 2: BV.jpg (Back variant photo)
        if (img.image_type === "back_variant") return 2;

        // Position 2 fallback: If no BV exists, use B.jpg (Back main) in position 2
        if (!hasBV && img.image_type === "back_main") return 2;

        // Position 3: M_1.jpg (First model photo)
        if (img.image_type === "model" && img.sequence === 1) return 3;

        // Position 4-10: M_2.jpg through M_7.jpg (Remaining model photos in sequence order)
        if (img.image_type === "model" && img.sequence > 1) {
          return 3 + img.sequence; // This will give 4, 5, 6, etc. for M_2, M_3, M_4...
        }

        // Position 11: B.jpg (Back main product photo) - only if not used as fallback for BV
        if (hasBV && img.image_type === "back_main") return 11;

        // Position 12: video.avi/mp4
        if (img.image_type === "video") return 12;

        // Position 13: D_1.jpg (First detail photo)
        if (img.image_type === "details" && img.sequence === 1) return 13;

        // Position 14+: D_X.jpg (Remaining detail photos in sequence order)
        if (img.image_type === "details" && img.sequence > 1) {
          return 13 + img.sequence; // This will give 14, 15, 16, etc. for D_2, D_3, D_4...
        }

        // Any other detail photos without sequence
        if (img.image_type === "details") return 20;

        // Any other model photos without sequence
        if (img.image_type === "model") return 21;

        // Everything else
        return 100;
      };

      const priorityA = getDisplayPriority(a);
      const priorityB = getDisplayPriority(b);

      return priorityA - priorityB;
    });

    // Show first 8 images (or fewer if even number), hide the rest
    const visibleImages = [];
    const hiddenImages = [];

    // Determine how many images to show initially (2, 4, 6, or 8)
    let visibleCount = 8; // Maximum of 8 images
    if (groupedImages[key].length < 8) {
      // If we have fewer than 8 images, round down to the nearest even number
      visibleCount = Math.floor(groupedImages[key].length / 2) * 2;
    }

    groupedImages[key].forEach((img, index) => {
      // First N images are visible (where N is visibleCount)
      if (index < visibleCount) {
        visibleImages.push(img);
      } else {
        // All images after position N are hidden
        const hiddenImg = {
          ...img,
          hidden: true
        };
        hiddenImages.push(hiddenImg);
      }
    });

    // Replace the group with the new ordering
    groupedImages[key] = [...visibleImages, ...hiddenImages];
  });

  // Flatten the grouped images, keeping product-color groups together
  const sortedImages = [];
  Object.keys(groupedImages).forEach((key) => {
    sortedImages.push(...groupedImages[key].map((img) => {
      // Return the URL and hidden status
      return {
        url: img.url,
        hidden: img.hidden || false
      };
    }));
  });

  return sortedImages;
}
