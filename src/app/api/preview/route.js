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
    console.log('🔍 Preview API called with:', { secret: secret ? '***' : 'missing', draftId });
    
    // Normalize draftId - handle both formats: "drafts.offer-123" and "drafts.123"
    let normalizedDraftId = draftId;
    if (!normalizedDraftId.startsWith('drafts.')) {
      normalizedDraftId = `drafts.${normalizedDraftId}`;
    }
    
    console.log('🔍 Normalized draftId:', normalizedDraftId);
    
    // First, let's see what drafts exist in Sanity - try multiple query approaches
    const allDrafts1 = await client.fetch(`*[_id in path("drafts.**")] | order(_createdAt desc)[0...10] { _id, _type, title }`);
    console.log('📄 All drafts (path query):', allDrafts1.map(d => ({ _id: d._id, _type: d._type, title: d.title })));
    
    const allDrafts2 = await client.fetch(`*[_id match "drafts.*"] | order(_createdAt desc)[0...10] { _id, _type, title }`);
    console.log('📄 All drafts (match query):', allDrafts2.map(d => ({ _id: d._id, _type: d._type, title: d.title })));
    
    const allOffers = await client.fetch(`*[_type == "offers"] | order(_createdAt desc)[0...10] { _id, _type, title }`);
    console.log('📄 All offers (any status):', allOffers.map(d => ({ _id: d._id, _type: d._type, title: d.title })));
    
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
    `, { draftId: normalizedDraftId });

    console.log('📄 Draft found:', draft ? { _id: draft._id, _type: draft._type, slug: draft.slug?.current } : 'null');

    if (!draft) {
      console.log('❌ Draft not found in Sanity for draftId:', normalizedDraftId);
      console.log('🔍 Check if the ID exists with different format...');
      
      // Try searching by just the ID without drafts prefix
      const publishedVersion = await client.fetch(`*[_id == $id][0] { _id, _type }`, { id: normalizedDraftId.replace('drafts.', '') });
      console.log('📄 Published version found:', publishedVersion ? { _id: publishedVersion._id, _type: publishedVersion._type } : 'null');
      
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
