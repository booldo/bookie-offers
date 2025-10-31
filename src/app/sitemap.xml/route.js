import { NextResponse } from "next/server";
import { getAllSitemapEntries, getLandingPageSettings } from "../../sanity/lib/seo";
import { client } from "../../sanity/lib/client";

export async function GET() {
  try {
    const baseUrl = "https://booldo.com";
    const entries = await getAllSitemapEntries();
    const landingPage = await getLandingPageSettings();
    const extraUrls = landingPage?.sitemapExtraUrls || [];

    // Start with important static pages - these should ALWAYS be in sitemap
    let urls = [
      {
        loc: `${baseUrl}/`,
        lastmod: new Date().toISOString(),
        priority: "1.0"
      },
      {
        loc: `${baseUrl}/briefly/`,
        lastmod: new Date().toISOString(),
        priority: "0.8"
      },
      {
        loc: `${baseUrl}/briefly/calculators/`,
        lastmod: new Date().toISOString(),
        priority: "0.8"
      },

      {
        loc: `${baseUrl}/faq/`,
        lastmod: new Date().toISOString(),
        priority: "0.7"
      }
    ];

    // Fetch additional static pages that should be in sitemap
    try {
      // Fetch footer pages
      const footerPages = await client.fetch(`*[_type == "footer" && isActive == true]{
        bottomRowLinks{
          links[]{
            slug,
            isActive,
            noindex,
            sitemapInclude,
            _updatedAt,
            updatedAt
          }
        }
      }`);

      // Add footer pages to sitemap
      footerPages.forEach(footer => {
        footer.bottomRowLinks?.links?.forEach(link => {
          if (link.isActive && link.slug?.current && !link.noindex && link.sitemapInclude !== false) {
            urls.push({
              loc: `${baseUrl}/footer/${link.slug.current}/`,
              lastmod: (link.updatedAt || link._updatedAt) ? new Date(link.updatedAt || link._updatedAt).toISOString() : new Date().toISOString(),
              priority: "0.6"
            });
          }
        });
      });

      // Fetch hamburger menu pages
      const hamburgerPages = await client.fetch(`*[_type == "hamburgerMenu"]{
        noindex,
        sitemapInclude,
        _updatedAt,
        updatedAt,
        slug
      }`);
      
      console.log('Fetched hamburger menu pages:', hamburgerPages.length);
      console.log('Hamburger menu pages data:', JSON.stringify(hamburgerPages, null, 2));

      // Add hamburger menu pages to sitemap
      hamburgerPages.forEach(menu => {
        console.log('Processing hamburger menu:', {
          slug: menu.slug,
          noindex: menu.noindex,
          sitemapInclude: menu.sitemapInclude
        });
        
        // Check if main menu should be included in sitemap
        const shouldInclude = !menu.noindex && (menu.sitemapInclude === true || menu.sitemapInclude === undefined);
        console.log('Should include in sitemap:', shouldInclude);
        
        if (shouldInclude) {
          // Add main hamburger menu page
          urls.push({
            loc: `${baseUrl}/hamburger-menu/main/`,
            lastmod: (menu.updatedAt || menu._updatedAt) ? new Date(menu.updatedAt || menu._updatedAt).toISOString() : new Date().toISOString(),
            priority: "0.6"
          });

          // Add the top-level Menu Page at /[slug]
          const menuSlug = typeof menu.slug === 'string' ? menu.slug : menu.slug?.current;
          console.log('Menu slug extracted:', menuSlug);
          if (menuSlug) {
            const menuUrl = `${baseUrl}/${menuSlug}/`;
            console.log('Adding menu URL to sitemap:', menuUrl);
            urls.push({
              loc: menuUrl,
              lastmod: (menu.updatedAt || menu._updatedAt) ? new Date(menu.updatedAt || menu._updatedAt).toISOString() : new Date().toISOString(),
              priority: "0.6"
            });
          } else {
            console.log('No valid slug found for menu:', menu);
          }
        }
      });

    } catch (error) {
      console.error('Error fetching additional static pages:', error);
    }

    // Fetch bookmakers with content for sitemap
    try {
      const bookmakersWithContent = await client.fetch(`
        *[_type == "bookmaker" && (
          (defined(comparison) && count(comparison) > 0) || 
          (defined(faqs) && count(faqs) > 0)
        ) && (noindex != true) && (sitemapInclude != false)]{
          slug,
          _updatedAt,
          country->{slug}
        }
      `);

      console.log('Fetched bookmakers with content:', bookmakersWithContent.length);

      // Add bookmaker pages to sitemap
      bookmakersWithContent.forEach(bookmaker => {
        if (bookmaker.slug?.current) {
          urls.push({
            loc: `${baseUrl}/${bookmaker.slug.current}/`,
            lastmod: bookmaker._updatedAt ? new Date(bookmaker._updatedAt).toISOString() : new Date().toISOString(),
            priority: "0.7"
          });
        }
      });
    } catch (error) {
      console.error('Error fetching bookmakers with content:', error);
    }

    // Process dynamic entries from Sanity
    
    const dynamicUrls = entries.map((entry) => {
      let path = "/";
      let isValid = true;
      let priority = "0.5";
      
      if (entry._type === "offers") {
        // For offers, use the correct URL structure: /{countrySlug}/{bonusTypeSlug}/{offerSlug}
        const rawCountrySlug = entry.country?.slug;
        const countrySlug = typeof rawCountrySlug === 'string' ? rawCountrySlug : (rawCountrySlug?.current || 'ng');
        const offerSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        const bonusTypeName = entry.bonusType?.name;
        
        if (!offerSlug || !bonusTypeName) {
          console.warn('Offer missing slug or bonusType:', entry);
          isValid = false;
        } else {
          // Convert bonus type name to slug format (lowercase, replace spaces with hyphens)
          const bonusTypeSlug = bonusTypeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          path = `/${countrySlug}/${bonusTypeSlug}/${offerSlug}`;
          priority = "0.8"; // Offers are high priority
        }
      } else if (entry._type === "article") {
        const articleSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!articleSlug) {
          console.warn('Article missing slug:', entry);
          isValid = false;
        } else {
          path = `/briefly/${articleSlug}`;
          priority = "0.7"; // Articles are medium-high priority
        }
      } else if (entry._type === "banner") {
        const bannerSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!bannerSlug) {
          console.warn('Banner missing slug:', entry);
          isValid = false;
        } else {
          path = `/banner/${bannerSlug}`;
          priority = "0.6";
        }
      } else if (entry._type === "faq") {
        const faqSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!faqSlug) {
          console.warn('FAQ missing slug:', entry);
          isValid = false;
        } else {
          path = `/faq/${faqSlug}`;
          priority = "0.6";
        }
      } else if (entry._type === "calculator") {
        const calcSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!calcSlug) {
          console.warn('Calculator missing slug:', entry);
          isValid = false;
        } else {
          path = `/briefly/calculator/${calcSlug}`;
          priority = "0.7"; // Calculators are medium-high priority
        }
      } else if (entry._type === "affiliate") {
        // For affiliate links, use the pretty link with country
        const countrySlug = entry.countrySlug || 'ng'; // Default to Nigeria if no country
        const affiliateSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!affiliateSlug) {
          console.warn('Affiliate missing slug:', entry);
          isValid = false;
        } else {
          path = `/${countrySlug}/${affiliateSlug}`;
          priority = "0.8"; // Affiliate links are high priority
        }
      } else if (entry._type === "filter") {
        // For filter pages (bookmaker/bonus-type), use the filter slug directly
        const filterSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!filterSlug || filterSlug === 'undefined') {
          console.warn('Filter missing or invalid slug:', entry);
          isValid = false;
        } else {
          path = `/${filterSlug}`;
          priority = "0.7"; // Filter pages are medium-high priority
        }
      } else if (entry._type === "country") {
        // For country pages
        const countrySlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!countrySlug) {
          console.warn('Country missing slug:', entry);
          isValid = false;
        } else {
          path = `/${countrySlug}`;
          priority = "0.9"; // Country pages are very high priority
        }
      }
      

      
      // Add trailing slash for consistency (except for root path)
      const urlPath = path === '/' ? path : `${path}/`;
      
      return {
        loc: `${baseUrl}${urlPath}`,
        lastmod: entry._updatedAt ? new Date(entry._updatedAt).toISOString() : undefined,
        priority: priority,
        sitemapInclude: entry.sitemapInclude,
        noindex: entry.noindex,
        nofollow: entry.nofollow,
        isValid: isValid
      };
    });

    // Filter out any invalid URLs and respect sitemapInclude and noindex settings
    const validDynamicUrls = dynamicUrls.filter(url => {
      if (!url.isValid) {
        console.warn('Filtered out invalid URL (missing slug):', url.loc);
        return false;
      }
      
      // Check if entry should be excluded from sitemap
      if (url.sitemapInclude === false) {
        return false;
      }
      
      // Check if entry is marked as noindex
      if (url.noindex === true) {
        return false;
      }
      
      // Additional validation for malformed URLs
      let isValid = false;
      try {
        const parsed = new URL(url.loc);
        const hasDoubleSlashInPath = parsed.pathname.includes('//');
        isValid = Boolean(url.loc) && 
          parsed.href !== `${baseUrl}/` &&
        !url.loc.includes('undefined') &&
          !hasDoubleSlashInPath &&
          parsed.pathname.length > 1;
      } catch (e) {
        isValid = false;
      }
      
      if (!isValid) {
        console.warn('Filtered out malformed URL:', url.loc);
      }
      
      return isValid;
    });

    // Add valid dynamic URLs
    urls = urls.concat(validDynamicUrls);
    
    // Add extra URLs from landing page settings
    urls = urls.concat((extraUrls || []).map((url) => ({ 
      loc: url,
      priority: "0.5"
    })));

    // Remove duplicates based on loc
    const uniqueUrls = urls
      .filter((url, index, self) => index === self.findIndex(u => u.loc === url.loc));

    console.log('Total URLs in sitemap:', uniqueUrls.length);
    console.log('Hamburger menu URLs:', uniqueUrls.filter(url => url.loc.includes('/hamburger-menu/') || url.loc.includes('/stack') || url.loc.includes('/about')).map(url => url.loc));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls
    .map(
      (u) =>
        `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}${u.priority ? `<priority>${u.priority}</priority>` : ""}</url>`
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
<url><loc>https://booldo.com/</loc><priority>1.0</priority></url>
</urlset>`;
    
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
} 