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
    const query = `*[_type in ["offers","article","banner","faq","calculator"] && (sitemapInclude == true || !defined(sitemapInclude))]{
    _type,
    slug,
    _updatedAt,
    country->{
      slug
    }
  }`;
  
  // Also fetch affiliate links with pretty links
  const affiliateQuery = `*[_type == "affiliate" && isActive == true && prettyLink.current != null]{
    _type,
    prettyLink,
    bookmaker->{
      country->{
        slug
      }
    },
    _updatedAt
  }`;

    // Fetch country pages for basic filter URLs
    const countryQuery = `*[_type == "countryPage" && isActive == true]{
      slug,
      _updatedAt
    }`;

    // Fetch basic filter options (bonus types and bookmakers) with proper country reference
    const basicFiltersQuery = `{
    "bonusTypes": *[_type == "bonusType" && defined(country) && country->slug.current]{
      name,
      country->{
        slug
      },
      _updatedAt
    },
    "bookmakers": *[_type == "bookmaker" && defined(country) && country->slug.current]{
      name,
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
      _updatedAt: link._updatedAt
    }));

    // Generate basic filter entries (only the most important ones)
    const filterEntries = [];
    
    // Add country pages
    countries.forEach(country => {
      if (country.slug?.current) {
          filterEntries.push({
          _type: 'country',
          slug: country.slug.current,
          _updatedAt: country._updatedAt
          });
        }
      });

    // Add bonus type filter pages - only if country slug exists
    basicFilters.bonusTypes?.forEach(bonusType => {
      if (bonusType.name && bonusType.country?.slug?.current) {
          filterEntries.push({
            _type: 'filter',
          slug: `${bonusType.country.slug.current}/${bonusType.name.toLowerCase().replace(/\s+/g, '-')}`,
          countrySlug: bonusType.country.slug.current,
          _updatedAt: bonusType._updatedAt
          });
        }
      });

    // Add bookmaker filter pages - only if country slug exists
    basicFilters.bookmakers?.forEach(bookmaker => {
      if (bookmaker.name && bookmaker.country?.slug?.current) {
        filterEntries.push({
          _type: 'filter',
          slug: `${bookmaker.country.slug.current}/${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}`,
          countrySlug: bookmaker.country.slug.current,
          _updatedAt: bookmaker._updatedAt
        });
      }
    });
    
    // Filter out any entries with undefined or invalid slugs before returning
    const allEntries = [...entries, ...transformedAffiliateLinks, ...filterEntries];
    const validEntries = allEntries.filter(entry => 
      entry.slug && 
      (typeof entry.slug === 'string' ? entry.slug !== 'undefined' : entry.slug.current !== 'undefined')
    );
    
    return validEntries;
  } catch (error) {
    console.error('Error fetching sitemap entries:', error);
    // Fallback to basic query if complex one fails
    const fallbackQuery = `*[_type in ["offers","article","banner","faq","calculator"] && (sitemapInclude == true || !defined(sitemapInclude))]{
      _type,
      slug,
      _updatedAt,
      country->{
        slug
      }
    }`;
    return client.fetch(fallbackQuery);
  }
} 