# Merchant-authored “All …” menu links evidence

Verified on 2026-08-04 against the International store.

## Root cause confirmation

Shopify Admin GraphQL shows six nested menu items whose URL intentionally matches their parent category URL, including:

- `Men > Men's Jackets > All Jackets`
- `Men > Men's Trousers > All Trousers`
- `Men > Men's Fleece & Midlayer > All Fleece & Midlayer`
- the corresponding three Women's menu items

The complete filtered Admin response is stored in [`admin-duplicate-parent-urls.json`](evidence/authored-all-links/admin-duplicate-parent-urls.json).

The live desktop theme returned no matching nested `.mega-menu__link` elements. See [`live-desktop-dom.json`](evidence/authored-all-links/live-desktop-dom.json). The Liquid implementation skipped any nested link whose URL matched the parent URL.

## Draft-theme verification

- Theme: `QA Authored All Menu Links 2026-08-04`
- Theme ID: `203133616460`
- Role: unpublished
- Preview: <https://sportfinder-international.myshopify.com?preview_theme_id=203133616460>
- Editor: <https://sportfinder-international.myshopify.com/admin/themes/203133616460/editor>

The draft renders all six merchant-authored links in both navigation variants:

- [`draft-desktop-dom.json`](evidence/authored-all-links/draft-desktop-dom.json)
- [`draft-mobile-dom.json`](evidence/authored-all-links/draft-mobile-dom.json)

The uploaded draft snippets were pulled back from Shopify and matched the local files byte-for-byte.

## Screenshots

### Reporter evidence

Shopify Admin contains `All Jackets`, while the reported storefront menu omits it:

![Shopify Admin menu containing All Jackets](evidence/authored-all-links/reporter-admin-menu.png)

![Reported storefront menu without All Jackets](evidence/authored-all-links/reporter-storefront-menu.png)

### Draft desktop

The desktop mega menu now includes `All Jackets`, `All Trousers`, and `All Fleece & Midlayer` in their merchant-authored positions:

![Draft desktop mega menu with authored All links](evidence/authored-all-links/draft-desktop-men-menu.png)

### Draft mobile

The mobile drawer now renders the authored `All Jackets` tile instead of replacing it with a generated label:

![Draft mobile menu with authored All Jackets tile](evidence/authored-all-links/draft-mobile-all-jackets-visible.png)

## Validation

- Vitest: 25 tests passed, including two menu-source regression tests.
- Changed Liquid files: zero Theme Check errors.
- Existing Theme Check warnings remain:
  - `OrphanedSnippet` for both menu snippets, because Theme Check does not resolve their dynamic render path.
  - `ValidRenderSnippetArgumentTypes` for the pre-existing numeric `size: 400` argument in `header-mega-menu.liquid`.
- Full repository Theme Check remains red because of the existing legacy baseline: 314 errors and 816 warnings across unrelated files.
