/**
 * Vercel Speed Insights Integration
 * 
 * This module initializes Vercel Speed Insights to track web vitals
 * and performance metrics for the Patinhas platform.
 * 
 * Documentation: https://vercel.com/docs/speed-insights/quickstart
 */

(function() {
  'use strict';

  // Initialize the Speed Insights queue
  function initQueue() {
    if (window.si) return;
    window.si = function() {
      (window.siq = window.siq || []).push(arguments);
    };
  }

  // Detect if running in development mode
  function isDevelopment() {
    try {
      // Check for localhost or common development URLs
      const hostname = window.location.hostname;
      return hostname === 'localhost' || 
             hostname === '127.0.0.1' || 
             hostname.includes('.local');
    } catch (e) {
      return false;
    }
  }

  // Inject the Speed Insights script
  function injectSpeedInsights() {
    // Don't track in development
    if (isDevelopment()) {
      console.log('[Speed Insights] Disabled in development mode');
      return;
    }

    // Initialize the queue first
    initQueue();

    // Use the production script URL
    // When deployed to Vercel, this will automatically work
    const scriptSrc = 'https://va.vercel-scripts.com/v1/speed-insights/script.js';

    // Check if script already exists
    if (document.head.querySelector(`script[src*="${scriptSrc}"]`)) {
      return;
    }

    // Create and inject the script
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.defer = true;
    script.dataset.sdkn = '@vercel/speed-insights';
    script.dataset.sdkv = '1.0.12';

    // Add error handler
    script.onerror = function() {
      console.warn('[Speed Insights] Failed to load tracking script');
    };

    // Inject into document head
    document.head.appendChild(script);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSpeedInsights);
  } else {
    injectSpeedInsights();
  }
})();
