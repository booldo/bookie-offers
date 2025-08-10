import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import { formatDate } from '../../utils/dateFormatter';
import { PortableText } from '@portabletext/react';
import OffersClient from './OffersClient';
import StreamingIndicator from './StreamingIndicator';

// Server-side data fetching for offers
async function getOffersData(countryName) {
  if (!countryName) {
    console.log('❌ getOffersData: No country name provided');
    return { offers: [], bonusTypeOptions: [], bookmakerOptions: [], advancedOptions: [] };
  }
  
  console.log('🔍 Fetching offers for country:', countryName);
  
  const query = `*[_type == "offers" && country->country == $countryName] | order(_createdAt desc) {
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
      paymentMethods,
      license,
      country->{
        _id,
        country
      }
    },
    maxBonus,
    minDeposit,
    description,
    expires,
    published,
    affiliateLink,
    banner,
    bannerAlt,
    terms,
    howItWorks,
    faq,
    offerSummary,
    title
  }`;
  
  try {
    const offers = await client.fetch(query, { countryName });
    console.log('Offers fetched:', offers.length, 'offers found for', countryName);
    
    if (offers.length === 0) {
      return { offers: [], bonusTypeOptions: [], bookmakerOptions: [], advancedOptions: [] };
    }
    
    // Compute bonus type counts and unique bonus types
    const bonusTypeCount = {};
    offers.forEach(offer => {
      const bt = offer.bonusType?.name || "Other";
      bonusTypeCount[bt] = (bonusTypeCount[bt] || 0) + 1;
    });
    const bonusTypeOptions = Object.entries(bonusTypeCount).map(([name, count]) => ({ name, count }));
    
    // Compute bookmaker counts and unique bookmakers
    const bookmakerCount = {};
    offers.forEach(offer => {
      const bm = offer.bookmaker?.name || "Other";
      bookmakerCount[bm] = (bookmakerCount[bm] || 0) + 1;
    });
    const bookmakerOptions = Object.entries(bookmakerCount).map(([name, count]) => ({ name, count }));
    
    // Compute payment method counts from actual data
    const paymentMethodCount = {};
    offers.forEach(offer => {
      if (Array.isArray(offer.bookmaker?.paymentMethods)) {
        offer.bookmaker.paymentMethods.forEach(pm => {
          paymentMethodCount[pm] = (paymentMethodCount[pm] || 0) + 1;
        });
      }
    });
    const paymentSubcategories = Object.entries(paymentMethodCount).map(([name, count]) => ({ name, count }));
    
    // Dynamic license options based on country
    let licenseOptions = [];
    if (countryName === "Ghana") {
      licenseOptions = [{ name: "Ghana Gaming Commission (GCG) Licenses" }];
    } else if (countryName === "Nigeria") {
      licenseOptions = [
        { name: "Lagos State Lotteries and Gaming Authority (LSLGA) - State level" },
        { name: "National Lottery Regulatory Commission (NLRC) - Federal" }
      ];
    }
    
    const advancedOptions = [
      {
        name: "Payment Methods",
        subcategories: paymentSubcategories
      },
      {
        name: "Licenses",
        subcategories: licenseOptions
      }
    ];
    
    return { offers, bonusTypeOptions, bookmakerOptions, advancedOptions };
  } catch (error) {
    console.error('Error fetching offers:', error);
    return { offers: [], bonusTypeOptions: [], bookmakerOptions: [], advancedOptions: [] };
  }
}

export default async function OffersServer({ countrySlug }) {
  // Show initial loading state
  console.log('Starting PPR streaming for:', countrySlug);
  
  // First fetch country data to get the country name
  const countryData = await client.fetch(`
    *[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
      country,
      slug
    }
  `, { slug: countrySlug });
  
  if (!countryData) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">Country not found</div>
      </div>
    );
  }
  
  console.log('Country data fetched:', countryData.country);
  
  // Add a small delay to demonstrate PPR streaming (remove this in production)
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Fetch offers data
  const { offers, bonusTypeOptions, bookmakerOptions, advancedOptions } = await getOffersData(countryData.country);
  
  if (offers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No offers found for {countryData.country}</div>
      </div>
    );
  }
  
  console.log('✅ Offers data fetched:', offers.length, 'offers');
  
  return (
    <OffersClient 
      countrySlug={countrySlug}
      initialOffers={offers}
      bonusTypeOptions={bonusTypeOptions}
      bookmakerOptions={bookmakerOptions}
      advancedOptions={advancedOptions}
    />
  );
}
