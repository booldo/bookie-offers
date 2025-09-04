import { NextResponse } from 'next/server';
import { checkRedirect } from './lib/redirects';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  try {
    console.log('🔍 Middleware checking path:', pathname);
    
    // Check if this path should redirect
    const redirect = await checkRedirect(pathname);
    
    if (redirect) {
      console.log('✅ Redirect found:', redirect);
      
      // Construct proper redirect URL
      let targetUrl = redirect.url;
      
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
