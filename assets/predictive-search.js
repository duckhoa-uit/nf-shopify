class PredictiveSearch extends SearchForm {
  constructor() {
    super();
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector('[data-predictive-search]');
    this.allPredictiveSearchInstances = document.querySelectorAll('predictive-search');
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = '';

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
    this.input.addEventListener('focus', this.onFocus.bind(this));
    this.addEventListener('focusout', this.onFocusOut.bind(this));
    this.addEventListener('keyup', this.onKeyup.bind(this));
    this.addEventListener('keydown', this.onKeydown.bind(this));
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
    const allVisibleElements = Array.from(this.querySelectorAll('li, button.predictive-search__item')).filter(
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
    const selectedOption = this.querySelector('[aria-selected="true"] a, button[aria-selected="true"]');
    if (selectedOption) selectedOption.click();
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
      collections: 'Categories',
      articles: 'Articles',
      products: 'Products',
    };

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

      return discountPercent > 0 ? [originalPrice, discountPrice, discountPercent] : [originalPrice, discountPrice, 0];
    }

    function formatMoney(amount) {
      // Get the current currency code and locale from the Shopify object
      const currencyCode = Shopify.currency.active;
      const locale = `${Shopify.locale}-${Shopify.country}`; // Creates locale like 'en-VN'

      // Create formatter instance with store's locale and currency
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 0, // VND typically doesn't use decimal places
        maximumFractionDigits: 0,
      });

      // Format the amount
      let formattedAmount = formatter.format(amount);

      // For VND, we might want to add space between amount and symbol
      if (currencyCode === 'VND') {
        // Replace the symbol position and add space if needed
        formattedAmount = formattedAmount.replace('₫', '').trim() + ' ₫';
      }

      return formattedAmount;
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

    const html = template`
    <div class="nf__predictive-search-results">
      <div class="nf__predictive-search__results-groups-wrapper" id="predictive-search-results-groups-wrapper">
        ${['collections', 'articles', 'products']
          .map((type) => {
            const items = results[type] || [];
            if (!items.length) return null;
            return hyperHTML.wire(items)`
              <div class="nf__predictive-search__result-group">
                <h2>
                  ${categoryLabelMap[type]}
                </h2>
                <ul class="predictive-search__result-list list-unstyled" role="list">
                  ${items.map((item) => {
                    if (type === 'collections')
                      return hyperHTML.wire(item)`
                        <li class="predictive-search__list-item-collections" role="option">
                          <a href="${item.url}" class="predictive-search__item" tabindex="-1">
                            <span class="predictive-search__item-heading">${item.title}</span>
                          </a>
                        </li>
                      `;

                    if (type === 'articles')
                      return hyperHTML.wire(item)`
                        <li class="predictive-search__list-item-articles" role="option">
                          <a href="${item.url}" class="predictive-search__item" tabindex="-1">
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

                    const [originalPrice, discountPrice, discountPercent] = getDiscountDetails(item);

                    return hyperHTML.wire(item)`
                      <li class="predictive-search__list-item-products" role="option">
                        <a href="${item.url}" class="predictive-search__item" tabindex="-1">
                          <div class="product">
                            <img src="${item.image}"/>
                            <h3>${item.title}</h3>
                          </div>
                          <div class="meta">
                            ${discountPercent ? hyperHTML.wire()`<span class="discount">${discountPercent >= 15 ? `-${Math.round(discountPercent)}%` : 'SALE'}</span>` : ''}
                            <div class="pricing">
                              ${
                                discountPercent
                                  ? hyperHTML.wire()`
                                <span>${formatMoney(originalPrice)}</span>
                                <span>${formatMoney(discountPrice)}</span>
                              `
                                  : hyperHTML.wire()`
                                <span></span>
                                <span>${formatMoney(originalPrice)}</span>
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

    this.setAttribute('open', true);
    this.input.setAttribute('aria-expanded', true);
    this.isOpen = true;
  }

  close(clearSearchTerm = false) {
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
}

customElements.define('predictive-search', PredictiveSearch);
