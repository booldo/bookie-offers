import { client } from './client';

export interface ClickTrackingData {
  linkId: string;
  linkType: 'offer' | 'bookmaker' | 'banner' | 'custom';
  linkUrl: string;
  linkTitle?: string;
  country?: string;
  pageUrl?: string;
  userAgent?: string;
  ipAddress?: string;
  referrer?: string;
  sessionId?: string;
}

export const trackClick = async (data: ClickTrackingData): Promise<void> => {
  try {
    // Create the click tracking document
    const clickData = {
      _type: 'clickTracking',
      linkId: data.linkId,
      linkType: data.linkType,
      linkUrl: data.linkUrl,
      linkTitle: data.linkTitle,
      country: data.country,
      pageUrl: data.pageUrl,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
      clickedAt: new Date().toISOString(),
      referrer: data.referrer,
      sessionId: data.sessionId,
    };

    // Send to Sanity
    await client.create(clickData);
    
    console.log('Click tracked successfully:', data.linkId);
  } catch (error) {
    console.error('Error tracking click:', error);
    // Don't throw error to avoid breaking user experience
  }
};

// Utility function to get session ID
export const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = sessionStorage.getItem('booldo_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('booldo_session_id', sessionId);
  }
  return sessionId;
};

// Utility function to get current page URL
export const getCurrentPageUrl = (): string => {
  if (typeof window === 'undefined') return '';
  return window.location.href;
};

// Utility function to get referrer
export const getReferrer = (): string => {
  if (typeof window === 'undefined') return '';
  return document.referrer;
};

// Utility function to get user agent
export const getUserAgent = (): string => {
  if (typeof window === 'undefined') return '';
  return navigator.userAgent;
};

// Helper function to determine country from pathname
export const getCountryFromPath = (pathname: string): string => {
  if (pathname.startsWith('/ng')) return 'Nigeria';
  if (pathname.startsWith('/gh')) return 'Ghana';
  return 'World Wide';
}; 