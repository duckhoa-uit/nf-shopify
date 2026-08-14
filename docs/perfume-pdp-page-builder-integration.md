# Perfume PDP page-builder integration

The perfume volume selector is a cross-product navigation component. Each volume links to a sibling Shopify product in the same perfume family. It is not an in-page Shopify variant selector.

## Canonical component

The source-controlled implementation is:

- `snippets/perfume-product-family-picker.liquid`
- `assets/perfume-product-family-picker.css`

The component reads `custom.parfum_group` first and temporarily falls back to `custom.product_in_group`. Keep the fallback until the retirement prerequisites in GitHub issue `#45` are complete.

Volume options are detected with the theme's locale-independent size-option helper. The literal `Size` option lookup remains only as a compatibility fallback for existing perfume catalog data.

## EComposer

Add an EComposer **Code** element in the Product Template immediately after EComposer's native product variant picker and before quantity/add-to-cart controls. Render the EComposer-specific adapter:

```liquid
{% render 'perfume-product-family-picker-ecomposer', product: product, instance_id: 'EComposerPerfumeFamilyPicker' %}
```

Do not paste the component implementation or duplicate CSS into EComposer. Do not edit generated `ecom-*.liquid`, `ecom-*.css`, or `ecom-*.js` files directly.

EComposer remains responsible for product media, price, the underlying variant form and variant JSON, quantity, and add-to-cart. Perfume volume is represented by sibling products, so the adapter hides EComposer's generated Color presentation and singleton Size presentation when the current product belongs to a perfume family. The Color and Size values remain in the product's variant data and selected variant control for form submission. The custom component performs normal navigation to sibling product URLs and must not bridge EComposer events to the theme product runtime.

This ownership boundary keeps the visible perfume PDP contract consistent with the native template: the custom `5ML / 50ML / 150ML / ...` sibling-product picker is the only visible volume control, while EComposer's variant runtime remains intact but its Color and singleton Size presentations are hidden.

If multiple EComposer templates need the adapter, it can be saved as an EComposer Global Block while the canonical implementation remains in this repository.

## Other page builders

For any builder that supports Shopify Liquid, use the same adapter contract:

1. Use a builder-specific adapter when the builder renders variant presentations that the perfume PDP contract intentionally hides.
2. Load `perfume-product-family-picker.css`.
3. Render `perfume-product-family-picker` with the current `product` and a unique `instance_id`.
4. Place the adapter directly after the builder's native variant picker and before quantity/add-to-cart controls.
5. Keep normal sibling-product links as the functional behavior.

If a builder does not support Shopify Liquid, use its supported app/embed integration or a hybrid Shopify template. Do not copy the business logic into builder-generated code or couple the component to generated product-form selectors.

## Verification checklist

- The published builder page resolves the current `product` object and perfume group metafield.
- The current volume uses `aria-current="page"`.
- Available volumes are normal links and unavailable volumes expose `aria-disabled="true"`.
- EComposer's underlying selected variant control and variant JSON remain present for add-to-cart.
- No generated Color presentation is visible on the perfume PDP.
- No duplicate singleton volume/Size presentation is visible beside the family picker.
- The family picker Code element is directly after the native variant picker and before quantity/add-to-cart controls.
- Every sibling product uses the intended product template.
- Navigation loads the correct media, price, availability, and add-to-cart state for the destination product.
- Browser Back and Forward work normally.
- Republishing the builder template preserves the adapter.
