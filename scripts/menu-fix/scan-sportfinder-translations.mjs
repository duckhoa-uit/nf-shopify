#!/usr/bin/env node
// Scan all storefront locale translations for any value containing
// "sportfinder.de" and report them. Optionally rewrite the host to a
// relative path (drop "https://sportfinder.de") with --confirm.
//
// This catches any per-locale URL override (theme settings, JSON template
// settings, link list items) that points at the wrong cross-store domain.
//
// Usage:
//   node scripts/menu-fix/scan-sportfinder-translations.mjs            # scan only
//   node scripts/menu-fix/scan-sportfinder-translations.mjs --confirm  # apply rewrite

import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(path.join(__dirname, "..", "translation"));
const { loadEnv } = await import("../translation/lib/env.mjs");
loadEnv();
const { makeTokenProvider } = await import("../translation/lib/auth.mjs");
const { makeShopifyClient } = await import("../translation/lib/shopify.mjs");

const CONFIRM = process.argv.includes("--confirm");
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

// Get all enabled storefront locales.
const locQ = await shopify.gql(`{
  shopLocales { locale primary published }
}`);
const locales = locQ.shopLocales.filter((l) => l.published && !l.primary).map((l) => l.locale);
console.log(`Scanning locales: ${locales.join(", ")}`);

// Resource types worth scanning. Anything with URL-like settings.
const resourceTypes = [
  "ONLINE_STORE_THEME_SECTION_GROUP",
  "ONLINE_STORE_THEME_JSON_TEMPLATE",
  "ONLINE_STORE_THEME_SETTINGS_DATA_SECTIONS",
  "ONLINE_STORE_THEME_LOCALE_CONTENT",
  "ONLINE_STORE_THEME_APP_EMBED",
  "LINK",
  "MENU",
];

function deToRelative(url) {
  try {
    const u = new URL(url);
    if (!/sportfinder\.de$/i.test(u.hostname)) return null;
    return u.pathname + u.search + u.hash;
  } catch {
    return null;
  }
}

const findings = [];

for (const rt of resourceTypes) {
  let cursor = null;
  let total = 0;
  while (true) {
    let r;
    try {
      r = await shopify.gql(
        `query($c:String, $rt:TranslatableResourceType!){
          translatableResources(first:50, after:$c, resourceType:$rt){
            pageInfo{ hasNextPage endCursor }
            nodes{ resourceId }
          }
        }`,
        { c: cursor, rt },
      );
    } catch (e) {
      console.warn(`  ! skip resourceType=${rt}: ${e.message.slice(0, 100)}`);
      break;
    }
    for (const n of r.translatableResources.nodes) {
      total++;
      // For each locale, fetch translations and check.
      for (const loc of locales) {
        let trDetail;
        try {
          trDetail = await shopify.gql(
            `query($id:ID!, $locale:String!){
              translatableResource(resourceId:$id){
                translations(locale:$locale){ key value locale }
                translatableContent { key digest }
              }
            }`,
            { id: n.resourceId, locale: loc },
          );
        } catch (e) {
          continue;
        }
        const digestByKey = new Map(
          trDetail.translatableResource.translatableContent.map((c) => [c.key, c.digest]),
        );
        for (const t of trDetail.translatableResource.translations) {
          if (!t.value || !t.value.includes("sportfinder.de")) continue;
          const next = deToRelative(t.value);
          findings.push({
            resourceId: n.resourceId,
            locale: loc,
            key: t.key,
            digest: digestByKey.get(t.key),
            from: t.value,
            to: next || t.value,
          });
        }
      }
    }
    if (!r.translatableResources.pageInfo.hasNextPage) break;
    cursor = r.translatableResources.pageInfo.endCursor;
  }
  console.log(`  scanned ${rt}: ${total} resources`);
}

console.log(`\nFindings: ${findings.length}`);
for (const f of findings) {
  console.log(`  [${f.locale}] ${f.resourceId}`);
  console.log(`     key:  ${f.key}`);
  console.log(`     from: ${JSON.stringify(f.from).slice(0, 200)}`);
  console.log(`     to:   ${JSON.stringify(f.to).slice(0, 200)}`);
}

if (findings.length === 0) {
  console.log("\nNothing to do.");
  process.exit(0);
}

if (!CONFIRM) {
  console.log("\nDry run. Re-run with --confirm to apply.");
  process.exit(0);
}

// Group by resourceId for batched translationsRegister calls.
const byResource = new Map();
for (const f of findings) {
  if (!f.digest) {
    console.warn(`  ! no digest for ${f.key} on ${f.resourceId} — skipping`);
    continue;
  }
  if (!byResource.has(f.resourceId)) byResource.set(f.resourceId, []);
  byResource.get(f.resourceId).push(f);
}

let applied = 0;
for (const [resourceId, items] of byResource) {
  const translations = items.map((f) => ({
    key: f.key,
    locale: f.locale,
    value: f.to,
    translatableContentDigest: f.digest,
  }));
  const res = await shopify.gql(
    `mutation Reg($id:ID!, $t:[TranslationInput!]!){
      translationsRegister(resourceId:$id, translations:$t){
        translations { key locale value }
        userErrors { field message code }
      }
    }`,
    { id: resourceId, t: translations },
  );
  const errs = res.translationsRegister.userErrors || [];
  if (errs.length) {
    console.error(`  userErrors for ${resourceId}:`, JSON.stringify(errs).slice(0, 200));
    continue;
  }
  applied += res.translationsRegister.translations.length;
  console.log(`  ✔ ${resourceId} → ${res.translationsRegister.translations.length} translations`);
}
console.log(`\nApplied ${applied} translations.`);
