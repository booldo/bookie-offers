import { client } from '../sanity/lib/client';

// Cache settings - Edge Runtime compatible (in-memory only)
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Use global variables that persist between requests but work in Edge Runtime
// The cache is stored in a variable outside the scope of any functions
// This ensures it persists between requests without using Node.js specific APIs
const goneCache = {}; // Simple in-memory cache for gone status checks

/**
 * Check gone status with caching to reduce API calls
 */
export async function checkGoneStatusWithCache(type, slug) {
  const cacheKey = `${type}:${slug}`;
  const now = Date.now();
  
  // Check cache first
  if (goneCache[cacheKey] && now - goneCache[cacheKey].timestamp < CACHE_TTL) {
    console.log('📦 Using cached gone status for:', cacheKey);
    return goneCache[cacheKey].data;
  }

  // If not in cache, check via the original function
  console.log('📦 Fetching gone status from Sanity for:', cacheKey);
  try {
    // Map type to Sanity fields if needed
    let query = '';
    if (type === 'offers') {
      query = `*[_type == "offers" && slug.current == $slug][0]{ title, bookmaker->{name}, expires, noindex, sitemapInclude }`;
    } else if (type === 'article') {
      query = `*[_type == "article" && slug.current == $slug][0]{ title, noindex, sitemapInclude }`;
    } else if (type === 'footer') {
      query = `*[_type == "footer" && isActive == true][0]{ bottomRowLinks{ links[]{ label, slug, content, noindex, sitemapInclude } } }`;
    } else if (type === 'page') {
      query = `*[_type == "page" && slug.current == $slug][0]{ title, noindex, sitemapInclude }`;
    } else {
      // Default: just check for noindex/sitemapInclude
      query = `*[_type == $type && slug.current == $slug][0]{ title, noindex, sitemapInclude }`;
    }
    
    const doc = await client.fetch(query, { type, slug });
    let result;
    
    if (!doc) {
      result = { shouldReturn410: true, doc: null };
    } 
    // Special handling for footer links (array)
    else if (type === 'footer') {
      const link = doc.bottomRowLinks?.links?.find(l => l?.slug?.current === slug);
      if (!link || link.noindex === true || link.sitemapInclude === false) {
        result = { shouldReturn410: true, doc: link };
      } else {
        result = { shouldReturn410: false, doc: link };
      }
    }
    else if (doc.noindex === true || doc.sitemapInclude === false) {
      result = { shouldReturn410: true, doc };
    } else {
      result = { shouldReturn410: false, doc };
    }
    
    // Save to cache
    goneCache[cacheKey] = {
      timestamp: now,
      data: result
    };
    
    return result;
  } catch (e) {
    console.error('Error checking gone status:', e);
    return { shouldReturn410: false, doc: null };
  }
}

/**
 * Cache for checking offer status - similarly to gone status
 */
export async function checkOfferStatusWithCache(countrySlug, offerSlug) {
  const cacheKey = `offer:${countrySlug}:${offerSlug}`;
  const now = Date.now();
  
  // Check cache first
  if (goneCache[cacheKey] && now - goneCache[cacheKey].timestamp < CACHE_TTL) {
    console.log('📦 Using cached offer status for:', cacheKey);
    return goneCache[cacheKey].data;
  }
  
  // If not in cache, check from Sanity
  console.log('📦 Fetching offer status from Sanity for:', cacheKey);
  try {
    const offerData = await client.fetch(`*[_type == "offers" && slug.current == $offerSlug][0]{
      title,
      bookmaker->{ name },
      expires,
      noindex,
      sitemapInclude
    }`, { offerSlug });

    const now = new Date();
    const isExpired = offerData?.expires ? new Date(offerData.expires) < now : false;
    const isHidden = offerData && (offerData.noindex === true || offerData.sitemapInclude === false);

    const result = {
      shouldReturn410: !offerData || isExpired || isHidden,
      offer: offerData ? {
        title: offerData.title,
        bookmaker: offerData.bookmaker?.name,
        expires: offerData.expires ? new Date(offerData.expires).toISOString().split('T')[0] : undefined
      } : null,
      isExpired,
      isHidden,
      countrySlug
    };
    
    // Save to cache
    goneCache[cacheKey] = {
      timestamp: now,
      data: result
    };
    
    return result;
  } catch (error) {
    console.error('Error checking offer status:', error);
    return { shouldReturn410: false };
  }
}

/**
 * Clear the gone status cache (useful for testing or when data changes)
 */
export function clearGoneCache() {
  // Clear the object properties instead of reassigning the object
  // This works with const declarations
  Object.keys(goneCache).forEach(key => delete goneCache[key]);
  console.log('📦 Gone status cache cleared');
}
