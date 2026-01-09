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
    reference_id: null,
    // Add a unique identifier based on the URL to differentiate between images with the same type/sequence
    unique_id: url.split('?v=')[1] || Math.random().toString(36).substring(2, 10)
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
            // Check if there's a sequence number in the filename (like H_1)
            if (seq) {
              result.sequence = parseInt(seq, 10);
            } else {
              // Check if there's a sequence number at the end of the filename (like H.jpg vs H_1.jpg)
              // This handles cases where the image is named like product-color-H_1.jpg
              const filenameWithoutExt = filename.replace(/\.[^/.]+$/, "");
              const parts = filenameWithoutExt.split("-");
              const lastPart = parts[parts.length - 1];

              // If the last part is H_1, extract the sequence
              if (lastPart && lastPart.startsWith("H_")) {
                const seqNum = lastPart.split("_")[1];
                if (seqNum) result.sequence = parseInt(seqNum, 10);
              }
            }
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

    groupedImages[key].sort((a, b) => {
      const getDisplayPriority = (img) => {
        // Position 1: H.jpg (Main product photo without sequence)
        if (img.image_type === "main" && !img.sequence) return 1;

        // Position 1+: H_1.jpg, H_2.jpg, etc. (Main product photos with sequence)
        if (img.image_type === "main" && img.sequence) {
          return 1 + (img.sequence * 0.1); // This will give 1.1, 1.2, etc. for H_1, H_2...
        }

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

      // If priorities are the same, use the unique_id as a tiebreaker to ensure consistent ordering
      if (priorityA === priorityB) {
        // For main images with the same priority, check if one has H_1 suffix in the filename
        if (a.image_type === 'main' && b.image_type === 'main') {
          // Extract the filename without extension
          const filenameA = a.url.split('/').pop().split('?')[0].replace(/\.[^/.]+$/, "");
          const filenameB = b.url.split('/').pop().split('?')[0].replace(/\.[^/.]+$/, "");

          // Check if filename contains H_1 or ends with -H_1
          const hasH1SuffixA = filenameA.includes('H_1') || filenameA.endsWith('-H_1');
          const hasH1SuffixB = filenameB.includes('H_1') || filenameB.endsWith('-H_1');

          // Also check for H vs H_1 pattern - look for -H at the end or followed by a dot
          const hasHSuffixA = (filenameA.endsWith('-H') || filenameA.includes('-H.')) && !filenameA.includes('H_');
          const hasHSuffixB = (filenameB.endsWith('-H') || filenameB.includes('-H.')) && !filenameB.includes('H_');

          // Extract the last part of the filename to check for H suffix more precisely
          const lastPartA = filenameA.split('-').pop();
          const lastPartB = filenameB.split('-').pop();
          const isExactHSuffixA = lastPartA === 'H';
          const isExactHSuffixB = lastPartB === 'H';

          // Prefer H_1 over any other
          if (hasH1SuffixA && !hasH1SuffixB) {
            return -1;
          }
          if (!hasH1SuffixA && hasH1SuffixB) {
            return 1;
          }

          // If neither has H_1, prefer exact H suffix over others
          if (isExactHSuffixA && !isExactHSuffixB) {
            return -1;
          }
          if (!isExactHSuffixA && isExactHSuffixB) {
            return 1;
          }

          // If neither has exact H suffix, try the more general H pattern
          if (hasHSuffixA && !hasHSuffixB) {
            return -1;
          }
          if (!hasHSuffixA && hasHSuffixB) {
            return 1;
          }

          // If both or neither have H_1 suffix, use the unique_id
          return a.unique_id.localeCompare(b.unique_id);
        }

        // For other image types, just use the unique_id
        return a.unique_id.localeCompare(b.unique_id);
      }

      return priorityA - priorityB;
    });

    // Show first 8 images (or fewer if even number), hide the rest
    const visibleImages = [];
    const hiddenImages = [];

    // Determine how many images to show initially (2, 4, 6, or 8)
    let visibleCount = 8; // Maximum of 8 images
    if (groupedImages[key].length < 8) {
      // If we have fewer than 8 images, round down to the nearest even number
      // But ensure we always show at least 1 image
      visibleCount = Math.max(1, Math.floor(groupedImages[key].length / 2) * 2);
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
  const seenUrls = new Set(); // Track URLs we've already added to prevent duplicates

  Object.keys(groupedImages).forEach((key) => {
    groupedImages[key].forEach((img) => {
      // Parse the image to get its type
      const parsed = parseImageUrl(img.url, colorMappings);

      // Special handling for main (H) images to prevent duplicates
      let isDuplicate = seenUrls.has(img.url);

      // For main images, also check if we already have another main image with the same product and color
      if (!isDuplicate && parsed.image_type === "main") {
        // Check if we already have a main image for this product-color
        const mainImageKey = `main-${parsed.product}-${parsed.color}`;
        const hasMainImage = seenUrls.has(mainImageKey);

        if (hasMainImage) {
          // If this is H_1, it might be better than a plain H
          const filename = img.url.split('/').pop().split('?')[0].replace(/\.[^/.]+$/, "");
          const lastPart = filename.split('-').pop();
          const isExactHSuffix = lastPart === 'H';
          const hasH1Suffix = filename.includes('H_1') || filename.endsWith('-H_1');

          if (hasH1Suffix) {
            // This is an H_1 image, which we prefer - find and remove the existing main image
            const existingMainIndex = sortedImages.findIndex(item => {
              const itemParsed = parseImageUrl(item.url, colorMappings);
              return itemParsed.image_type === "main" &&
                     itemParsed.product === parsed.product &&
                     itemParsed.color === parsed.color;
            });

            if (existingMainIndex !== -1) {
              sortedImages.splice(existingMainIndex, 1);
            }
          } else if (!isExactHSuffix) {
            // This is not an H_1 or exact H image, so skip it
            isDuplicate = true;
          }
        }

        // Mark that we have a main image for this product-color
        seenUrls.add(mainImageKey);
      }

      // Only add the image if it's not a duplicate
      if (!isDuplicate) {
        seenUrls.add(img.url);
        // Return the URL and hidden status
        sortedImages.push({
          url: img.url,
          hidden: img.hidden || false
        });
      }
    });
  });

  return sortedImages;
}

/**
 * Filters media URLs by active color, implementing matching priority:
 * 1. Exact matches (parsedColor === activeColor)
 * 2. Partial matches (includes)
 * 3. Reference ID matching
 * 4. Flexible matching (split by '-' for compound colors)
 * 5. Priority-based fallback (-H.jpg, -BV.jpg, -B.jpg)
 *
 * @param {Array<string>} allMediaUrls - List of all media URLs to filter
 * @param {string} activeColor - The active color to filter by
 * @param {Array} colorMappings - Array of color mappings from product.metafields.custom.color.value
 * @returns {Array<string>} - Filtered URLs matching the active color
 */
export function filterMediaByColor(allMediaUrls, activeColor, colorMappings) {
  if (!allMediaUrls || allMediaUrls.length === 0) {
    return [];
  }

  if (!activeColor || !colorMappings) {
    return allMediaUrls;
  }

  let urlsToUse = [];
  let exactMatches = [];
  let partialMatches = [];

  // First try to get normalized color key - this converts reference_id to color name if needed
  const normalizedColorKey = getNormalizedColorKey(activeColor, colorMappings);
  const normalizedActiveColor = normalizedColorKey.toLowerCase().trim();

  // Check each URL for matches using the active color
  for (const url of allMediaUrls) {
    // Use parseImageUrl with colorMappings to properly handle reference_ids
    const parsed = parseImageUrl(url, colorMappings);
    const parsedColor = parsed.color.toLowerCase().trim();

    // Collect exact and partial matches
    if (parsedColor === normalizedActiveColor) {
      exactMatches.push(url);
    } else if (parsedColor.includes(normalizedActiveColor) || normalizedActiveColor.includes(parsedColor)) {
      partialMatches.push(url);
    }

    // If we didn't find a match but we have reference_id and colorMappings, try direct reference_id matching
    if (exactMatches.length === 0 && partialMatches.length === 0 && parsed.reference_id && colorMappings) {
      // Check if the active color is actually a reference_id
      const activeRefId = parseInt(activeColor, 10);

      if (!isNaN(activeRefId) && parsed.reference_id === activeRefId) {
        exactMatches.push(url);
      }
    }
  }

  // Prioritize exact matches, fall back to partial matches
  if (exactMatches.length > 0) {
    urlsToUse = exactMatches;
  } else if (partialMatches.length > 0) {
    urlsToUse = partialMatches;
  }

  // If no matches found, try more flexible matching (just try parts of the color name)
  if (urlsToUse.length === 0 && normalizedColorKey.includes('-')) {
    const colorParts = normalizedColorKey.split('-');

    for (const part of colorParts) {
      if (part.length < 3) {
        continue; // Skip very short parts
      }

      const flexibleMatches = allMediaUrls.filter(url => {
        const parsed = parseImageUrl(url, colorMappings);
        return parsed.color.toLowerCase().includes(part.toLowerCase());
      });

      if (flexibleMatches.length > 0) {
        urlsToUse = flexibleMatches;
        break;
      }
    }
  }

  // If still no matches found, implement priority-based fallback
  if (urlsToUse.length === 0) {
    const fallbackCandidates = [];

    // Priority 1: Main image ending with -H.jpg (highest priority)
    const mainImages = allMediaUrls.filter(url => {
      const filename = url.split('/').pop().split('?')[0].toLowerCase();
      return filename.includes('-h.jpg') || filename.endsWith('-h.jpg');
    });

    if (mainImages.length > 0) {
      fallbackCandidates.push(mainImages[0]);
    }

    // Priority 2: Back variant (-BV.jpg) or back main (-B.jpg) as fallback
    const backVariantImages = allMediaUrls.filter(url => {
      const filename = url.split('/').pop().split('?')[0].toLowerCase();
      return filename.includes('-bv.jpg') || filename.endsWith('-bv.jpg');
    });

    const backMainImages = allMediaUrls.filter(url => {
      const filename = url.split('/').pop().split('?')[0].toLowerCase();
      return filename.includes('-b.jpg') || filename.endsWith('-b.jpg');
    });

    if (backVariantImages.length > 0) {
      fallbackCandidates.push(backVariantImages[0]);
    } else if (backMainImages.length > 0) {
      fallbackCandidates.push(backMainImages[0]);
    }

    // If we have fallback candidates, use them; otherwise return sorted media
    if (fallbackCandidates.length > 0) {
      urlsToUse = fallbackCandidates;
    } else {
      // Last resort: get all media URLs and sort them according to display rules
      const sortedFallbackImages = sortImagesByDisplayRules(allMediaUrls.slice(), colorMappings);

      // Take only the first 2 items according to priority order
      urlsToUse = sortedFallbackImages.slice(0, 2).map(item =>
        typeof item === 'string' ? item : item.url
      );
    }
  }

  return urlsToUse;
}
