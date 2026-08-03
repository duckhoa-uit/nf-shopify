class PredictiveSearch extends SearchForm {
  constructor() {
    super();
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
    this.allPredictiveSearchInstances = document.querySelectorAll('predictive-search');
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = '';

    // Helper function to decode HTML entities
    this.decodeHtmlEntities = (str) => {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = str;
      return textarea.value;
    };

    // Localized strings - fallback to window.theme.strings if available
    this.translations = {
      categories: this.decodeHtmlEntities(window.theme?.strings?.search?.categories || 'Categories'),
      articles: this.decodeHtmlEntities(window.theme?.strings?.search?.articles || 'Articles'),
      products: this.decodeHtmlEntities(window.theme?.strings?.search?.products || 'Products'),
      view_all_results: this.decodeHtmlEntities(window.theme?.strings?.search?.view_all_results || 'View all results'),
      no_results: this.decodeHtmlEntities(window.theme?.strings?.search?.no_results || 'No results found for {{ terms }}. Check the spelling or use a different word or phrase.'),
      no_results_suggestion: this.decodeHtmlEntities(window.theme?.strings?.search?.no_results_suggestion || 'Try checking your spelling or using different words.')
    };

    // Popper.js integration
    this.popperInstance = null;
    this.isPopperAvailable = typeof window.Popper !== 'undefined';
    this.isMobile = window.innerWidth <= 749;

    this.setupEventListeners();
    this.setupResizeListener();
  }

  setupEventListeners() {
    this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', this.onKeyup.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));
  }

  setupResizeListener() {
    // Update mobile state on resize
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 749;

      // If mobile state changed and dropdown is open, recreate positioning
      if (wasMobile !== this.isMobile && this.isOpen) {
        this.updatePositioning();
      }
    });
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    super.onChange();
    const newSearchTerm = this.getQuery();
    if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
      this.querySelector('#predictive-search-results-groups-wrapper')?.remove();
    }

    this.updateSearchForTerm(this.searchTerm, newSearchTerm);
    this.searchTerm = newSearchTerm;

    if (!this.searchTerm.length) {
      this.close(true);
      return;
    }

    this.getSearchResults(this.searchTerm);
  }

  onFormSubmit(event) {
    // Always prevent form submission to avoid redirecting to search page
    event.preventDefault();
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.searchTerm = '';
      this.abortController.abort();
      this.abortController = new AbortController();
      this.closeResults(true);
    }
  }

  onFocus() {
    this.predictiveSearchResults.removeAttribute('style');
    const currentSearchTerm = this.getQuery();

    if (!currentSearchTerm.length) return;

    if (this.searchTerm !== currentSearchTerm) {
      this.onChange();
    } else if (this.getAttribute('results') === 'true') {
      this.open();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
    event.preventDefault();

    switch (event.code) {
      case 'ArrowUp':
        this.switchOption('up');
        break;
      case 'ArrowDown':
        this.switchOption('down');
        break;
      case 'Enter':
        this.selectOption();
        break;
    }
  }

  onKeydown(event) {
    if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
      event.preventDefault();
    }
  }

  updateSearchForTerm(previousTerm, newTerm) {
    const searchForTextElement = this.querySelector('[data-predictive-search-search-for-text]');
    const currentButtonText = searchForTextElement?.innerText;
    if (currentButtonText) {
      if (currentButtonText.match(new RegExp(previousTerm, 'g')).length > 1) return;
      const newButtonText = currentButtonText.replace(previousTerm, newTerm);
      searchForTextElement.innerText = newButtonText;
    }
  }

  switchOption(direction) {
    if (!this.getAttribute('open')) return;

    const moveUp = direction === 'up';
    const selectedElement = this.querySelector('[aria-selected="true"]');
    const allVisibleElements = Array.from(this.querySelectorAll('[role="option"]')).filter(
      (element) => element.offsetParent !== null,
    );

    if (moveUp && !selectedElement) return;

    let selectedElementIndex = -1;
    let i = 0;
    while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
      if (allVisibleElements[i] === selectedElement) selectedElementIndex = i;
      i++;
    }

    this.statusElement.textContent = '';

    let activeElementIndex = 0;
    if (!moveUp && selectedElement) {
      activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
    } else if (moveUp) {
      activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
    }

    if (activeElementIndex === selectedElementIndex) return;

    const activeElement = allVisibleElements[activeElementIndex];
    activeElement.setAttribute('aria-selected', true);
    if (selectedElement) selectedElement.setAttribute('aria-selected', false);
    this.input.setAttribute('aria-activedescendant', activeElement.id);
  }

  selectOption() {
    const selectedOption = this.querySelector('[aria-selected="true"]');
    const selectedLink = selectedOption?.querySelector('a') || selectedOption;
    if (selectedLink) selectedLink.click();
  }

  getMarkupFromResults(results) {
    // Ensure hyperHTML is available
    if (typeof hyperHTML === 'undefined') {
      console.error('hyperHTML is not defined');
      return '';
    }

    // Ensure results is an object
    if (!results || typeof results !== 'object') {
      console.error('Invalid results object');
      return '';
    }

    const template = hyperHTML.wire();
    const categoryLabelMap = {
      collections: this.translations.categories,
      articles: this.translations.articles,
      products: this.translations.products,
    };

    // Check if we have any results
    const hasResults = ['collections', 'articles', 'products'].some((type) => {
      const items = results[type] || [];
      return items.length > 0;
    });

    function getDiscountDetails(product) {
      let originalPrice = 0;
      let discountPrice = 0;
      let discountPercent = 0;

      // Check product-level discount
      if (parseFloat(product.compare_at_price_min) > parseFloat(product.price_min)) {
        originalPrice = parseFloat(product.compare_at_price_min);
        discountPrice = parseFloat(product.price_min);
        discountPercent = ((originalPrice - discountPrice) / originalPrice) * 100;
      }

      // Check variants for discounts
      if (product.variants) {
        product.variants.forEach((variant) => {
          if (variant.compare_at_price && parseFloat(variant.compare_at_price) > parseFloat(variant.price)) {
            let variantOriginalPrice = parseFloat(variant.compare_at_price);
            let variantDiscountPrice = parseFloat(variant.price);
            let variantDiscountPercent = ((variantOriginalPrice - variantDiscountPrice) / variantOriginalPrice) * 100;

            // Pick the highest discount
            if (variantDiscountPercent > discountPercent) {
              originalPrice = variantOriginalPrice;
              discountPrice = variantDiscountPrice;
              discountPercent = variantDiscountPercent;
            }
          }
        });
      }

      // Ensure we have a valid price if no discount is found
      if (originalPrice === 0) {
        originalPrice = parseFloat(product.price_min) || 0;
        discountPrice = originalPrice;
      }

      return discountPercent > 0 ? [originalPrice, discountPrice, discountPercent] : [originalPrice, discountPrice, 0];
    }

    function formatMoney(amount) {
      // Format using the storefront's active currency and locale so CZ/RO/etc.
      // see their own currency (Kč, lei, …) instead of a hardcoded €.
      const price = parseFloat(amount);
      if (isNaN(price)) return '';

      const currency = (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || 'EUR';
      const locale = (window.Shopify && window.Shopify.locale) || document.documentElement.lang || 'en';

      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: currency,
        }).format(price);
      } catch (e) {
        // Fallback: number with currency code suffix
        return price.toFixed(2) + ' ' + currency;
      }
    }

    function formatDate(dateString) {
      if (!dateString) return '';

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;

      // Format as DD.MM.YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();

      return `${day}.${month}.${year}`;
    }

    const normalizedSearchTerm = this.searchTerm.trim().toLocaleLowerCase();
    const resultGroups = ['products', 'collections', 'articles']
      .map((type) => {
        const seen = new Set();
        const seenArticleUrls = new Set();
        const seenArticleTitles = new Set();
        const items = (results[type] || []).filter((item) => {
          const url = (item.url || '').split('?')[0].replace(/\/$/, '').toLocaleLowerCase();
          const title = (item.title || '').trim().toLocaleLowerCase();
          const key = url || title;
          if (!key || seen.has(key)) return false;
          if (type === 'articles' && (seenArticleUrls.has(url) || seenArticleTitles.has(title))) return false;
          seen.add(key);
          if (type === 'articles') {
            seenArticleUrls.add(url);
            seenArticleTitles.add(title);
          }
          return true;
        });
        if (type !== 'products') return { type, items };
        return {
          type,
          items: items.sort((a, b) => {
            const aExact = (a.title || '').trim().toLocaleLowerCase() === normalizedSearchTerm;
            const bExact = (b.title || '').trim().toLocaleLowerCase() === normalizedSearchTerm;
            return Number(bExact) - Number(aExact);
          }),
        };
      })
      .filter(({ items }) => items.length);
    const resultCount = resultGroups.reduce((count, { items }) => count + items.length, 0);
    const allResultsUrl = `${window.Shopify?.routes?.search_url || routes.search_url || '/search'}?q=${encodeURIComponent(this.searchTerm)}`;

    const html = template`
    <div class="nf__predictive-search-results">
      <div class="nf__predictive-search__results-groups-wrapper" id="predictive-search-results-groups-wrapper">
        ${!hasResults ?
          hyperHTML.wire()`
            <div class="nf__predictive-search__no-results">
              <p class="nf__predictive-search__no-results-text">${this.translations.no_results.replace('{{ terms }}', `"${this.searchTerm}"`)}</p>
              <p class="nf__predictive-search__no-results-suggestion">${this.translations.no_results_suggestion}</p>
            </div>
          ` :
          resultGroups
            .map(({ type, items }) => {
              return hyperHTML.wire(items)`
                <div class="nf__predictive-search__result-group">
                  <h2>
                    ${categoryLabelMap[type]}
                  </h2>
                  <ul class="predictive-search__result-list list-unstyled" role="listbox" aria-label="${categoryLabelMap[type]}">
                    ${items.map((item, itemIndex) => {
                    const optionId = `predictive-search-${type}-${itemIndex}`;
                    if (type === 'collections')
                      return hyperHTML.wire(item)`
                        <li id="${optionId}" class="predictive-search__list-item-collections" role="option" aria-selected="false">
                          <a href="${item.url}" class="predictive-search__item" tabindex="-1" aria-label="${item.title}">
                            <span class="predictive-search__item-heading">${item.title}</span>
                          </a>
                        </li>
                      `;

                    if (type === 'articles')
                      return hyperHTML.wire(item)`
                        <li id="${optionId}" class="predictive-search__list-item-articles" role="option" aria-selected="false">
                          <a href="${item.url}" class="predictive-search__item" tabindex="-1" aria-label="${item.title}">
                            <span class="predictive-search__item-heading">${item.title}</span>
                          </a>
                          <div class="article-meta">
                            <span class="article-date">${formatDate(item.published_at)}</span>
                            <div class="article-views">
                              <span class="svg-wrapper">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                  <path d="M9.524 4.8c-2.761.13-5.44 1.82-8.352 4.865a.484.484 0 0 0 0 .67c2.911 3.044 5.59 4.736 8.352 4.865 2.75.13 5.743-1.286 9.298-4.86a.48.48 0 0 0 0-.68c-3.555-3.574-6.549-4.99-9.298-4.86m-.049-1.04c3.177-.15 6.44 1.503 10.081 5.164a1.526 1.526 0 0 1 0 2.152c-3.641 3.66-6.904 5.314-10.08 5.165-3.167-.149-6.085-2.08-9.053-5.185a1.53 1.53 0 0 1 0-2.112C3.391 5.84 6.31 3.907 9.475 3.76" fill="#EC0009"/>
                                  <path d="M13.58 10a3.564 3.564 0 0 1-3.568 3.559A3.564 3.564 0 0 1 6.443 10a3.564 3.564 0 0 1 3.569-3.558A3.564 3.564 0 0 1 13.581 10m-3.568 2.517A2.524 2.524 0 0 0 12.542 10a2.524 2.524 0 0 0-2.53-2.517A2.524 2.524 0 0 0 7.482 10a2.524 2.524 0 0 0 2.53 2.517" fill="#EC0009"/>
                                </svg>
                              </span>
                              <span>${349}</span>
                            </div>
                          </div>
                        </li>
                      `;

                    // Get discount details and ensure we're working with numbers
                    let [originalPrice, discountPrice, discountPercent] = getDiscountDetails(item);

                    // Make sure we have valid price values
                    originalPrice = parseFloat(originalPrice) || 0;
                    discountPrice = parseFloat(discountPrice) || 0;

                    return hyperHTML.wire(item)`
                      <li id="${optionId}" class="predictive-search__list-item-products" role="option" aria-selected="false">
                        <a href="${item.url}" class="predictive-search__item" tabindex="-1" aria-label="${item.title}">
                          <div class="product">
                            <img src="${item.image}"/>
                            <h3>${item.title}
                            <div class="meta flex justify-start gap-2 sm:hidden mt-1">
                            ${discountPercent ? hyperHTML.wire()`<span class="discount text-sm px-1 py-0.5">${discountPercent >= 15 ? `-${Math.round(discountPercent)}%` : 'SALE'}</span>` : ''}
                            <div class="flex gap-1 items-center">
                              ${
                                discountPercent > 0
                                  ? hyperHTML.wire()`
                                <span class="line-through text-[#666666] font-medium font-archivo-expanded text-sm leading-6">${formatMoney(originalPrice)}</span>
                                <span class="text-black font-medium font-archivo-expanded text-sm leading-6">${formatMoney(discountPrice)}</span>
                              `
                                  : hyperHTML.wire()`
                                <span class="text-black font-medium font-archivo-expanded text-sm leading-6">${formatMoney(originalPrice)}</span>
                              `
                              }
                            </div>
                          </div>
                            </h3>
                          </div>
                          <div class="meta hidden sm:block">
                            ${discountPercent ? hyperHTML.wire()`<span class="discount">${discountPercent >= 15 ? `-${Math.round(discountPercent)}%` : 'SALE'}</span>` : ''}
                            <div class="flex gap-3 items-center mt-0.5">
                              ${
                                discountPercent > 0
                                  ? hyperHTML.wire()`
                                <span class="line-through text-[#666666] font-medium font-archivo-expanded text-base leading-6">${formatMoney(originalPrice)}</span>
                                <span class="text-black font-medium font-archivo-expanded text-base leading-6">${formatMoney(discountPrice)}</span>
                              `
                                  : hyperHTML.wire()`
                                <span class="text-black font-medium font-archivo-expanded text-base leading-6">${formatMoney(originalPrice)}</span>
                              `
                              }
                            </div>
                          </div>
                        </a>
                      </li>
                    `;
                  })}
                </ul>
              </div>
            `;
          })
          .filter(Boolean)}
      </div>
      ${resultCount ? hyperHTML.wire()`
        <a
          id="predictive-search-view-all"
          class="nf__predictive-search__view-all-button button button--primary"
          href="${allResultsUrl}"
          role="option"
          aria-selected="false"
          tabindex="-1"
        >${this.translations.view_all_results}</a>
      ` : ''}
    </div>
  `;

    return html.innerHTML;
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(' ', '-').toLowerCase();
    this.setLiveRegionLoadingState();

    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }

    fetch(
      `${routes.predictive_search_url}.json?q=${encodeURIComponent(searchTerm)}&resources[type]=article,product,collection,query&section_id=predictive-search`,
      { signal: this.abortController.signal },
    )
      .then((response) => {
        if (!response.ok) {
          var error = new Error(response.status);
          this.close();
          throw error;
        }

        return response.json();
      })
      .then((json) => {
        const results = json?.resources?.results;
        if (!results) return;

        const resultsMarkup = this.getMarkupFromResults(results);
        this.allPredictiveSearchInstances.forEach((instance) => {
          instance.cachedResults[queryKey] = resultsMarkup;
        });
        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        if (error?.code === 20) {
          // Code 20 means the call was aborted
          return;
        }
        this.close();
        throw error;
      });
  }

  setLiveRegionLoadingState() {
    this.statusElement = this.statusElement || this.querySelector('.predictive-search-status');
    this.loadingText = this.loadingText || this.getAttribute('data-loading-text');
    this.setLiveRegionText(this.loadingText);
    this.setAttribute('loading', true);
  }

  setLiveRegionText(statusText) {
    this.statusElement.setAttribute('aria-hidden', 'false');
    this.statusElement.textContent = statusText;
    setTimeout(() => this.statusElement.setAttribute('aria-hidden', 'true'), 1000);
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute('results', true);
    this.setLiveRegionResults();
    this.open();

    // Add styles for no results message if it exists
    const noResultsElement = this.querySelector('.nf__predictive-search__no-results');
    if (noResultsElement) {
      // Apply styles to the no results container
      noResultsElement.style.padding = '20px';
      noResultsElement.style.textAlign = 'center';

      // Style the main message and fix text content
      const noResultsText = this.querySelector('.nf__predictive-search__no-results-text');
      if (noResultsText) {
        noResultsText.style.fontSize = '16px';
        noResultsText.style.fontWeight = '600';
        noResultsText.style.marginBottom = '8px';

        // Fix the text content by setting it directly
        const cleanText = this.translations.no_results.replace('{{ terms }}', `"${this.searchTerm}"`);
        noResultsText.textContent = cleanText;
      }

      // Style the suggestion text
      const noResultsSuggestion = this.querySelector('.nf__predictive-search__no-results-suggestion');
      if (noResultsSuggestion) {
        noResultsSuggestion.style.fontSize = '14px';
        noResultsSuggestion.style.color = '#666666';
      }
    }

    // Add event listeners for category tabs
    const categoryTabs = this.querySelectorAll('.nf__predictive-search__results-category');
    if (categoryTabs.length) {
      categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          // Remove active class from all tabs
          categoryTabs.forEach(t => t.classList.remove('active'));
          // Add active class to clicked tab
          tab.classList.add('active');
          // Here you would filter results based on the selected category
          // For now, we're just toggling the active state
        });
      });
    }
  }

  setLiveRegionResults() {
    this.removeAttribute('loading');
    this.setLiveRegionText(this.querySelector('[data-predictive-search-live-region-count-value]')?.textContent);
  }

  getResultsMaxHeight() {
    this.resultsMaxHeight =
      window.innerHeight - document.querySelector('.section-header')?.getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }

  open() {
    this.predictiveSearchResults.style.maxHeight = this.resultsMaxHeight || `${this.getResultsMaxHeight()}px`;

    // Setup positioning (Popper.js or fallback)
    this.setupPositioning();

    this.setAttribute('open', true);
    this.input.setAttribute('aria-expanded', true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
    // Cleanup Popper instance
    this.destroyPopper();

    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }

  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = '';
      this.removeAttribute('results');
    }
    const selected = this.querySelector('[aria-selected="true"]');
    if (selected) selected.setAttribute('aria-selected', false);

    this.input.setAttribute('aria-activedescendant', '');
    this.removeAttribute('loading');
    this.removeAttribute('open');
    this.input.setAttribute('aria-expanded', false);
    this.resultsMaxHeight = false;
    this.predictiveSearchResults.removeAttribute('style');
  }

  setupPositioning() {
    if (this.isMobile) {
      this.setupMobilePositioning();
    } else if (this.isPopperAvailable) {
      this.createPopperInstance();
    } else {
      this.setupFallbackPositioning();
    }
  }

  updatePositioning() {
    this.destroyPopper();
    this.setupPositioning();
  }

  setupMobilePositioning() {
    // Mobile: use full-width positioning
    this.predictiveSearchResults.classList.add('predictive-search--mobile');
    this.predictiveSearchResults.classList.remove('predictive-search--popper');
  }

  createPopperInstance() {
    if (this.popperInstance) {
      this.destroyPopper();
    }

    const referenceElement = this.input;
    const popperElement = this.predictiveSearchResults;

    // Add Popper class for styling
    popperElement.classList.add('predictive-search--popper');
    popperElement.classList.remove('predictive-search--mobile');

    this.popperInstance = window.Popper.createPopper(referenceElement, popperElement, {
      placement: 'bottom-start',
      strategy: 'absolute',
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: 'viewport',
            padding: 8,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
          },
        },
        {
          name: 'offset',
          options: {
            offset: [0, 4],
          },
        },
      ],
    });
  }

  setupFallbackPositioning() {
    // Fallback: use original absolute positioning
    console.warn('Popper.js not available, using fallback positioning');
    const popperElement = this.predictiveSearchResults;

    popperElement.classList.remove('predictive-search--popper', 'predictive-search--mobile');
    popperElement.style.position = 'absolute';
    popperElement.style.top = 'calc(100% + 0.0625rem)';
    popperElement.style.left = '0';
    popperElement.style.width = '600px';
  }

  destroyPopper() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }

    // Clean up classes
    this.predictiveSearchResults.classList.remove('predictive-search--popper', 'predictive-search--mobile');
  }
}

customElements.define('predictive-search', PredictiveSearch);
