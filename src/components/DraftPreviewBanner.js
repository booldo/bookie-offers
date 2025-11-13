import React from 'react';

export default function DraftPreviewBanner({ 
  draftData, 
  previewMode = 'full',
  onExitPreview 
}) {
  const {
    publishingStatus = 'draft',
    draftPreview = {},
    title = 'Untitled Offer'
  } = draftData || {};

  const { previewNotes, previewExpiry } = draftPreview;

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'review': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'published': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft': return '📝';
      case 'review': return '👀';
      case 'approved': return '✅';
      case 'published': return '🌐';
      case 'archived': return '🗄️';
      default: return '📄';
    }
  };

  const getPreviewModeLabel = (mode) => {
    switch (mode) {
      case 'full': return 'Full Preview';
      case 'minimal': return 'Minimal Preview';
      case 'mobile': return 'Mobile Preview';
      case 'desktop': return 'Desktop Preview';
      default: return 'Preview';
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔄</span>
              <span className="font-bold text-lg">DRAFT PREVIEW</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm opacity-90">Mode:</span>
              <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm font-medium">
                {getPreviewModeLabel(previewMode)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm opacity-90">Status:</span>
              <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusColor(publishingStatus)}`}>
                <span className="mr-1">{getStatusIcon(publishingStatus)}</span>
                {publishingStatus.charAt(0).toUpperCase() + publishingStatus.slice(1)}
              </span>
            </div>

            {previewNotes && (
              <div className="flex items-center space-x-2">
                <span className="text-sm opacity-90">Notes:</span>
                <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm max-w-xs truncate">
                  {previewNotes}
                </span>
              </div>
            )}

            {previewExpiry && (
              <div className="flex items-center space-x-2">
                <span className="text-sm opacity-90">Expires:</span>
                <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-sm">
                  {new Date(previewExpiry).toLocaleDateString('en-GB')}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-sm opacity-90">
              <span className="font-medium">Title:</span> {title}
            </div>
            
            <button
              onClick={onExitPreview}
              className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <span>❌</span>
              <span>Exit Preview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
