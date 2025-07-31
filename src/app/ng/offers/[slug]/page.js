import { getPageSeo } from "../../../../sanity/lib/seo";
import { client } from "../../../../sanity/lib/client";
import OfferDetailsInner from "./OfferDetailsInner";
import ExpiredOfferPage from "./ExpiredOfferPage";

// Function to check if an offer has expired
function isOfferExpired(expiresDate) {
  if (!expiresDate) return false;
  const today = new Date();
  const expiryDate = new Date(expiresDate);
  return today > expiryDate;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  // Fetch the offer to check if it's expired and get SEO data
  const offerQuery = `*[_type == "offers" && country == "Nigeria" && slug.current == $slug][0]{
    _id,
    bonusType->{name},
    bookmaker->{name},
    expires,
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl,
    sitemapInclude
  }`;
  const offer = await client.fetch(offerQuery, { slug });
  
  // If offer is expired, return 410 metadata
  if (offer && isOfferExpired(offer.expires)) {
    return {
      title: "Offer Expired | Booldo",
      description: "This offer has expired and is no longer available.",
      robots: "noindex, nofollow",
    };
  }
  
  // If no offer found, return default metadata
  if (!offer) {
    return {
      title: "Offer Not Found | Booldo",
      description: "The requested offer could not be found.",
      robots: "noindex, nofollow",
    };
  }

  // Return SEO metadata from the offer
  const offerTitle = offer.bonusType?.name ? `${offer.bonusType.name} - ${offer.bookmaker?.name}` : "Offer";
  return {
    title: offer.metaTitle || `${offerTitle} | Booldo`,
    description: offer.metaDescription || `View ${offerTitle} details and claim your bonus.`,
    robots: [
      offer.noindex ? "noindex" : "index",
      offer.nofollow ? "nofollow" : "follow"
    ].join(", "),
    alternates: {
      canonical: offer.canonicalUrl || undefined,
    },
  };
}

export default async function OfferDetails({ params }) {
  const { slug } = await params;
  
  // Fetch the offer to check if it's expired
  const offerQuery = `*[_type == "offers" && country == "Nigeria" && slug.current == $slug][0]{
    _id,
    bonusType->{name},
    bookmaker->{name},
    expires
  }`;
  const offer = await client.fetch(offerQuery, { slug });
  
  // If offer is expired, return 410 error page
  if (offer && isOfferExpired(offer.expires)) {
    return <ExpiredOfferPage offer={offer} />;
  }
  
  return <OfferDetailsInner slug={slug} />;
} 