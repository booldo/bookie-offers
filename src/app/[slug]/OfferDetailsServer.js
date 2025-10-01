import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import OfferDetailsClient from "./OfferDetailsClient";

// Server-side offer details fetching for PPR
async function getOfferDetailsData(slug, countryName) {
  try {
    // Fetch the main offer
    const mainOfferQuery = `*[_type == "offers" && country->country == $countryName && slug.current == $slug && (!defined(expires) || expires > now())][0]{
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
        logoUrl,
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
    
    // Fetch more offers from the same bookmaker (excluding current offer and expired offers)
    const moreOffersQuery = `*[_type == "offers" && country->country == $countryName && bookmaker._ref == $bookmakerId && slug.current != $currentSlug && (!defined(expires) || expires > now())] | order(_createdAt desc)[0...4] {
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
        logoAlt,
        logoUrl
      },
      maxBonus,
      minDeposit,
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
    
    // Get total count of offers from this bookmaker (excluding expired offers)
    const totalOffersQuery = `count(*[_type == "offers" && country->country == $countryName && bookmaker._ref == $bookmakerId && (!defined(expires) || expires > now())])`;
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
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <main className="max-w-7xl mx-auto w-full px-4 flex-1">
          {/* Back Button */}
          <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500">
            <a href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:underline flex items-center gap-1">
              <img src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
              Home
            </a>
          </div>
          
          {/* 410 Error Content */}
          <div className="py-12 flex items-center justify-center">
            <div className="text-center">
              {/* 410 Status Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg 
                    width="48" 
                    height="48" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                    className="text-red-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              </div>

              {/* Error Code */}
              <h1 className="text-6xl font-bold text-red-600 mb-4">410</h1>
              
              {/* Main Message */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Offer Not Available
              </h2>
              
              {/* Description */}
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                This offer is not available or may be in draft mode. Please check back later or browse our available offers.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
                >
                  <img src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                  Browse Available Offers
                </a>
              </div>
              
              {/* Additional Info */}
              <div className="mt-8 text-sm text-gray-500">
                <p>Looking for similar offers? Check out our latest promotions!</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Check if offer is expired
  const isExpired = offerData.mainOffer?.expires ? new Date(offerData.mainOffer.expires) < new Date() : false;
  if (isExpired) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex flex-col">
        <main className="max-w-7xl mx-auto w-full px-4 flex-1">
          {/* Back Button */}
          <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 overflow-hidden">
            <a href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} className="hover:underline flex items-center gap-1 flex-shrink-0">
              <img src="/assets/back-arrow.png" alt="Back" width="24" height="24" />
              <span className="hidden sm:inline">Home</span>
              <span className="sm:hidden">H</span>
            </a>
          </div>
          
          {/* 410 Error Content */}
          <div className="py-12 flex items-center justify-center">
            <div className="text-center">
              {/* 410 Status Icon */}
              <div className="mb-8">
                <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg 
                    width="48" 
                    height="48" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    viewBox="0 0 24 24"
                    className="text-red-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              </div>

              {/* Error Code */}
              <h1 className="text-6xl font-bold text-red-600 mb-4">410</h1>
              
              {/* Main Message */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Offer Has Expired
              </h2>
              
              {/* Offer Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8 max-w-md mx-auto">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {offerData.mainOffer.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Bookmaker: {offerData.mainOffer.bookmaker?.name}
                </p>
                <p className="text-red-600 text-sm font-medium">
                  Expired: {new Date(offerData.mainOffer.expires).toLocaleDateString()}
                </p>
              </div>
              
              {/* Description */}
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                This offer is no longer available. The promotion has ended and cannot be claimed.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href={`/${countryName.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
                >
                  <img src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                  View Active Offers
                </a>
              </div>
              
              {/* Additional Info */}
              <div className="mt-8 text-sm text-gray-500">
                <p>Looking for similar offers? Check out our latest promotions!</p>
              </div>
            </div>
          </div>
        </main>
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
