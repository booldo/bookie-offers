import { client } from '../sanity/lib/client';

// Check if a page should redirect and return the redirect URL if applicable
export async function checkRedirect(path) {
  try {
    console.log('🔍 Checking redirects for path:', path);
    
    // Normalize path: remove trailing slash for consistency
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
    const pathWithSlash = normalizedPath + '/';
    
    console.log('🛠️ Original path:', path);
    console.log('🛠️ Normalized path:', normalizedPath);
    console.log('🛠️ Path with slash:', pathWithSlash);
    
    // Check the centralized redirects collection
    // If matchExact is false (default), try both with and without trailing slash
    // If matchExact is true, only match the exact path
    const redirectQuery = `*[_type == "redirects" && isActive == true && (
      (matchExact == true && sourcePath == $exactPath) ||
      (matchExact != true && (sourcePath == $path || sourcePath == $pathWithSlash))
    )][0] {
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
    
    if (redirect?.redirectType === '410') {
      return { type: '410' };
    }
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
