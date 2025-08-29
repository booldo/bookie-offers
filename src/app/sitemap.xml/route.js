import { NextResponse } from "next/server";
import { getAllSitemapEntries, getLandingPageSettings } from "../../sanity/lib/seo";
import { client } from "../../sanity/lib/client";

export async function GET() {
  try {
    const baseUrl = "https://bookie-offers.vercel.app";
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
        loc: `${baseUrl}/briefly`,
        lastmod: new Date().toISOString(),
        priority: "0.8"
      },
      {
        loc: `${baseUrl}/briefly/calculators`,
        lastmod: new Date().toISOString(),
        priority: "0.8"
      },

      {
        loc: `${baseUrl}/faq`,
        lastmod: new Date().toISOString(),
        priority: "0.7"
      }
    ];

    // Fetch additional static pages that should be in sitemap
    try {
      // Fetch About and Contact pages
      const [aboutPage, contactPage] = await Promise.all([
        client.fetch(`*[_type == "about" && !(_id in path("drafts.**"))][0]{ noindex, sitemapInclude, _updatedAt }`),
        client.fetch(`*[_type == "contact" && !(_id in path("drafts.**"))][0]{ noindex, sitemapInclude, _updatedAt }`)
      ]);

      // Add About page to sitemap if not hidden
      if (aboutPage && !aboutPage.noindex && aboutPage.sitemapInclude !== false) {
        urls.push({
          loc: `${baseUrl}/about`,
          lastmod: aboutPage._updatedAt ? new Date(aboutPage._updatedAt).toISOString() : new Date().toISOString(),
          priority: "0.7"
        });
      }

      // Add Contact page to sitemap if not hidden
      if (contactPage && !contactPage.noindex && contactPage.sitemapInclude !== false) {
        urls.push({
          loc: `${baseUrl}/contact`,
          lastmod: contactPage._updatedAt ? new Date(contactPage._updatedAt).toISOString() : new Date().toISOString(),
          priority: "0.7"
        });
      }

      // Fetch Landing page
      const landingPage = await client.fetch(`*[_type == "landingPage" && !(_id in path("drafts.**"))][0]{ defaultNoindex, defaultSitemapInclude, _updatedAt }`);

      // Add Landing page to sitemap if not hidden
      if (landingPage && !landingPage.defaultNoindex && landingPage.defaultSitemapInclude !== false) {
        urls.push({
          loc: `${baseUrl}/`,
          lastmod: landingPage._updatedAt ? new Date(landingPage._updatedAt).toISOString() : new Date().toISOString(),
          priority: "1.0"
        });
      }

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
              loc: `${baseUrl}/footer/${link.slug.current}`,
              lastmod: (link.updatedAt || link._updatedAt) ? new Date(link.updatedAt || link._updatedAt).toISOString() : new Date().toISOString(),
              priority: "0.6"
            });
          }
        });
      });

      // Fetch hamburger menu pages
      const hamburgerPages = await client.fetch(`*[_type == "hamburgerMenu" && isActive == true]{
        noindex,
        sitemapInclude,
        _updatedAt,
        updatedAt,
        additionalMenuItems[]{
          label,
          isActive,
          noindex,
          sitemapInclude,
          _updatedAt,
          updatedAt
        }
      }`);

      // Add hamburger menu pages to sitemap
      hamburgerPages.forEach(menu => {
        // Check if main menu is hidden
        if (!menu.noindex && menu.sitemapInclude !== false) {
          // Add main hamburger menu page
          urls.push({
            loc: `${baseUrl}/hamburger-menu/main`,
            lastmod: (menu.updatedAt || menu._updatedAt) ? new Date(menu.updatedAt || menu._updatedAt).toISOString() : new Date().toISOString(),
            priority: "0.6"
          });
        }
        
        // Add additional menu items
        menu.additionalMenuItems?.forEach(item => {
          if (item.isActive && item.label && !item.noindex && item.sitemapInclude !== false) {
            const slug = item.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            urls.push({
              loc: `${baseUrl}/hamburger-menu/${slug}`,
              lastmod: (item.updatedAt || item._updatedAt) ? new Date(item.updatedAt || item._updatedAt).toISOString() : new Date().toISOString(),
              priority: "0.6"
            });
          }
        });
      });

    } catch (error) {
      console.error('Error fetching additional static pages:', error);
    }

    // Process dynamic entries from Sanity
    
    // Debug logging
    console.log('Processing sitemap entries:', entries.length);
    console.log('Sample entries:', entries.slice(0, 3));
    
    const dynamicUrls = entries.map((entry) => {
      let path = "/";
      let isValid = true;
      let priority = "0.5";
      
      if (entry._type === "offers") {
        // For offers, use the country from the offer data
        const rawCountrySlug = entry.country?.slug;
        const countrySlug = typeof rawCountrySlug === 'string' ? rawCountrySlug : (rawCountrySlug?.current || 'ng');
        const offerSlug = typeof entry.slug === 'string' ? entry.slug : entry.slug?.current;
        if (!offerSlug) {
          console.warn('Offer missing slug:', entry);
          isValid = false;
        } else {
          path = `/${countrySlug}/offers/${offerSlug}`;
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
      
      // Debug logging for _updatedAt field
      if (!entry._updatedAt) {
        console.warn(`Entry missing _updatedAt:`, { _type: entry._type, slug: entry.slug, path });
      }
      
      return {
        loc: `${baseUrl}${path}`,
        lastmod: entry._updatedAt ? new Date(entry._updatedAt).toISOString() : undefined,
        priority: priority,
        sitemapInclude: entry.sitemapInclude,
        noindex: entry.noindex,
        nofollow: entry.nofollow,
        isValid: isValid
      };
    });

    // Filter out any invalid URLs and respect sitemapInclude settings
    const validDynamicUrls = dynamicUrls.filter(url => {
      if (!url.isValid) {
        console.warn('Filtered out invalid URL (missing slug):', url.loc);
        return false;
      }
      
      // Check if entry should be excluded from sitemap
      if (url.sitemapInclude === false) {
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
    const uniqueUrls = urls.filter((url, index, self) => 
      index === self.findIndex(u => u.loc === url.loc)
    );

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
<url><loc>https://bookie-offers.vercel.app</loc><priority>1.0</priority></url>
</urlset>`;
    
    return new NextResponse(fallbackXml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
      },
    });
  }
} 