class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 800);

    const facetForm = this.querySelector("form");
    facetForm.addEventListener("input", this.debouncedOnSubmit.bind(this));
    facetForm.addEventListener("change", this.debouncedOnSubmit.bind(this));

    const facetWrapper = this.querySelector("#FacetsWrapperDesktop");
    if (facetWrapper) facetWrapper.addEventListener("keyup", onKeyUpEscape);
  }

  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener("popstate", onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll(".js-facet-remove").forEach((element) => {
      element.classList.toggle("disabled", disable);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById("ProductCount");
    const countContainerDesktop = document.getElementById("ProductCountDesktop");
    const loadingSpinners = document.querySelectorAll(
      ".facets-container .loading__spinner, facet-filters-form .loading__spinner",
    );
    loadingSpinners.forEach((spinner) => spinner.classList.remove("hidden"));
    document.getElementById("ProductGridContainer").querySelector(".collection").classList.add("loading");
    if (countContainer) {
      countContainer.classList.add("loading");
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add("loading");
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = (element) => element.url === url;

      FacetFiltersForm.filterData.some(filterDataUrl)
        ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event)
        : FacetFiltersForm.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then((response) => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);
        if (typeof initializeScrollAnimationTrigger === "function") initializeScrollAnimationTrigger(html.innerHTML);
      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
    if (typeof initializeScrollAnimationTrigger === "function") initializeScrollAnimationTrigger(html.innerHTML);
  }

  static renderProductGridContainer(html) {
    document.getElementById("ProductGridContainer").innerHTML = new DOMParser()
      .parseFromString(html, "text/html")
      .getElementById("ProductGridContainer").innerHTML;

    document
      .getElementById("ProductGridContainer")
      .querySelectorAll(".scroll-trigger")
      .forEach((element) => {
        element.classList.add("scroll-trigger--cancel");
      });
  }

  static renderProductCount(html) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html");
    const productCountElement = parsedHTML.getElementById("ProductCount");

    // Check if ProductCount element exists in the parsed HTML
    if (!productCountElement) {
      console.warn("ProductCount element not found in fetched HTML");
      return;
    }

    const count = productCountElement.innerHTML;
    const container = document.getElementById("ProductCount");
    const containerDesktop = document.getElementById("ProductCountDesktop");

    // Check if containers exist in the current DOM
    if (container) {
      container.innerHTML = count;
      container.classList.remove("loading");
    }

    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove("loading");
    }

    const loadingSpinners = document.querySelectorAll(
      ".facets-container .loading__spinner, facet-filters-form .loading__spinner",
    );
    loadingSpinners.forEach((spinner) => spinner.classList.add("hidden"));
  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html");
    const facetDetailsElementsFromFetch = parsedHTML.querySelectorAll(
      "#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter",
    );
    const facetDetailsElementsFromDom = document.querySelectorAll(
      "#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter",
    );

    // Remove facets that are no longer returned from the server
    Array.from(facetDetailsElementsFromDom).forEach((currentElement) => {
      if (!Array.from(facetDetailsElementsFromFetch).some(({ id }) => currentElement.id === id)) {
        currentElement.remove();
      }
    });

    const matchesId = (element) => {
      const jsFilter = event ? event.target.closest(".js-filter") : undefined;
      return jsFilter ? element.id === jsFilter.id : false;
    };

    const facetsToRender = Array.from(facetDetailsElementsFromFetch).filter((element) => !matchesId(element));
    const countsToRender = Array.from(facetDetailsElementsFromFetch).find(matchesId);

    facetsToRender.forEach((elementToRender, index) => {
      const currentElement = document.getElementById(elementToRender.id);
      // Element already rendered in the DOM so just update the innerHTML
      if (currentElement) {
        document.getElementById(elementToRender.id).innerHTML = elementToRender.innerHTML;
      } else {
        if (index > 0) {
          const { className: previousElementClassName, id: previousElementId } = facetsToRender[index - 1];
          // Same facet type (eg horizontal/vertical or drawer/mobile)
          if (elementToRender.className === previousElementClassName) {
            document.getElementById(previousElementId).after(elementToRender);
            return;
          }
        }

        if (elementToRender.parentElement) {
          document.querySelector(`#${elementToRender.parentElement.id} .js-filter`).before(elementToRender);
        }
      }
    });

    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (countsToRender && event && event.target) {
      const closestJSFilter = event.target.closest(".js-filter");
      const closestJSFilterID = closestJSFilter ? closestJSFilter.id : null;

      if (closestJSFilterID) {
        FacetFiltersForm.renderCounts(countsToRender, closestJSFilter);
        FacetFiltersForm.renderMobileCounts(countsToRender, document.getElementById(closestJSFilterID));

        const newFacetDetailsElement = document.getElementById(closestJSFilterID);
        if (newFacetDetailsElement) {
          const newElementSelector = newFacetDetailsElement.classList.contains("mobile-facets__details")
            ? `.mobile-facets__close-button`
            : `.facets__summary`;
          const newElementToActivate = newFacetDetailsElement.querySelector(newElementSelector);

          const isTextInput = event.target.getAttribute("type") === "text";

          if (newElementToActivate && !isTextInput) newElementToActivate.focus();
        }
      }
    }
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = [".active-facets-mobile", ".active-facets-desktop"];

    activeFacetElementSelectors.forEach((selector) => {
      const sourceElement = html.querySelector(selector);
      const targetElement = document.querySelector(selector);

      if (!sourceElement || !targetElement) return;

      targetElement.innerHTML = sourceElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const mobileElementSelectors = [".mobile-facets__open", ".mobile-facets__count", ".sorting"];

    mobileElementSelectors.forEach((selector) => {
      const sourceElement = html.querySelector(selector);
      const targetElement = document.querySelector(selector);

      if (!sourceElement || !targetElement) return;

      targetElement.innerHTML = sourceElement.innerHTML;
    });

    const facetFormMobile = document.getElementById("FacetFiltersFormMobile");
    if (facetFormMobile) {
      const menuDrawer = facetFormMobile.closest("menu-drawer");
      if (menuDrawer && typeof menuDrawer.bindEvents === 'function') {
        menuDrawer.bindEvents();
      }
    }

    // // Fix mobile facets submenu transitions
    // const mobileSubmenus = document.querySelectorAll('.mobile-facets__submenu');
    // mobileSubmenus.forEach(submenu => {
    //   const closeButton = submenu.querySelector('.mobile-facets__close-button');
    //   if (closeButton) {
    //     closeButton.addEventListener('click', function() {
    //       const details = this.closest('details');
    //       if (details) {
    //         submenu.style.transform = 'translateX(100%)';
    //         submenu.style.visibility = 'hidden';

    //         // Remove open attribute after transition completes
    //         setTimeout(() => {
    //           details.removeAttribute('open');
    //         }, 300);
    //       }
    //     });
    //   }
    // });
  }

  static renderCounts(source, target) {
    const targetSummary = target.querySelector(".facets__summary");
    const sourceSummary = source.querySelector(".facets__summary");

    if (sourceSummary && targetSummary) {
      targetSummary.outerHTML = sourceSummary.outerHTML;
    }

    const targetHeaderElement = target.querySelector(".facets__header");
    const sourceHeaderElement = source.querySelector(".facets__header");

    if (sourceHeaderElement && targetHeaderElement) {
      targetHeaderElement.outerHTML = sourceHeaderElement.outerHTML;
    }

    const targetWrapElement = target.querySelector(".facets-wrap");
    const sourceWrapElement = source.querySelector(".facets-wrap");

    if (sourceWrapElement && targetWrapElement) {
      const isShowingMore = Boolean(target.querySelector("show-more-button .label-show-more.hidden"));
      if (isShowingMore) {
        sourceWrapElement
          .querySelectorAll(".facets__item.hidden")
          .forEach((hiddenItem) => hiddenItem.classList.replace("hidden", "show-more-item"));
      }

      targetWrapElement.outerHTML = sourceWrapElement.outerHTML;
    }
  }

  static renderMobileCounts(source, target) {
    const targetFacetsList = target.querySelector(".mobile-facets__list");
    const sourceFacetsList = source.querySelector(".mobile-facets__list");

    if (sourceFacetsList && targetFacetsList) {
      targetFacetsList.outerHTML = sourceFacetsList.outerHTML;
    }
  }

  static updateURLHash(searchParams) {
    // Clean up the search parameters - remove empty parameters
    if (searchParams) {
      const params = new URLSearchParams(searchParams);
      // Remove any parameters with empty values
      for (const [key, value] of Array.from(params.entries())) {
        if (!value || value === "undefined" || value === "null") {
          params.delete(key);
        }
      }
      // If we have parameters, append them to URL with '?', otherwise just use pathname
      const cleanParams = params.toString();
      history.pushState(
        { searchParams: cleanParams },
        "",
        `${window.location.pathname}${cleanParams ? "?".concat(cleanParams) : ""}`,
      );
    } else {
      history.pushState({ searchParams: "" }, "", window.location.pathname);
    }
  }

  static getSections() {
    return [
      {
        section: document.getElementById("product-grid").dataset.id,
      },
    ];
  }

  createSearchParams(form) {
    const formData = new FormData(form);
    const params = new URLSearchParams();

    // Only add non-empty values to the URL parameters
    for (const [key, value] of formData.entries()) {
      if (value && value !== "undefined" && value !== "null") {
        // For price filters, only add if they're not at default values
        if (key.includes("price") && form.querySelector("price-range")) {
          const priceRange = form.querySelector("price-range");
          if (key.includes("-GTE") && Number(value) === priceRange.defaultMin) continue;
          if (key.includes("-LTE") && Number(value) === priceRange.defaultMax) continue;
        }

        // Handle metaobject filter parameters
        if (key.startsWith("filter.v.meta.")) {
          const filterGroup = key.split(".").pop();
          const existingValue = params.get(`filter.v.meta.${filterGroup}`);
          if (existingValue) {
            // If we already have values for this filter group, append the new value
            params.set(`filter.v.meta.${filterGroup}`, `${existingValue},${value}`);
          } else {
            params.append(key, value);
          }
        } else {
          params.append(key, value);
        }
      }
    }

    return params.toString();
  }

  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll("facet-filters-form form");

    if (event.srcElement && event.srcElement.className == "mobile-facets__checkbox") {
      const form = event.target.closest("form");
      if (form) {
        const searchParams = this.createSearchParams(form);
        this.onSubmitForm(searchParams, event);
      }
    } else {
      const forms = [];
      const targetForm = event.target.closest("form");
      const isMobile = targetForm && targetForm.id === "FacetFiltersFormMobile";

      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === "FacetSortForm" || form.id === "FacetFiltersForm" || form.id === "FacetSortDrawerForm") {
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === "FacetFiltersFormMobile") {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join("&"), event);
    }
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url =
      event.currentTarget.href.indexOf("?") == -1
        ? ""
        : event.currentTarget.href.slice(event.currentTarget.href.indexOf("?") + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define("facet-filters-form", FacetFiltersForm);
FacetFiltersForm.setListeners();

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.minInput = this.querySelector("#" + this.querySelector('.price-input[id*="-GTE"]').id);
    this.maxInput = this.querySelector("#" + this.querySelector('.price-input[id*="-LTE"]').id);
    this.sliderTrack = this.querySelector(".price-slider-track");
    this.sliderRange = this.querySelector(".price-slider-range");
    this.sliderThumbMin = this.querySelector(".price-slider-thumb-min");
    this.sliderThumbMax = this.querySelector(".price-slider-thumb-max");
    this.sliderContainer = this.querySelector(".price-slider-container");
    this.discountCheckbox = this.querySelector(".discount-filter-checkbox");
    this.container = this.closest(".price-filter-container");

    this.dragging = false;
    this.activeThumb = null;
    this.initialized = false;
    this.isInitialLoad = true;
    this.pendingUpdate = false;

    // Get pre-rendered values from data attributes (server-side rendered)
    const preRenderedMin = this.container ? Number(this.container.getAttribute("data-min-value")) : null;
    const preRenderedMax = this.container ? Number(this.container.getAttribute("data-max-value")) : null;

    // Store default values
    this.defaultMin = Number(this.minInput.getAttribute("data-min") || 0);
    this.defaultMax = Number(this.maxInput.getAttribute("data-max")) || 1000;

    // Prioritize values in this order: URL params > pre-rendered values > input values > defaults
    let initialMin = preRenderedMin !== null && !isNaN(preRenderedMin) ? preRenderedMin : this.defaultMin;
    let initialMax = preRenderedMax !== null && !isNaN(preRenderedMax) ? preRenderedMax : this.defaultMax;

    // Check URL params for filter values
    if (window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMinValue = urlParams.get(this.minInput.name);
      const urlMaxValue = urlParams.get(this.maxInput.name);

      // If URL params exist, use those values
      if (urlMinValue !== null && !isNaN(Number(urlMinValue))) initialMin = Number(urlMinValue);
      if (urlMaxValue !== null && !isNaN(Number(urlMaxValue))) initialMax = Number(urlMaxValue);
    }

    // Ensure we don't have NaN values
    if (isNaN(initialMin)) initialMin = this.defaultMin;
    if (isNaN(initialMax)) initialMax = this.defaultMax;
    if (isNaN(this.defaultMax)) this.defaultMax = 1000;

    // Set input values immediately
    this.minInput.value = initialMin;
    this.maxInput.value = initialMax;

    // Add event listeners for inputs
    this.minInput.addEventListener("change", this.onRangeInputChange.bind(this));
    this.maxInput.addEventListener("change", this.onRangeInputChange.bind(this));
    this.minInput.addEventListener("keydown", this.onKeyDown.bind(this));
    this.maxInput.addEventListener("keydown", this.onKeyDown.bind(this));

    // Add event listeners for slider thumbs
    this.sliderThumbMin.addEventListener("mousedown", this.onThumbMouseDown.bind(this));
    this.sliderThumbMax.addEventListener("mousedown", this.onThumbMouseDown.bind(this));

    // Add global event listeners for dragging
    document.addEventListener("mousemove", this.onMouseMove.bind(this));
    document.addEventListener("mouseup", this.onMouseUp.bind(this));

    // Touch support
    this.sliderThumbMin.addEventListener("touchstart", this.onThumbTouchStart.bind(this), { passive: true });
    this.sliderThumbMax.addEventListener("touchstart", this.onThumbTouchStart.bind(this), { passive: true });
    document.addEventListener("touchmove", this.onTouchMove.bind(this), { passive: false });
    document.addEventListener("touchend", this.onTouchEnd.bind(this));

    // Initialize
    this.setMinAndMaxValues();

    // Make sure we have valid values before initializing the slider
    if (isNaN(Number(this.minInput.value))) {
      this.minInput.value = this.defaultMin;
    }

    if (isNaN(Number(this.maxInput.value))) {
      this.maxInput.value = this.defaultMax;
    }

    // We don't need this check anymore since we're setting values correctly in the constructor

    this.updateSliderFromInputs();

    // Set initial load to false after a delay to allow the page to stabilize
    setTimeout(() => {
      this.isInitialLoad = false;
    }, 500);
  }

  onKeyDown(event) {
    if (event.metaKey) return;

    const pattern = /[0-9]|\.|,|'| |Tab|Backspace|Enter|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Delete|Escape/;
    if (!event.key.match(pattern)) event.preventDefault();

    // Update slider after pressing Enter
    if (event.key === "Enter") {
      this.onRangeInputChange(event);
    }
  }

  // Check if current values are different from defaults
  hasFilterChanged() {
    const currentMin = Number(this.minInput.value);
    const currentMax = Number(this.maxInput.value);
    return currentMin !== this.defaultMin || currentMax !== this.defaultMax;
  }

  onRangeInputChange(event) {
    if (this.pendingUpdate) return;

    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
    this.updateSliderFromInputs();

    // Always trigger form submission when user changes input values
    this.triggerFormSubmission();
  }

  triggerFormSubmission() {
    const form = this.closest("form");
    if (form) {
      this.pendingUpdate = true;
      const event = new Event("input", {
        bubbles: true,
        cancelable: true,
      });
      form.dispatchEvent(event);

      // Reset pendingUpdate after a short delay
      setTimeout(() => {
        this.pendingUpdate = false;
      }, 100);
    }
  }

  setMinAndMaxValues() {
    if (this.maxInput.value) this.minInput.setAttribute("data-max", this.maxInput.value);
    if (this.minInput.value) this.maxInput.setAttribute("data-min", this.minInput.value);
    if (this.minInput.value === "") this.maxInput.setAttribute("data-min", 0);
    if (this.maxInput.value === "") this.minInput.setAttribute("data-max", this.maxInput.getAttribute("data-max"));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute("data-min"));
    const max = Number(input.getAttribute("data-max"));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }

  updateSliderFromInputs() {
    const min = Number(this.minInput.getAttribute("data-min") || 0);
    const max = Number(this.maxInput.getAttribute("data-max")) || 1000;

    // Get current values directly from the input fields
    let currentMin = Number(this.minInput.value || min);
    let currentMax = Number(this.maxInput.value || max);

    // Ensure we don't have NaN values
    let safeCurrentMin = isNaN(currentMin) ? min : currentMin;
    let safeCurrentMax = isNaN(currentMax) ? max : currentMax;

    // Make sure min doesn't exceed max and max isn't below min
    safeCurrentMin = Math.min(safeCurrentMin, safeCurrentMax);
    safeCurrentMax = Math.max(safeCurrentMin, safeCurrentMax);

    // Make sure we have a valid range to prevent division by zero
    const range = max - min || 1; // Use 1 as fallback if range is 0

    // Calculate percentage positions
    const minPos = Math.max(0, Math.min(100, ((safeCurrentMin - min) / range) * 100));
    const maxPos = Math.max(0, Math.min(100, ((safeCurrentMax - min) / range) * 100));

    // Update thumb positions
    this.sliderThumbMin.style.left = `${minPos}%`;
    this.sliderThumbMax.style.left = `${maxPos}%`;

    // Update range bar
    this.sliderRange.style.left = `${minPos}%`;
    this.sliderRange.style.width = `${maxPos - minPos}%`;

    // Initialize the slider if it hasn't been initialized yet
    if (!this.initialized) {
      this.initialized = true;
      // Add initialized class to show the slider
      if (this.sliderContainer) {
        this.sliderContainer.classList.add('initialized');
      }
    }
  }

  updateInputsFromSlider(position, isMin) {
    if (this.pendingUpdate) return;

    const min = Number(this.minInput.getAttribute("data-min") || 0);
    const max = Number(this.maxInput.getAttribute("data-max")) || 1000;
    const range = max - min;

    // Ensure position is a valid number
    position = isNaN(position) ? (isMin ? 0 : 100) : position;

    // Calculate the value based on position
    let value = Math.round((position * range) / 100 + min);

    // Ensure value is a valid number
    if (isNaN(value)) {
      value = isMin ? min : max;
    }

    // Update the appropriate input
    if (isMin) {
      // Ensure min value doesn't exceed max value
      const maxValue = Number(this.maxInput.value || max);
      value = Math.min(value, isNaN(maxValue) ? max : maxValue);
      this.minInput.value = value;
    } else {
      // Ensure max value doesn't go below min value
      const minValue = Number(this.minInput.value || min);
      value = Math.max(value, isNaN(minValue) ? min : minValue);
      this.maxInput.value = value;
    }

    this.setMinAndMaxValues();

    // Always trigger form submission when slider is dragged
    if (this.dragging) {
      this.triggerFormSubmission();
    }
  }

  onThumbMouseDown(event) {
    event.preventDefault();
    this.dragging = true;
    this.activeThumb = event.currentTarget === this.sliderThumbMin ? "min" : "max";
  }

  onThumbTouchStart(event) {
    this.dragging = true;
    this.activeThumb = event.currentTarget === this.sliderThumbMin ? "min" : "max";
  }

  onMouseMove(event) {
    if (!this.dragging) return;

    const rect = this.sliderTrack.getBoundingClientRect();
    const position = ((event.clientX - rect.left) / rect.width) * 100;
    this.updateSliderThumb(position);
  }

  onTouchMove(event) {
    if (!this.dragging) return;
    event.preventDefault();

    const touch = event.touches[0];
    const rect = this.sliderTrack.getBoundingClientRect();
    const position = ((touch.clientX - rect.left) / rect.width) * 100;
    this.updateSliderThumb(position);
  }

  updateSliderThumb(position) {
    if (!this.dragging) return;

    // Clamp position between 0 and 100
    position = Math.max(0, Math.min(100, position));

    if (this.activeThumb === "min") {
      // Get max position to ensure min thumb doesn't go beyond max thumb
      let maxPosition = parseFloat(this.sliderThumbMax.style.left || 100);
      // Handle NaN
      if (isNaN(maxPosition)) maxPosition = 100;

      position = Math.min(position, maxPosition);

      this.sliderThumbMin.style.left = `${position}%`;
      this.sliderRange.style.left = `${position}%`;
      this.sliderRange.style.width = `${maxPosition - position}%`;

      this.updateInputsFromSlider(position, true);
    } else if (this.activeThumb === "max") {
      // Get min position to ensure max thumb doesn't go below min thumb
      let minPosition = parseFloat(this.sliderThumbMin.style.left || 0);
      // Handle NaN
      if (isNaN(minPosition)) minPosition = 0;

      position = Math.max(position, minPosition);

      this.sliderThumbMax.style.left = `${position}%`;
      this.sliderRange.style.width = `${position - minPosition}%`;

      this.updateInputsFromSlider(position, false);
    }
  }

  onMouseUp() {
    if (this.dragging) {
      // Trigger form submission when mouse is released after dragging
      this.triggerFormSubmission();
      this.dragging = false;
      this.activeThumb = null;
    }
  }

  onTouchEnd() {
    if (this.dragging) {
      // Trigger form submission when touch ends after dragging
      this.triggerFormSubmission();
      this.dragging = false;
      this.activeThumb = null;
    }
  }
}

customElements.define("price-range", PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector("a");
    facetLink.setAttribute("role", "button");
    facetLink.addEventListener("click", this.closeFilter.bind(this));
    facetLink.addEventListener("keyup", (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === "SPACE") this.closeFilter(event);
    });
  }

  closeFilter(event) {
    event.preventDefault();
    const form = this.closest("facet-filters-form") || document.querySelector("facet-filters-form");
    form.onActiveFilterClick(event);
  }
}

customElements.define("facet-remove", FacetRemove);
