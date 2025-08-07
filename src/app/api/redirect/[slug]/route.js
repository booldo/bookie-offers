import { NextResponse } from 'next/server';
import { client } from '../../../../sanity/lib/client';

export async function GET(request, { params }) {
  try {
    const { slug } = params;
    
    // Fetch the offer by slug to get the affiliate link
    const query = `*[_type == "offers" && slug.current == $slug][0]{
      _id,
      title,
      affiliateLink->{
        _id,
        name,
        affiliateUrl,
        isActive
      }
    }`;
    
    const offer = await client.fetch(query, { slug });
    
    if (!offer || !offer.affiliateLink?.affiliateUrl || !offer.affiliateLink?.isActive) {
      return NextResponse.redirect(new URL('/ng', request.url));
    }
    
    // Redirect to the affiliate URL
    return NextResponse.redirect(offer.affiliateLink.affiliateUrl);
    
  } catch (error) {
    console.error('Redirect error:', error);
    return NextResponse.redirect(new URL('/ng', request.url));
  }
} 