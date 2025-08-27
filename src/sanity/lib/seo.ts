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
    defaultSitemapInclude
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
    // Fetch all docs with sitemapInclude != false, including country info for offers
    const query = `*[_type in ["offers","article","banner","faq","calculator"] && (sitemapInclude == true || !defined(sitemapInclude)) && (isActive == true || !defined(isActive))]{
      _type,
      slug,
      _updatedAt,
      sitemapInclude,
      noindex,
      nofollow,
      country->{
        slug
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
      "bonusTypes": *[_type == "bonusType"]{
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
      "bookmakers": *[_type == "bookmaker"]{
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

    // Debug logging
    console.log('Sitemap entries fetched:', {
      offers: entries.filter(e => e._type === 'offers').length,
      articles: entries.filter(e => e._type === 'article').length,
      banners: entries.filter(e => e._type === 'banner').length,
      faqs: entries.filter(e => e._type === 'faq').length,
      calculators: entries.filter(e => e._type === 'calculator').length,
      total: entries.length
    });
    
    console.log('Filter entries:', {
      bonusTypes: basicFilters.bonusTypes?.length || 0,
      bookmakers: basicFilters.bookmakers?.length || 0,
      countries: countries.length
    });
    
    // Debug the actual data fetched
    console.log('Basic filters data:', {
      bonusTypes: basicFilters.bonusTypes?.slice(0, 2) || [],
      bookmakers: basicFilters.bookmakers?.slice(0, 2) || []
    });
    
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
    console.log('Processing bonus types:', basicFilters.bonusTypes?.length || 0);
    basicFilters.bonusTypes?.forEach(bonusType => {
      console.log('Bonus type:', { name: bonusType.name, slug: bonusType.slug, country: bonusType.country?.slug?.current });
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
    console.log('Processing bookmakers:', basicFilters.bookmakers?.length || 0);
    basicFilters.bookmakers?.forEach(bookmaker => {
      console.log('Bookmaker:', { name: bookmaker.name, slug: bookmaker.slug, country: bookmaker.country?.slug?.current });
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
    
    // Debug logging for all entries
    console.log('All entries before filtering:', {
      total: allEntries.length,
      byType: allEntries.reduce((acc, entry) => {
        acc[entry._type] = (acc[entry._type] || 0) + 1;
        return acc;
      }, {})
    });
    
    const validEntries = allEntries.filter(entry => 
      entry.slug && 
      (typeof entry.slug === 'string' ? entry.slug !== 'undefined' : entry.slug.current !== 'undefined') &&
      // Only include entries that should be in sitemap
      (entry.sitemapInclude === true || !entry.sitemapInclude)
    );
    
    console.log('Valid entries after filtering:', {
      total: validEntries.length,
      byType: validEntries.reduce((acc, entry) => {
        acc[entry._type] = (acc[entry._type] || 0) + 1;
        return acc;
      }, {})
    });
    
    return validEntries;
  } catch (error) {
    console.error('Error fetching sitemap entries:', error);
    // Fallback to basic query if complex one fails
    const fallbackQuery = `*[_type in ["offers","article","banner","faq","calculator"] && (sitemapInclude == true || !defined(sitemapInclude))]{
      _type,
      slug,
      sitemapInclude,
      noindex,
      nofollow,
      _updatedAt,
      country->{
        slug
      }
    }`;
    return client.fetch(fallbackQuery);
  }
} 