import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";
import Image from "next/image";
import { client } from "../sanity/lib/client";
import { urlFor } from "../sanity/lib/image";
import { Suspense } from "react";
import { PortableText } from "@portabletext/react";

// Static data fetching for PPR
async function getCountries() {
  try {
    const query = `*[_type == "countryPage" && isActive == true && (noindex != true) && (sitemapInclude != false)] | order(country asc) {
      country,
      countryCode,
      slug,
      pageFlag,
      description
    }`;
    const countries = await client.fetch(query);
    return countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    return [];
  }
}

// Fetch landing page data from Sanity
async function getLandingPageData() {
  try {
    const landingPageData = await client.fetch(`*[_type == "landingPage"][0]{
      siteHeading1,
      siteHeading2,
      siteDescription,
      mostSearches[]{
        searchTerm,
        isActive,
        order
      }
    }`);

    return landingPageData || {};
  } catch (error) {
    console.error("Error fetching landing page data:", error);
    return {};
  }
}

// Async country cards component
async function CountryCards() {
  const countries = await getCountries();

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-4xl mx-auto px-2 sm:px-0">
      {countries.map((country) => (
        <a
          key={country.slug.current}
          href={`/${country.slug.current}`}
          className="flex flex-col bg-[#F5F5F7] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-gray-200 cursor-pointer block sm:h-[92px] sm:w-[758px] sm:mx-auto"
        >
          {/* Flag and Country Name Row */}
          <div className="flex items-center gap-3 mb-2">
            {country.pageFlag ? (
              <img
                src={urlFor(country.pageFlag).width(32).height(32).url()}
                alt={`${country.country} flag`}
                className="w-8 h-8 sm:w-9 sm:h-9 object-cover rounded"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-300 flex items-center justify-center rounded">
                <span className="text-xs font-bold text-gray-600 font-['General_Sans']">
                  {country.countryCode?.toUpperCase() ||
                    country.country?.charAt(0) ||
                    "?"}
                </span>
              </div>
            )}
            <div className="font-semibold text-gray-900 text-base sm:text-lg md:text-xl font-['General_Sans']">
              {country.country}
            </div>
          </div>

          {/* Description and View Offers Button Row */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500  ml-11 sm:ml-12">
              {country.description || "Discover local offers"}
            </div>

            {/* View Offers Button - positioned on far right for desktop only */}
            <div className="inline-flex items-center text-sm font-semibold text-gray-900  ml-0 sm:ml-auto">
              View Offers
              <svg
                className="ml-2 w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

// Async landing page header component
async function LandingPageHeader() {
  const landingPageData = await getLandingPageData();

  // Fallback to hardcoded values if data is not available
  const heading1 = landingPageData?.siteHeading1 || "No Bias. No Hype.";
  const heading2 = landingPageData?.siteHeading2 || "Just Betting Options.";
  const description = landingPageData?.siteDescription || [
    {
      _type: "block",
      _key: "description",
      style: "normal",
      children: [
        {
          _type: "span",
          _key: "description-text",
          text: "Booldo is built to help you bet smarter. We show you all the top bookmakers and offers, even those we don't partner with, so you can decide with confidence. No noisy tips. No clutter. Just clear, honest info.",
          marks: [],
        },
      ],
    },
  ];

  return (
    <>
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-3 sm:mb-4  leading-tight">
        {heading1}
      </h1>
      <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-4 sm:mb-6 md:mb-8  leading-tight">
        {heading2}
      </h1>
      <div className="text-center text-gray-600 mb-4 sm:mb-6 md:mb-8  text-sm sm:text-base lg:text-lg max-w-4xl leading-relaxed px-2 sm:px-0">
        <PortableText value={description} />
      </div>
    </>
  );
}

// Loading fallback for PPR
function CountryCardsLoading() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-4xl mx-auto px-2 sm:px-0">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex flex-col bg-[#F5F5F7] rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 animate-pulse"
        >
          {/* Flag and Country Name Row */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-300 rounded"></div>
            <div className="h-5 sm:h-6 bg-gray-300 rounded w-24"></div>
          </div>

          {/* Description and View Offers Button Row */}
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-300 rounded w-32 ml-11 sm:ml-12"></div>
            <div className="h-4 bg-gray-300 rounded w-20 ml-0 sm:ml-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading fallback for landing page header
function LandingPageHeaderLoading() {
  return (
    <>
      <div className="h-8 sm:h-10 md:h-12 lg:h-16 bg-gray-200 rounded w-64 mx-auto mb-3 sm:mb-4 animate-pulse"></div>
      <div className="h-8 sm:h-10 md:h-12 lg:h-16 bg-gray-200 rounded w-80 mx-auto mb-4 sm:mb-6 md:mb-8 animate-pulse"></div>
      <div className="max-w-4xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2 sm:px-0">
        <div className="h-4 sm:h-5 lg:h-6 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
        <div className="h-4 sm:h-5 lg:h-6 bg-gray-200 rounded w-3/4 mx-auto animate-pulse"></div>
      </div>
    </>
  );
}

// Main page component with PPR structure
export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <HomeNavbar />
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 flex flex-col items-center flex-1">
        {/* Dynamic landing page header - uses PPR */}
        <Suspense fallback={<LandingPageHeaderLoading />}>
          <LandingPageHeader />
        </Suspense>

        {/* Dynamic country cards - uses PPR */}
        <Suspense fallback={<CountryCardsLoading />}>
          <CountryCards />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
