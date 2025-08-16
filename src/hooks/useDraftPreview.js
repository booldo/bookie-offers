import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { client } from '../sanity/lib/client';

export const useDraftPreview = () => {
  const [searchParams] = useSearchParams();
  const router = useRouter();
  const [draftData, setDraftData] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('full');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if we're in preview mode
  useEffect(() => {
    const preview = searchParams.get('preview');
    const draftId = searchParams.get('draftId');
    
    if (preview === 'true' && draftId) {
      setIsPreview(true);
      fetchDraftData(draftId);
    } else {
      setIsPreview(false);
      setDraftData(null);
    }
  }, [searchParams]);

  // Fetch draft data
  const fetchDraftData = async (draftId) => {
    if (!draftId) return;

    setLoading(true);
    setError(null);

    try {
      const draft = await client.fetch(`
        *[_id == $draftId && _type == "offers"][0]{
          _id,
          _type,
          title,
          slug,
          country->{
            _id,
            country,
            slug
          },
          bonusType->{
            _id,
            name,
            description
          },
          bookmaker->{
            _id,
            name,
            logo,
            logoAlt,
            description,
            paymentMethods[]->{
              _id,
              name
            },
            license[]->{
              _id,
              name
            }
          },
          maxBonus,
          minDeposit,
          description,
          expires,
          published,
          affiliateLink->{
            _id,
            affiliateUrl,
            isActive,
            prettyLink
          },
          banner,
          bannerAlt,
          howItWorks,
          faq,
          offerSummary,
          metaTitle,
          metaDescription,
          draftPreview,
          publishingStatus
        }
      `, { draftId });

      if (draft) {
        setDraftData(draft);
        setPreviewMode(draft.draftPreview?.previewMode || 'full');
      } else {
        setError('Draft not found');
      }
    } catch (err) {
      console.error('Error fetching draft:', err);
      setError('Failed to load draft');
    } finally {
      setLoading(false);
    }
  };

  // Exit preview mode
  const exitPreview = () => {
    setIsPreview(false);
    setDraftData(null);
    setError(null);
    
    // Remove preview parameters from URL
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('preview');
    currentUrl.searchParams.delete('draftId');
    
    router.replace(currentUrl.pathname + currentUrl.search);
  };

  // Refresh draft data
  const refreshDraft = () => {
    if (draftData?._id) {
      fetchDraftData(draftData._id);
    }
  };

  // Get the data to display (draft or published)
  const getDisplayData = (publishedData) => {
    if (isPreview && draftData) {
      return {
        ...publishedData,
        ...draftData,
        _isDraft: true,
        _draftId: draftData._id
      };
    }
    return publishedData;
  };

  // Check if preview has expired
  const isPreviewExpired = () => {
    if (!draftData?.draftPreview?.previewExpiry) return false;
    
    const expiryDate = new Date(draftData.draftPreview.previewExpiry);
    return new Date() > expiryDate;
  };

  // Get preview status
  const getPreviewStatus = () => {
    if (!isPreview) return null;
    
    return {
      isPreview,
      previewMode,
      publishingStatus: draftData?.publishingStatus || 'draft',
      previewNotes: draftData?.draftPreview?.previewNotes,
      previewExpiry: draftData?.draftPreview?.previewExpiry,
      isExpired: isPreviewExpired()
    };
  };

  return {
    // State
    isPreview,
    draftData,
    previewMode,
    loading,
    error,
    
    // Actions
    exitPreview,
    refreshDraft,
    
    // Utilities
    getDisplayData,
    getPreviewStatus,
    isPreviewExpired
  };
};
