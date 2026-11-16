/*
 * Black Friday landing page: live store prices.
 *
 * The campaign feed (assets/bf-products.json) holds the campaign rules that
 * Shopify does not know about: mode, coupon %, member gating, phase. It also
 * holds a price snapshot taken when it was generated, which goes stale the
 * moment a price changes in the store. This replaces that snapshot with the
 * store's current prices before the grid first renders, so the price, the
 * strike-through, the direct discount % and its badge always follow Shopify.
 *
 * The EComposer page loads this file and calls two hooks:
 *   window.nfbfLivePrices(feed)  -> Promise of the same feed, re-priced
 *   window.nfbfLiveInfo(handle, info, item) -> re-priced CAMPAIGN_INFO entry
 * Both fall back to the feed's own values when the store cannot be reached.
 */
(function () {
  if (window.nfbfLivePrices) return;

  var COLLECTION = 'black-friday';
  // How long the first render waits for live prices. Past this the grid
  // renders from the feed and is re-rendered once the prices arrive.
  var WAIT_MS = 4000;
  // Products absent from the collection are priced one by one; above this
  // many, the collection lookup itself has failed and that is not worth it.
  var MAX_SINGLE_LOOKUPS = 150;
  var SKU_IN_PHOTO = /NF-([A-Z]{2}-[0-9A-Z]+)-/;

  function root() {
    return (window.Shopify && Shopify.routes && Shopify.routes.root) || '/';
  }

  function getJSON(url) {
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  var live = { byHandle: {}, bySku: {}, ready: false };

  function index(items) {
    (items || []).forEach(function (row) {
      var entry = { price: row[1] / 100, compare: (row[2] || 0) / 100 };
      live.byHandle[row[0]] = entry;
      var m = SKU_IN_PHOTO.exec(row[3] || '');
      if (m && !live.bySku[m[1]]) live.bySku[m[1]] = entry;
    });
  }

  function collectionPage(n) {
    return getJSON(root() + 'collections/' + COLLECTION + '?view=bf-prices&page=' + n);
  }

  // Started as soon as this file runs, in parallel with the feed download.
  // The collection is ~5 pages of 250, so the first few pages are requested
  // together instead of waiting on page 1 to learn the page count; a page
  // past the end just comes back empty.
  var FIRST_PAGES = 6;
  var requested = [];
  for (var n = 1; n <= FIRST_PAGES; n++) requested.push(collectionPage(n));
  var loaded = Promise.all(requested).then(function (pages) {
    var first = pages[0];
    if (!first || !first.items) return false;
    pages.forEach(function (d) { if (d) index(d.items); });
    var rest = [];
    for (var m = FIRST_PAGES + 1; m <= Math.min(first.pages || 1, 20); m++) {
      rest.push(collectionPage(m).then(function (d) { if (d) index(d.items); }));
    }
    return Promise.all(rest).then(function () { live.ready = true; return true; });
  });

  function lookup(handle, sku) {
    return live.byHandle[handle] || (sku && live.bySku[sku]) || null;
  }

  function round2(n) { return Math.round(n * 100) / 100; }

  // Rewrites one campaign row from a live store price. The campaign's own
  // coupon % is kept; everything derived from the store price is recomputed.
  function reprice(row, store) {
    if (!row || !store || !(store.price > 0)) return false;
    row.price = store.price;
    if (row.mode === 'direct') {
      var strike = store.compare > store.price + 0.009 ? store.compare : null;
      row.strike = strike;
      row.pct = strike ? Math.round((strike - store.price) / strike * 100) : 0;
      row.final = store.price;
    } else {
      row.final = round2(store.price * (1 - (Number(row.pct) || 0) / 100));
    }
    row.livePrice = true;
    return true;
  }

  function priceOneByOne(rows) {
    var i = 0;
    function next() {
      if (i >= rows.length) return Promise.resolve();
      var row = rows[i++];
      return getJSON(root() + 'products/' + encodeURIComponent(row.handle) + '.js')
        .then(function (d) {
          if (d) reprice(row, { price: d.price_max / 100, compare: (d.compare_at_price_max || 0) / 100 });
        })
        .then(next);
    }
    var workers = [];
    for (var k = 0; k < 6; k++) workers.push(next());
    return Promise.all(workers);
  }

  window.nfbfLivePrices = function (feed) {
    if (!Array.isArray(feed)) return Promise.resolve(feed);
    var settled = false;
    var work = loaded.then(function (ok) {
      var missing = [];
      feed.forEach(function (row) {
        if (!row || row.published === false || !row.handle) return;
        if (!reprice(row, lookup(row.handle, row.sku))) missing.push(row);
      });
      if (!ok || missing.length > MAX_SINGLE_LOOKUPS) return;
      return priceOneByOne(missing);
    });
    var timeout = new Promise(function (resolve) { setTimeout(resolve, WAIT_MS); });
    work.then(function () {
      // The grid already rendered from the feed: draw it again with live prices.
      if (settled) document.dispatchEvent(new CustomEvent('nfMemberChange'));
    });
    return Promise.race([work, timeout]).then(function () {
      settled = true;
      return feed;
    });
  };

  // For the "recently viewed / suggested" row, whose campaign prices are
  // inlined in the page. That row renders only after its own collection
  // fetch, by which time this lookup has normally loaded.
  window.nfbfLiveInfo = function (handle, info, item) {
    if (!info) return info;
    var store = lookup(handle, item && item.sku);
    if (!store) return info;
    var copy = {};
    for (var k in info) copy[k] = info[k];
    return reprice(copy, store) ? copy : info;
  };
})();
