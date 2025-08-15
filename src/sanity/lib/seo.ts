import { client } from './client';

export async function getSeoSettings() {
  const query = `*[_type == "seoSettings"][0]{
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
  // Fetch all docs with sitemapInclude != false, including country info for offers
  const query = `*[_type in ["offers","article","banner","faq"] && (sitemapInclude == true || !defined(sitemapInclude))]{
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

  // Fetch filter options for sitemap generation
  const filterQuery = `{
    "bonusTypes": *[_type == "bonusType" && isActive == true]{
      name,
      country->{
        slug
      },
      _updatedAt
    },
    "bookmakers": *[_type == "bookmaker" && isActive == true]{
      name,
      country->{
        slug
      },
      _updatedAt
    },
    "advancedFilters": *[_type == "bookmaker" && isActive == true]{
      paymentMethods,
      license,
      country->{
        slug
      },
      _updatedAt
    }
  }`;
  
  try {
    const [entries, affiliateLinks, filterData] = await Promise.all([
      client.fetch(query),
      client.fetch(affiliateQuery),
      client.fetch(filterQuery)
    ]);
    
    // Transform affiliate links to match the expected format
    const transformedAffiliateLinks = affiliateLinks.map(link => ({
      _type: 'affiliate',
      slug: link.prettyLink,
      countrySlug: link.bookmaker?.country?.slug?.current,
      _updatedAt: link._updatedAt
    }));

    // Generate filter combination entries
    const filterEntries = [];
    filterData.forEach(country => {
      const countrySlug = country.slug?.current;
      if (!countrySlug) return;

      // Add bonus type filter pages
      country.bonusTypes?.forEach(bonusType => {
        if (bonusType.name) {
          filterEntries.push({
            _type: 'filter',
            slug: `${countrySlug}/${bonusType.name.toLowerCase().replace(/\s+/g, '-')}`,
            countrySlug,
            filterType: 'bonusType',
            filterValue: bonusType.name,
            _updatedAt: bonusType._updatedAt || country._updatedAt
          });
        }
      });

      // Add bookmaker filter pages
      country.bookmakers?.forEach(bookmaker => {
        if (bookmaker.name) {
          filterEntries.push({
            _type: 'filter',
            slug: `${countrySlug}/${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}`,
            countrySlug,
            filterType: 'bookmaker',
            filterValue: bookmaker.name,
            _updatedAt: bookmaker._updatedAt || country._updatedAt
          });
        }
      });

      // Add payment method filter pages (unique payment methods)
      const uniquePaymentMethods = new Set<string>();
      country.paymentMethods?.forEach(offer => {
        offer.bookmaker?.paymentMethods?.forEach(pm => {
          if (pm?.name && typeof pm.name === 'string') {
            uniquePaymentMethods.add(pm.name);
          }
        });
      });

      uniquePaymentMethods.forEach(pmName => {
        filterEntries.push({
          _type: 'filter',
          slug: `${countrySlug}/${pmName.toLowerCase().replace(/\s+/g, '-')}`,
          countrySlug,
          filterType: 'paymentMethod',
          filterValue: pmName,
          _updatedAt: country._updatedAt
        });
      });

      // Generate 2-way combination filter pages
      // Bonus Type + Bookmaker combinations
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          if (bonusType.name && bookmaker.name) {
            filterEntries.push({
              _type: 'filter',
              slug: `${countrySlug}/${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}`,
              countrySlug,
              filterType: 'bonusType-bookmaker',
              filterValue: `${bonusType.name}-${bookmaker.name}`,
              _updatedAt: Math.max(
                bonusType._updatedAt || 0,
                bookmaker._updatedAt || 0,
                country._updatedAt || 0
              )
            });
          }
        });
      });

      // Bonus Type + Payment Method combinations
      country.bonusTypes?.forEach(bonusType => {
        uniquePaymentMethods.forEach(pmName => {
          if (bonusType.name && pmName) {
            filterEntries.push({
              _type: 'filter',
              slug: `${countrySlug}/${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}`,
              countrySlug,
              filterType: 'bonusType-paymentMethod',
              filterValue: `${bonusType.name}-${pmName}`,
              _updatedAt: Math.max(
                bonusType._updatedAt || 0,
                country._updatedAt || 0
              )
            });
          }
        });
      });

      // Bookmaker + Payment Method combinations
      country.bookmakers?.forEach(bookmaker => {
        uniquePaymentMethods.forEach(pmName => {
          if (bookmaker.name && pmName) {
            filterEntries.push({
              _type: 'filter',
              slug: `${countrySlug}/${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}`,
              countrySlug,
              filterType: 'bookmaker-paymentMethod',
              filterValue: `${bookmaker.name}-${pmName}`,
              _updatedAt: Math.max(
                bookmaker._updatedAt || 0,
                country._updatedAt || 0
              )
            });
          }
        });
      });

      // Generate 3-way combination filter pages
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          uniquePaymentMethods.forEach(pmName => {
            if (bonusType.name && bookmaker.name && pmName) {
              filterEntries.push({
                _type: 'filter',
                slug: `${countrySlug}/${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}`,
                countrySlug,
                filterType: 'bonusType-bookmaker-paymentMethod',
                filterValue: `${bonusType.name}-${bookmaker.name}-${pmName}`,
                _updatedAt: Math.max(
                  bonusType._updatedAt || 0,
                  bookmaker._updatedAt || 0,
                  country._updatedAt || 0
                )
              });
            }
          });
        });
      });

      // Generate 4-way combination filter pages (Bonus Type + Bookmaker + Payment Method + License)
      // First, get unique licenses for this country
      const uniqueLicenses = new Set<string>();
      country.bookmakers?.forEach(bookmaker => {
        if (Array.isArray(bookmaker.license)) {
          bookmaker.license.forEach(license => {
            if (license && typeof license === 'string') {
              uniqueLicenses.add(license);
            }
          });
        }
      });

      // 4-way combinations: Bonus Type + Bookmaker + Payment Method + License
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          uniquePaymentMethods.forEach(pmName => {
            uniqueLicenses.forEach(licenseName => {
              if (bonusType.name && bookmaker.name && pmName && licenseName) {
                filterEntries.push({
                  _type: 'filter',
                  slug: `${countrySlug}/${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}-${licenseName.toLowerCase().replace(/\s+/g, '-')}`,
                  countrySlug,
                  filterType: 'bonusType-bookmaker-paymentMethod-license',
                  filterValue: `${bonusType.name}-${bookmaker.name}-${pmName}-${licenseName}`,
                  _updatedAt: Math.max(
                    bonusType._updatedAt || 0,
                    bookmaker._updatedAt || 0,
                    country._updatedAt || 0
                  )
                });
              }
            });
          });
        });
      });

      // Generate 5-way combination filter pages (Bonus Type + Bookmaker + Payment Method + License + Country-specific features)
      // Add country-specific features like "mobile-optimized", "live-betting", etc.
      const countryFeatures = ['mobile-optimized', 'live-betting', 'instant-withdrawal', '24-7-support'];
      
      country.bonusTypes?.forEach(bonusType => {
        country.bookmakers?.forEach(bookmaker => {
          uniquePaymentMethods.forEach(pmName => {
            uniqueLicenses.forEach(licenseName => {
              countryFeatures.forEach(feature => {
                if (bonusType.name && bookmaker.name && pmName && licenseName) {
                  filterEntries.push({
                    _type: 'filter',
                    slug: `${countrySlug}/${bonusType.name.toLowerCase().replace(/\s+/g, '-')}-${bookmaker.name.toLowerCase().replace(/\s+/g, '-')}-${pmName.toLowerCase().replace(/\s+/g, '-')}-${licenseName.toLowerCase().replace(/\s+/g, '-')}-${feature}`,
                    countrySlug,
                    filterType: 'bonusType-bookmaker-paymentMethod-license-feature',
                    filterValue: `${bonusType.name}-${bookmaker.name}-${pmName}-${licenseName}-${feature}`,
                    _updatedAt: Math.max(
                      bonusType._updatedAt || 0,
                      bookmaker._updatedAt || 0,
                      country._updatedAt || 0
                    )
                  });
                }
              });
            });
          });
        });
      });
    });
    
    return [...entries, ...transformedAffiliateLinks, ...filterEntries];
  } catch (error) {
    console.error('Error fetching sitemap entries:', error);
    return client.fetch(query);
  }
} 