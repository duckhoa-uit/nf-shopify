# Product gallery videos

Square and vertical product clips live in **product media**, not metafields.

Merchants upload two Shopify product videos when both exist:

- Square (about 1:1) — gallery tile, always after the first photo
- Vertical (about 9:16) — fullscreen reel only, never a grid/swiper slide

The theme classifies clips from the actual source width/height (`sources[].width / height`), then `media.aspect_ratio`, then the poster. Anything taller than 3:4 (`aspect < 0.75`) is vertical. Prefer source dimensions because Shopify posters are sometimes square even when the file is 9:16.

## Behaviour

- No video: gallery sequence is unchanged
- Square + vertical: gallery shows `[first photo, square, …]`. Clicking the square opens the vertical clip
- Only vertical: that clip is cropped to the first photo’s tile ratio in the gallery, then opened uncropped fullscreen
- Video is never pinned to position 1 even if it is the selected variant’s featured media
- Gallery tile autoplays muted and loops, with a play badge in the corner
- Fullscreen uses a native `<dialog>` (not Fancybox): black background, 9:16 contain, starts muted, tap to pause, mute toggle, close. Closing restores focus and gallery scroll/swiper position

## Files

- `assets/product-media-gallery-video.js` — pairing + fullscreen viewer
- `assets/product-media-gallery-sequence.js` — keeps vertical clips out of the sequence
- `assets/product-media-gallery-runtime.js` — tile, play badge, opens the viewer
- `assets/product-media-gallery.css` — badge + fullscreen chrome
- `snippets/product-media-gallery.liquid` — translated control labels
- `locales/en.default.json` — `products.product.media.pause_video`, `mute_video`, `unmute_video`

## Pitfalls

- Do not add vertical files to `filteredSources`. `reorderVideos` would put them in the grid.
- Do not open gallery video sources in the reel when a vertical sibling exists.
- Do not start the reel unmuted; autoplay with sound is blocked and the ticket requires mute-on.
- Fancybox is still used for photo lightbox only. Video HTML-in-Fancybox was dropped because it used native controls, started with sound, and could not swap in a second file.
- `product.media | json` already includes `sources` and `aspect_ratio` for Shopify-hosted videos. No extra Liquid dump is required.
