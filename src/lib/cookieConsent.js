// Simple cookie consent management utility

const COOKIE_CONSENT_KEY = 'booldo-cookie-consent';
const CONSENT_EXPIRY_DAYS = 365;

export const CookieConsentStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted', 
  REJECTED: 'rejected'
};

/**
 * Get the current cookie consent status
 * @returns {string} One of: 'pending', 'accepted', 'rejected'
 */
export function getCookieConsent() {
  if (typeof window === 'undefined') return CookieConsentStatus.PENDING;
  
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return CookieConsentStatus.PENDING;
    
    const data = JSON.parse(stored);
    
    // Check if consent has expired
    if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      return CookieConsentStatus.PENDING;
    }
    
    return data.status || CookieConsentStatus.PENDING;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return CookieConsentStatus.PENDING;
  }
}

/**
 * Set the cookie consent status
 * @param {string} status - 'accepted' or 'rejected'
 */
export function setCookieConsent(status) {
  if (typeof window === 'undefined') return;
  
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + CONSENT_EXPIRY_DAYS);
    
    const data = {
      status,
      timestamp: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    
    // Trigger custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
      detail: { status } 
    }));
  } catch (error) {
    console.error('Error setting cookie consent:', error);
  }
}

/**
 * Clear cookie consent (for testing or reset)
 */
export function clearCookieConsent() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.dispatchEvent(new CustomEvent('cookieConsentChanged', { 
      detail: { status: CookieConsentStatus.PENDING } 
    }));
  } catch (error) {
    console.error('Error clearing cookie consent:', error);
  }
}

/**
 * Check if cookies are accepted
 * @returns {boolean}
 */
export function areCookiesAccepted() {
  return getCookieConsent() === CookieConsentStatus.ACCEPTED;
}

/**
 * Check if user has made a choice (not pending)
 * @returns {boolean}
 */
export function hasUserMadeChoice() {
  return getCookieConsent() !== CookieConsentStatus.PENDING;
}
