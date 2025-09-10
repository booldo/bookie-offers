import { NextResponse } from 'next/server';
import { checkRedirect } from './lib/redirects';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname === '/410' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // --- 410 Gone logic for expired/hidden offers ---
  // Match dynamic offer routes like /gh/free-bet/offer-slug
  const match = /^\/([^/]+)\/(.+)$/.exec(pathname);
  if (match) {
    const offerSlug = match[2].split('/').pop();
    try {
      const { client } = await import("./sanity/lib/client");
      const offerData = await client.fetch(
        `*[_type == "offers" && slug.current == $offerSlug][0]{ expires, noindex, sitemapInclude }`,
        { offerSlug }
      );
      const now = new Date();
      const isExpired = offerData?.expires ? new Date(offerData.expires) < now : false;
      const isHidden = offerData && (offerData.noindex === true || offerData.sitemapInclude === false);
      if (!offerData || isExpired || isHidden) {
        const ua = request.headers.get('user-agent') || '';
        const isBot = /bot|crawl|slurp|spider|bing|duckduckgo|baidu|yandex/i.test(ua);
        if (isBot) {
          // Serve /410 page with 410 status
          const goneUrl = `${request.nextUrl.origin}/410`;
          const resp = await fetch(goneUrl, { headers: { 'x-internal-gone': '1' } });
          const html = await resp.text();
          return new Response(html, {
            status: 410,
            headers: { 'content-type': resp.headers.get('content-type') || 'text/html; charset=utf-8' }
          });
        } else {
          // Rewrite users to /410 (UI only, status will be 200)
          return NextResponse.rewrite(new URL('/410', request.url));
        }
      }
    } catch (e) {
      // If error fetching offer, fall through
    }
  }

  try {
    console.log('🔍 Middleware checking path:', pathname);
    
    // Check if this path should redirect
    const redirect = await checkRedirect(pathname);
    
    if (redirect) {
      console.log('✅ Redirect found:', redirect);
      
      // If explicitly marked as 410, return a 410 response instead of redirecting
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
    } else {
      console.log('❌ No redirect found for:', pathname);
    }
  } catch (error) {
    console.error('❌ Middleware redirect error:', error);
  }

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
