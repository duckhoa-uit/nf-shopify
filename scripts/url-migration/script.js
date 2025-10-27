const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const ExcelJS = require('exceljs');
require('@shopify/shopify-api/adapters/node');
const { shopifyApi, ApiVersion } = require('@shopify/shopify-api');

// Logger class for file-based logging
class Logger {
  constructor(logFilePath) {
    this.logFilePath = logFilePath;
    this.logStream = null;
  }

  async initialize() {
    try {
      // Clear the log file if it exists
      await fs.writeFile(this.logFilePath, '');
      this.logStream = fsSync.createWriteStream(this.logFilePath, { flags: 'a' });
    } catch (error) {
      console.error('Failed to initialize log file:', error.message);
    }
  }

  log(message) {
    if (this.logStream) {
      this.logStream.write(message + '\n');
    }
  }

  logTable(data, columns) {
    if (!data || data.length === 0) {
      this.log('No data to display');
      return;
    }

    // Calculate column widths
    const widths = {};
    columns.forEach(col => {
      widths[col] = Math.max(col.length, ...data.map(row => String(row[col] || '').length));
    });

    // Write header
    const header = columns.map(col => col.padEnd(widths[col])).join(' | ');
    this.log(header);
    this.log('-'.repeat(header.length));

    // Write rows
    data.forEach(row => {
      const rowStr = columns.map(col => String(row[col] || '').padEnd(widths[col])).join(' | ');
      this.log(rowStr);
    });
  }

  error(message) {
    if (this.logStream) {
      this.logStream.write(`[ERROR] ${message}\n`);
    }
  }

  close() {
    return new Promise((resolve) => {
      if (this.logStream) {
        this.logStream.end(() => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Configuration
const CONFIG = {
  prestashop: {
    sitemapUrl: 'https://northfinder.com//modules/asdata_sitemap_generator/xml/filter1.xml',
    baseDomain: 'sportfinder.de'
  },
  shopify: {
    shop: 'northfinder-1.myshopify.com',
    accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
    apiVersion: ApiVersion.October25,
    apiKey: "849424933cfd618d2d5c48e208540b1d",
    apiSecret:"82763ad1eec0d4030bb85ce989657dc6"
  }
};

// Initialize Shopify API client
const shopify = shopifyApi({
  apiKey: CONFIG.shopify.shop,
  apiSecretKey: CONFIG.shopify.apiSecret,
  scopes: [],
  hostName: CONFIG.shopify.shop,
  apiVersion: CONFIG.shopify.apiVersion,
  isEmbeddedApp: false,
  logger: {
    log: () => {}, // Suppress default logging
    warn: () => {},
    error: () => {},
    debug: () => {},
    info: () => {},
  },
});

class URLMapper {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.shopifyData = {
      metafields: [],
      productMetafields: [],
      metaobjects: [],
      metaobjectEntries: [],
      sizeMetaobjectEntries: [],
      colorMetaobjectEntries: [],
      filters: []
    };
    this.mappings = [];
  }

  // Phase 1: Read and parse PrestaShop sitemap from local file
  async fetchPrestaShopUrls() {
    this.logger.log('Reading PrestaShop sitemap from local file...');
    try {
      const sitemapPath = './sitemap.xml';
      const xmlContent = await fs.readFile(sitemapPath, 'utf-8');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(xmlContent);

      const urls = result.urlset.url.map(urlObj => urlObj.loc[0]);
      this.logger.log(`Found ${urls.length} URLs in sitemap`);

      return urls.map(this.parsePrestaShopUrl);
    } catch (error) {
      this.logger.error(`Error reading PrestaShop sitemap: ${error.message}`);
      throw error;
    }
  }

  // Parse PrestaShop URL structure
  parsePrestaShopUrl(url) {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(p => p);

    // Extract language (e.g., 'en')
    const language = pathParts[0];

    // Extract collection info (e.g., '1625-jackets')
    const collectionPart = pathParts[1];
    const collectionMatch = collectionPart.match(/^(\d+)-(.+)$/);
    const prestashopId = collectionMatch ? collectionMatch[1] : null;
    const collectionKey = collectionMatch ? collectionMatch[2] : collectionPart;

    // Extract filters (everything after collection)
    const filters = {};
    for (let i = 2; i < pathParts.length; i++) {
      const filterPart = pathParts[i];
      // Split by dash to separate filter name and value
      const dashIndex = filterPart.indexOf('-');
      if (dashIndex > 0) {
        const filterName = filterPart.substring(0, dashIndex);
        const filterValue = filterPart.substring(dashIndex + 1);
        filters[filterName] = filterValue;
      }
    }

    return {
      originalUrl: url,
      language,
      prestashopId,
      collectionKey,
      filters,
      parsed: true
    };
  }

  // Phase 2: Fetch Shopify data
  async fetchShopifyData() {
    this.logger.log('Fetching Shopify data...');

    await Promise.all([
      this.fetchShopifyMetafields(),
      this.fetchShopifyProductMetafields(),
      this.fetchShopifyMetaobjects(),
      this.fetchShopifyMetaobjectEntries(),
      this.fetchShopifyMetaobjectEntriesByType('size'),
      this.fetchShopifyMetaobjectEntriesByType('color'),
      this.fetchShopifyFilters()
    ]);

    this.logger.log(`Fetched ${this.shopifyData.metafields.length} collection metafields`);
    this.logger.log(`Fetched ${this.shopifyData.productMetafields.length} product metafields`);
    this.logger.log(`Fetched ${this.shopifyData.metaobjects.length} metaobjects`);
    this.logger.log(`Fetched ${this.shopifyData.metaobjectEntries.length} product feature preset entries`);
    this.logger.log(`Fetched ${this.shopifyData.sizeMetaobjectEntries.length} size metaobject entries`);
    this.logger.log(`Fetched ${this.shopifyData.colorMetaobjectEntries.length} color metaobject entries`);
    this.logger.log(`Fetched ${this.shopifyData.filters.length} collections`);
  }

  async fetchShopifyMetafields() {
    const query = `
      {
        metafieldDefinitions(first: 250, ownerType: COLLECTION) {
          edges {
            node {
              id
              namespace
              key
              name
              type {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.shopifyGraphQL(query);
      // The Shopify GraphQL client returns data directly in response.data
      this.shopifyData.metafields = response.data.metafieldDefinitions.edges.map(e => e.node);

      // Log metafields data
      this.logger.log('\n===== SHOPIFY METAFIELDS =====');
      this.logger.log(`Total Metafields: ${this.shopifyData.metafields.length}\n`);

      const metafieldsTable = this.shopifyData.metafields.map(mf => ({
        'Namespace': mf.namespace,
        'Key': mf.key,
        'Name': mf.name,
        'Type': mf.type?.name || 'N/A'
      }));

      if (metafieldsTable.length > 0) {
        this.logger.logTable(metafieldsTable, ['Namespace', 'Key', 'Name', 'Type']);
      } else {
        this.logger.log('No metafields found.');
      }
      this.logger.log('=============================\n');
    } catch (error) {
      this.logger.error(`Error fetching metafields: ${error.message}`);
    }
  }

  async fetchShopifyProductMetafields() {
    const query = `
      {
        metafieldDefinitions(first: 250, ownerType: PRODUCT) {
          edges {
            node {
              id
              namespace
              key
              name
              type {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.shopifyGraphQL(query);
      this.shopifyData.productMetafields = response.data.metafieldDefinitions.edges.map(e => e.node);

      // Log product metafields data
      this.logger.log('\n===== SHOPIFY PRODUCT METAFIELDS =====');
      this.logger.log(`Total Product Metafields: ${this.shopifyData.productMetafields.length}\n`);

      const productMetafieldsTable = this.shopifyData.productMetafields.map(mf => ({
        'Namespace': mf.namespace,
        'Key': mf.key,
        'Name': mf.name,
        'Type': mf.type?.name || 'N/A'
      }));

      if (productMetafieldsTable.length > 0) {
        this.logger.logTable(productMetafieldsTable, ['Namespace', 'Key', 'Name', 'Type']);
      } else {
        this.logger.log('No product metafields found.');
      }
      this.logger.log('=======================================\n');
    } catch (error) {
      this.logger.error(`Error fetching product metafields: ${error.message}`);
    }
  }

  async fetchShopifyMetaobjects() {
    const query = `
      {
        metaobjectDefinitions(first: 250) {
          edges {
            node {
              id
              type
              name
              fieldDefinitions {
                key
                name
                type {
                  name
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await this.shopifyGraphQL(query);
      this.shopifyData.metaobjects = response.data.metaobjectDefinitions.edges.map(e => e.node);

      // Log metaobjects data
      this.logger.log('\n===== SHOPIFY METAOBJECTS =====');
      this.logger.log(`Total Metaobject Definitions: ${this.shopifyData.metaobjects.length}\n`);

      this.shopifyData.metaobjects.forEach(mo => {
        this.logger.log(`Type: ${mo.type} | Name: ${mo.name}`);

        if (mo.fieldDefinitions && mo.fieldDefinitions.length > 0) {
          const fieldsTable = mo.fieldDefinitions.map(fd => ({
            'Key': fd.key,
            'Name': fd.name,
            'Type': fd.type?.name || 'N/A'
          }));
          this.logger.logTable(fieldsTable, ['Key', 'Name', 'Type']);
        } else {
          this.logger.log('  No field definitions');
        }
        this.logger.log('---');
      });
      this.logger.log('================================\n');
    } catch (error) {
      this.logger.error(`Error fetching metaobjects: ${error.message}`);
    }
  }

  async fetchShopifyMetaobjectEntries() {
    try {
      this.shopifyData.metaobjectEntries = await this.fetchAllMetaobjectEntriesByType('product_feature_preset');

      // Log metaobject entries data
      this.logger.log('\n===== SHOPIFY METAOBJECT ENTRIES =====');
      this.logger.log(`Total Metaobject Entries: ${this.shopifyData.metaobjectEntries.length}\n`);

      const entriesTable = this.shopifyData.metaobjectEntries.map(entry => ({
        'ID (GID)': entry.id,
        'Handle': entry.handle,
        'Display Name': entry.displayName
      }));

      if (entriesTable.length > 0) {
        this.logger.logTable(entriesTable, ['ID (GID)', 'Handle', 'Display Name']);
      } else {
        this.logger.log('No metaobject entries found.');
      }
      this.logger.log('=======================================\n');
    } catch (error) {
      this.logger.error(`Error fetching metaobject entries: ${error.message}`);
    }
  }

  async fetchShopifyMetaobjectEntriesByType(type) {
    try {
      const entries = await this.fetchAllMetaobjectEntriesByType(type);

      // Store entries based on type
      if (type === 'size') {
        this.shopifyData.sizeMetaobjectEntries = entries;
      } else if (type === 'color') {
        this.shopifyData.colorMetaobjectEntries = entries;
      }

      // Log metaobject entries data
      this.logger.log(`\n===== SHOPIFY ${type.toUpperCase()} METAOBJECT ENTRIES =====`);
      this.logger.log(`Total ${type} Entries: ${entries.length}\n`);

      const entriesTable = entries.map(entry => ({
        'ID (GID)': entry.id,
        'Handle': entry.handle,
        'Display Name': entry.displayName
      }));

      if (entriesTable.length > 0) {
        this.logger.logTable(entriesTable, ['ID (GID)', 'Handle', 'Display Name']);
      } else {
        this.logger.log(`No ${type} metaobject entries found.`);
      }
      this.logger.log(`${'='.repeat(40)}\n`);
    } catch (error) {
      this.logger.error(`Error fetching ${type} metaobject entries: ${error.message}`);
    }
  }

  async fetchAllMetaobjectEntriesByType(type) {
    let allEntries = [];
    let hasNextPage = true;
    let endCursor = null;
    let pageCount = 0;

    while (hasNextPage) {
      pageCount++;
      const afterCursor = endCursor ? `, after: "${endCursor}"` : '';

      const query = `
        {
          metaobjects(type: "${type}", first: 250${afterCursor}) {
            edges {
              node {
                id
                handle
                displayName
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      `;

      try {
        const response = await this.shopifyGraphQL(query);
        const edges = response.data.metaobjects.edges;
        const pageInfo = response.data.metaobjects.pageInfo;

        // Add entries from this page
        allEntries = allEntries.concat(edges.map(e => e.node));

        // Check if there are more pages
        hasNextPage = pageInfo.hasNextPage;
        endCursor = pageInfo.endCursor;

        this.logger.log(`Fetched page ${pageCount} for ${type} metaobjects: ${edges.length} entries (total so far: ${allEntries.length})`);
      } catch (error) {
        this.logger.error(`Error fetching page ${pageCount} of ${type} metaobject entries: ${error.message}`);
        throw error;
      }
    }

    this.logger.log(`Completed fetching all ${type} metaobjects in ${pageCount} page(s). Total: ${allEntries.length}`);
    return allEntries;
  }

  async fetchShopifyFilters() {
    // Fetch collections with filter definitions
    const query = `
      {
        collections(first: 250) {
          edges {
            node {
              id
              handle
              title
            }
          }
        }
      }
    `;

    try {
      const response = await this.shopifyGraphQL(query);
      this.shopifyData.filters = response.data.collections.edges.map(e => e.node);

      // Log collections/filters data
      this.logger.log('\n===== SHOPIFY COLLECTIONS =====');
      this.logger.log(`Total Collections: ${this.shopifyData.filters.length}\n`);

      const collectionsTable = this.shopifyData.filters.map(col => ({
        'ID': col.id,
        'Handle': col.handle,
        'Title': col.title
      }));

      if (collectionsTable.length > 0) {
        this.logger.logTable(collectionsTable, ['ID', 'Handle', 'Title']);
      } else {
        this.logger.log('No collections found.');
      }
      this.logger.log('================================\n');
    } catch (error) {
      this.logger.error(`Error fetching filters: ${error.message}`);
    }
  }

  async shopifyGraphQL(query) {
    try {
      // Create a mock session object for the GraphQL client
      const session = {
        shop: this.config.shopify.shop,
        accessToken: this.config.shopify.accessToken,
        isOnline: false,
      };

      // Create GraphQL client with the session
      const client = new shopify.clients.Graphql({
        session,
        apiVersion: this.config.shopify.apiVersion,
      });

      // Make the request with built-in retry logic (up to 3 retries)
      const response = await client.request(query, {
        retries: 2, // Retry up to 2 times on failure
      });

      return response;
    } catch (error) {
      // Handle GraphQL-specific errors
      if (error.name === 'GraphqlQueryError') {
        this.logger.error(`GraphQL Error: ${error.message}`);
        if (error.body?.errors?.graphQLErrors) {
          error.body.errors.graphQLErrors.forEach(err => {
            this.logger.error(`  - ${err.message}`);
          });
        }
      } else if (error instanceof TypeError) {
        // Handle network or other errors
        this.logger.error(`Request Error: ${error.message}`);
      } else {
        this.logger.error(`Unexpected Error: ${error.message}`);
      }
      throw error;
    }
  }

  // Phase 3: Map PrestaShop URLs to Shopify URLs
  async mapUrls(prestashopUrls) {
    this.logger.log('Mapping URLs...');

    this.mappings = prestashopUrls.map(psUrl => {
      const shopifyUrl = this.buildShopifyUrl(psUrl);

      return {
        oldUrl: psUrl.originalUrl,
        newUrl: shopifyUrl.url,
        language: psUrl.language,
        collection: psUrl.collectionKey,
        filters: psUrl.filters,
        matched: shopifyUrl.matched,
        notes: shopifyUrl.notes
      };
    });

    this.logger.log(`Mapped ${this.mappings.length} URLs`);
    return this.mappings;
  }

  buildShopifyUrl(psUrl) {
    // Find matching collection in Shopify
    const collection = this.findMatchingCollection(psUrl.collectionKey);

    // Log mapping attempt details
    this.logger.log(`\n[MAPPING] PrestaShop Collection: "${psUrl.collectionKey}"`);

    if (!collection) {
      this.logger.log(`  ❌ Status: NOT MATCHED - Collection not found in Shopify`);
      return {
        url: '',
        matched: false,
        notes: `Collection '${psUrl.collectionKey}' not found in Shopify`
      };
    }

    this.logger.log(`  ✓ Status: MATCHED`);
    this.logger.log(`  Shopify Handle: "${collection.handle}"`);
    this.logger.log(`  Language: "${psUrl.language}" (no prefix - Shopify will handle redirects automatically)`);

    // Build base Shopify URL without language prefix
    // Shopify store only has German (DE) enabled
    // Shopify will automatically handle language detection and redirects based on visitor's browser settings
    let shopifyUrl = `https://${this.config.prestashop.baseDomain}`;
    shopifyUrl += `/collections/${collection.handle}`;

    // Add filters as query parameters
    const filterParams = this.buildFilterParams(psUrl.filters);

    if (filterParams.length > 0) {
      this.logger.log(`  Filters Applied: ${filterParams.length}`);
      filterParams.forEach((param, index) => {
        this.logger.log(`    ${index + 1}. ${param}`);
      });
      shopifyUrl += '?' + filterParams.join('&');
    } else {
      this.logger.log(`  Filters Applied: None`);
    }

    this.logger.log(`  Generated URL: ${shopifyUrl}`);

    return {
      url: shopifyUrl,
      matched: true,
      notes: filterParams.length > 0 ? `Applied ${filterParams.length} filters` : 'No filters'
    };
  }

  findMatchingCollection(collectionKey) {
    // Convert underscores to hyphens for Shopify handle format
    const normalizedKey = collectionKey.replace(/_/g, '-');

    return this.shopifyData.filters.find(filter =>
      filter.handle === normalizedKey ||
      filter.handle.includes(normalizedKey) ||
      filter.title.toLowerCase().replace(/\s+/g, '-') === normalizedKey
    );
  }

  buildFilterParams(filters) {
    const params = [];

    for (const [filterName, filterValue] of Object.entries(filters)) {
      this.logger.log(`\n    [FILTER] PrestaShop: ${filterName}=${filterValue}`);

      // Determine which metaobject type to use based on filter name
      let metaobjectEntries = this.shopifyData.metaobjectEntries;
      let metaobjectType = 'product_feature_preset';

      if (filterName.toLowerCase().includes('size')) {
        metaobjectEntries = this.shopifyData.sizeMetaobjectEntries;
        metaobjectType = 'size';
        this.logger.log(`      → Using metaobject type: ${metaobjectType}`);
      } else if (filterName.toLowerCase().includes('color')) {
        metaobjectEntries = this.shopifyData.colorMetaobjectEntries;
        metaobjectType = 'color';
        this.logger.log(`      → Using metaobject type: ${metaobjectType}`);
      } else {
        this.logger.log(`      → Using metaobject type: ${metaobjectType}`);
      }

      // Find matching product metafield
      const metafield = this.findProductMetafield(filterName);
      let metafieldKey = filterName;
      let metafieldNamespace = 'features';

      if (metafield) {
        metafieldNamespace = metafield.namespace;
        metafieldKey = metafield.key;
        this.logger.log(`      ✓ Found metafield: ${metafieldNamespace}.${metafieldKey}`);
      } else {
        this.logger.log(`      ⚠ Metafield not found, using fallback: features.${filterName}`);
      }

      // Find matching metaobject entry by handle
      const normalizedValue = filterValue.replace(/_/g, '-');
      const metaobjectEntry = metaobjectEntries.find(
        entry => entry.handle === normalizedValue
      );

      if (!metaobjectEntry) {
        this.logger.log(`      ❌ Metaobject entry not found in ${metaobjectType} for handle: ${normalizedValue}`);
        this.logger.log(`      ⏭ Skipping this filter`);
        continue;
      }

      this.logger.log(`      ✓ Found metaobject entry: ${metaobjectEntry.handle} (${metaobjectEntry.id})`);

      // Build the filter parameter with metaobject GID
      const shopifyFilterName = `filter.p.m.${metafieldNamespace}.${metafieldKey}`;
      const shopifyFilterValue = metaobjectEntry.id;

      const filterParam = `${shopifyFilterName}=${encodeURIComponent(shopifyFilterValue)}`;
      params.push(filterParam);
      this.logger.log(`      → Generated: ${filterParam}`);
    }

    return params;
  }

  findProductMetafield(filterName) {
    // Search for a product metafield where the key ends with the filter name
    // Example: Find 'features.type_of_material' when looking for 'type_of_material'
    return this.shopifyData.productMetafields.find(mf =>
      mf.key.endsWith(filterName) || mf.key === filterName
    );
  }

  // Phase 4: Export to Excel
  async exportToExcel(filename = 'url-mapping.xlsx') {
    console.log('Exporting to Excel...');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('URL Mappings');

    // Define columns
    worksheet.columns = [
      { header: 'Old URL (PrestaShop)', key: 'oldUrl', width: 50 },
      { header: 'New URL (Shopify)', key: 'newUrl', width: 50 },
      { header: 'Language', key: 'language', width: 10 },
      { header: 'Collection', key: 'collection', width: 20 },
      { header: 'Filters', key: 'filters', width: 30 },
      { header: 'Matched', key: 'matched', width: 10 },
      { header: 'Notes', key: 'notes', width: 40 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    this.mappings.forEach(mapping => {
      worksheet.addRow({
        oldUrl: mapping.oldUrl,
        newUrl: mapping.newUrl,
        language: mapping.language,
        collection: mapping.collection,
        filters: JSON.stringify(mapping.filters),
        matched: mapping.matched ? 'Yes' : 'No',
        notes: mapping.notes
      });
    });

    // Add conditional formatting for matched column
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const matchedCell = row.getCell('matched');
        if (matchedCell.value === 'No') {
          matchedCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCC' }
          };
        } else {
          matchedCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFCCFFCC' }
          };
        }
      }
    });

    // Save file
    await workbook.xlsx.writeFile(filename);
    this.logger.log(`Excel file saved: ${filename}`);

    // Log summary
    const matched = this.mappings.filter(m => m.matched).length;
    const total = this.mappings.length;
    this.logger.log(`\nSummary:`);
    this.logger.log(`Total URLs: ${total}`);
    this.logger.log(`Matched: ${matched} (${((matched/total)*100).toFixed(1)}%)`);
    this.logger.log(`Unmatched: ${total - matched}`);
  }

  // Main execution
  async run() {
    try {
      this.logger.log('Starting URL mapping process...\n');

      // Phase 1: Fetch PrestaShop URLs
      const prestashopUrls = await this.fetchPrestaShopUrls();

      // Phase 2: Fetch Shopify data
      await this.fetchShopifyData();

      // Phase 3: Map URLs
      await this.mapUrls(prestashopUrls);

      // Phase 4: Export to Excel
      await this.exportToExcel('prestashop-to-shopify-mapping.xlsx');

      this.logger.log('\nURL mapping completed successfully!');
    } catch (error) {
      this.logger.error(`Error during URL mapping: ${error.message}`);
      throw error;
    }
  }
}

// Usage
async function main() {
  const logFilePath = './url-migration-log.txt';
  const logger = new Logger(logFilePath);

  try {
    await logger.initialize();

    // Write header to log file
    const timestamp = new Date().toLocaleString();
    logger.log('========================================');
    logger.log('URL Migration Script Log');
    logger.log(`Started: ${timestamp}`);
    logger.log('========================================\n');

    console.log('Starting URL migration script...');
    console.log(`Log file: ${logFilePath}\n`);

    const mapper = new URLMapper(CONFIG, logger);
    await mapper.run();

    // Wait for logger to finish writing before exiting
    await logger.close();
    console.log('\n✓ URL mapping completed successfully!');
    console.log(`✓ Log file saved: ${logFilePath}`);

    // Explicitly exit the process to ensure all resources are cleaned up
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error during URL mapping:', error.message);
    await logger.close();
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = URLMapper;