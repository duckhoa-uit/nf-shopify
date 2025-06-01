/**
 * Performance Monitoring Script
 * Tracks Core Web Vitals and sends data to analytics
 */

(function() {
  'use strict';

  // Check if performance API is available
  if (!window.performance || !window.performance.getEntriesByType) {
    return;
  }

  // Core Web Vitals tracking
  const vitals = {
    FCP: null, // First Contentful Paint
    LCP: null, // Largest Contentful Paint
    FID: null, // First Input Delay
    CLS: null  // Cumulative Layout Shift
  };

  // Track First Contentful Paint
  function trackFCP() {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcpEntry) {
      vitals.FCP = Math.round(fcpEntry.startTime);
    }
  }

  // Track Largest Contentful Paint
  function trackLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        vitals.LCP = Math.round(lastEntry.startTime);
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Fallback for browsers that don't support LCP
        console.warn('LCP tracking not supported');
      }
    }
  }

  // Track First Input Delay
  function trackFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            vitals.FID = Math.round(entry.processingStart - entry.startTime);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Fallback for browsers that don't support FID
        console.warn('FID tracking not supported');
      }
    }
  }

  // Track Cumulative Layout Shift
  function trackCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            vitals.CLS = Math.round(clsValue * 1000) / 1000;
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Fallback for browsers that don't support CLS
        console.warn('CLS tracking not supported');
      }
    }
  }

  // Track resource loading performance
  function trackResourcePerformance() {
    const resources = performance.getEntriesByType('resource');
    const cssResources = resources.filter(r => r.name.includes('.css'));
    const jsResources = resources.filter(r => r.name.includes('.js'));

    const cssLoadTime = cssResources.reduce((total, resource) => {
      return total + (resource.responseEnd - resource.startTime);
    }, 0);

    const jsLoadTime = jsResources.reduce((total, resource) => {
      return total + (resource.responseEnd - resource.startTime);
    }, 0);

    return {
      cssCount: cssResources.length,
      jsCount: jsResources.length,
      cssLoadTime: Math.round(cssLoadTime),
      jsLoadTime: Math.round(jsLoadTime)
    };
  }

  // Send performance data to analytics
  function sendPerformanceData() {
    const resourceData = trackResourcePerformance();

    const performanceData = {
      ...vitals,
      ...resourceData,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink
      } : null
    };

    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metrics', {
        custom_map: {
          metric1: 'fcp',
          metric2: 'lcp',
          metric3: 'fid',
          metric4: 'cls'
        },
        fcp: vitals.FCP,
        lcp: vitals.LCP,
        fid: vitals.FID,
        cls: vitals.CLS
      });
    }

    // Send to Shopify Analytics if available
    if (window.ShopifyAnalytics) {
      window.ShopifyAnalytics.lib.track('Performance Metrics', performanceData);
    }

    // Console log for development
    if (window.Shopify && window.Shopify.designMode) {
      console.group('🚀 Performance Metrics');
      console.log('Core Web Vitals:', vitals);
      console.log('Resource Performance:', resourceData);
      console.log('Full Data:', performanceData);
      console.groupEnd();
    }
  }

  // Initialize tracking
  function initPerformanceTracking() {
    trackFCP();
    trackLCP();
    trackFID();
    trackCLS();

    // Send data after page load
    if (document.readyState === 'complete') {
      setTimeout(sendPerformanceData, 1000);
    } else {
      window.addEventListener('load', () => {
        setTimeout(sendPerformanceData, 1000);
      });
    }

    // Send data before page unload
    window.addEventListener('beforeunload', sendPerformanceData);
  }

  // Start tracking when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPerformanceTracking);
  } else {
    initPerformanceTracking();
  }

  // Expose vitals for debugging
  if (window.Shopify && window.Shopify.designMode) {
    window.performanceVitals = vitals;
  }

})();
