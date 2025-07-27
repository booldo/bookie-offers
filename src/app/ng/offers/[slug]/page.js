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
  
  // Fetch the offer to check if it's expired
  const offerQuery = `*[_type == "offer" && country == "Nigeria" && slug.current == $slug][0]{
          expires,
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl
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
  
  // Get SEO data for non-expired offers
  const seo = await getPageSeo("offer", slug);

  return {
    title: seo?.metaTitle || "Offer Details | Booldo",
    description: seo?.metaDescription || "View offer details and claim your bonus.",
    robots: [
      seo?.noindex ? "noindex" : "index",
      seo?.nofollow ? "nofollow" : "follow"
    ].join(", "),
    alternates: {
      canonical: seo?.canonicalUrl || undefined,
    },
  };
}

export default async function OfferDetails({ params }) {
  const { slug } = await params;
  
  // Fetch the offer to check if it's expired
  const offerQuery = `*[_type == "offer" && country == "Nigeria" && slug.current == $slug][0]{
    _id,
    title,
    bookmaker,
    expires
  }`;
  const offer = await client.fetch(offerQuery, { slug });
  
  // If offer is expired, return 410 error page
  if (offer && isOfferExpired(offer.expires)) {
    return <ExpiredOfferPage offer={offer} />;
  }
  
  return <OfferDetailsInner slug={slug} />;
} 