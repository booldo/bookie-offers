import { NextResponse } from "next/server";
import { getAllSitemapEntries, getLandingPageSettings } from "../../sanity/lib/seo";

export async function GET() {
  try {
    const baseUrl = "http://localhost:3000";
    const entries = await getAllSitemapEntries();
    const landingPage = await getLandingPageSettings();
    const extraUrls = landingPage?.sitemapExtraUrls || [];

    // Start with important static pages
    let urls = [
      {
        loc: `${baseUrl}/`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/briefly`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/briefly/calculators`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/about`,
        lastmod: new Date().toISOString(),
      },
      {
        loc: `${baseUrl}/contact`,
        lastmod: new Date().toISOString(),
      }
    ];

    // Process dynamic entries
    console.log('Processing sitemap entries:', entries.length);
    console.log('Sample entries:', entries.slice(0, 3));
    
    const dynamicUrls = entries.map((entry) => {
      let path = "/";
      let isValid = true;
      
      if (entry._type === "offers") {
        // For offers, use the country from the offer data
        const countrySlug = entry.country?.slug?.current || 'ng'; // Default to Nigeria if no country
        const offerSlug = entry.slug?.current;
        if (!offerSlug) {
          console.warn('Offer missing slug:', entry);
          isValid = false;
        } else {
          path = `/${countrySlug}/offers/${offerSlug}`;
        }
      } else if (entry._type === "article") {
        const articleSlug = entry.slug?.current;
        if (!articleSlug) {
          console.warn('Article missing slug:', entry);
          isValid = false;
        } else {
          path = `/briefly/${articleSlug}`;
        }
      } else if (entry._type === "banner") {
        const bannerSlug = entry.slug?.current;
        if (!bannerSlug) {
          console.warn('Banner missing slug:', entry);
          isValid = false;
        } else {
          path = `/banner/${bannerSlug}`;
        }
      } else if (entry._type === "faq") {
        const faqSlug = entry.slug?.current;
        if (!faqSlug) {
          console.warn('FAQ missing slug:', entry);
          isValid = false;
        } else {
          path = `/faq/${faqSlug}`;
        }
      } else if (entry._type === "calculator") {
        const calcSlug = entry.slug?.current;
        if (!calcSlug) {
          console.warn('Calculator missing slug:', entry);
          isValid = false;
        } else {
          path = `/briefly/calculator/${calcSlug}`;
        }
      } else if (entry._type === "affiliate") {
        // For affiliate links, use the pretty link with country
        const countrySlug = entry.countrySlug || 'ng'; // Default to Nigeria if no country
        const affiliateSlug = entry.slug?.current;
        if (!affiliateSlug) {
          console.warn('Affiliate missing slug:', entry);
          isValid = false;
        } else {
          path = `/${countrySlug}/${affiliateSlug}`;
        }
      } else if (entry._type === "filter") {
        // For filter pages, use the filter slug
        const filterSlug = entry.slug?.current;
        if (!filterSlug) {
          console.warn('Filter missing slug:', entry);
          isValid = false;
        } else {
          path = `/${filterSlug}`;
        }
      } else if (entry._type === "country") {
        // For country pages
        const countrySlug = entry.slug?.current;
        if (!countrySlug) {
          console.warn('Country missing slug:', entry);
          isValid = false;
        } else {
          path = `/${countrySlug}`;
        }
      }
      
      return {
        loc: `${baseUrl}${path}`,
        lastmod: entry._updatedAt ? new Date(entry._updatedAt).toISOString() : undefined,
        isValid: isValid
      };
    });

    // Filter out any invalid URLs
    const validDynamicUrls = dynamicUrls.filter(url => {
      if (!url.isValid) {
        console.warn('Filtered out invalid URL (missing slug):', url.loc);
        return false;
      }
      
      // Additional validation for malformed URLs
      const isValid = url.loc && 
        url.loc !== `${baseUrl}/` && 
        !url.loc.includes('undefined') &&
        !url.loc.includes('//') &&
        url.loc.length > baseUrl.length + 1;
      
      if (!isValid) {
        console.warn('Filtered out malformed URL:', url.loc);
      }
      
      return isValid;
    });

    // Add valid dynamic URLs
    urls = urls.concat(validDynamicUrls);
    
    // Add extra URLs
    urls = urls.concat((extraUrls || []).map((url) => ({ loc: url })));

    // Remove duplicates based on loc
    const uniqueUrls = urls.filter((url, index, self) => 
      index === self.findIndex(u => u.loc === url.loc)
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
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