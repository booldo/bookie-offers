import { client } from "../../../sanity/lib/client";

export async function generateMetadata({ params }) {
  const pathname = params?.filters || [];
  const countrySlug = params?.slug;
  
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
  if (pathname && pathname.length >= 2 && countryData) {
    const slug = pathname[pathname.length - 1];
    
    try {
      // Fetch the offer metadata from Sanity - now dynamic by country
      const offerQuery = `*[_type == "offers" && country == $countryName && slug.current == $slug][0]{
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
      const offer = await client.fetch(offerQuery, { slug, countryName: countryData.country });
      
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
    } catch (error) {
      console.error('Error fetching offer metadata:', error);
    }
  }
  
  // Default metadata for filter pages - now dynamic
  const countryName = countryData?.country || "Unknown";
  return {
    title: `Betting Offers | Booldo`,
    description: `Discover the best betting offers and bonuses from top bookmakers in ${countryName}.`,
  };
}

export default function CountryFiltersLayout({ children }) {
  return children;
}