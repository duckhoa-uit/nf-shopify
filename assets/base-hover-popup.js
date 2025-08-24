/**
 * Base Hover Popup Component
 * Reusable foundation for hover popups with instant display and background updates
 *
 * Features:
 * - Popper.js positioning with fallback
 * - Hover behavior with configurable timing
 * - Background DOM update system
 * - Instant display performance
 * - Event handling and cleanup
 * - Cache management
 */

class BaseHoverPopup extends HTMLElement {
  constructor(options = {}) {
    super();

    // Configuration options
    this.options = {
      hoverDelay: 150,
      hideDelay: 100,
      cacheTTL: 300000, // 5 minutes
      backgroundUpdateDebounce: 100,
      updateDebounce: 150,
      maxItems: 5,
      ...options
    };

    // Popper.js integration
    this.popperInstance = null;
    this.isPopperAvailable = false;
    this.isMobile = window.innerWidth <= 749;

    // Check for Popper.js availability
    this.checkPopperAvailability();

    // Cache management
    this.cache = null;
    this.cacheTimestamp = 0;

    // Performance optimization
    this.updateDebounceTimer = null;
    this.isUpdating = false;

    // Background update system
    this.backgroundUpdateTimer = null;
    this.isBackgroundUpdating = false;
    this.pendingBackgroundUpdate = null;

    // State management
    this.isOpen = false;
    this.isLoading = false;
    this.hoverTimer = null;
    this.leaveTimer = null;

    // DOM state tracking
    this.domSyncTimestamp = 0;
    this.lastDOMHash = null;

    // DOM elements
    this.content = this.querySelector(this.getContentSelector());
    this.triggerElement = null;

    // Event unsubscribers
    this.eventUnsubscribers = [];

    // Delay initialization
    setTimeout(() => {
      this.init();
    }, 100);
  }

  // Abstract methods to be implemented by subclasses
  getContentSelector() {
    throw new Error('getContentSelector() must be implemented by subclass');
  }

  getTriggerSelector() {
    throw new Error('getTriggerSelector() must be implemented by subclass');
  }

  getUpdateEventName() {
    return null; // Override if popup needs to listen to specific events
  }

  getSectionId() {
    return null; // Override if popup uses section rendering
  }

  // Core initialization
  init() {
    // Find trigger element
    this.triggerElement = document.querySelector(this.getTriggerSelector());

    if (!this.triggerElement) {
      console.warn(`[${this.constructor.name}] Trigger element not found, popup disabled`);
      return;
    }

    this.setupEventListeners();
    this.setupResizeListener();
    this.subscribeToUpdates();
  }

  checkPopperAvailability() {
    this.isPopperAvailable = !!(
      (typeof window.Popper !== 'undefined' && window.Popper.createPopper) ||
      (typeof window.PopperJS !== 'undefined' && window.PopperJS.createPopper) ||
      (window.Popper && typeof window.Popper.createPopper === 'function')
    );

    // Wait for deferred scripts if not immediately available
    if (!this.isPopperAvailable) {
      setTimeout(() => {
        this.isPopperAvailable = !!(
          (typeof window.Popper !== 'undefined' && window.Popper.createPopper) ||
          (typeof window.PopperJS !== 'undefined' && window.PopperJS.createPopper) ||
          (window.Popper && typeof window.Popper.createPopper === 'function')
        );
      }, 500);
    }
  }

  setupEventListeners() {
    // Escape key to close
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape' && this.isOpen) {
        this.hide();
      }
    });

    // Trigger hover events (desktop only)
    if (!this.isMobile) {
      this.setupHoverEvents();
    }

    // Popup hover events to keep it open
    this.addEventListener('mouseenter', () => {
      this.clearLeaveTimer();
    });

    this.addEventListener('mouseleave', () => {
      this.scheduleHide();
    });
  }

  setupHoverEvents() {
    // Hover intent detection with configurable delay
    this.triggerElement.addEventListener('mouseenter', () => {
      this.clearLeaveTimer();
      this.hoverTimer = setTimeout(() => {
        if (!this.isMobile) {
          this.show();
        }
      }, this.options.hoverDelay);
    });

    this.triggerElement.addEventListener('mouseleave', () => {
      this.clearHoverTimer();
      this.scheduleHide();
    });
  }

  setupResizeListener() {
    const resizeHandler = () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth <= 749;

      if (wasMobile !== this.isMobile) {
        if (this.isMobile && this.isOpen) {
          this.hide();
        }
        this.updatePositioning();
      }
    };

    window.addEventListener('resize', resizeHandler);
    this.eventUnsubscribers.push(() => {
      window.removeEventListener('resize', resizeHandler);
    });
  }

  subscribeToUpdates() {
    const eventName = this.getUpdateEventName();
    if (!eventName || typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS !== 'object') {
      return;
    }

    const unsubscriber = subscribe(PUB_SUB_EVENTS[eventName], (event) => {
      this.handleUpdateEvent(event);
    });

    this.eventUnsubscribers.push(unsubscriber);
  }

  handleUpdateEvent(event) {
    // Always invalidate cache when updates occur
    this.invalidateCache();

    // Update cache with fresh data if available
    if (event?.data) {
      this.cache = event.data;
      this.cacheTimestamp = Date.now();
    }

    // Always update DOM in background, regardless of popup state
    this.scheduleBackgroundDOMUpdate(event);

    // If popup is open, also handle immediate visual updates
    if (this.isOpen) {
      this.debouncedHandleUpdate(event);
    }
  }

  // Background DOM update system
  scheduleBackgroundDOMUpdate(event) {
    if (this.backgroundUpdateTimer) {
      clearTimeout(this.backgroundUpdateTimer);
    }

    this.pendingBackgroundUpdate = event;

    this.backgroundUpdateTimer = setTimeout(() => {
      this.performBackgroundDOMUpdate(this.pendingBackgroundUpdate);
    }, this.options.backgroundUpdateDebounce);
  }

  async performBackgroundDOMUpdate(event) {
    if (this.isBackgroundUpdating) return;

    this.isBackgroundUpdating = true;

    try {
      let data = event?.data;
      if (!data) {
        data = await this.fetchFreshData();
        if (data) {
          this.cache = data;
          this.cacheTimestamp = Date.now();
        }
      }

      if (!data) return;

      // Generate hash for change detection
      const dataHash = this.generateDataHash(data);

      // Skip update if DOM is already in sync
      if (this.lastDOMHash === dataHash && this.isDOMSyncValid()) {
        return;
      }

      // Determine update strategy
      const needsStructuralUpdate = this.needsStructuralDOMUpdate(data);

      if (needsStructuralUpdate) {
        await this.performBackgroundStructuralUpdate(data);
      } else {
        this.updateDynamicContent(data);
      }

      // Update DOM sync tracking
      this.lastDOMHash = dataHash;
      this.domSyncTimestamp = Date.now();

    } catch (error) {
      console.error(`[${this.constructor.name}] Background update failed:`, error);
    } finally {
      this.isBackgroundUpdating = false;
    }
  }

  debouncedHandleUpdate(event) {
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.updateDebounceTimer = setTimeout(() => {
      this.handleUpdate(event);
    }, this.options.updateDebounce);
  }

  // Abstract methods for subclasses to implement
  async fetchFreshData() {
    throw new Error('fetchFreshData() must be implemented by subclass');
  }

  generateDataHash(data) {
    throw new Error('generateDataHash() must be implemented by subclass');
  }

  needsStructuralDOMUpdate(data) {
    throw new Error('needsStructuralDOMUpdate() must be implemented by subclass');
  }

  async performBackgroundStructuralUpdate(data) {
    throw new Error('performBackgroundStructuralUpdate() must be implemented by subclass');
  }

  updateDynamicContent(data) {
    throw new Error('updateDynamicContent() must be implemented by subclass');
  }

  handleUpdate(event) {
    // Default implementation - can be overridden
    if (event?.data) {
      this.updateDynamicContent(event.data);
    }
  }

  // Core popup behavior
  show() {
    if (this.isOpen || this.isMobile) {
      return;
    }

    this.isOpen = true;
    this.setAttribute('open', '');

    // Setup positioning
    this.setupPositioning();

    // Attach event listeners to content
    this.attachEventListeners();

    // DOM is already synced in background, just ensure dynamic content is fresh
    this.ensureFreshDynamicContent();
  }

  hide() {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.removeAttribute('open');

    // Cleanup Popper instance
    this.destroyPopper();

    // Clear timers
    this.clearHoverTimer();
    this.clearLeaveTimer();
  }

  // Timer management
  clearHoverTimer() {
    if (this.hoverTimer) {
      clearTimeout(this.hoverTimer);
      this.hoverTimer = null;
    }
  }

  clearLeaveTimer() {
    if (this.leaveTimer) {
      clearTimeout(this.leaveTimer);
      this.leaveTimer = null;
    }
  }

  scheduleHide() {
    this.leaveTimer = setTimeout(() => {
      this.hide();
    }, this.options.hideDelay);
  }

  clearBackgroundUpdateTimer() {
    if (this.backgroundUpdateTimer) {
      clearTimeout(this.backgroundUpdateTimer);
      this.backgroundUpdateTimer = null;
    }
  }

  // Positioning system
  setupPositioning() {
    if (this.isMobile) {
      return;
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

  createPopperInstance() {
    if (this.popperInstance) {
      this.destroyPopper();
    }

    const referenceElement = this.triggerElement;
    const popperElement = this;

    // Add Popper class for styling
    this.classList.add(`${this.getPopupName()}--popper`);

    // Try different Popper.js API locations
    const createPopper =
      (window.Popper && window.Popper.createPopper) ||
      (window.PopperJS && window.PopperJS.createPopper) ||
      window.createPopper;

    if (!createPopper) {
      this.setupFallbackPositioning();
      return;
    }

    try {
      this.popperInstance = createPopper(referenceElement, popperElement, {
        placement: 'bottom-end',
        strategy: 'absolute',
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 8],
            },
          },
          {
            name: 'preventOverflow',
            options: {
              boundary: 'viewport',
              padding: 16,
            },
          },
          {
            name: 'flip',
            options: {
              fallbackPlacements: ['bottom-start', 'top-end', 'top-start'],
            },
          },
        ],
      });
    } catch (error) {
      console.error(`[${this.constructor.name}] Popper.js initialization failed:`, error);
      this.setupFallbackPositioning();
    }
  }

  setupFallbackPositioning() {
    // Fallback positioning logic
    this.classList.add(`${this.getPopupName()}--fallback`);

    const rect = this.triggerElement.getBoundingClientRect();
    this.style.position = 'absolute';
    this.style.top = `${rect.bottom + window.scrollY + 8}px`;
    this.style.right = `${window.innerWidth - rect.right}px`;
    this.style.zIndex = '1000';
  }

  destroyPopper() {
    if (this.popperInstance) {
      this.popperInstance.destroy();
      this.popperInstance = null;
    }
    this.classList.remove(`${this.getPopupName()}--popper`);
    this.classList.remove(`${this.getPopupName()}--fallback`);
  }

  // Cache management
  isCacheValid() {
    return this.cache &&
           this.cacheTimestamp &&
           (Date.now() - this.cacheTimestamp) < this.options.cacheTTL;
  }

  invalidateCache() {
    this.cache = null;
    this.cacheTimestamp = 0;
  }

  isDOMSyncValid() {
    return this.domSyncTimestamp &&
           (Date.now() - this.domSyncTimestamp) < 30000; // 30 seconds
  }

  ensureFreshDynamicContent() {
    if (this.cache && this.isCacheValid()) {
      this.updateDynamicContent(this.cache);
    } else if (this.cache) {
      this.updateDynamicContent(this.cache);
    }
  }

  // Abstract methods for subclasses
  getPopupName() {
    return this.constructor.name.toLowerCase().replace('popup', '');
  }

  attachEventListeners() {
    // Override in subclasses to attach specific event listeners
  }

  // Cleanup
  disconnectedCallback() {
    this.destroyPopper();
    this.clearHoverTimer();
    this.clearLeaveTimer();
    this.clearBackgroundUpdateTimer();

    // Cleanup all event listeners
    this.eventUnsubscribers.forEach(unsubscriber => {
      if (typeof unsubscriber === 'function') {
        unsubscriber();
      }
    });
    this.eventUnsubscribers = [];
  }
}

// Make BaseHoverPopup available globally
window.BaseHoverPopup = BaseHoverPopup;
