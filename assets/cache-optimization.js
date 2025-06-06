/**
 * Cache Optimization Script
 * Implements service worker for better caching of static assets
 */

// Register service worker for cache optimization
if ('serviceWorker' in navigator && !window.Shopify?.designMode) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    }).then(function(registration) {
      console.log('ServiceWorker registration successful');
    }).catch(function(err) {
      console.log('ServiceWorker registration failed');
    });
  });
}

// Preload critical resources
document.addEventListener('DOMContentLoaded', function() {
  // Preload critical images
  const criticalImages = [
    // Add critical images that should be preloaded
  ];
  
  criticalImages.forEach(function(src) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
  
  // Optimize font loading
  const fontLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
  fontLinks.forEach(function(link) {
    link.addEventListener('load', function() {
      // Font loaded successfully
      document.documentElement.classList.add('fonts-loaded');
    });
  });
});

// Resource hints for better performance
function addResourceHints() {
  const hints = [
    { rel: 'dns-prefetch', href: '//cdn.shopify.com' },
    { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: '//cdn.jsdelivr.net' },
    { rel: 'preconnect', href: 'https://cdn.shopify.com', crossorigin: true },
  ];
  
  hints.forEach(function(hint) {
    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.crossorigin) link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

// Initialize optimizations
addResourceHints();
