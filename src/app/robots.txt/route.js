import { NextResponse } from "next/server";
import { getLandingPageSettings } from "../../sanity/lib/seo";
export const dynamic = "force-dynamic";
export async function GET(request) {
  try {
    // Check if this is a staging environment
    const host = request.headers.get('host') || '';
    const isStaging = host.includes('vercel.app') || 
                     host.includes('staging') || 
                     process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging' ||
                     process.env.VERCEL_ENV === 'preview';

    // If staging, block all crawlers
    if (isStaging) {
      const stagingRobotsContent = `User-agent: *
Disallow: /`;
      
      return new NextResponse(stagingRobotsContent, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
        },
      });
    }

    const landingPage = await getLandingPageSettings();

    // Default comprehensive robots.txt content
    const defaultRobotsContent = `User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /studio/
Disallow: /api/
Disallow: /admin/
Disallow: /_next/

# Allow crawling of main content
Allow: /briefly/
Allow: /footer/
Allow: /faq/

# Sitemaps
Sitemap: https://booldo.com/sitemap.xml
Sitemap: https://booldo.com/sitemap-index.xml`;

    // Use custom content from Sanity if available, otherwise use default
    const robotsContent = landingPage?.robotsTxt || defaultRobotsContent;

    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching robots.txt:', error);

    // Fallback robots.txt content
    const fallbackContent = `User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /studio/
Disallow: /api/
Disallow: /admin/
Disallow: /_next/

# Allow crawling of main content
Allow: /briefly/
Allow: /footer/
Allow: /faq/

# Sitemaps
Sitemap: https://booldo.com/sitemap.xml
Sitemap: https://booldo.com/sitemap-index.xml`;

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }
}