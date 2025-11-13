import { client } from '../sanity/lib/client';

// Cache settings
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Server-side cache for redirects (in-memory only for Edge compatibility)
let memoryCache = null;
let lastFetchTime = 0;

/**
 * Get all redirects with caching
 */
export async function getAllRedirects() {
  const now = Date.now();
  
  // Check memory cache first
  if (memoryCache && now - lastFetchTime < CACHE_TTL) {
    console.log('📦 Using in-memory redirects cache');
    return memoryCache;
  }

  // Fetch from Sanity if no valid cache
  try {
    console.log('📦 Fetching all redirects from Sanity (server-side)');
    const allRedirects = await client.fetch(`
      *[_type == "redirects" && isActive == true] {
        "id": _id,
        sourcePath,
        targetUrl,
        redirectType,
        matchExact,
        isActive
      }
    `);

    // Save to memory cache only (Edge compatible)
    memoryCache = allRedirects;
    lastFetchTime = now;
    
    return allRedirects;
  } catch (error) {
    console.error('Error fetching redirects from Sanity:', error);
    return [];
  }
}

/**
 * Check if a path should redirect using the cached redirects data
 */
export async function checkRedirectFromCache(path) {
  try {
    const redirects = await getAllRedirects();
    
    if (!redirects || redirects.length === 0) {
      return null;
    }

    // Normalize path: remove trailing slash for consistency unless it's root
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
    const pathWithSlash = normalizedPath + '/';
    
    console.log('🔍 Checking paths for redirects:', {
      original: path,
      normalized: normalizedPath,
      withSlash: pathWithSlash
    });
    
    // Find matching redirect
    const redirect = redirects.find(r => {
      if (r.matchExact === true) {
        return r.sourcePath === path;
      } else {
        return r.sourcePath === normalizedPath || r.sourcePath === pathWithSlash;
      }
    });

    if (!redirect) return null;
    
    // Handle 410 type explicitly
    if (redirect.redirectType === '410') {
      return { type: '410' };
    }

    // Handle normal redirects
    if (redirect.targetUrl) {
      return {
        url: redirect.targetUrl,
        type: redirect.redirectType || '301'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking redirect from cache:', error);
    return null;
  }
}

// No file-based caching functions in Edge runtime
