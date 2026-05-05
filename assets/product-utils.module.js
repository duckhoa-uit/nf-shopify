// Pre-compiled patterns for better performance
const TYPE_CODES = ['H', 'D', 'M', 'B', 'BV', 'X'];
const TYPE_CODE_PATTERN = /^(H|D|M|B|BV|X)(_\d+)?$/;
const URL_SPLIT_QUERY = /\?v=/;
const PATH_SPLIT_SLASH = /\//;
const EXTENSION_PATTERN = /\.[^/.]+$/;
const HYPHEN_PATTERN = /-/;

// Memoization cache for parseImageUrl
const parseCache = new Map();
const MAX_CACHE_SIZE = 1000;

// Priority lookup table - avoids function call overhead in sorting
const PRIORITY_MAP = {
  main: { no_seq: 1, with_seq: (seq) => 1 + seq * 0.1 },
  back_variant: 2,
  back_main: { fallback: 2, normal: 11 },
  model: { seq_1: 3, seq_n: (seq) => 3 + seq },
  video: 12,
  details: { seq_1: 13, seq_n: (seq) => 13 + seq, no_seq: 20 },
  other_model: 21,
  default: 100
};

/**
 * Parses an image/video URL according to the nomenclature rules
 * @param {string} url - The image/video URL to parse
 * @param {Array} colorMappings - Optional array of color mappings from product.metafields.custom.color.value
 * @returns {Object} - An object containing product, color, and image_type
 */
export function parseImageUrl(url, colorMappings = null) {
  // Memoization: check cache first (only for null colorMappings to be safe)
  if (colorMappings === null && parseCache.has(url)) {
    return parseCache.get(url);
  }

  // Initialize result with default values
  const result = {
    product: "",
    color: "",
    image_type: "main",
    reference_id: null,
    unique_id: ""
  };

  // Extract query param for unique_id
  const queryParts = url.split('?v=');
  result.unique_id = queryParts[1] || '';

  // Extract filename from URL and remove file extension
  const slashIdx = url.lastIndexOf('/');
  const filename = slashIdx >= 0 ? url.substring(slashIdx + 1).split('?')[0] : url.split('?')[0];
  const nameWithoutExt = filename.replace(EXTENSION_PATTERN, "");

  // Return default values for malformed URLs or files without proper naming convention
  if (!nameWithoutExt.includes('-')) {
    // Memoize only when colorMappings is null
    if (colorMappings === null && parseCache.size < MAX_CACHE_SIZE) {
      parseCache.set(url, result);
    }
    return result;
  }

  // Handle new formats (NF-no and NF-bu)
  const parts = nameWithoutExt.split('-');
  let nfIndex = -1;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === 'NF') {
      nfIndex = i;
      break;
    }
  }

  if (nfIndex !== -1) {
    // Extract product code (includes the prefix and additional parts)
    const prefix = parts[nfIndex + 1];
    const productParts = parts.slice(nfIndex + 2);

    // Find the index where the color/type section starts - optimized loop
    let typeIndex = -1;
    for (let i = 0; i < productParts.length; i++) {
      const part = productParts[i];
      if (TYPE_CODE_PATTERN.test(part)) {
        typeIndex = i;
        break;
      }
    }

    // Find the product code by looking for the base code before any color parts
    let baseCodeEndIndex = -1;
    for (let i = 0; i < productParts.length; i++) {
      const part = productParts[i];
      if (part.includes('-') || part === 'light' || part === 'dark') {
        baseCodeEndIndex = i;
        break;
      }
    }
    const code =
      baseCodeEndIndex === -1
        ? productParts.slice(0, typeIndex === -1 ? productParts.length - 1 : typeIndex - 1).join('-')
        : productParts.slice(0, baseCodeEndIndex).join('-');

    if (!code) {
      if (colorMappings === null && parseCache.size < MAX_CACHE_SIZE) {
        parseCache.set(url, result);
      }
      return result;
    }

    // Set product code
    result.product = `NF-${prefix}-${code}`;

    // Extract color or reference_id (everything between product code and type code)
    if (typeIndex !== -1) {
      const colorParts = productParts.slice(baseCodeEndIndex === -1 ? typeIndex - 1 : baseCodeEndIndex, typeIndex);

      // Check if this is a reference_id (numeric) or color name
      const colorStr = colorParts.join('-');
      const potentialReferenceId = parseInt(colorStr, 10);

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
        result.color = colorStr;
      }

      // Extract type code and sequence
      const typePart = productParts[typeIndex];
      const typeCode = typePart[0];
      const underscoreIdx = typePart.indexOf('_');

      if (underscoreIdx > 0) {
        result.sequence = parseInt(typePart.substring(underscoreIdx + 1), 10);
      }

      switch (typeCode) {
        case 'D':
          result.image_type = 'details';
          break;
        case 'M':
          result.image_type = 'model';
          break;
        case 'B':
          if (typePart === 'BV' || typePart.startsWith('BV_')) {
            result.image_type = 'back_variant';
          } else {
            result.image_type = 'back_main';
          }
          break;
        case 'H':
        default:
          result.image_type = 'main';
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

  // Memoize only when colorMappings is null
  if (colorMappings === null && parseCache.size < MAX_CACHE_SIZE) {
    parseCache.set(url, result);
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
    const group = groupedImages[key];
    
    // First, check if we have a BV (back variant) image in this group
    let hasBV = false;
    for (let i = 0; i < group.length; i++) {
      if (group[i].image_type === "back_variant") { hasBV = true; break; }
    }

    group.sort((a, b) => {
      // Inline priority calculation to avoid function call overhead
      let pa = a.image_type === "main" ? (a.sequence ? 1 + a.sequence * 0.1 : 1) :
                a.image_type === "back_variant" ? 2 :
                a.image_type === "back_main" ? (hasBV ? 11 : 2) :
                a.image_type === "model" ? (a.sequence === 1 ? 3 : a.sequence > 1 ? 3 + a.sequence : 21) :
                a.image_type === "video" ? 12 :
                a.image_type === "details" ? (a.sequence === 1 ? 13 : a.sequence > 1 ? 13 + a.sequence : 20) : 100;
      
      let pb = b.image_type === "main" ? (b.sequence ? 1 + b.sequence * 0.1 : 1) :
                b.image_type === "back_variant" ? 2 :
                b.image_type === "back_main" ? (hasBV ? 11 : 2) :
                b.image_type === "model" ? (b.sequence === 1 ? 3 : b.sequence > 1 ? 3 + b.sequence : 21) :
                b.image_type === "video" ? 12 :
                b.image_type === "details" ? (b.sequence === 1 ? 13 : b.sequence > 1 ? 13 + b.sequence : 20) : 100;

      // If priorities differ, return immediately (avoids string comparison in most cases)
      if (pa !== pb) return pa - pb;

      // Only do string comparison when priorities are equal
      return a.unique_id < b.unique_id ? -1 : a.unique_id > b.unique_id ? 1 : 0;
    });

    // Show first 8 images (or fewer if even number), hide the rest
    const totalCount = groupedImages[key].length;
    let visibleCount = 8; // Maximum of 8 images
    if (totalCount < 8) {
      // If we have fewer than 8 images, round down to the nearest even number
      // But ensure we always show at least 1 image
      visibleCount = Math.max(1, Math.floor(totalCount / 2) * 2);
    }
    
    // Pre-allocate arrays
    const visibleImages = new Array(visibleCount);
    const hiddenImages = new Array(totalCount - visibleCount);
    let vi = 0, hi = 0;
    
    for (let i = 0; i < totalCount; i++) {
      const img = groupedImages[key][i];
      if (i < visibleCount) {
        visibleImages[vi++] = img;
      } else {
        hiddenImages[hi++] = { ...img, hidden: true };
      }
    }

    groupedImages[key] = visibleImages.concat(hiddenImages);
  });

  // Flatten the grouped images, keeping product-color groups together
  const sortedImages = [];
  const seenUrls = new Set(); // Track URLs we've already added to prevent duplicates
  const mainImageTracker = new Map(); // Track main images per product-color

  Object.keys(groupedImages).forEach((key) => {
    groupedImages[key].forEach((img) => {
      // Special handling for main (H) images to prevent duplicates
      let isDuplicate = seenUrls.has(img.url);

      // For main images, also check if we already have another main image with the same product and color
      if (!isDuplicate && img.image_type === "main") {
        const mainKey = `${img.product}|${img.color}`;
        const existingMainUrl = mainImageTracker.get(mainKey);

        if (existingMainUrl) {
          // Check if this is H_1 (prefer over plain H)
          const filename = img.url.split('/').pop().split('?')[0].replace(/\.[^/.]+$/, "");
          const lastPart = filename.split('-').pop();
          const isExactHSuffix = lastPart === 'H';
          const hasH1Suffix = filename.includes('H_1') || filename.endsWith('-H_1');

          if (hasH1Suffix) {
            // This is an H_1 image, which we prefer - find and remove the existing main image
            const existingMainIndex = sortedImages.findIndex(item => item.url === existingMainUrl);
            if (existingMainIndex !== -1) {
              sortedImages.splice(existingMainIndex, 1);
            }
          } else if (!isExactHSuffix) {
            // This is not an H_1 or exact H image, so skip it
            isDuplicate = true;
          }
        }

        // Track main image for this product-color
        if (!isDuplicate) {
          mainImageTracker.set(mainKey, img.url);
        }
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
