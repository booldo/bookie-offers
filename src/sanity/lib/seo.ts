import { client } from './client';

export async function getLandingPageSettings() {
  const query = `*[_type == "landingPage"][0]{
    robotsTxt,
    sitemapExtraUrls,
    defaultMetaTitle,
    defaultMetaDescription,
    defaultNoindex,
    defaultNofollow,
    defaultCanonicalUrl,
    defaultSitemapInclude,
    blogPageTitle,
    calculatorPageTitle,
    mostSearches
  }`;
  return client.fetch(query);
}

export async function getPageSeo(type, slug) {
  // type: 'offer', 'article', etc. slug: string or object
  const query = `*[_type == $type && slug.current == $slug][0]{
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl,
    sitemapInclude
  }`;
  return client.fetch(query, { type, slug });
}

export async function getAllSitemapEntries() {
  try {
    // Fetch all docs with sitemapInclude != false, including country and bonusType info for offers
    const query = `*[_type in ["offers","article","banner","faq","calculator"] && (sitemapInclude == true || !defined(sitemapInclude)) && (isActive == true || !defined(isActive))]{
      _type,
      slug,
      _updatedAt,
      sitemapInclude,
      noindex,
      nofollow,
      country->{
        slug
      },
      bonusType->{
        name
      }
    }`;
  
    // Also fetch affiliate links with pretty links
    const affiliateQuery = `*[_type == "affiliate" && isActive == true && prettyLink.current != null && (sitemapInclude == true || !defined(sitemapInclude))]{
      _type,
      prettyLink,
      sitemapInclude,
      noindex,
      nofollow,
      bookmaker->{
        country->{
          slug
        }
      },
      _updatedAt
    }`;

    // Fetch country pages for basic filter URLs
    const countryQuery = `*[_type == "countryPage" && isActive == true && (sitemapInclude == true || !defined(sitemapInclude))]{
      slug,
      sitemapInclude,
      noindex,
      nofollow,
      _updatedAt
    }`;

    // Fetch basic filter options (bonus types and bookmakers) with proper country reference
    const basicFiltersQuery = `{
      "bonusTypes": *[_type == "bonusType" && (isActive == true || !defined(isActive)) && (sitemapInclude == true || !defined(sitemapInclude))]{
        name,
        slug,
        sitemapInclude,
        noindex,
        nofollow,
        country->{
          slug
        },
        _updatedAt
      },
      "bookmakers": *[_type == "bookmaker" && (isActive == true || !defined(isActive)) && (sitemapInclude == true || !defined(sitemapInclude))]{
        name,
        slug,
        sitemapInclude,
        noindex,
        nofollow,
        country->{
          slug
        },
        _updatedAt
      }
    }`;
    
    const [entries, affiliateLinks, countries, basicFilters] = await Promise.all([
      client.fetch(query),
      client.fetch(affiliateQuery),
      client.fetch(countryQuery),
      client.fetch(basicFiltersQuery)
    ]);


    
    // Transform affiliate links to match the expected format
    const transformedAffiliateLinks = affiliateLinks.map(link => ({
      _type: 'affiliate',
      slug: link.prettyLink,
      countrySlug: link.bookmaker?.country?.slug?.current,
      sitemapInclude: link.sitemapInclude,
      noindex: link.noindex,
      nofollow: link.nofollow,
      _updatedAt: link._updatedAt
    }));

    // Generate basic filter entries (only the most important ones)
    const filterEntries = [];
    
    // Add country pages
    countries.forEach(country => {
      if (country.slug?.current) {
        filterEntries.push({
          _type: 'country',
          slug: { current: country.slug.current },
          sitemapInclude: country.sitemapInclude,
          noindex: country.noindex,
          nofollow: country.nofollow,
          _updatedAt: country._updatedAt
        });
      }
    });

    // Add bonus type filter pages - only if slug exists
    basicFilters.bonusTypes?.forEach(bonusType => {
      if (bonusType.slug?.current) {
        filterEntries.push({
          _type: 'filter',
          slug: { current: bonusType.slug.current },
          countrySlug: bonusType.country?.slug?.current,
          sitemapInclude: bonusType.sitemapInclude,
          noindex: bonusType.noindex,
          nofollow: bonusType.nofollow,
          _updatedAt: bonusType._updatedAt
        });
      }
    });

    // Add bookmaker filter pages - only if slug exists
    basicFilters.bookmakers?.forEach(bookmaker => {
      if (bookmaker.slug?.current) {
        filterEntries.push({
          _type: 'filter',
          slug: { current: bookmaker.slug.current },
          countrySlug: bookmaker.country?.slug?.current,
          sitemapInclude: bookmaker.sitemapInclude,
          noindex: bookmaker.noindex,
          nofollow: bookmaker.nofollow,
          _updatedAt: bookmaker._updatedAt
        });
      }
    });
    
    // Filter out any entries with undefined or invalid slugs before returning
    const allEntries = [...entries, ...transformedAffiliateLinks, ...filterEntries];
    
    const validEntries = allEntries.filter(entry => 
      entry.slug && 
      (typeof entry.slug === 'string' ? entry.slug !== 'undefined' : entry.slug.current !== 'undefined') &&
      // Only include entries that should be in sitemap
      (entry.sitemapInclude === true || !entry.sitemapInclude) &&
      // Exclude entries marked as noindex
      !entry.noindex
    );
    
    return validEntries;
  } catch (error) {
    console.error('Error fetching sitemap entries:', error);
    // Fallback to basic query if complex one fails
    const fallbackQuery = `*[_type in ["offers","article","banner","faq","calculator"] && (sitemapInclude == true || !defined(sitemapInclude)) && !noindex]{
      _type,
      slug,
      sitemapInclude,
      noindex,
      nofollow,
      _updatedAt,
      country->{
        slug
      },
      bonusType->{
        name
      }
    }`;
    return client.fetch(fallbackQuery);
  }
} 