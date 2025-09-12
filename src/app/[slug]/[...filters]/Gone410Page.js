import { NextResponse } from 'next/server';
import ExpiredOfferPage from './ExpiredOfferPage';

// Server Component for HTTP 410 Gone
export default function Gone410Page({ offer = null, countrySlug = '', isCountryEmpty = false, countryName = '', isHidden = false, contentType = 'offer' }) {
  // Render the ExpiredOfferPage UI, but ensure 410 status is set
  // Note: Next.js App Router only supports returning a Response with status from route handlers (not components),
  // so this component is meant to be imported and returned from the main page.js when needed.
  return <ExpiredOfferPage 
    offer={offer}
    embedded={false}
    countrySlug={countrySlug}
    isCountryEmpty={isCountryEmpty}
    countryName={countryName}
    isHidden={isHidden}
    contentType={contentType}
  />;
}
