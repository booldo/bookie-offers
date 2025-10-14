// Conditional analytics loading based on cookie consent

import { areCookiesAccepted } from './cookieConsent';

// Google Analytics 4 configuration
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

/**
 * Initialize Google Analytics if cookies are accepted
 */
export function initializeAnalytics() {
  if (typeof window === 'undefined') return;
  
  if (!areCookiesAccepted()) {
    console.log('Analytics not initialized - cookies not accepted');
    return;
  }

  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_title: document.title,
    page_location: window.location.href,
  });

  console.log('Google Analytics initialized');
}

/**
 * Track page view (only if cookies accepted)
 * @param {string} url - Page URL
 * @param {string} title - Page title
 */
export function trackPageView(url, title) {
  if (typeof window === 'undefined' || !areCookiesAccepted()) return;
  
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: title,
    });
  }
}

/**
 * Track custom event (only if cookies accepted)
 * @param {string} eventName - Event name
 * @param {Object} parameters - Event parameters
 */
export function trackEvent(eventName, parameters = {}) {
  if (typeof window === 'undefined' || !areCookiesAccepted()) return;
  
  if (window.gtag) {
    window.gtag('event', eventName, parameters);
  }
}

/**
 * Track cookie consent decision
 * @param {string} decision - 'accepted' or 'rejected'
 */
export function trackCookieConsent(decision) {
  // This event can be tracked regardless of consent since it's about consent itself
  if (typeof window === 'undefined') return;
  
  // Use a simple tracking method that doesn't require full analytics
  console.log(`Cookie consent: ${decision}`);
  
  // If user accepted cookies, initialize analytics and track the consent
  if (decision === 'accepted') {
    initializeAnalytics();
    // Track the consent event after a short delay to ensure analytics is loaded
    setTimeout(() => {
      trackEvent('cookie_consent', {
        consent_decision: decision,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  }
}

/**
 * Clean up analytics (when cookies are rejected or cleared)
 */
export function cleanupAnalytics() {
  if (typeof window === 'undefined') return;
  
  // Remove Google Analytics scripts
  const scripts = document.querySelectorAll('script[src*="googletagmanager.com"]');
  scripts.forEach(script => script.remove());
  
  // Clear dataLayer
  if (window.dataLayer) {
    window.dataLayer = [];
  }
  
  // Remove gtag function
  if (window.gtag) {
    delete window.gtag;
  }
  
  console.log('Analytics cleaned up');
}
