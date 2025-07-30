import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  trackClick, 
  getSessionId, 
  getCurrentPageUrl, 
  getReferrer, 
  getUserAgent, 
  getCountryFromPath,
  type ClickTrackingData 
} from '../sanity/lib/clickTracking';

export const useClickTracking = () => {
  const pathname = usePathname();

  const trackLinkClick = useCallback(async (
    linkId: string,
    linkType: 'offer' | 'bookmaker' | 'banner' | 'custom',
    linkUrl: string,
    linkTitle?: string
  ) => {
    const trackingData: ClickTrackingData = {
      linkId,
      linkType,
      linkUrl,
      linkTitle,
      country: getCountryFromPath(pathname),
      pageUrl: getCurrentPageUrl(),
      userAgent: getUserAgent(),
      referrer: getReferrer(),
      sessionId: getSessionId(),
    };

    await trackClick(trackingData);
  }, [pathname]);

  return { trackLinkClick };
}; 