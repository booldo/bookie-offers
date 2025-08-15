import React from 'react';
import { useDraftPreview } from '../hooks/useDraftPreview';
import DraftPreviewBanner from './DraftPreviewBanner';

/**
 * Wrapper component that adds draft preview functionality to offer pages
 * 
 * @param {Object} props
 * @param {Object} props.offer - The published offer data
 * @param {React.ReactNode} props.children - The offer content to render
 * @param {string} props.previewMode - Override preview mode (optional)
 */
export default function OfferPreviewWrapper({ 
  offer, 
  children, 
  previewMode: overridePreviewMode 
}) {
  const {
    isPreview,
    draftData,
    previewMode,
    loading,
    error,
    exitPreview,
    getDisplayData
  } = useDraftPreview();

  // Get the data to display (draft or published)
  const displayData = getDisplayData(offer);
  
  // Use override preview mode if provided, otherwise use draft preview mode
  const currentPreviewMode = overridePreviewMode || previewMode;

  // Show loading state while fetching draft data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Show error state if draft loading failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Preview Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={exitPreview}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Exit Preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Show preview banner if in preview mode */}
      {isPreview && (
        <DraftPreviewBanner
          draftData={draftData}
          previewMode={currentPreviewMode}
          onExitPreview={exitPreview}
        />
      )}

      {/* Apply preview mode styles */}
      <div className={getPreviewModeStyles(currentPreviewMode)}>
        {/* Render the offer content with draft data */}
        {React.cloneElement(children, { 
          offer: displayData,
          isPreview,
          previewMode: currentPreviewMode
        })}
      </div>

      {/* Preview mode indicator for debugging */}
      {isPreview && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm z-50">
          Preview Mode: {currentPreviewMode}
          {draftData?._id && (
            <div className="text-xs opacity-75 mt-1">
              Draft ID: {draftData._id}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getPreviewModeStyles(previewMode) {
  switch (previewMode) {
    case 'minimal':
      return 'max-w-2xl mx-auto px-4';
    case 'mobile':
      return 'max-w-sm mx-auto px-4';
    case 'desktop':
      return 'max-w-6xl mx-auto px-4';
    case 'full':
    default:
      return 'max-w-4xl mx-auto px-4';
  }
}

export function withDraftPreview(Component) {
  return function WrappedComponent(props) {
    return (
      <OfferPreviewWrapper offer={props.offer}>
        <Component {...props} />
      </OfferPreviewWrapper>
    );
  };
}
