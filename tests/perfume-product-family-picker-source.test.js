import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const readProjectFile = (path) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), "utf8");

describe("perfume product-family picker", () => {
  test("keeps group resolution in the canonical builder-neutral snippet", () => {
    const source = readProjectFile("snippets/perfume-product-family-picker.liquid");
    const wrapper = readProjectFile("snippets/product-variant-picker-parfums.liquid");

    expect(source).toContain("product.metafields.custom.parfum_group.value");
    expect(source).toContain("perfume_group.products.value");
    expect(source).toContain("product.metafields.custom.product_in_group.value");
    expect(wrapper).toContain("render 'perfume-product-family-picker'");
    expect(wrapper).not.toContain("product.metafields.custom.parfum_group.value");
  });

  test("resolves, deduplicates, and renders sibling product volumes semantically", () => {
    const source = readProjectFile("snippets/perfume-product-family-picker.liquid");

    expect(source).toContain("render 'is-size-option', option: option, product: family_product");
    expect(source).toContain("family_product.options_by_name.Size");
    expect(source).toContain("family_product.metafields.custom.size.value");
    expect(source).toContain("rendered_size_keys contains size_token");
    expect(source).toContain('aria-current="page"');
    expect(source).toContain('href="{{ family_product.url | escape }}"');
    expect(source).toContain('aria-disabled="true"');
    expect(source).toContain("'products.product.size_label' | t");
  });

  test("does not depend on Dawn or EComposer presentation contracts", () => {
    const source = readProjectFile("snippets/perfume-product-family-picker.liquid");

    expect(source).toContain("perfume-product-family-picker__group");
    expect(source).not.toContain("product-form__input");
    expect(source).not.toContain("ecom-product");
    expect(source).not.toContain("block.id");
    expect(source).not.toContain("block.shopify_attributes");
    expect(source).toContain("instance_id | default: product.id | handleize");
  });

  test("uses an EComposer adapter to hide Color and singleton family Size presentation", () => {
    const adapter = readProjectFile("snippets/perfume-product-family-picker-ecomposer.liquid");

    expect(adapter).toContain("option_handle == 'color' or option_handle == 'colour'");
    expect(adapter).toContain("ecomposer_color_option_handle = option_handle");
    expect(adapter).toContain("ecomposer_color_option_index = option.position | minus: 1");
    expect(adapter).toContain("assign color_option = product.options_by_name.Color");
    expect(adapter).toContain("render 'is-size-option', option: option, product: product");
    expect(adapter).toContain("option.values.size == 1");
    expect(adapter).toContain("ecomposer_size_option_handle = option.name | handleize");
    expect(adapter).toContain("ecomposer_size_option_index = option.position | minus: 1");
    expect(adapter).toContain("assign size_option = product.options_by_name.Size");
    expect(adapter).toContain("size_option.values.size == 1");
    expect(adapter).toContain("ecom-product-single__picker-option-{{ ecomposer_size_option_handle }}");
    expect(adapter).toContain(
      '.selector-wrapper:has(.single-option-selector[data-option-index="{{ ecomposer_size_option_index }}"])',
    );
    expect(adapter).toContain("ecom-product-single__picker-option-{{ ecomposer_color_option_handle }}");
    expect(adapter).toContain(
      '.selector-wrapper:has(.single-option-selector[data-option-index="{{ ecomposer_color_option_index }}"])',
    );
    expect(adapter).toContain("data-perfume-ecomposer-color-ownership");
    expect(adapter).toContain("display: none !important");
    expect(adapter).toContain("render 'perfume-product-family-picker'");
  });

  test("loads the component stylesheet on the maintained perfume PDP", () => {
    const section = readProjectFile("sections/main-product-parfums.liquid");
    const styles = readProjectFile("assets/perfume-product-family-picker.css");

    expect(section).toContain("'perfume-product-family-picker.css' | asset_url | stylesheet_tag");
    expect(styles).toContain(".perfume-product-family-picker__option--current");
    expect(styles).toContain(".perfume-product-family-picker__option--unavailable");
    expect(styles).toContain("--variant-pills-radius, 3px");
    expect(styles).toContain("color-mix(in srgb, currentColor");
    expect(styles).not.toContain(".ecom-");
  });
});
