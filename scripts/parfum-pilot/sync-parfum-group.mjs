#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STORE = "sportfinder-international.myshopify.com";
const EXPECTED_SHOP_ID = "gid://shopify/Shop/100928389452";
const API_VERSION = "2026-07";
const FAMILY = "LP-1001";
const METAOBJECT_TYPE = "parfum_group";
const METAOBJECT_HANDLE = "lp-1001";
const EXPECTED_PRODUCTS = new Map([
  ["LP-10011SP", "5ML"],
  ["LP-10012SP", "50ML"],
  ["LP-10013SP", "150ML"],
  ["LP-10014SP", "250ML"],
  ["LP-10015SP", "500ML"],
]);
const MODE = process.argv.includes("--apply") ? "apply" : "dry-run";
const ROLLBACK = process.argv.includes("--rollback");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const themeRoot = path.resolve(__dirname, "../..");
const snapshotDir = path.join(themeRoot, ".tmp/parfum-pilot");
const beforeSnapshotPath = path.join(snapshotDir, "lp-1001-before.json");
const statePath = path.join(snapshotDir, "lp-1001-current.json");
const REQUIRED_APPLY_SCOPES = new Set([
  "write_products",
  "write_metaobjects",
  "write_metaobject_definitions",
]);

function readBeforeSnapshot() {
  return JSON.parse(readFileSync(beforeSnapshotPath, "utf8"));
}

function authorizedProductIds() {
  return validateProducts(readBeforeSnapshot().products).map(
    (product) => product.id,
  );
}

const stateQuery = `
  query ParfumPilotState($ids: [ID!]!, $type: String!, $handle: String!) {
    shop { id name }
    currentAppInstallation {
      accessScopes { handle }
    }
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        handle
        status
        templateSuffix
        publishedAt
        onlineStoreUrl
        catalogCode: metafield(namespace: "custom", key: "catalog_code") { jsonValue }
        size: metafield(namespace: "custom", key: "size") {
          references(first: 10) {
            nodes {
              ... on Metaobject { fields { key jsonValue } }
            }
          }
        }
        productInGroup: metafield(namespace: "custom", key: "product_in_group") {
          jsonValue
          compareDigest
        }
        parfumGroup: metafield(namespace: "custom", key: "parfum_group") {
          jsonValue
          compareDigest
        }
        variants(first: 10) {
          nodes { id sku inventoryQuantity availableForSale }
        }
      }
    }
    metaobjectDefinitionByType(type: $type) {
      id
      type
      displayNameKey
      access { admin storefront }
      fieldDefinitions { key required type { name } }
    }
    canonicalDefinition: metafieldDefinition(
      identifier: { ownerType: PRODUCT, namespace: "custom", key: "parfum_group" }
    ) {
      id
      namespace
      key
      type { name }
      access { admin storefront }
      validations { name value }
    }
    legacyDefinition: metafieldDefinition(
      identifier: { ownerType: PRODUCT, namespace: "custom", key: "product_in_group" }
    ) {
      id
      namespace
      key
      type { name }
      access { admin storefront }
      validations { name value }
    }
    metaobjectByHandle(handle: { type: $type, handle: $handle }) {
      id
      handle
      type
      fields { key jsonValue }
    }
  }
`;

const createMetaobjectDefinitionMutation = `
  mutation CreateParfumGroupDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition { id type }
      userErrors { field message code }
    }
  }
`;

const createMetafieldDefinitionMutation = `
  mutation CreateParfumGroupMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id namespace key type { name } }
      userErrors { field message code }
    }
  }
`;

const upsertGroupMutation = `
  mutation UpsertParfumGroup($handle: MetaobjectHandleInput!, $metaobject: MetaobjectUpsertInput!) {
    metaobjectUpsert(handle: $handle, metaobject: $metaobject) {
      metaobject { id handle type fields { key jsonValue } }
      userErrors { field message code }
    }
  }
`;

const setMetafieldsMutation = `
  mutation SetParfumProductGroups($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id namespace key jsonValue compareDigest }
      userErrors { field message code }
    }
  }
`;

const deleteMetafieldsMutation = `
  mutation DeleteParfumProductGroups($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields { ownerId namespace key }
      userErrors { field message }
    }
  }
`;

const deleteMetaobjectMutation = `
  mutation DeleteParfumGroup($id: ID!) {
    metaobjectDelete(id: $id) {
      deletedId
      userErrors { field message code }
    }
  }
`;

function executeGraphql(query, variables = {}, allowMutations = false) {
  const env = {
    ...process.env,
    SHOPIFY_CLI_AGENT_INFO: "n:factory-droid|v:none|p:openai|m:GPT-5.6-Luna",
    SHOPIFY_CLI_AGENT_IDS: "r:parfum-pilot-sync-20260803|i:orca",
  };
  const args = [
    "store",
    "execute",
    "--store",
    STORE,
    "--version",
    API_VERSION,
    "--json",
    "--query",
    query,
    "--variables",
    JSON.stringify(variables),
  ];
  if (allowMutations) args.push("--allow-mutations");

  const stdout = execFileSync("shopify", args, {
    cwd: themeRoot,
    env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    maxBuffer: 10 * 1024 * 1024,
  });
  const payload = JSON.parse(stdout);
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join("; "));
  }
  return payload;
}

function userErrors(payload, field) {
  const errors = payload?.[field]?.userErrors ?? [];
  if (errors.length) {
    throw new Error(
      `${field}: ${errors.map((error) => error.message).join("; ")}`,
    );
  }
  return payload[field];
}

function sizeValue(product) {
  return (
    product.size?.references?.nodes?.[0]?.fields?.find(
      (field) => field.key === "value",
    )?.jsonValue ?? null
  );
}

function sortedProducts(products) {
  return [...products].sort(
    (a, b) =>
      Number(sizeValue(a).replace("ML", "")) -
      Number(sizeValue(b).replace("ML", "")),
  );
}

function normalizeIds(value) {
  return Array.isArray(value) ? value : [];
}

function sameIds(left, right) {
  return (
    JSON.stringify(normalizeIds(left)) === JSON.stringify(normalizeIds(right))
  );
}

function validateProducts(products) {
  const unexpectedCodes = products
    .map((product) => product.catalogCode?.jsonValue)
    .filter(
      (catalogCode) => catalogCode && !EXPECTED_PRODUCTS.has(catalogCode),
    );
  if (unexpectedCodes.length) {
    throw new Error(
      `Query returned non-allowlisted catalog codes: ${unexpectedCodes.join(", ")}`,
    );
  }

  const pilotProducts = products.filter((product) =>
    EXPECTED_PRODUCTS.has(product.catalogCode?.jsonValue),
  );
  if (pilotProducts.length !== EXPECTED_PRODUCTS.size) {
    throw new Error(
      `Expected ${EXPECTED_PRODUCTS.size} ${FAMILY} products, found ${pilotProducts.length}`,
    );
  }

  for (const product of pilotProducts) {
    const catalogCode = product.catalogCode.jsonValue;
    const expectedSize = EXPECTED_PRODUCTS.get(catalogCode);
    const actualSize = sizeValue(product);
    if (actualSize !== expectedSize) {
      throw new Error(
        `${catalogCode}: expected ${expectedSize}, found ${actualSize ?? "no size"}`,
      );
    }
    if (product.status !== "ACTIVE") {
      throw new Error(
        `${catalogCode}: expected ACTIVE status, found ${product.status}`,
      );
    }
  }

  const ordered = sortedProducts(pilotProducts);
  const actualCodes = ordered.map((product) => product.catalogCode.jsonValue);
  if (new Set(actualCodes).size !== EXPECTED_PRODUCTS.size) {
    throw new Error("Pilot contains duplicate catalog codes");
  }
  return ordered;
}

function validateDefinition(state) {
  const definition = state.metaobjectDefinitionByType;
  if (!definition) return;
  const fields = new Map(
    definition.fieldDefinitions.map((field) => [field.key, field]),
  );
  const unexpectedRequiredFields = definition.fieldDefinitions.filter(
    (field) =>
      field.required &&
      !["name", "family_code", "products"].includes(field.key),
  );
  const schemaMatches =
    definition.displayNameKey === "name" &&
    ["PUBLIC_READ_WRITE", "MERCHANT_READ_WRITE"].includes(
      definition.access.admin,
    ) &&
    definition.access.storefront === "PUBLIC_READ" &&
    fields.get("family_code")?.type.name === "single_line_text_field" &&
    fields.get("family_code")?.required === true &&
    fields.get("name")?.type.name === "single_line_text_field" &&
    fields.get("name")?.required === true &&
    fields.get("products")?.type.name === "list.product_reference" &&
    fields.get("products")?.required === true &&
    unexpectedRequiredFields.length === 0;
  if (!schemaMatches) {
    throw new Error(
      "Existing parfum_group definition does not match the pilot schema or access contract",
    );
  }
}

function validateMetafieldDefinitions(state) {
  const definition = state.canonicalDefinition;
  if (definition) {
    if (
      definition.type.name !== "metaobject_reference" ||
      definition.access.storefront !== "PUBLIC_READ"
    ) {
      throw new Error(
        "custom.parfum_group exists with an incompatible type or storefront access",
      );
    }
    const target = definition.validations.find(
      (validation) => validation.name === "metaobject_definition_id",
    )?.value;
    if (
      state.metaobjectDefinitionByType &&
      target !== state.metaobjectDefinitionByType.id
    ) {
      throw new Error(
        "custom.parfum_group targets a different metaobject definition",
      );
    }
  }

  if (
    !state.legacyDefinition ||
    state.legacyDefinition.type.name !== "list.product_reference" ||
    state.legacyDefinition.access.storefront !== "PUBLIC_READ"
  ) {
    throw new Error(
      "custom.product_in_group is missing, incompatible, or not storefront-readable",
    );
  }
}

function validateScopes(state) {
  if (MODE !== "apply") return;
  const scopes = new Set(
    state.currentAppInstallation.accessScopes.map((scope) => scope.handle),
  );
  const missing = [...REQUIRED_APPLY_SCOPES].filter(
    (scope) => !scopes.has(scope),
  );
  if (missing.length) {
    throw new Error(`Missing required Shopify scopes: ${missing.join(", ")}`);
  }
}

function fetchState() {
  return executeGraphql(stateQuery, {
    ids: authorizedProductIds(),
    type: METAOBJECT_TYPE,
    handle: METAOBJECT_HANDLE,
  });
}

function writeState(state) {
  mkdirSync(snapshotDir, { recursive: true });
  writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function coreFingerprint(product) {
  return {
    id: product.id,
    catalogCode: product.catalogCode?.jsonValue,
    status: product.status,
    templateSuffix: product.templateSuffix || null,
    publishedAt: product.publishedAt,
    onlineStoreUrl: product.onlineStoreUrl,
    variants: product.variants.nodes
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        inventoryQuantity: variant.inventoryQuantity,
        availableForSale: variant.availableForSale,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  };
}

function validateStoreAndSnapshot(state, products, allowPilotState = false) {
  if (state.shop.id !== EXPECTED_SHOP_ID) {
    throw new Error(
      `Expected shop ${EXPECTED_SHOP_ID}, found ${state.shop.id}`,
    );
  }
  const snapshot = readBeforeSnapshot();
  if (snapshot.store.id !== EXPECTED_SHOP_ID) {
    throw new Error("Before snapshot belongs to a different Shopify store");
  }
  const snapshotProducts = validateProducts(snapshot.products);
  const currentById = new Map(products.map((product) => [product.id, product]));
  for (const product of snapshotProducts) {
    const currentProduct = currentById.get(product.id);
    if (!currentProduct) {
      throw new Error(
        `${product.catalogCode.jsonValue}: authorized product ID no longer resolves`,
      );
    }
    const expected = coreFingerprint(product);
    const current = coreFingerprint(currentProduct);
    if (JSON.stringify(current) !== JSON.stringify(expected)) {
      throw new Error(
        `${product.catalogCode.jsonValue}: core product state changed since the before snapshot`,
      );
    }
    if (
      currentProduct.publishedAt !== null ||
      currentProduct.onlineStoreUrl !== null
    ) {
      throw new Error(
        `${product.catalogCode.jsonValue}: pilot product is now published`,
      );
    }

    const beforeLegacy = product.productInGroup?.jsonValue ?? null;
    const beforeCanonical = product.parfumGroup?.jsonValue ?? null;
    const currentLegacy = currentProduct.productInGroup?.jsonValue ?? null;
    const currentCanonical = currentProduct.parfumGroup?.jsonValue ?? null;

    if (!allowPilotState) {
      if (
        JSON.stringify(currentLegacy) !== JSON.stringify(beforeLegacy) ||
        JSON.stringify(currentCanonical) !== JSON.stringify(beforeCanonical)
      ) {
        throw new Error(
          `${product.catalogCode.jsonValue}: target group metafields drifted since the before snapshot`,
        );
      }
    } else {
      const desiredLegacy = products.map((candidate) => candidate.id);
      const legacyAllowed =
        JSON.stringify(currentLegacy) === JSON.stringify(beforeLegacy) ||
        sameIds(currentLegacy, desiredLegacy);
      const canonicalAllowed =
        JSON.stringify(currentCanonical) === JSON.stringify(beforeCanonical) ||
        currentCanonical === state.metaobjectByHandle?.id;
      if (!legacyAllowed || !canonicalAllowed) {
        throw new Error(
          `${product.catalogCode.jsonValue}: target group metafields contain external drift`,
        );
      }
    }
  }
}

function createDefinitions(state) {
  let definitionId = state.metaobjectDefinitionByType?.id;
  if (!definitionId) {
    const response = executeGraphql(
      createMetaobjectDefinitionMutation,
      {
        definition: {
          name: "Parfum group",
          type: METAOBJECT_TYPE,
          description:
            "Canonical ordered group of individual Parfum size products.",
          displayNameKey: "name",
          access: { storefront: "PUBLIC_READ" },
          fieldDefinitions: [
            {
              name: "Name",
              key: "name",
              type: "single_line_text_field",
              required: true,
            },
            {
              name: "Family code",
              key: "family_code",
              type: "single_line_text_field",
              required: true,
            },
            {
              name: "Products",
              key: "products",
              type: "list.product_reference",
              required: true,
            },
          ],
        },
      },
      true,
    );
    definitionId = userErrors(response, "metaobjectDefinitionCreate")
      .metaobjectDefinition.id;
    console.log(`Created ${METAOBJECT_TYPE} definition ${definitionId}`);
  }

  if (!state.canonicalDefinition) {
    const response = executeGraphql(
      createMetafieldDefinitionMutation,
      {
        definition: {
          name: "Parfum group",
          namespace: "custom",
          key: "parfum_group",
          description:
            "Canonical Parfum family for cross-product size navigation.",
          ownerType: "PRODUCT",
          type: "metaobject_reference",
          validations: [
            { name: "metaobject_definition_id", value: definitionId },
          ],
          access: { storefront: "PUBLIC_READ" },
        },
      },
      true,
    );
    userErrors(response, "metafieldDefinitionCreate");
    console.log("Created custom.parfum_group definition");
  }
}

function upsertGroup(productIds) {
  const response = executeGraphql(
    upsertGroupMutation,
    {
      handle: { type: METAOBJECT_TYPE, handle: METAOBJECT_HANDLE },
      metaobject: {
        fields: [
          { key: "name", value: "Active Fresh" },
          { key: "family_code", value: FAMILY },
          { key: "products", value: JSON.stringify(productIds) },
        ],
      },
    },
    true,
  );
  return userErrors(response, "metaobjectUpsert").metaobject;
}

function syncProductMetafields(products, groupId, productIds) {
  const legacyValue = JSON.stringify(productIds);
  const metafields = products.flatMap((product) => [
    {
      ownerId: product.id,
      namespace: "custom",
      key: "parfum_group",
      type: "metaobject_reference",
      value: groupId,
      compareDigest: product.parfumGroup?.compareDigest ?? null,
    },
    {
      ownerId: product.id,
      namespace: "custom",
      key: "product_in_group",
      type: "list.product_reference",
      value: legacyValue,
      compareDigest: product.productInGroup?.compareDigest ?? null,
    },
  ]);
  const response = executeGraphql(setMetafieldsMutation, { metafields }, true);
  userErrors(response, "metafieldsSet");
}

function rollback() {
  if (MODE !== "apply") throw new Error("Rollback requires --apply --rollback");
  const snapshot = readBeforeSnapshot();
  const snapshotProducts = validateProducts(snapshot.products);
  const state = fetchState();
  validateDefinition(state);
  validateMetafieldDefinitions(state);
  validateScopes(state);
  const products = validateProducts(state.nodes);
  validateStoreAndSnapshot(state, products, true);
  const plan = buildPlan(state, products);
  if (plan.hasChanges) {
    throw new Error(
      "Rollback requires a fully converged pilot state with no external drift",
    );
  }

  const deleteInputs = [];
  const restoreInputs = [];

  for (const product of snapshotProducts) {
    deleteInputs.push({
      ownerId: product.id,
      namespace: "custom",
      key: "parfum_group",
    });
    const previousLegacy = product.productInGroup?.jsonValue;
    if (previousLegacy) {
      restoreInputs.push({
        ownerId: product.id,
        namespace: "custom",
        key: "product_in_group",
        type: "list.product_reference",
        value: JSON.stringify(previousLegacy),
      });
    } else {
      deleteInputs.push({
        ownerId: product.id,
        namespace: "custom",
        key: "product_in_group",
      });
    }
  }

  const deleteResponse = executeGraphql(
    deleteMetafieldsMutation,
    { metafields: deleteInputs },
    true,
  );
  userErrors(deleteResponse, "metafieldsDelete");
  if (restoreInputs.length) {
    const restoreResponse = executeGraphql(
      setMetafieldsMutation,
      { metafields: restoreInputs },
      true,
    );
    userErrors(restoreResponse, "metafieldsSet");
  }

  if (state.metaobjectByHandle?.id) {
    const deleteGroupResponse = executeGraphql(
      deleteMetaobjectMutation,
      { id: state.metaobjectByHandle.id },
      true,
    );
    userErrors(deleteGroupResponse, "metaobjectDelete");
  }

  const rolledBackState = fetchState();
  const rolledBackProducts = validateProducts(rolledBackState.nodes);
  validateStoreAndSnapshot(rolledBackState, rolledBackProducts, false);
  if (rolledBackState.metaobjectByHandle) {
    throw new Error("Rollback verification failed: pilot group still exists");
  }
  console.log("Restored product group metafields and removed the pilot group");
}

function buildPlan(state, products) {
  const productIds = products.map((product) => product.id);
  const groupFields = new Map(
    (state.metaobjectByHandle?.fields ?? []).map((field) => [
      field.key,
      field.jsonValue,
    ]),
  );
  const desiredLegacy = productIds;
  const needsDefinition = !state.metaobjectDefinitionByType;
  const needsMetafieldDefinition = !state.canonicalDefinition;
  const needsGroup =
    !state.metaobjectByHandle ||
    groupFields.get("name") !== "Active Fresh" ||
    groupFields.get("family_code") !== FAMILY ||
    !sameIds(groupFields.get("products"), productIds);
  const productsNeedingSync = products.filter(
    (product) =>
      product.parfumGroup?.jsonValue !== state.metaobjectByHandle?.id ||
      !sameIds(product.productInGroup?.jsonValue, desiredLegacy),
  );

  return {
    family: FAMILY,
    mode: MODE,
    products: products.map((product) => ({
      id: product.id,
      catalogCode: product.catalogCode.jsonValue,
      size: sizeValue(product),
    })),
    needsDefinition,
    needsMetafieldDefinition,
    needsGroup,
    productsNeedingSync: productsNeedingSync.map(
      (product) => product.catalogCode.jsonValue,
    ),
    hasChanges:
      needsDefinition ||
      needsMetafieldDefinition ||
      needsGroup ||
      productsNeedingSync.length > 0,
  };
}

if (ROLLBACK) {
  rollback();
  const state = fetchState();
  writeState(state);
  process.exit(0);
}

let state = fetchState();
validateDefinition(state);
validateMetafieldDefinitions(state);
validateScopes(state);
let products = validateProducts(state.nodes);
validateStoreAndSnapshot(state, products, Boolean(state.metaobjectByHandle));
let plan = buildPlan(state, products);
console.log(JSON.stringify(plan, null, 2));

if (MODE === "dry-run" || !plan.hasChanges) {
  writeState(state);
  if (!plan.hasChanges) console.log("No changes required");
  process.exit(0);
}

for (let attempt = 1; attempt <= 3; attempt += 1) {
  createDefinitions(state);
  state = fetchState();
  validateDefinition(state);
  validateMetafieldDefinitions(state);
  validateScopes(state);
  products = validateProducts(state.nodes);
  validateStoreAndSnapshot(state, products, Boolean(state.metaobjectByHandle));
  const productIds = products.map((product) => product.id);
  const group = upsertGroup(productIds);
  syncProductMetafields(products, group.id, productIds);

  state = fetchState();
  validateDefinition(state);
  validateMetafieldDefinitions(state);
  products = validateProducts(state.nodes);
  validateStoreAndSnapshot(state, products, true);
  plan = buildPlan(state, products);
  writeState(state);
  if (!plan.hasChanges) {
    console.log("Pilot group sync converged successfully");
    process.exit(0);
  }
  if (attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
}

throw new Error(
  `Pilot did not converge after 3 attempts: ${JSON.stringify(plan)}`,
);
