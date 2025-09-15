import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import { formatDate } from "../../utils/dateFormatter";
import { PortableText } from "@portabletext/react";
import OffersClient from "./OffersClient";
import ExpiredOfferPage from "./[...filters]/ExpiredOfferPage";

// Server-side data fetching for offers and aggregations
async function getOffersData({ countryName, countryId }) {
  if (!countryName) {
    console.log("getOffersData: No country name provided");
    return {
      offers: [],
      bonusTypeOptions: [],
      bookmakerOptions: [],
      advancedOptions: [],
    };
  }

  console.log("Fetching offers for country:", countryName);

  const query = `*[_type == "offers" && country->country == $countryName && (noindex != true) && (sitemapInclude != false)] | order(_createdAt desc) {
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
      }
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
    title
  }`;

  try {
    const offers = await client.fetch(query, { countryName });
    console.log(
      "Offers fetched:",
      offers.length,
      "offers found for",
      countryName
    );

    // Fetch all bonus types and bookmakers for the country (ensure dropdowns list all, even with zero offers)
    let allBonusTypes = [];
    let allBookmakers = [];
    const fetchAllBookmakers = client.fetch(
      `*[_type == "bookmaker" ]{name, country->{_id, country, countryCode}}`
    );
    if (countryId) {
      console.log("DEBUG: countryId:", countryId);
      console.log("DEBUG: countryName:", countryName);
      const [btList, bmList] = await Promise.all([
        client.fetch(
          `*[_type == "bonusType" && country._ref == $cid && isActive == true] | order(name asc){ name }`,
          { cid: countryId }
        ),
        fetchAllBookmakers,
        client.fetch(
          `*[_type == "bookmaker" && country._ref == $cid && isActive == true] | order(name asc){ name, country }`,
          { cid: countryId }
        ),
      ]);
      console.log("DEBUG: raw bmList:", bmList);
      const allbookmaker = await fetchAllBookmakers;
      console.log("DEBUG: allbookmaker:", allbookmaker);
      allBonusTypes = btList?.map((b) => b.name).filter(Boolean) || [];
      allBookmakers = bmList?.map((b) => b.name).filter(Boolean) || [];
      // If bmList is empty, try alternate query by country name
      if (allBookmakers.length === 0 && countryName) {
        const bmListByName = await client.fetch(
          `*[_type == "bookmaker" && country->country == $countryName && isActive == true] | order(name asc){ name, country }`,
          { countryName }
        );
        console.log("DEBUG: fallback bmListByName:", bmListByName);
        allBookmakers = bmListByName?.map((b) => b.name).filter(Boolean) || [];
      }
      // Always log all bookmakers with country reference for inspection
      const allBookmakersWithCountry = await fetchAllBookmakers;
      console.log("DEBUG: allBookmakersWithCountry:", allBookmakersWithCountry);
    }

    // Compute bonus type counts and unique bonus types
    const bonusTypeCount = {};
    offers.forEach((offer) => {
      const bt = offer.bonusType?.name || "Other";
      bonusTypeCount[bt] = (bonusTypeCount[bt] || 0) + 1;
    });
    // Bonus types remain derived from offers (do not include zero-offer items)
    const bonusTypeOptions = Object.entries(bonusTypeCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Compute bookmaker counts and unique bookmakers
    const bookmakerCount = {};
    offers.forEach((offer) => {
      const bm = offer.bookmaker?.name || "Other";
      bookmakerCount[bm] = (bookmakerCount[bm] || 0) + 1;
    });
    const bookmakerSet = new Set([
      ...Object.keys(bookmakerCount),
      ...allBookmakers,
    ]);
    const bookmakerOptions = Array.from(bookmakerSet)
      .map((name) => ({ name, count: bookmakerCount[name] || 0 }))
      .sort((a, b) => a.name.localeCompare(b.name));
    console.log("DEBUG: allBookmakers:", allBookmakers);
    console.log(
      "DEBUG: bookmakerOptions (all, including 0 offers):",
      bookmakerOptions
    );

    // Compute payment method counts from actual data
    const paymentMethodCount = {};
    offers.forEach((offer) => {
      if (Array.isArray(offer.bookmaker?.paymentMethods)) {
        offer.bookmaker.paymentMethods.forEach((pm) => {
          // Handle both old string format and new reference format
          const pmName = typeof pm === "string" ? pm : pm.name;
          if (pmName) {
            paymentMethodCount[pmName] = (paymentMethodCount[pmName] || 0) + 1;
          }
        });
      }
    });
    const paymentSubcategories = Object.entries(paymentMethodCount).map(
      ([name, count]) => ({ name, count })
    );

    // Compute license counts from actual offers data
    const licenseCount = {};
    offers.forEach((offer) => {
      if (Array.isArray(offer.bookmaker?.license)) {
        offer.bookmaker.license.forEach((license) => {
          // Handle both old string format and new reference format
          const licenseName =
            typeof license === "string" ? license : license.name;
          if (licenseName) {
            licenseCount[licenseName] = (licenseCount[licenseName] || 0) + 1;
          }
        });
      }
    });
    const licenseOptions = Object.entries(licenseCount).map(
      ([name, count]) => ({ name, count })
    );

    const advancedOptions = [
      {
        name: "Payment Methods",
        subcategories: paymentSubcategories,
      },
      {
        name: "Licenses",
        subcategories: licenseOptions,
      },
    ];

    return { offers, bonusTypeOptions, bookmakerOptions, advancedOptions };
  } catch (error) {
    console.error("Error fetching offers:", error);
    return {
      offers: [],
      bonusTypeOptions: [],
      bookmakerOptions: [],
      advancedOptions: [],
    };
  }
}

export default async function OffersServer({ countrySlug, initialFilter }) {
  // First fetch country data to get the country name
  const countryData = await client.fetch(
    `
    *[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
      _id,
      country,
      pageTitle,
      slug
    }
  `,
    { slug: countrySlug }
  );

  if (!countryData) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">Country not found</div>
      </div>
    );
  }

  // Fetch offers data and dropdown options merged with country-scoped lists
  const { offers, bonusTypeOptions, bookmakerOptions, advancedOptions } =
    await getOffersData({
      countryName: countryData.country,
      countryId: countryData._id,
    });

  if (offers.length === 0) {
    return (
      <ExpiredOfferPage
        embedded={true}
        isCountryEmpty={true}
        countryName={countryData.country}
        countrySlug={countryData.slug?.current || countrySlug}
      />
    );
  }

  return (
    <OffersClient
      countrySlug={countrySlug}
      initialOffers={offers}
      bonusTypeOptions={bonusTypeOptions}
      bookmakerOptions={bookmakerOptions}
      advancedOptions={advancedOptions}
      pageTitle={countryData.pageTitle}
      initialFilter={initialFilter}
    />
  );
}
