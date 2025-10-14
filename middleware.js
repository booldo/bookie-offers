import { NextResponse } from 'next/server';
import { checkRedirect } from './src/lib/redirects';
import { generate410Html, checkOfferStatus } from './src/lib/gone410';
import { checkGoneStatus } from './src/lib/checkGoneStatus';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files, API routes, and Studio
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/studio') ||
    pathname === '/410' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    console.log('🔍 Middleware checking path:', pathname);
    
    // For article paths (/briefly/*), completely skip redirect handling
    // Let Next.js handle routing naturally (including 404s)
    if (pathname.startsWith('/briefly/') && pathname !== '/briefly') {
      console.log('📝 Article path detected, skipping redirects and letting Next.js handle:', pathname);
      return NextResponse.next();
    }
    
    // Generic global 410 Gone logic for all dynamic content types
    const excludedRoutes = ['/briefly', '/briefly/calculators', '/faq', '/footer', '/analytics', '/robots.txt', '/sitemap.xml', '/sitemap-index.xml'];
    if (!excludedRoutes.includes(pathname)) {
      const dynamicPatterns = [
        { regex: /^\/footer\/([^\/]+)$/, type: 'footer' },
        { regex: /^\/([^\/]+)\/[^\/]+\/([^\/]+)$/, type: 'offers' }, // offer details
        { regex: /^\/([^\/]+)$/, type: 'countryPage' }, // country slugs like /ng
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
          const { shouldReturn410, doc } = await checkGoneStatus(type, slug);
          if (shouldReturn410) {
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
    }
    
    // For non-article paths, check redirects normally
    const redirect = await checkRedirect(pathname);
    
    if (redirect) {
      console.log('✅ Redirect found:', redirect);
      
      // If explicitly marked as 410, return a 410 response instead of redirecting
      if (redirect.type === '410') {
        const html = generate410Html({ isExpired: false, isHidden: true });
        return new Response(html, {
          status: 410,
          headers: { 'content-type': 'text/html; charset=utf-8' }
        });
      }

      // Construct proper redirect URL
      let targetUrl = redirect.url;
      if (targetUrl) {
        // Treat redirects pointing to the 410 page as true 410 responses
        const normalizedTarget = targetUrl.trim().toLowerCase();
        if (normalizedTarget === '/410' || normalizedTarget.endsWith('/410')) {
          const html = generate410Html({ isExpired: false, isHidden: true });
          return new Response(html, {
            status: 410,
            headers: { 'content-type': 'text/html; charset=utf-8' }
          });
        }
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
    } else {
      console.log('❌ No redirect found for:', pathname);
      
      // Check for offer pages that should return 410 status
      // Only runs if no redirect was found above
      // Exclude calculator URLs from 410 checks
      const offerPageMatch = pathname.match(/^\/([^\/]+)\/[^\/]+\/([^\/]+)$/);
      if (offerPageMatch && !pathname.includes('/calculator/')) {
        const [, countrySlug, offerSlug] = offerPageMatch;
        console.log('🔍 Checking offer for 410 status (no redirect found):', { countrySlug, offerSlug });
        
        const offerStatus = await checkOfferStatus(countrySlug, offerSlug);
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
    }
  } catch (error) {
    console.error('❌ Middleware redirect error:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


