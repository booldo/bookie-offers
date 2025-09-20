import { NextResponse } from "next/server";
import { getLandingPageSettings } from "../../sanity/lib/seo";

export async function GET() {
  try {
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
Sitemap: https://bookie-offers-weld.vercel.app/sitemap.xml
Sitemap: https://bookie-offers-weld.vercel.app/sitemap-index.xml`;

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
Sitemap: https://bookie-offers-weld.vercel.app/sitemap.xml
Sitemap: https://bookie-offers-weld.vercel.app/sitemap-index.xml`;

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  }
}