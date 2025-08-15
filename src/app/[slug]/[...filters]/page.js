import CountryPageShell, { generateStaticParams } from '../CountryPageShell';
import DynamicOffers from '../DynamicOffers';
import OfferDetailsInner from './OfferDetailsInner';
import { Suspense } from "react";
import { redirect } from 'next/navigation';
import { client } from '../../../sanity/lib/client';
import { urlFor } from '../../../sanity/lib/image';

// Use the same static generation functions from CountryPageShell
export { generateStaticParams };

// Generate metadata for filter pages and pretty links
export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  
  // Check if this is an offer details page (has 3 segments: country/bonus-type/offer-slug)
  const isOfferDetailsPage = awaitedParams.filters && awaitedParams.filters.length >= 2;
  
  if (isOfferDetailsPage) {
    try {
      const countrySlug = awaitedParams.slug;
      const offerSlug = awaitedParams.filters[awaitedParams.filters.length - 1];
      
      // Fetch offer metadata
      const offerData = await client.fetch(`
        *[_type == "offers" && slug.current == $offerSlug][0]{
          title,
          metaTitle,
          metaDescription,
          bookmaker->{
            name,
            logo,
            logoAlt
          },
          bonusType->{
            name
          },
          country->{
            country
          }
        }
      `, { offerSlug });
      
      if (offerData) {
        const title = offerData.metaTitle || `${offerData.title} - ${offerData.bookmaker?.name} | Booldo`;
        const description = offerData.metaDescription || `Get ${offerData.bonusType?.name || 'exclusive'} bonus from ${offerData.bookmaker?.name}. ${offerData.title}`;
        
        return {
          title,
          description,
          openGraph: {
            title,
            description,
            images: offerData.bookmaker?.logo ? [urlFor(offerData.bookmaker.logo).url()] : [],
          },
        };
      }
    } catch (error) {
      console.error('Error generating metadata for offer details:', error);
    }
  }
  
  // Check if this is a pretty link (single segment) or a single filter page
  if (awaitedParams.filters && awaitedParams.filters.length === 1) {
    const singleFilter = awaitedParams.filters[0];
    
    try {
      // Pretty link handling
      const affiliateLink = await client.fetch(`
        *[_type == "affiliate" && prettyLink.current == $prettyLink && isActive == true][0]{
          bookmaker->{
            name,
            logo,
            logoAlt,
            description,
            country->{
              country,
              slug
            }
          },
          bonusType->{
            name,
            description
          }
        }
      `, { prettyLink: singleFilter });

      if (affiliateLink) {
        const { bookmaker, bonusType } = affiliateLink;
        const title = `${bonusType?.name} - ${bookmaker?.name} | Booldo`;
        const description = `Get ${bonusType?.name} from ${bookmaker?.name}. ${bonusType?.description || ''}`;

        return {
          title,
          description,
          openGraph: {
            title,
            description,
            images: bookmaker?.logo ? [urlFor(bookmaker.logo).url()] : [],
          },
        };
      }

      // Resolve country name
      const countryDoc = await client.fetch(`*[_type == "countryPage" && slug.current == $slug][0]{country, metaTitle, metaDescription}`, { slug: awaitedParams.slug });
      const countryName = countryDoc?.country;
      
      if (countryName) {
        // Try bookmaker metadata by name within this country
        const bookmaker = await client.fetch(`*[_type == "bookmaker" && country->country == $country && name match $name][0]{
          metaTitle, metaDescription, logo
        }`, { country: countryName, name: singleFilter.replace(/-/g, ' ') });
        if (bookmaker) {
          const title = bookmaker.metaTitle || `${singleFilter.replace(/-/g, ' ')} | Booldo`;
          const description = bookmaker.metaDescription || `Explore offers and information for ${singleFilter.replace(/-/g, ' ')} in ${countryName}.`;
          return {
            title,
            description,
            openGraph: {
              title,
              description,
              images: bookmaker.logo ? [urlFor(bookmaker.logo).url()] : [],
            },
          };
        }

        // Try bonus type metadata by name within this country
        const bonusType = await client.fetch(`*[_type == "bonusType" && country->country == $country && name match $name][0]{
          metaTitle, metaDescription
        }`, { country: countryName, name: singleFilter.replace(/-/g, ' ') });
        if (bonusType) {
          const title = bonusType.metaTitle || `${singleFilter.replace(/-/g, ' ')} | Booldo`;
          const description = bonusType.metaDescription || `Discover ${singleFilter.replace(/-/g, ' ')} offers in ${countryName}.`;
          return { title, description };
        }

        // Combination filter (contains '-') or fallback: use country page metadata
        if (singleFilter.includes('-') || countryDoc) {
          return {
            title: countryDoc.metaTitle || `${countryName} Offers | Booldo`,
            description: countryDoc.metaDescription || `Find the best offers and bookmakers in ${countryName}.`,
          };
        }
      }
    } catch (error) {
      console.error('Error generating metadata for single filter:', error);
    }
  }

  // Default metadata for filter pages (fallback)
  return {
    title: 'Offers | Booldo',
    description: 'Find the best bonuses and offers.',
  };
}

export default async function CountryFiltersPage({ params }) {
  const awaitedParams = await params;
  
  // Check if this is an offer details page (has 3 segments: country/bonus-type/offer-slug)
  const isOfferDetailsPage = awaitedParams.filters && awaitedParams.filters.length >= 2;
  
  if (isOfferDetailsPage) {
    // Extract the offer slug from the last segment
    const offerSlug = awaitedParams.filters[awaitedParams.filters.length - 1];
    return (
      <CountryPageShell params={awaitedParams} isOfferDetailsPage={true}>
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        }>
          <OfferDetailsInner slug={offerSlug} />
        </Suspense>
      </CountryPageShell>
    );
  }
  
  // Check if this is a single filter page (country/filter)
  const isSingleFilterPage = awaitedParams.filters && awaitedParams.filters.length === 1;
  const singleFilter = isSingleFilterPage ? awaitedParams.filters[0] : null;
  
  // Check if this might be a pretty link (single segment that could be an affiliate link)
  if (isSingleFilterPage && singleFilter) {
    try {
      // Check if this is a pretty link for an affiliate
      const affiliateLink = await client.fetch(`
        *[_type == "affiliate" && prettyLink.current == $prettyLink && isActive == true][0]{
          _id,
          affiliateUrl,
          bookmaker->{
            _id,
            name,
            logo,
            logoAlt,
            description,
            country->{
              country,
              slug
            }
          },
          bonusType->{
            name,
            description
          }
        }
      `, { prettyLink: singleFilter });

      if (affiliateLink && affiliateLink.affiliateUrl) {
        // Redirect to the affiliate URL
        redirect(affiliateLink.affiliateUrl);
      }
    } catch (error) {
      console.error('Error checking for pretty link:', error);
      // Continue with normal filter processing if there's an error
    }
  }
  
  // Check if this is a combination filter page (country/filter1-filter2)
  const isCombinationFilterPage = isSingleFilterPage && singleFilter && singleFilter.includes('-');
  let filterInfo = null;
  
  if (isCombinationFilterPage) {
    // Parse combination filter (e.g., "free-bet-1bet" -> ["free-bet", "1bet"])
    const filterParts = singleFilter.split('-');
    
    if (filterParts.length >= 2) {
      // Determine the type of combination based on the number of parts
      let combinationType = 'unknown';
      if (filterParts.length === 2) {
        combinationType = '2-way';
      } else if (filterParts.length === 3) {
        combinationType = '3-way';
      } else if (filterParts.length === 4) {
        combinationType = '4-way';
      } else if (filterParts.length >= 5) {
        combinationType = '5-way+';
      }
      
      filterInfo = {
        type: 'combination',
        parts: filterParts,
        original: singleFilter,
        combinationType: combinationType,
        partCount: filterParts.length
      };
    }
  } else if (isSingleFilterPage) {
    filterInfo = {
      type: 'single',
      value: singleFilter
    };
  }
  
  // For single filter pages, try to load comparison/faq for bookmaker or bonus type
  let filterComparison = null;
  let filterFaqs = null;
  if (isSingleFilterPage && singleFilter) {
    const country = await client.fetch(`*[_type == "countryPage" && slug.current == $slug][0]{country}`, { slug: awaitedParams.slug });
    if (country?.country) {
      // Try bookmaker first
      const bookmaker = await client.fetch(`*[_type == "bookmaker" && country->country == $country && name match $name][0]{
        comparison,
        faqs,
        metaTitle,
        metaDescription
      }`, { country: country.country, name: singleFilter.replace(/-/g, ' ') });
      if (bookmaker) {
        filterComparison = bookmaker.comparison || null;
        filterFaqs = bookmaker.faqs || null;
      } else {
        // Try bonus type
        const bonusType = await client.fetch(`*[_type == "bonusType" && country->country == $country && name match $name][0]{
          comparison,
          faqs,
          metaTitle,
          metaDescription
        }`, { country: country.country, name: singleFilter.replace(/-/g, ' ') });
        if (bonusType) {
          filterComparison = bonusType.comparison || null;
          filterFaqs = bonusType.faqs || null;
        }
      }
    }
  }

  return (
    <CountryPageShell params={awaitedParams} filterComparison={filterComparison} filterFaqs={filterFaqs}>
      <Suspense fallback={
        <div className="space-y-4">
          {/* Filter skeleton */}
          <div className="sticky top-16 z-10 bg-white sm:static sm:bg-transparent">
            <div className="flex items-center justify-between my-4">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="sm:max-w-md">
                              <div className="grid grid-cols-3 gap-2 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Offer cards skeleton */}
          <div className="flex flex-col gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      }>
        <DynamicOffers 
          countrySlug={awaitedParams.slug} 
          initialFilter={singleFilter}
          filterInfo={filterInfo}
        />
      </Suspense>
    </CountryPageShell>
  );
}