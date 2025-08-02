import { client } from "../../sanity/lib/client";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  // Fetch the bonus type to get the affiliate link
  const bonusTypeQuery = `*[_type == "bonusType" && slug.current == $slug][0]{
    _id,
    title,
    affiliateLink,
    bookmaker->{
      name
    }
  }`;
  const bonusType = await client.fetch(bonusTypeQuery, { slug });
  
  if (!bonusType || !bonusType.affiliateLink) {
    return {
      title: "Offer Not Found | Booldo",
      description: "The requested offer could not be found.",
      robots: "noindex, nofollow",
    };
  }

  return {
    title: `Get ${bonusType.title} from ${bonusType.bookmaker?.name} | Booldo`,
    description: `Claim your ${bonusType.title} bonus from ${bonusType.bookmaker?.name}.`,
    robots: "noindex, nofollow",
  };
}

export default async function AffiliateRedirect({ params }) {
  const { slug } = await params;
  
  // Fetch the bonus type to get the affiliate link
  const bonusTypeQuery = `*[_type == "bonusType" && slug.current == $slug][0]{
    _id,
    title,
    affiliateLink,
    bookmaker->{
      name
    }
  }`;
  const bonusType = await client.fetch(bonusTypeQuery, { slug });
  
  if (!bonusType || !bonusType.affiliateLink) {
    redirect('/404');
  }

  // Redirect to the affiliate link
  redirect(bonusType.affiliateLink);
} 