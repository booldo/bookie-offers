import { NextResponse } from "next/server";
import { getLandingPageSettings } from "../../sanity/lib/seo";

export async function GET() {
  try {
    const landingPage = await getLandingPageSettings();
    const robotsContent = landingPage?.robotsTxt || `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://yourdomain.com/sitemap.xml
Sitemap: https://yourdomain.com/sitemap-index.xml`;

    return new NextResponse(robotsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    // Fallback robots.txt content
    const fallbackContent = `User-agent: *
Allow: /

# Sitemaps
Sitemap: https://yourdomain.com/sitemap.xml
Sitemap: https://yourdomain.com/sitemap-index.xml`;

    return new NextResponse(fallbackContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
} 