#!/usr/bin/env node
// Fix Bug 003 (Blog) + Bug 004 (FAQ) on /sl/.
//
// Root cause: the `news` blog and `faq` page resources have no SL translation
// registered, so `shopify://blogs/news` and `shopify://pages/faq` (in
// sections/header-group.json) fall back to the unprefixed default-locale URL.
// Once we register at least one translation per resource for the SL locale,
// Shopify resolves the `shopify://` references with the `/sl/` prefix.
//
// What this script does:
//   1. Loads SL translation values from
//      scripts/menu-fix/data/blog-faq-sl-translations.json
//      (keyed by "blog:<handle>" and "page:<handle>").
//   2. Resolves the resource IDs for the `news` blog and `faq` page.
//   3. For every translatable key listed in the data file, fetches the
//      current `digest` (required by translationsRegister) and prepares a
//      TranslationInput.
//   4. Snapshots existing SL translations for both resources to
//      .menu-fix-cache/blog-faq-sl-snapshot-<ts>.json (rollback aid).
//   5. Refuses to mutate unless `--confirm` is passed.
//   6. Calls `translationsRegister` and prints userErrors.
//
// Usage:
//   node scripts/menu-fix/fix-blog-faq-sl.mjs            # dry-run preview
//   node scripts/menu-fix/fix-blog-faq-sl.mjs --confirm  # apply for sl
//   node scripts/menu-fix/fix-blog-faq-sl.mjs cs --confirm  # apply for cs

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
process.chdir(path.join(__dirname, "..", "translation"));
const { loadEnv } = await import("../translation/lib/env.mjs");
loadEnv();
const { makeTokenProvider } = await import("../translation/lib/auth.mjs");
const { makeShopifyClient } = await import("../translation/lib/shopify.mjs");

const args = process.argv.slice(2);
const CONFIRM = args.includes("--confirm");
const LOCALE = (args.find((a) => !a.startsWith("--")) || "sl").toLowerCase();

const dataPath = path.join(__dirname, "data", "blog-faq-sl-translations.json");
if (!fs.existsSync(dataPath)) {
  console.error(`Missing data file: ${dataPath}`);
  process.exit(2);
}
const dataFile = JSON.parse(fs.readFileSync(dataPath, "utf8"));

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

console.log(`Locale: ${LOCALE}`);
console.log(`Mode:   ${CONFIRM ? "APPLY" : "DRY-RUN (pass --confirm to apply)"}`);
console.log("");

// ---- Resolve resource IDs ----
const blogQ = await shopify.gql(`{
  blogs(first: 50) { nodes { id handle title } }
}`);
const newsBlog = blogQ.blogs.nodes.find((b) => b.handle === "news");
if (!newsBlog) {
  console.error("No 'news' blog found in this store.");
  process.exit(2);
}

const pageQ = await shopify.gql(`{
  pages(first: 100) { nodes { id handle title } }
}`);
const faqPage = pageQ.pages.nodes.find((p) => p.handle === "faq");
if (!faqPage) {
  console.error("No 'faq' page found in this store.");
  process.exit(2);
}

const resources = [
  { kind: "blog", handle: newsBlog.handle, id: newsBlog.id, dataKey: `blog:${newsBlog.handle}` },
  { kind: "page", handle: faqPage.handle, id: faqPage.id, dataKey: `page:${faqPage.handle}` },
];

// ---- Build payloads with current digests + snapshot existing translations ----
const snapshot = { locale: LOCALE, generatedAt: new Date().toISOString(), resources: [] };
const writes = [];

for (const r of resources) {
  console.log(`Resource: ${r.kind} '${r.handle}'  (${r.id})`);
  const tr = await shopify.gql(
    `query($id:ID!,$locale:String!){
      translatableResource(resourceId:$id){
        translatableContent { key value digest locale }
        translations(locale:$locale){ key value locale }
      }
    }`,
    { id: r.id, locale: LOCALE },
  );
  const content = tr.translatableResource.translatableContent;
  const existing = new Map(tr.translatableResource.translations.map((t) => [t.key, t]));
  const desired = dataFile[r.dataKey] || {};

  snapshot.resources.push({
    id: r.id,
    kind: r.kind,
    handle: r.handle,
    existing_translations: tr.translatableResource.translations,
  });

  const translations = [];
  for (const c of content) {
    const want = desired[c.key];
    if (typeof want !== "string" || want.length === 0) continue;

    const cur = existing.get(c.key);
    const isSame = cur && cur.value === want;
    const status = isSame ? "✓ already set" : cur ? "↻ overwrite" : "+ new";
    console.log(`  ${status.padEnd(14)} ${c.key.padEnd(12)} ← ${JSON.stringify(want)}`);

    if (!isSame) {
      translations.push({
        locale: LOCALE,
        key: c.key,
        value: want,
        translatableContentDigest: c.digest,
      });
    }
  }
  if (translations.length > 0) {
    writes.push({ resourceId: r.id, translations, label: `${r.kind}:${r.handle}` });
  }
  console.log("");
}

// ---- Save snapshot ----
const cacheDir = path.join(REPO_ROOT, ".menu-fix-cache");
fs.mkdirSync(cacheDir, { recursive: true });
const snapshotPath = path.join(
  cacheDir,
  `blog-faq-${LOCALE}-snapshot-${Date.now()}.json`,
);
fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
console.log(`Snapshot: ${snapshotPath}`);

if (writes.length === 0) {
  console.log("\nNothing to do — all desired translations already in place.");
  process.exit(0);
}

console.log(`\n${writes.length} resource(s) require translation writes.`);
if (!CONFIRM) {
  console.log("Dry-run — pass --confirm to apply.");
  process.exit(0);
}

// ---- Apply ----
let totalErrors = 0;
for (const w of writes) {
  console.log(`\nApplying ${w.translations.length} translation(s) to ${w.label}…`);
  const data = await shopify.gql(
    `mutation translationsRegister($resourceId:ID!,$translations:[TranslationInput!]!){
      translationsRegister(resourceId:$resourceId, translations:$translations){
        translations{ key locale value }
        userErrors{ field message code }
      }
    }`,
    { resourceId: w.resourceId, translations: w.translations },
  );
  const errs = data.translationsRegister?.userErrors || [];
  if (errs.length) {
    totalErrors += errs.length;
    for (const e of errs) {
      console.error(`  !! ${e.code} @ ${(e.field || []).join(".")}: ${e.message}`);
    }
  } else {
    for (const t of data.translationsRegister.translations) {
      console.log(`  ✓ ${t.key}`);
    }
  }
}

if (totalErrors > 0) {
  console.error(`\n!! ${totalErrors} userError(s). Rollback snapshot: ${snapshotPath}`);
  process.exit(1);
}
console.log(`\n✓ Done. Verify with: node scripts/menu-fix/check-blog-faq-sl.mjs ${LOCALE}`);
console.log(`  Rollback snapshot: ${snapshotPath}`);
