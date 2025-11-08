// import { client } from '../sanity/lib/client';

// // Check if a page should redirect and return the redirect URL if applicable
// export async function checkRedirect(path) {
//   try {
//     console.log('🔍 Checking redirects for path:', path);
    
//     // Normalize path: remove trailing slash for consistency
//     const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
//     const pathWithSlash = normalizedPath + '/';
    
//     console.log('🛠️ Original path:', path);
//     console.log('🛠️ Normalized path:', normalizedPath);
//     console.log('🛠️ Path with slash:', pathWithSlash);
    
//     // Check the centralized redirects collection
//     // If matchExact is false (default), try both with and without trailing slash
//     // If matchExact is true, only match the exact path
//     const redirectQuery = `*[_type == "redirects" && isActive == true && (
//       (matchExact == true && sourcePath == $exactPath) ||
//       (matchExact != true && (sourcePath == $path || sourcePath == $pathWithSlash))
//     )][0] {
//       targetUrl,
//       redirectType,
//       matchExact
//     }`;
    
//     console.log('📝 Executing query:', redirectQuery);
//     const redirect = await client.fetch(redirectQuery, { 
//       path: normalizedPath, 
//       pathWithSlash: pathWithSlash,
//       exactPath: path
//     });
//     console.log('📊 Query result:', redirect);
    
//     if (redirect?.redirectType === '410') {
//       return { type: '410' };
//     }
//     if (redirect?.targetUrl) {
//       console.log('✅ Redirect found:', redirect);
//       return {
//         url: redirect.targetUrl,
//         type: redirect.redirectType || '301'
//       };
//     }
    
//     console.log('❌ No redirect found for path:', path);
//     return null;
//   } catch (error) {
//     console.error('❌ Error checking redirects:', error);
//     return null;
//   }
// }

// import { client } from '../sanity/lib/client'

// // Simple in-memory cache (resets on redeploy)
// const redirectCache = new Map()
// const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// export async function checkRedirect(path) {
//   try {
//     // Normalize paths
//     const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path
//     const pathWithSlash = normalizedPath + '/'

//     // Check cache first
//     const cacheKey = normalizedPath
//     const cached = redirectCache.get(cacheKey)
//     if (cached && Date.now() - cached.time < CACHE_TTL) {
//       return cached.data
//     }

//     const redirectQuery = `*[_type == "redirects" && isActive == true && (
//       (matchExact == true && sourcePath == $exactPath) ||
//       (matchExact != true && (sourcePath == $path || sourcePath == $pathWithSlash))
//     )][0] {
//       targetUrl,
//       redirectType,
//       matchExact
//     }`
//     console.log('🧩 Fetching redirect from Sanity for:', path)

//     const redirect = await client.fetch(redirectQuery, {
//       path: normalizedPath,
//       pathWithSlash,
//       exactPath: path
//     })
    
//     // Store in cache (even null results to prevent redundant calls)
//     redirectCache.set(cacheKey, { time: Date.now(), data: redirect || null })

//     if (redirect?.redirectType === '410') {
//       return { type: '410' }
//     }

//     console.log(redirect, 'redirect to see');

//     if (redirect?.targetUrl) {
//       return {
//         url: redirect.targetUrl,
//         type: redirect.redirectType || '301'
//       }
//     }

//     return null
//   } catch (error) {
//     console.error('❌ Error in checkRedirect:', error)
//     return null
//   }
// }

// import { client } from '../sanity/lib/client';

// Check if a page should redirect and return the redirect URL or 410 if applicable
export async function checkRedirect(path) {
  try {
    console.log('🔍 Checking redirects for path:', path);

    // Normalize path: remove trailing slash for consistency
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
    const pathWithSlash = normalizedPath + '/';

    console.log('🛠️ Original path:', path);
    console.log('🛠️ Normalized path:', normalizedPath);
    console.log('🛠️ Path with slash:', pathWithSlash);

    // Combined GROQ query: check both sourcePath and targetUrl
    const redirectQuery = `*[_type == "redirects" && isActive == true && (
      // Match by sourcePath
      (matchExact == true && sourcePath == $exactPath) ||
      (matchExact != true && (sourcePath == $path || sourcePath == $pathWithSlash)) ||

      // OR match by targetUrl
      targetUrl == $exactPath || targetUrl == $path || targetUrl == $pathWithSlash
    )][0] {
      sourcePath,
      targetUrl,
      redirectType,
      matchExact
    }`;

    console.log('📝 Executing query:', redirectQuery);
    const redirect = await client.fetch(redirectQuery, {
      path: normalizedPath,
      pathWithSlash: pathWithSlash,
      exactPath: path
    });

    console.log('📊 Query result:', redirect);

    // Handle 410 status (gone)
    if (redirect?.redirectType === '410') {
      return { type: '410' };
    }

    // Handle redirect URL
    if (redirect?.targetUrl) {
      console.log('✅ Redirect found:', redirect);
      return {
        url: redirect.targetUrl,
        type: redirect.redirectType || '301'
      };
    }

    console.log('❌ No redirect found for path:', path);
    return null;

  } catch (error) {
    console.error('❌ Error checking redirects:', error);
    return null;
  }
}
