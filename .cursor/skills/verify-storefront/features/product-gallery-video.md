# Product gallery video

On a product with a square clip and a vertical clip, the shopper sees the first photo, then a muted looping square tile with a play badge. A click opens the 9:16 reel fullscreen on black. Close returns to the same gallery.

## Sub-features

- `gallery-first-photo` keeps the first tile an image even when a video exists.
- `gallery-square-tile` places the square clip second, same size as a photo tile, muted, looping, with `.video-container__play`.
- `reel-open` opens `#ProductVideoLightbox` with the vertical source, muted, on a black background.
- `reel-controls` toggles mute and pause, then close restores the gallery at `scrollY` 0 with the tile still second.

## How to get to it (user POV)

- Open a product whose media includes a 1:1 clip and a 9:16 clip.
- The second gallery tile is the square video. The vertical file is not a grid slide.
- Tap the tile. Use mute, tap the reel to pause, then close.

## Driving it with agent-browser

Preconditions:

- `doctor.sh` passed for this `THEME_ID` on unpublished draft `206651130188`.
- Viewport is 1400x900, then 390x844 for the swiper.
- Theme Access cannot attach Shopify product media. Do not mutate a live product. Push short QA clips to the unpublished draft only, then splice them into `[data-gallery-media]` and clone `media-gallery` with `dataset.galleryInitialized = "false"`.

- **No-video baseline.** Open `https://northfinder.sk/products/bu-6464sp-damska-mestka-moderna-zateplena-bunda-grasia?preview_theme_id=$THEME_ID`, restore the param, run doctor. First two `[data-gallery-item]` nodes are `image`.
- **Inject the pair.** Append a 720x720 video and a 720x1280 video to `[data-gallery-media]`. Clone the gallery root with `galleryInitialized` false so the MutationObserver creates a new controller. Wait `[data-gallery-grid] .video-container`.
- **Measure the tile.** `types[0]` is `image`. `types[1]` is `video`. Tile is muted, looping, playing. `verticalInGrid` is false. First and second tiles are 425x425 at 1400px.
- **Open the reel.** Click `[data-gallery-grid] .video-container`. `#ProductVideoLightbox` is open. `dialogCurrentSrc` is the vertical file. `dialogMuted` is true. `dialogVideoWidth` x `dialogVideoHeight` is 720x1280.
- **Controls.** Click `.product-video-lightbox__mute` so `dialogMuted` is false. Click `.product-video-lightbox__player` so `dialogPaused` is true and `is-paused` is on the dialog. Click `.product-video-lightbox__close`. Dialog is gone. `scrollY` is 0. The second tile is still video and playing again.
- **Mobile.** Set viewport 390x844. Swiper slide 0 is `image`. Slide 1 is `video`.

## Gotchas

- Cloning `media-gallery` without clearing `data-gallery-initialized` skips `init()`. The JSON updates and the tiles do not.
- `getBoundingClientRect()` does not JSON-serialize. Read `width` and `height` as numbers.
- Theme Access (`shptka_`) cannot run Admin product mutations. `shopify store auth` needs an interactive OAuth callback. Do not attach test videos to a live product with this token.
- QA files pushed to an unpublished draft stay on that theme id. CDN caches them for a long time. They are not product media and they are not on the live theme.
- Wait `--load load`. Analytics never reaches `networkidle`.
