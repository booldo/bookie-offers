import { client } from "../../../sanity/lib/client";

export async function generateMetadata({ params }) {
  const pathname = params?.filters || [];
  
  // Check if this is an individual offer page (has 2 or more parts)
  if (pathname && pathname.length >= 2) {
    const slug = pathname[pathname.length - 1];
    
    try {
      // Fetch the offer metadata from Sanity
      const offerQuery = `*[_type == "offers" && country == "Ghana" && slug.current == $slug][0]{
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
      const offer = await client.fetch(offerQuery, { slug });
      
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
  
  // Default metadata for filter pages
  return {
    title: "Betting Offers | Booldo",
    description: "Discover the best betting offers and bonuses from top bookmakers in Ghana.",
  };
}

export default function GhanaFiltersLayout({ children }) {
  return children;
} 