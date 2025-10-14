'use client';

import { useCookieConsent } from '../hooks/useCookieConsent';
import { trackCookieConsent } from '../lib/analytics';

export default function CookieBanner() {
  const { shouldShowBanner, acceptCookies, rejectCookies, isLoading } = useCookieConsent();

  // Don't render anything while loading or if user has already made a choice
  if (isLoading || !shouldShowBanner) {
    return null;
  }

  const handleAccept = () => {
    acceptCookies();
    trackCookieConsent('accepted');
  };

  const handleReject = () => {
    rejectCookies();
    trackCookieConsent('rejected');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Cookie message */}
          <div className="flex-1">
            <p className="text-sm text-gray-700 font-['General_Sans']">
              We use cookies to improve your browsing experience, analyze site traffic, and personalize content. 
              <span className="hidden sm:inline"> By continuing to use our site, you consent to our use of cookies.</span>
            </p>
            <p className="text-xs text-gray-500 mt-1 font-['General_Sans']">
              <a 
                href="/privacy" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Learn more in our Privacy Policy
              </a>
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={handleReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-['General_Sans'] w-full sm:w-auto"
            >
              Reject All
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors font-['General_Sans'] w-full sm:w-auto"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
