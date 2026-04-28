#!/usr/bin/env node
// Inspect SL translations for the header-group.json section group, focusing on
// the announcement-bar block (blog_link, faq_link, announcement_text, etc.).
//
// Helps diagnose Bug 003 (Blog menu link missing on /sl/) and
// Bug 004 (FAQ menu link missing on /sl/). The source theme has
// `blog_link = shopify://blogs/news` and `faq_link = shopify://pages/faq`,
// so a missing/wrong SL translation override is the likely root cause.

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(__dirname, "..", "translation"));
const { loadEnv } = await import("../translation/lib/env.mjs");
loadEnv();
const { makeTokenProvider } = await import("../translation/lib/auth.mjs");
const { makeShopifyClient } = await import("../translation/lib/shopify.mjs");

const LOCALE = process.argv[2] || "sl";
const SHOP = process.env.SHOPIFY_STORE;
const shopify = makeShopifyClient({
  shop: SHOP,
  tokenProvider: makeTokenProvider({
    shop: SHOP,
    staticToken: process.env.SHOPIFY_ADMIN_TOKEN,
    clientId: process.env.SHOPIFY_CLIENT_ID,
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET,
  }),
});

// Find the header-group section-group resource.
let cursor = null;
let resourceId = null;
while (true) {
  const r = await shopify.gql(
    `query($c:String){
      translatableResources(first:50, after:$c, resourceType: ONLINE_STORE_THEME_SECTION_GROUP){
        pageInfo{ hasNextPage endCursor }
        nodes{ resourceId }
      }
    }`,
    { c: cursor },
  );
  for (const n of r.translatableResources.nodes) {
    if (/\/sections\/header-group\.json/.test(n.resourceId) || /header-group/.test(n.resourceId)) {
      resourceId = n.resourceId;
      break;
    }
  }
  if (resourceId) break;
  if (!r.translatableResources.pageInfo.hasNextPage) break;
  cursor = r.translatableResources.pageInfo.endCursor;
}

if (!resourceId) {
  console.error("Could not find header-group section group resource");
  process.exit(2);
}
console.log(`Resource: ${resourceId}`);

const data = await shopify.gql(
  `query($id:ID!, $locale:String!){
    translatableResource(resourceId:$id){
      translatableContent { key value digest locale }
      translations(locale:$locale){ key value locale }
    }
  }`,
  { id: resourceId, locale: LOCALE },
);

const tByKey = new Map(
  data.translatableResource.translations.map((t) => [t.key, t]),
);

console.log(`\n# Source content (English) vs ${LOCALE} translations`);
console.log(`# Filtering to announcement-bar settings\n`);
for (const c of data.translatableResource.translatableContent) {
  if (!/announcement-bar/.test(c.key)) continue;
  const t = tByKey.get(c.key);
  console.log(`KEY: ${c.key}`);
  console.log(`  source: ${JSON.stringify(c.value)}`);
  console.log(`  ${LOCALE}:    ${t ? JSON.stringify(t.value) : "(not translated)"}`);
}
