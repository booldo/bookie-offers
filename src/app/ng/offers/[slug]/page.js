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
  
  // Fetch the bonus type to check if it's expired and get SEO data
  const bonusTypeQuery = `*[_type == "bonusType" && bookmaker->country == "Nigeria" && slug.current == $slug][0]{
    _id,
    title,
    expires,
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl,
    sitemapInclude
  }`;
  const bonusType = await client.fetch(bonusTypeQuery, { slug });
  
  // If bonus type is expired, return 410 metadata
  if (bonusType && isOfferExpired(bonusType.expires)) {
    return {
      title: "Offer Expired | Booldo",
      description: "This offer has expired and is no longer available.",
      robots: "noindex, nofollow",
    };
  }
  
  // If no bonus type found, return default metadata
  if (!bonusType) {
    return {
      title: "Offer Not Found | Booldo",
      description: "The requested offer could not be found.",
      robots: "noindex, nofollow",
    };
  }

  // Return SEO metadata from the bonus type
  return {
    title: bonusType.metaTitle || `${bonusType.title} | Booldo`,
    description: bonusType.metaDescription || `View ${bonusType.title} details and claim your bonus.`,
    robots: [
      bonusType.noindex ? "noindex" : "index",
      bonusType.nofollow ? "nofollow" : "follow"
    ].join(", "),
    alternates: {
      canonical: bonusType.canonicalUrl || undefined,
    },
  };
}

export default async function OfferDetails({ params }) {
  const { slug } = await params;
  
  // Fetch the bonus type to check if it's expired
  const bonusTypeQuery = `*[_type == "bonusType" && bookmaker->country == "Nigeria" && slug.current == $slug][0]{
    _id,
    title,
    bookmaker,
    expires
  }`;
  const bonusType = await client.fetch(bonusTypeQuery, { slug });
  
  // If bonus type is expired, return 410 error page
  if (bonusType && isOfferExpired(bonusType.expires)) {
    return <ExpiredOfferPage offer={bonusType} />;
  }
  
  return <OfferDetailsInner slug={slug} />;
} 