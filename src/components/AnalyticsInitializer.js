'use client';

import { useEffect } from 'react';
import { useCookieConsent } from '../hooks/useCookieConsent';
import { initializeAnalytics, cleanupAnalytics } from '../lib/analytics';

export default function AnalyticsInitializer() {
  const { isAccepted, isRejected, isLoading } = useCookieConsent();

  useEffect(() => {
    // Don't do anything while loading
    if (isLoading) return;

    // Initialize analytics if cookies are accepted
    if (isAccepted) {
      initializeAnalytics();
    }

    // Cleanup analytics if cookies are rejected
    if (isRejected) {
      cleanupAnalytics();
    }
  }, [isAccepted, isRejected, isLoading]);

  // Listen for consent changes
  useEffect(() => {
    const handleConsentChange = (event) => {
      const { status } = event.detail;
      
      if (status === 'accepted') {
        initializeAnalytics();
      } else if (status === 'rejected') {
        cleanupAnalytics();
      }
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange);

    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
