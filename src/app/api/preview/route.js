import { redirect } from 'next/navigation';
import { client } from '../../../sanity/lib/client';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const slug = searchParams.get('slug');
  const country = searchParams.get('country');
  const draftId = searchParams.get('draftId');

  // Check the secret and next parameters
  if (secret !== process.env.SANITY_PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  if (!slug || !country || !draftId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  try {
    // Fetch the draft document
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

    // Redirect to the preview page with draft data
    const previewUrl = `/${country}/offers/${slug}?preview=true&draftId=${draftId}`;
    redirect(previewUrl);
  } catch (error) {
    console.error('Error fetching draft:', error);
    return new Response('Error fetching draft', { status: 500 });
  }
}
