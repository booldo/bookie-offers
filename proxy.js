import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper to generate the 410 Gone HTML response
function generate410Response() {
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

export async function proxy(request) {
  const { pathname, origin, search } = request.nextUrl;

  // 1. Skip middleware for static files and internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/.well-known') ||
    pathname === '/410' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Trailing Slash Redirect (SEO best practice)
  if (!pathname.endsWith('/') && pathname !== '/') {
    return NextResponse.redirect(`${origin}${pathname}/${search}`, 301);
  }

  // 3. Article bypass
  if (pathname.startsWith('/briefly/') && pathname !== '/briefly/') {
    return NextResponse.next();
  }

  try {
    // 4. Check Sanity for Redirects or 410s
    console.log(`🔍 Checking redirects for path: ${pathname}`);
    const redirectData = await checkRedirectWithFetch(pathname);
    console.log('➡️ Redirect Data:', redirectData);

    if (redirectData) {
      if (redirectData.type === '410') {
        return generate410Response();
        return { type: '410' };
      }

      let targetUrl = redirectData.url;
      // Treat /410 targets as actual 410 status
      if (targetUrl.endsWith('/410')) {
        return generate410Response();
      }

      // Normalize target URL
      if (targetUrl.startsWith('/')) {
        targetUrl = `${origin}${targetUrl}${search}`;
      }
      
      return NextResponse.redirect(targetUrl, redirectData.type === '302' ? 302 : 301);
    }

    // 5. Apply SEO Headers for specific paths (/offers/)
    const response = NextResponse.next();
    
    if (pathname.includes('/offers/')) {
      const segments = pathname.split('/').filter(Boolean);
      if (segments.length >= 2) {
        const country = segments[0]; 
        const slug = segments[segments.length - 1];

        // Apply SEO headers to the response object
        response.headers.set('X-Robots-Tag', 'noindex, follow');
      }
    }

    return response;

  } catch (error) {
    console.error('❌ Middleware Error:', error);
    return NextResponse.next();
  }
}

async function checkRedirectWithFetch(path) {
  try {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
    const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2025-07-13';
    
    if (!projectId || !dataset) return null;

    // Normalize path for query
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
    const pathWithSlash = normalizedPath + '/';


    const query = `*[_type == "redirects" && isActive == true && (
      (matchExact == true && sourcePath == $exactPath) ||
      (matchExact != true && (sourcePath == $path || sourcePath == $pathWithSlash))
    )][0] { targetUrl, redirectType }`;

    // Wrap the values in double quotes before encoding
const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}` +
    `&$path=${encodeURIComponent(`"${normalizedPath}"`)}` + 
    `&$pathWithSlash=${encodeURIComponent(`"${pathWithSlash}"`)}` + 
    `&$exactPath=${encodeURIComponent(`"${path}"`)}`;
    
    // const url = `https://${projectId}.apicdn.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}&$path=${encodeURIComponent(normalizedPath)}&$pathWithSlash=${encodeURIComponent(pathWithSlash)}&$exactPath=${encodeURIComponent(path)}`;
    
    const res = await fetch(url);
    console.log('🔍 Fetching Redirect from Sanity:', res);
    if (!res.ok) return null;
    
    const data = await res.json();
    const result = data.result;
    console.log('🔍 Redirect Query Result:', result);
    if (!result) return null;

    if (result.redirectType === '410') {
      return { type: '410' };
    }

    if (result.targetUrl) {
      return {
        url: result.targetUrl,
        type: result.redirectType || '301'
      };
    }
  } catch (e) {
    return null;
  }
  return null;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};