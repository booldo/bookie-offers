import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import OfferDetailsClient from "./OfferDetailsClient";

// Server-side offer details fetching for PPR
async function getOfferDetailsData(slug, countryName) {
  try {
    // Fetch the main offer
    const mainOfferQuery = `*[_type == "offers" && country->country == $countryName && slug.current == $slug && publishingStatus != "hidden"][0]{
      _id,
      slug,
      country->{
        _id,
        country,
        slug
      },
      bonusType->{
        _id,
        name
      },
      bookmaker->{
        _id,
        name,
        logo,
        logoAlt,
        paymentMethods[]->{
          _id,
          name
        },
        license[]->{
          _id,
          name
        },
        country->{
          _id,
          country
        },
        metaTitle,
        metaDescription
      },
      maxBonus,
      minDeposit,
      description,
      expires,
      published,
      affiliateLink->{
        _id,
        name,
        affiliateUrl,
        isActive,
        prettyLink
      },
      banner,
      bannerAlt,
      howItWorks,
      faq,
      offerSummary,
      metaTitle,
      metaDescription,
      noindex,
      nofollow,
      canonicalUrl,
      sitemapInclude,
      title
    }`;
    
    const mainOffer = await client.fetch(mainOfferQuery, { slug, countryName });
    
    if (!mainOffer) {
      return null;
    }
    
    // Fetch more offers from the same bookmaker (excluding current offer)
    const moreOffersQuery = `*[_type == "offers" && country->country == $countryName && bookmaker._ref == $bookmakerId && slug.current != $currentSlug && publishingStatus != "hidden"] | order(_createdAt desc)[0...4] {
      _id,
      slug,
      country->{
        _id,
        country
      },
      bonusType->{
        _id,
        name
      },
      bookmaker->{
        _id,
        name,
        logo,
        logoAlt
      },
      maxBonus,
      minDeposit,
      description,
      published,
      banner,
      bannerAlt,
      title
    }`;
    
    const moreOffers = await client.fetch(moreOffersQuery, { 
      countryName, 
      bookmakerId: mainOffer.bookmaker._id, 
      currentSlug: slug 
    });
    
    // Get total count of offers from this bookmaker
    const totalOffersQuery = `count(*[_type == "offers" && country->country == $countryName && bookmaker._ref == $bookmakerId])`;
    const totalOffers = await client.fetch(totalOffersQuery, { 
      countryName, 
      bookmakerId: mainOffer.bookmaker._id 
    });
    
    return {
      mainOffer,
      moreOffers,
      totalOffers
    };
  } catch (error) {
    console.error('Error fetching offer details:', error);
    return null;
  }
}

export default async function OfferDetailsServer({ slug, countryName }) {
  const offerData = await getOfferDetailsData(slug, countryName);
  
  if (!offerData) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Offer Not Found</h1>
        <p className="text-gray-600 mb-4">The requested offer could not be found.</p>
        <a href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Back to Offers
        </a>
      </div>
    );
  }
  
  return (
    <OfferDetailsClient 
      offer={offerData.mainOffer}
      moreOffers={offerData.moreOffers}
      totalOffers={offerData.totalOffers}
      countryName={countryName}
    />
  );
}
