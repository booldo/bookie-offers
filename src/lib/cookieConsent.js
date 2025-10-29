// Simple cookie consent management utility (client + SSR-aware)

const COOKIE_CONSENT_KEY = 'booldo-cookie-consent'; // used for both cookie name and localStorage key
const CONSENT_EXPIRY_DAYS = 365;

export const CookieConsentStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted', 
  REJECTED: 'rejected'
};

// ----- Cookie helpers (client) -----
function setCookie(name, value, days) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  const path = '; path=/';
  const sameSite = '; samesite=lax';
  // No secure flag here by default to work on http in dev; servers in prod should add it
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value || '')}${expires}${path}${sameSite}`;
}

function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const nameEQ = encodeURIComponent(name) + '=';
  const ca = document.cookie ? document.cookie.split(';') : [];
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

function eraseCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; samesite=lax`;
}

/**
 * Get the current cookie consent status (client). Prefers HTTP cookie, then localStorage.
 * @returns {string} One of: 'pending', 'accepted', 'rejected'
 */
export function getCookieConsent() {
  if (typeof window === 'undefined') return CookieConsentStatus.PENDING;
  
  try {
    // 1) Try HTTP cookie first (server-readable)
    const cookieVal = getCookie(COOKIE_CONSENT_KEY);
    if (cookieVal === CookieConsentStatus.ACCEPTED || cookieVal === CookieConsentStatus.REJECTED) {
      return cookieVal;
    }

    // 2) Fallback to localStorage (legacy)
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return CookieConsentStatus.PENDING;
    
    const data = JSON.parse(stored);
    
    // Check if consent has expired
    if (data.expiresAt && new Date() > new Date(data.expiresAt)) {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      eraseCookie(COOKIE_CONSENT_KEY);
      return CookieConsentStatus.PENDING;
    }
    
    return data.status || CookieConsentStatus.PENDING;
  } catch (error) {
    console.error('Error reading cookie consent:', error);
    return CookieConsentStatus.PENDING;
  }
}

/**
 * Set the cookie consent status (client). Writes both cookie and localStorage.
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
    
    // Write cookie (source of truth for SSR)
    setCookie(COOKIE_CONSENT_KEY, status, CONSENT_EXPIRY_DAYS);

    // Keep localStorage for richer metadata and backwards compatibility
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
    eraseCookie(COOKIE_CONSENT_KEY);
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

// ----- SSR helpers -----
/**
 * Get consent on the server using next/headers cookies().
 * Safe to call only in a server context (RSC, route handlers, etc.).
 */
export function getCookieConsentServer() {
  try {
    // Lazy import to avoid adding next/headers to client bundle
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { cookies } = require('next/headers');
    const c = cookies();
    const value = c.get(COOKIE_CONSENT_KEY)?.value;
    return value === CookieConsentStatus.ACCEPTED || value === CookieConsentStatus.REJECTED
      ? value
      : CookieConsentStatus.PENDING;
  } catch (_e) {
    return CookieConsentStatus.PENDING;
  }
}

/**
 * Get consent from a raw Cookie header string (e.g., in middleware).
 * @param {string|undefined} cookieHeader
 */
export function getCookieConsentFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return CookieConsentStatus.PENDING;
  try {
    const parts = cookieHeader.split(';');
    for (const part of parts) {
      const [rawName, ...rest] = part.trim().split('=');
      if (decodeURIComponent(rawName) === COOKIE_CONSENT_KEY) {
        const value = decodeURIComponent(rest.join('='));
        return value === CookieConsentStatus.ACCEPTED || value === CookieConsentStatus.REJECTED
          ? value
          : CookieConsentStatus.PENDING;
      }
    }
  } catch (_e) {}
  return CookieConsentStatus.PENDING;
}
