import { checkRedirectFromCache } from './redirectCache';

// Check if a page should redirect and return the redirect URL if applicable
export async function checkRedirect(path) {
  try {
    console.log('🔍 Checking redirects for path:', path);
    
    // Use cached redirects data instead of querying Sanity directly
    const redirect = await checkRedirectFromCache(path);
    
    if (redirect) {
      console.log('✅ Redirect found from cache:', redirect);
      return redirect;
    }
    
    console.log('❌ No redirect found for path:', path);
    return null;
  } catch (error) {
    console.error('❌ Error checking redirects:', error);
    return null;
  }
}
