import { redirect } from 'next/navigation';
import { client } from '../../../sanity/lib/client';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const draftId = searchParams.get('draftId');

  // Check the secret
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  if (!draftId) {
    return new Response('Missing draftId parameter', { status: 400 });
  }

  try {
    // Fetch minimal draft data needed for preview URL construction
    const draft = await client.fetch(`
      *[_id == $draftId][0]{
        _id,
        _type,
        slug,
        country->{ slug },
        bonusType->{ slug },
        draftPreview
      }
    `, { draftId });

    if (!draft) {
      return new Response('Draft not found', { status: 404 });
    }

    // Check if preview has expired
    if (draft.draftPreview?.previewExpiry) {
      const expiryDate = new Date(draft.draftPreview.previewExpiry);
      if (new Date() > expiryDate) {
        return new Response('Preview has expired', { status: 410 });
      }
    }

    // Build preview URL based on document type
    let previewUrl;
    
    switch (draft._type) {
      case 'offers':
        const countrySlug = draft.country?.slug?.current;
        const bonusTypeSlug = draft.bonusType?.slug?.current;
        const offerSlug = draft.slug?.current;
        
        if (!countrySlug || !bonusTypeSlug || !offerSlug) {
          return new Response('Missing required slugs for offer', { status: 400 });
        }
        
        previewUrl = `/${countrySlug}/${bonusTypeSlug}/${offerSlug}?preview=true&draftId=${draftId}`;
        break;
        
      case 'article':
        if (!draft.slug?.current) {
          return new Response('Missing slug for article', { status: 400 });
        }
        previewUrl = `/briefly/${draft.slug.current}?preview=true&draftId=${draftId}`;
        break;
        
      case 'countryPage':
        if (!draft.slug?.current) {
          return new Response('Missing slug for country page', { status: 400 });
        }
        previewUrl = `/${draft.slug.current}?preview=true&draftId=${draftId}`;
        break;
        
      default:
        return new Response(`Preview not supported for type: ${draft._type}`, { status: 400 });
    }

    // Redirect to the preview page with query params
    redirect(previewUrl);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return new Response('Error fetching draft', { status: 500 });
  }
}
