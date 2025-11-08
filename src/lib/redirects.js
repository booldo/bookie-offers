import { client } from '../sanity/lib/client';

// In-memory cache for redirects
let redirectCache = [];
let lastCacheUpdateTime = 0;
// const CACHE_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_LIFETIME_MS = 60 * 60 * 1000; // 1 hour

/**
 * Fetches all active redirects from Sanity and populates the cache.
 * @returns {Promise<Array>} A promise that resolves to an array of redirect objects.
 */
async function fetchAndPopulateRedirectCache() {
  console.log('🔄 Fetching all active redirects from Sanity to populate cache...');
  const allRedirectsQuery = `*[_type == "redirects" && isActive == true] {
    sourcePath,
    targetUrl,
    redirectType,
    matchExact
  }`;
  try {
    const redirects = await client.fetch(allRedirectsQuery);
    redirectCache = redirects;
    lastCacheUpdateTime = Date.now();
    console.log(`✅ Redirect cache populated with ${redirects.length} entries.`);
    return redirects;
  } catch (error) {
    console.error('❌ Error fetching all redirects for cache:', error);
    // On error, don't clear existing cache, but log the error.
    return redirectCache; // Return existing cache if fetch fails
  }
}

/**
 * Ensures the redirect cache is up-to-date.
 * Forces a refresh if the cache is old or empty.
 */
async function ensureRedirectCacheFresh() {
  if (redirectCache.length === 0 || (Date.now() - lastCacheUpdateTime) > CACHE_LIFETIME_MS) {
    await fetchAndPopulateRedirectCache();
  }
}

/**
 * Finds a redirect match in the in-memory cache for a given sourcePath.
 * This now returns the full redirect object, including its redirectType.
 * @param {string} path - The path to look up as a sourcePath.
 * @param {Array} redirects - The array of redirect objects from the cache.
 * @returns {Object|null} The matching redirect object, or null if not found.
 */

// function findRedirectEntryForSourcePath(path, redirects) {
//   const normalizedPath =
//     path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
//   const pathWithSlash = normalizedPath + '/';
//   return redirects.find((redirect) => {
//     const { sourcePath, targetUrl, matchExact } = redirect;

//     if (matchExact) {
//       return sourcePath === path || targetUrl === path;
//     }
//     const matchesSource =
//       sourcePath === normalizedPath || sourcePath === pathWithSlash;
//     const matchesTarget =
//       targetUrl === normalizedPath || targetUrl === pathWithSlash;

//     return matchesSource || matchesTarget;
//   });
// }

function findRedirectEntryForSourcePath(path, redirects) {
  const normalizedPath =
    path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
  const pathWithSlash = normalizedPath + '/';

  return redirects.find((redirect) => {
    const { sourcePath, targetUrl, matchExact, redirectType } = redirect;

    // 🟢 Match 410s on both source and target
    if (redirectType === '410') {
      const match410 =
        sourcePath === path ||
        targetUrl === path ||
        sourcePath === normalizedPath ||
        sourcePath === pathWithSlash ||
        targetUrl === normalizedPath ||
        targetUrl === pathWithSlash;

      if (match410) return true;
    }

    // 🔵 Match others (301, 302, etc.) only on sourcePath
    if (matchExact) {
      return sourcePath === path;
    }

    return sourcePath === normalizedPath || sourcePath === pathWithSlash;
  });
}



// Check if a page should redirect and return the redirect URL if applicable
export async function checkRedirect(path, redirectCount = 0) {
  const MAX_REDIRECTS = 5; // To prevent infinite loops in memory

  if (redirectCount > MAX_REDIRECTS) {
    console.warn(`⚠️ Max redirect limit (${MAX_REDIRECTS}) exceeded for path: ${path}. Possible loop detected.`);
    return null;
  }

  try {
    await ensureRedirectCacheFresh(); // Ensure cache is ready and fresh

    console.log(`🔍 Checking redirects for path: '${path}' (attempt ${redirectCount + 1})`);

    // Lookup in the in-memory cache for a redirect entry where `path` is the sourcePath
    const redirectEntry = findRedirectEntryForSourcePath(path, redirectCache);
    console.log('📊 Cache lookup result for sourcePath:', redirectEntry);

    // --- CRUCIAL: Check if the *current path itself* is marked as a 410 ---
    if (redirectEntry?.redirectType === '410') {
      console.log(`⚠️ Source path '${path}' is directly configured as a 410 (Gone).`);
      return { type: '410' };
    }

    // If it's not a direct 410, but has a target URL, proceed to check the target
    if (redirectEntry?.targetUrl) {
      console.log(`➡️ Found redirect target: ${redirectEntry.targetUrl}`);

      // Recursively call checkRedirect for the targetUrl, using the cache
      const targetRedirectStatus = await checkRedirect(redirectEntry.targetUrl, redirectCount + 1);

      if (targetRedirectStatus?.type === '410') {
        // If the target URL eventually leads to a 410,
        // we should serve a 410 for the *original* requested path.
        console.log(`⚠️ Target URL '${redirectEntry.targetUrl}' ultimately leads to a 410. Serving 410 for '${path}'.`);
        return { type: '410' };
      } else if (targetRedirectStatus?.url) {
        // If the target URL redirects further, use that final destination
        console.log(`🔄 Target URL '${redirectEntry.targetUrl}' redirects further to '${targetRedirectStatus.url}'.`);
        return {
          url: targetRedirectStatus.url,
          type: targetRedirectStatus.type || '301' // Use the type from the final redirect
        };
      } else {
        // If the target URL doesn't redirect further and isn't a 410,
        // then the original redirect is valid.
        console.log(`✅ Redirect found and target is valid: ${redirectEntry.targetUrl}`);
        return {
          url: redirectEntry.targetUrl,
          type: redirectEntry.redirectType || '301'
        };
      }
    }

    console.log('❌ No redirect found for path:', path);
    return null;
  } catch (error) {
    console.error('❌ Error checking redirects:', error);
    return null;
  }
}