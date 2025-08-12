import { client } from "../../../sanity/lib/client";

export async function generateMetadata({ params }) {
  const awaitedParams = await params;
  const pathname = awaitedParams?.filters || [];
  const countrySlug = awaitedParams?.slug;
  
  // First, get the country data
  let countryData = null;
  if (countrySlug) {
    try {
      const countryQuery = `*[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
        country,
        metaTitle,
        metaDescription
      }`;
      countryData = await client.fetch(countryQuery, { slug: countrySlug });
    } catch (error) {
      console.error('Error fetching country data:', error);
    }
  }
  
  // Check if this is an individual offer page (has 2 or more parts)
  // URL structure: /country/bonus-type/offer-slug (filters = [bonus-type, offer-slug])
  if (pathname && pathname.length >= 2 && countryData) {
    const offerSlug = pathname[pathname.length - 1];
    
    try {
      // First, try to find the offer by slug and country
      const offerQuery = `*[_type == "offers" && country->country == $countryName && slug.current == $slug][0]{
        title,
        bonusType->{name},
        bookmaker->{name},
        metaTitle,
        metaDescription,
        noindex,
        nofollow,
        canonicalUrl,
        sitemapInclude
      }`;
      const offer = await client.fetch(offerQuery, { slug: offerSlug, countryName: countryData.country });
      
      if (offer) {
        const offerTitle = offer.metaTitle || `${offer.title} - ${offer.bookmaker?.name}`;
        const offerDescription = offer.metaDescription || `View ${offer.title} details and claim your bonus from ${offer.bookmaker?.name}.`;
        
        return {
          title: offerTitle,
          description: offerDescription,
          robots: [
            offer.noindex ? "noindex" : "index",
            offer.nofollow ? "nofollow" : "follow"
          ].join(", "),
          alternates: {
            canonical: offer.canonicalUrl || undefined,
          },
        };
      }
      
      // If not found, try a broader search without country constraint
      const fallbackQuery = `*[_type == "offers" && slug.current == $slug][0]{
        title,
        bonusType->{name},
        bookmaker->{name},
        metaTitle,
        metaDescription,
        noindex,
        nofollow,
        canonicalUrl,
        sitemapInclude
      }`;
      const fallbackOffer = await client.fetch(fallbackQuery, { slug: offerSlug });
      
      if (fallbackOffer) {
        const offerTitle = fallbackOffer.metaTitle || `${fallbackOffer.title} - ${fallbackOffer.bookmaker?.name}`;
        const offerDescription = fallbackOffer.metaDescription || `View ${fallbackOffer.title} details and claim your bonus from ${fallbackOffer.bookmaker?.name}.`;
        
        return {
          title: offerTitle,
          description: offerDescription,
          robots: [
            fallbackOffer.noindex ? "noindex" : "index",
            fallbackOffer.nofollow ? "nofollow" : "follow"
          ].join(", "),
          alternates: {
            canonical: fallbackOffer.canonicalUrl || undefined,
          },
        };
      }
    } catch (error) {
      console.error('Error fetching offer metadata:', error);
    }
  }
  
  // Default metadata for filter pages - now dynamic
  const countryName = countryData?.country || "Unknown";
  return {
    title: countryData?.metaTitle || `Betting Offers in ${countryName} | Booldo`,
    description: countryData?.metaDescription || `Discover the best betting offers and bonuses from top bookmakers in ${countryName}.`,
  };
}

export default function CountryFiltersLayout({ children }) {
  return children;
}