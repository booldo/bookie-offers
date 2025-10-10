'use client';

import { useCookieConsent } from '../hooks/useCookieConsent';
import { trackCookieConsent, cleanupAnalytics } from '../lib/analytics';

export default function CookieSettings() {
  const { consentStatus, acceptCookies, rejectCookies, resetConsent, hasUserMadeChoice } = useCookieConsent();

  const handleAccept = () => {
    acceptCookies();
    trackCookieConsent('accepted');
  };

  const handleReject = () => {
    rejectCookies();
    trackCookieConsent('rejected');
    cleanupAnalytics();
  };

  const handleReset = () => {
    resetConsent();
    cleanupAnalytics();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 font-['General_Sans']">Cookie Settings</h2>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-4 font-['General_Sans']">
          Manage your cookie preferences below. You can change these settings at any time.
        </p>
        
        {hasUserMadeChoice && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-['General_Sans']">
              <strong>Current status:</strong> 
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                consentStatus === 'accepted' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {consentStatus === 'accepted' ? 'Cookies Accepted' : 'Cookies Rejected'}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Essential Cookies */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 font-['General_Sans']">Essential Cookies</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-['General_Sans']">
              Always Active
            </span>
          </div>
          <p className="text-sm text-gray-600 font-['General_Sans']">
            These cookies are necessary for the website to function and cannot be switched off. 
            They are usually only set in response to actions made by you.
          </p>
        </div>

        {/* Analytics Cookies */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 font-['General_Sans']">Analytics Cookies</h3>
            <span className={`px-2 py-1 text-xs rounded font-['General_Sans'] ${
              consentStatus === 'accepted' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            }`}>
              {consentStatus === 'accepted' ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-['General_Sans']">
            These cookies help us understand how visitors interact with our website by collecting 
            and reporting information anonymously.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <button
          onClick={handleAccept}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors font-['General_Sans']"
        >
          Accept All Cookies
        </button>
        <button
          onClick={handleReject}
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors font-['General_Sans']"
        >
          Reject All Cookies
        </button>
        {hasUserMadeChoice && (
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium rounded-lg transition-colors font-['General_Sans']"
          >
            Reset Preferences
          </button>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 font-['General_Sans']">
          <strong>Note:</strong> Rejecting cookies may affect your browsing experience and some features may not work properly.
        </p>
      </div>
    </div>
  );
}
