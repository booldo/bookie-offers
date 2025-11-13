import { NextResponse } from 'next/server';
import { checkRedirect } from './lib/redirects';
import { generate410Html } from './lib/gone410';
import { checkGoneStatusWithCache, checkOfferStatusWithCache } from './lib/goneCache';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for excluded routes
  const excludedRoutes = ['/briefly', '/briefly/calculators', '/faq', '/footer', '/analytics', '/robots.txt', '/sitemap.xml', '/sitemap-index.xml'];
  if (excludedRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for redirects FIRST - using cached data
  // This ensures redirects take priority over 410 responses
  try {
    console.log('🔍 Checking for redirects:', pathname);
    const redirect = await checkRedirect(pathname);
    
    if (redirect) {
      // If explicitly marked as 410, return a 410 response
      if (redirect.type === '410') {
        try {
          const goneUrl = `${request.nextUrl.origin}/410`;
          const resp = await fetch(goneUrl, { headers: { 'x-internal-gone': '1' } });
          const html = await resp.text();
          return new Response(html, {
            status: 410,
            headers: { 'content-type': resp.headers.get('content-type') || 'text/html; charset=utf-8' }
          });
        } catch (e) {
          return new Response('<!doctype html><html><head><meta charset="utf-8"/><title>410 Gone</title><meta name="robots" content="noindex, nofollow"/></head><body><h1>410 Gone</h1><p>The requested resource is no longer available.</p></body></html>', {
            status: 410,
            headers: { 'content-type': 'text/html; charset=utf-8' }
          });
        }
      }
      
      // Construct proper redirect URL
      let targetUrl = redirect.url;
      if (targetUrl) {
        // If target URL is relative, make it absolute
        if (targetUrl.startsWith('/')) {
          targetUrl = `${request.nextUrl.origin}${targetUrl}`;
        } else if (!targetUrl.startsWith('http')) {
          targetUrl = `${request.nextUrl.origin}/${targetUrl}`;
        }

        console.log('🎯 Redirecting to:', targetUrl);
        
        // Perform redirect with the specified type
        const statusCode = redirect.type === '302' ? 302 : 301;
        return NextResponse.redirect(targetUrl, statusCode);
      }
      return null; // Explicit return if no URL
    }
    
    console.log('❌ No redirect found, proceeding to 410 check');
  } catch (error) {
    console.error('❌ Error checking redirects in middleware:', error);
  }

  // ✅ STEP 2: Check for 410 status ONLY if no redirect was found
  console.log('🔍 STEP 2: Checking for 410 status:', pathname);
  const dynamicPatterns = [
    // Removed article pattern to let Next.js handle 404s naturally
    // { regex: /^\/briefly\/([^\/]+)$/, type: 'article' },
    { regex: /^\/footer\/([^\/]+)$/, type: 'footer' },
    { regex: /^\/([^\/]+)\/[^\/]+\/([^\/]+)$/, type: 'offers' }, // offer details
    { regex: /^\/([^\/]+)$/, type: 'countryPage' }, // country slugs like /ng
    // Add more patterns as needed
  ];
  for (const { regex, type } of dynamicPatterns) {
    const match = pathname.match(regex);
    if (match) {
      // For offers, slug is in match[2], for others it's match[1]
      const slug = type === 'offers' ? match[2] : match[1];
      // Only run gone check for countryPage if slug is a valid country
      if (type === 'countryPage') {
        // Check if slug is a valid country
        const isValidCountry = await fetch(`${request.nextUrl.origin}/api/country-exists?slug=${slug}`).then(res => res.ok ? res.json() : { exists: false }).then(res => res.exists);
        if (!isValidCountry) {
          // Let the route handler return 404
          continue;
        }
      }
      const { shouldReturn410, doc } = await checkGoneStatusWithCache(type, slug);
      if (shouldReturn410) {
        console.log('✅ Returning 410 status (no redirect found)');
        const html = generate410Html({ offer: doc, isExpired: false, isHidden: true });
        return new Response(html, {
          status: 410,
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-cache, no-store, must-revalidate'
          }
        });
      }
    }
  }

  // Check for offer pages that should return 410 status
  // Only runs if no redirect was found above
  // Exclude calculator URLs from 410 checks
  const offerPageMatch = pathname.match(/^\/([^\/]+)\/[^\/]+\/([^\/]+)$/);
  if (offerPageMatch && !pathname.includes('/calculator/')) {
    const [, countrySlug, offerSlug] = offerPageMatch;
    console.log('🔍 Checking offer for 410 status (no redirect found):', { countrySlug, offerSlug });
    
    const offerStatus = await checkOfferStatusWithCache(countrySlug, offerSlug);
    if (offerStatus.shouldReturn410) {
      console.log('✅ Returning 410 status for offer:', offerSlug);
      const html = generate410Html(offerStatus);
      return new Response(html, {
        status: 410,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
  }

  // Handle 410 page with proper HTTP status
  if (pathname === '/410') {
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    // The actual 410 status will be set by the page component
    return response;
  }

  // We already checked for static files and API routes at the top
  // and already checked for redirects above
  
  // No additional redirect check needed here - removed duplicate code

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
