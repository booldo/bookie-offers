import { client } from "../../../sanity/lib/client";
import OfferDetailsInner from "../../[...filters]/OfferDetailsInner";

export async function generateMetadata({ params }) {
  const { slug } = params;
  
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
  
  // Default metadata if offer not found
  return {
    title: "Offer Not Found | Booldo",
    description: "The requested offer could not be found.",
    robots: "noindex, nofollow",
  };
}

export default function OfferPage({ params }) {
  const { slug } = params;
  return <OfferDetailsInner slug={slug} />;
} 