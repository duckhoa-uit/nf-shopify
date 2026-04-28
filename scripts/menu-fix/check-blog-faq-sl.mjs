#!/usr/bin/env node
// Diagnose Bug 003 (Blog) and Bug 004 (FAQ) on SL.
//
// Theme settings already point at shopify://blogs/news and shopify://pages/faq.
// If those pages render English content under /sl/, it's because the underlying
// resource (blog, page) has no SL translation registered.

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

// 1. Find the news blog id and the faq page id.
const blogQ = await shopify.gql(`{
  blogs(first: 20) { nodes { id handle title } }
}`);
console.log("Blogs:");
for (const b of blogQ.blogs.nodes) {
  console.log(`  - ${b.handle.padEnd(20)} | ${b.title} | ${b.id}`);
}

const newsBlog = blogQ.blogs.nodes.find((b) => b.handle === "news");
if (!newsBlog) {
  console.error("No 'news' blog found");
  process.exit(2);
}

const pageQ = await shopify.gql(`{
  pages(first: 50) { nodes { id handle title } }
}`);
const faqPage = pageQ.pages.nodes.find((p) => p.handle === "faq");
console.log("\nFAQ page:");
if (faqPage) {
  console.log(`  - ${faqPage.handle} | ${faqPage.title} | ${faqPage.id}`);
} else {
  console.log("  (no page with handle 'faq' found)");
}

async function checkTranslations(resourceId, label) {
  console.log(`\n=== ${label} (${resourceId}) ===`);
  const r = await shopify.gql(
    `query($id:ID!, $locale:String!){
      translatableResource(resourceId:$id){
        translatableContent { key value digest locale }
        translations(locale:$locale){ key value }
      }
    }`,
    { id: resourceId, locale: LOCALE },
  );
  const tByKey = new Map(r.translatableResource.translations.map((t) => [t.key, t]));
  for (const c of r.translatableResource.translatableContent) {
    const t = tByKey.get(c.key);
    const status = t && t.value ? "✔" : "✖";
    const sourcePreview = String(c.value).slice(0, 60);
    const trPreview = t ? String(t.value).slice(0, 60) : "(missing)";
    console.log(`  ${status} ${c.key}`);
    console.log(`     source: ${JSON.stringify(sourcePreview)}`);
    console.log(`     ${LOCALE}:     ${JSON.stringify(trPreview)}`);
  }
}

await checkTranslations(newsBlog.id, "Blog: news");
if (faqPage) await checkTranslations(faqPage.id, "Page: faq");

// 2. Check the latest 3 articles in the news blog and their SL status.
const articlesQ = await shopify.gql(
  `query($id:ID!){
    blog(id:$id){
      articles(first:5, reverse:true){
        nodes { id handle title isPublished }
      }
    }
  }`,
  { id: newsBlog.id },
);
console.log(`\n=== Latest 5 articles in 'news' blog ===`);
for (const a of articlesQ.blog.articles.nodes) {
  console.log(`  - ${a.handle}  (published=${a.isPublished})  ${a.title}`);
}
for (const a of articlesQ.blog.articles.nodes.slice(0, 3)) {
  await checkTranslations(a.id, `Article: ${a.handle}`);
}
