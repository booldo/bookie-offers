import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";
import Image from "next/image";
import { client } from "../sanity/lib/client";
import { urlFor } from "../sanity/lib/image";
import { Suspense } from "react";

// Static data fetching for PPR
async function getCountries() {
  try {
    const query = `*[_type == "countryPage" && isActive == true] | order(country asc) {
      country,
      countryCode,
      slug,
      pageFlag
    }`;
    const countries = await client.fetch(query);
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

// Async country cards component
async function CountryCards() {
  const countries = await getCountries();
  
  return (
    <div className="flex flex-col gap-4 w-full">
      {countries.map((country) => (
        <a
          key={country.slug.current}
          href={`/${country.slug.current}`}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#F5F5F7] rounded-xl p-4 shadow-sm border border-gray-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer block"
        >
          <div className="flex items-center gap-4 mb-3 sm:mb-0">
            {country.pageFlag ? (
              <img
                src={urlFor(country.pageFlag).width(36).height(36).url()}
                alt={`${country.country} flag`}
                className="w-9 h-9 object-cover rounded"
              />
            ) : (
              <div className="w-9 h-9 bg-gray-300 flex items-center justify-center rounded">
                <span className="text-xs font-bold text-gray-600">
                  {country.countryCode?.toUpperCase() || country.country?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900 text-lg sm:text-base">{country.country}</div>
              <div className="text-sm text-gray-500">Discover local offers and bookies</div>
            </div>
          </div>
          <div className="inline-flex items-center text-sm font-semibold text-gray-900">
            View Offers
            <svg className="ml-1" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      ))}
    </div>
  );
}

// Loading fallback for PPR
function CountryCardsLoading() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#F5F5F7] rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-center gap-4 mb-3 sm:mb-0">
            <div className="w-9 h-9 bg-gray-300 rounded"></div>
            <div>
              <div className="h-5 sm:h-4 bg-gray-300 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

// Main page component with PPR structure
export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <HomeNavbar />
      <main className="max-w-7xl mx-auto px-4 py-10 flex flex-col items-center flex-1">
        {/* Static content - prerendered */}
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
          No Bias. No Hype.
        </h1>
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
          Just Betting Options.
        </h1>
        <p className="text-center text-gray-600 mb-8 font-['General_Sans']">
          Booldo is built to help you bet smarter. We show you all the top bookmakers and offers, even those we<br />
          don't partner with, so you can decide with confidence. No noisy tips. No clutter. Just clear, honest info.
        </p>
        
        {/* Dynamic country cards - uses PPR */}
        <Suspense fallback={<CountryCardsLoading />}>
          <CountryCards />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}