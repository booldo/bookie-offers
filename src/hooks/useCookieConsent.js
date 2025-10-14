import { useState, useEffect } from 'react';
import { 
  getCookieConsent, 
  setCookieConsent, 
  clearCookieConsent,
  CookieConsentStatus,
  areCookiesAccepted,
  hasUserMadeChoice
} from '../lib/cookieConsent';

/**
 * React hook for managing cookie consent state
 * @returns {Object} Cookie consent state and actions
 */
export function useCookieConsent() {
  const [consentStatus, setConsentStatus] = useState(CookieConsentStatus.PENDING);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize consent status from localStorage
    const currentStatus = getCookieConsent();
    setConsentStatus(currentStatus);
    setIsLoading(false);

    // Listen for consent changes from other components/tabs
    const handleConsentChange = (event) => {
      setConsentStatus(event.detail.status);
    };

    window.addEventListener('cookieConsentChanged', handleConsentChange);

    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
    };
  }, []);

  const acceptCookies = () => {
    setCookieConsent(CookieConsentStatus.ACCEPTED);
    setConsentStatus(CookieConsentStatus.ACCEPTED);
  };

  const rejectCookies = () => {
    setCookieConsent(CookieConsentStatus.REJECTED);
    setConsentStatus(CookieConsentStatus.REJECTED);
  };

  const resetConsent = () => {
    clearCookieConsent();
    setConsentStatus(CookieConsentStatus.PENDING);
  };

  return {
    // Status
    consentStatus,
    isLoading,
    isPending: consentStatus === CookieConsentStatus.PENDING,
    isAccepted: consentStatus === CookieConsentStatus.ACCEPTED,
    isRejected: consentStatus === CookieConsentStatus.REJECTED,
    hasUserMadeChoice: hasUserMadeChoice(),
    
    // Actions
    acceptCookies,
    rejectCookies,
    resetConsent,
    
    // Convenience getters
    shouldShowBanner: consentStatus === CookieConsentStatus.PENDING,
    canUseAnalytics: consentStatus === CookieConsentStatus.ACCEPTED
  };
}
