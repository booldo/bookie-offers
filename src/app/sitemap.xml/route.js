import { NextResponse } from "next/server";
import { getAllSitemapEntries, getLandingPageSettings } from "../../sanity/lib/seo";

export async function GET() {
  try {
    const baseUrl = "http://localhost:3000";
    const entries = await getAllSitemapEntries();
    const landingPage = await getLandingPageSettings();
    const extraUrls = landingPage?.sitemapExtraUrls || [];

    let urls = entries.map((entry) => {
      let path = "/";
      
      if (entry._type === "offers") {
        // For offers, use the country from the offer data
        const countrySlug = entry.country?.slug?.current || 'ng'; // Default to Nigeria if no country
        path = `/${countrySlug}/offers/${entry.slug?.current}`;
      } else if (entry._type === "article") {
        path = `/briefly/${entry.slug?.current}`;
      } else if (entry._type === "banner") {
        path = `/banner/${entry.slug?.current}`;
      } else if (entry._type === "faq") {
        path = `/faq/${entry.slug?.current}`;
      } else if (entry._type === "calculator") {
        path = `/briefly/calculator/${entry.slug?.current}`;
      } else if (entry._type === "affiliate") {
        // For affiliate links, use the pretty link with country
        const countrySlug = entry.countrySlug || 'ng'; // Default to Nigeria if no country
        path = `/${countrySlug}/${entry.slug?.current}`;
      } else if (entry._type === "filter") {
        // For filter pages, use the filter slug
        path = `/${entry.slug?.current}`;
      } else if (entry._type === "country") {
        // For country pages
        path = `/${entry.slug?.current}`;
      }
      
      return {
        loc: `${baseUrl}${path}`,
        lastmod: entry._updatedAt ? new Date(entry._updatedAt).toISOString() : undefined,
      };
    });
    
    // Add extra URLs
    urls = urls.concat((extraUrls || []).map((url) => ({ loc: url })));

    // Filter out any invalid URLs
    urls = urls.filter(url => url.loc && url.loc !== `${baseUrl}/`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
      (u) =>
        `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`
    )
    .join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    
    // Return a basic sitemap with just the homepage if there's an error
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>http://localhost:3000</loc></url>
</urlset>`;
    
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
} 