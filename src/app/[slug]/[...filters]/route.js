import { NextResponse } from 'next/server';
import { client } from '../../../sanity/lib/client';

export async function GET(request, context) {
  const params = await context.params;
  const { slug, filters = [] } = params;
  const segments = Array.isArray(filters) ? filters : [filters];

  // Affiliate pretty link redirect logic
  if (segments.length > 0) {
    const fullPath = segments.join('/');
    const affiliateLink = await client.fetch(`*[_type == "affiliate" && isActive == true && prettyLink.current == $prettyLink][0]{ affiliateUrl }`, { prettyLink: fullPath });
    if (affiliateLink?.affiliateUrl) {
      return NextResponse.redirect(affiliateLink.affiliateUrl);
    }
    if (segments.length === 1) {
      const singleAffiliateLink = await client.fetch(`*[_type == "affiliate" && isActive == true && prettyLink.current == $prettyLink][0]{ affiliateUrl }`, { prettyLink: segments[0] });
      if (singleAffiliateLink?.affiliateUrl) {
        return NextResponse.redirect(singleAffiliateLink.affiliateUrl);
      }
    }
    if (segments.length === 2) {
      const bookmakerBonusTypeLink = await client.fetch(`*[_type == "affiliate" && isActive == true && prettyLink.current == $prettyLink][0]{ affiliateUrl }`, { prettyLink: segments.join('/') });
      if (bookmakerBonusTypeLink?.affiliateUrl) {
        return NextResponse.redirect(bookmakerBonusTypeLink.affiliateUrl);
      }
    }
  }

  // Offer 410 logic (expired/hidden/non-existent)
  if (segments.length >= 2) {
    const offerSlug = segments[segments.length - 1];
    const offerData = await client.fetch(`*[_type == "offers" && slug.current == $offerSlug][0]{ expires, noindex, sitemapInclude }`, { offerSlug });
    const now = new Date();
    const isExpired = offerData?.expires ? new Date(offerData.expires) < now : false;
    const isHidden = offerData && (offerData.noindex === true || offerData.sitemapInclude === false);
    if (!offerData || isExpired || isHidden) {
      return new Response("410 Gone", { status: 410 });
    }
  }

  // Default: allow to page.js for normal rendering
  return NextResponse.next();
}
