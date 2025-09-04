import { client } from '../sanity/lib/client';

// Check if a page should redirect and return the redirect URL if applicable
export async function checkRedirect(path) {
  try {
    console.log('🔍 Checking redirects for path:', path);
    
    // Check the centralized redirects collection
    const redirectQuery = `*[_type == "redirects" && sourcePath == $path && isActive == true][0] {
      targetUrl,
      redirectType
    }`;
    
    console.log('📝 Executing query:', redirectQuery);
    const redirect = await client.fetch(redirectQuery, { path });
    console.log('📊 Query result:', redirect);
    
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
