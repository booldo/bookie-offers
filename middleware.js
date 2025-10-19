import { NextResponse } from 'next/server';

// Edge Runtime configuration for proper middleware execution
export const runtime = 'edge';

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
    
    // For non-article paths, check redirects using native fetch (Edge Runtime compatible)
    const redirect = await checkRedirectWithFetch(pathname);
    
    if (redirect) {
      console.log('✅ Redirect found:', redirect);
      
      // If explicitly marked as 410, return a 410 response instead of redirecting
      if (redirect.type === '410') {
        const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>410 Gone</title>
    <style>
      body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background:#fafbfc; color:#111827; }
      .container { max-width: 72rem; margin: 0 auto; padding: 1.5rem; min-height: 100vh; display:flex; flex-direction:column; }
      .main { flex:1; display:flex; align-items:center; justify-content:center; }
      .card { text-align:center; }
      .iconWrap { width: 6rem; height: 6rem; margin: 0 auto 1rem; background:#fee2e2; border-radius:9999px; display:flex; align-items:center; justify-content:center; }
      .h1 { font-size: 3rem; font-weight:700; color:#dc2626; margin: 0 0 0.75rem; }
      .h2 { font-size: 1.5rem; font-weight:600; margin: 0 0 1rem; }
      .p { color:#4b5563; margin: 0 0 2rem; }
      .btn { display:inline-flex; align-items:center; gap:.5rem; background:#16a34a; color:white; padding:.75rem 1.25rem; border-radius:.5rem; text-decoration:none; font-weight:600; }
      .btn:hover { background:#15803d; }
      .muted { margin-top:2rem; font-size:.875rem; color:#6b7280; }
      svg { color:#dc2626; }
    </style>
  </head>
  <body>
    <div class="container">
      <main class="main">
        <div class="card">
          <div class="iconWrap">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div class="h1">410</div>
          <div class="h2">Content No Longer Available</div>
          <p class="p">This resource has been intentionally removed and is no longer accessible.</p>
          <a class="btn" href="/">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Go Home
          </a>
          <div class="muted">If you believe this is an error, please contact support.</div>
        </div>
      </main>
    </div>
  </body>
</html>`;
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
          const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>410 Gone</title>
    <style>
      body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; background:#fafbfc; color:#111827; }
      .container { max-width: 72rem; margin: 0 auto; padding: 1.5rem; min-height: 100vh; display:flex; flex-direction:column; }
      .main { flex:1; display:flex; align-items:center; justify-content:center; }
      .card { text-align:center; }
      .iconWrap { width: 6rem; height: 6rem; margin: 0 auto 1rem; background:#fee2e2; border-radius:9999px; display:flex; align-items:center; justify-content:center; }
      .h1 { font-size: 3rem; font-weight:700; color:#dc2626; margin: 0 0 0.75rem; }
      .h2 { font-size: 1.5rem; font-weight:600; margin: 0 0 1rem; }
      .p { color:#4b5563; margin: 0 0 2rem; }
      .btn { display:inline-flex; align-items:center; gap:.5rem; background:#16a34a; color:white; padding:.75rem 1.25rem; border-radius:.5rem; text-decoration:none; font-weight:600; }
      .btn:hover { background:#15803d; }
      .muted { margin-top:2rem; font-size:.875rem; color:#6b7280; }
      svg { color:#dc2626; }
    </style>
  </head>
  <body>
    <div class="container">
      <main class="main">
        <div class="card">
          <div class="iconWrap">
            <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div class="h1">410</div>
          <div class="h2">Content No Longer Available</div>
          <p class="p">This resource has been intentionally removed and is no longer accessible.</p>
          <a class="btn" href="/">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Go Home
          </a>
          <div class="muted">If you believe this is an error, please contact support.</div>
        </div>
      </main>
    </div>
  </body>
</html>`;
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
    }
  } catch (error) {
    console.error('❌ Middleware redirect error:', error);
  }

  return NextResponse.next();
}

// Inline redirect check using native fetch API (100% Edge Runtime compatible)
// This avoids importing Sanity client which has Node.js dependencies
async function checkRedirectWithFetch(path) {
  try {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-07-13';
    
    if (!projectId || !dataset) {
      console.error('❌ Missing Sanity environment variables');
      return null;
    }

    // GROQ query to find active redirects for this path
    const query = `*[_type == "redirects" && sourcePath == $path && isActive == true][0] {
      targetUrl,
      redirectType
    }`;
    
    // Use Sanity HTTP API directly with native fetch
    const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}&$path=${encodeURIComponent(path)}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.error('❌ Sanity API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    const redirect = data.result;
    
    if (redirect?.redirectType === '410') {
      return { type: '410' };
    }
    if (redirect?.targetUrl) {
      return {
        url: redirect.targetUrl,
        type: redirect.redirectType || '301'
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error checking redirects:', error);
    return null;
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


