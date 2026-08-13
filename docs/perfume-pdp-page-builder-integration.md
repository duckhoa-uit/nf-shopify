# Perfume PDP page-builder integration

The perfume volume selector is a cross-product navigation component. Each volume links to a sibling Shopify product in the same perfume family. It is not an in-page Shopify variant selector.

## Canonical component

The source-controlled implementation is:

- `snippets/perfume-product-family-picker.liquid`
- `assets/perfume-product-family-picker.css`

The component reads `custom.parfum_group` first and temporarily falls back to `custom.product_in_group`. Keep the fallback until the retirement prerequisites in GitHub issue `#45` are complete.

Volume options are detected with the theme's locale-independent size-option helper. The literal `Size` option lookup remains only as a compatibility fallback for existing perfume catalog data.

## EComposer

Add an EComposer **Code** element at the desired position in the Product Template. Render the EComposer-specific adapter:

```liquid
{% render 'perfume-product-family-picker-ecomposer', product: product, instance_id: 'EComposerPerfumeFamilyPicker' %}
```

Do not paste the component implementation or duplicate CSS into EComposer. Do not edit generated `ecom-*.liquid`, `ecom-*.css`, or `ecom-*.js` files directly.

EComposer remains responsible for product media, price, real in-product variant options such as Color, quantity, and add-to-cart. Perfume volume is represented by sibling products, so the adapter hides only EComposer's generated singleton size control when the current product belongs to a perfume family. The singleton size value remains in the product's variant data for form submission. The custom component performs normal navigation to sibling product URLs and must not bridge EComposer events to the theme product runtime.

This ownership boundary prevents the EComposer native `Size` control from appearing beside the custom `5ML / 50ML / 150ML / ...` sibling-product picker while preserving real variant selection such as Color.

If multiple EComposer templates need the adapter, it can be saved as an EComposer Global Block while the canonical implementation remains in this repository.

## Other page builders

For any builder that supports Shopify Liquid, use the same adapter contract:

1. Use a builder-specific adapter when the builder renders a duplicate singleton volume option.
2. Load `perfume-product-family-picker.css`.
3. Render `perfume-product-family-picker` with the current `product` and a unique `instance_id`.
4. Keep normal sibling-product links as the functional behavior.

If a builder does not support Shopify Liquid, use its supported app/embed integration or a hybrid Shopify template. Do not copy the business logic into builder-generated code or couple the component to generated product-form selectors.

## Verification checklist

- The published builder page resolves the current `product` object and perfume group metafield.
- The current volume uses `aria-current="page"`.
- Available volumes are normal links and unavailable volumes expose `aria-disabled="true"`.
- Real in-product variants such as Color remain selectable in the builder's native picker.
- No duplicate singleton volume/Size control is visible beside the family picker.
- Every sibling product uses the intended product template.
- Navigation loads the correct media, price, availability, and add-to-cart state for the destination product.
- Browser Back and Forward work normally.
- Republishing the builder template preserves the adapter.
