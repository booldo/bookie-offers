import HomeNavbar from "../components/HomeNavbar";
import Footer from "../components/Footer";
import Image from "next/image";
import { client } from "../sanity/lib/client";
import { urlFor } from "../sanity/lib/image";
import { Suspense } from "react";
import ExpiredOfferPage from "./[slug]/[...filters]/ExpiredOfferPage";

// Static data fetching for PPR
async function getCountries() {
  try {
    const query = `*[_type == "countryPage" && isActive == true && (noindex != true) && (sitemapInclude != false)] | order(country asc) {
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

// Check if landing page is hidden
async function checkLandingPageVisibility() {
  try {
    const landingPageData = await client.fetch(`*[_type == "landingPage"][0]{
      defaultNoindex,
      defaultSitemapInclude
    }`);
    
    if (landingPageData?.defaultNoindex === true || landingPageData?.defaultSitemapInclude === false) {
      return true; // Page is hidden
    }
    return false; // Page is visible
  } catch (error) {
    console.error('Error checking landing page visibility:', error);
    return false; // Default to visible on error
  }
}

// Fetch most searches from Sanity
async function getMostSearches() {
  try {
    const landingPageData = await client.fetch(`*[_type == "landingPage"][0]{
      mostSearches[]{
        searchTerm,
        isActive,
        order
      }
    }`);
    
    if (landingPageData?.mostSearches) {
      // Filter active searches and sort by order
      return landingPageData.mostSearches
        .filter(search => search.isActive)
        .sort((a, b) => (a.order || 1) - (b.order || 1))
        .map(search => search.searchTerm);
    }
    return [];
  } catch (error) {
    console.error('Error fetching most searches:', error);
    return [];
  }
}

// Async country cards component
async function CountryCards() {
  const countries = await getCountries();
  
  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {countries.map((country) => (
        <a
          key={country.slug.current}
          href={`/${country.slug.current}`}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#F5F5F7] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer block"
        >
          <div className="flex flex-col gap-2 mb-3 sm:mb-0">
            <div className="flex items-center gap-3">
              {country.pageFlag ? (
                <img
                  src={urlFor(country.pageFlag).width(36).height(36).url()}
                  alt={`${country.country} flag`}
                  className="w-9 h-9 object-cover rounded"
                />
              ) : (
                <div className="w-9 h-9 bg-gray-300 flex items-center justify-center rounded">
                  <span className="text-xs font-bold text-gray-600 font-['General_Sans']">
                    {country.countryCode?.toUpperCase() || country.country?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="font-semibold text-gray-900 text-lg sm:text-xl font-['General_Sans']">{country.country}</div>
            </div>
            <div className="text-sm text-gray-500 font-['General_Sans'] ml-12 sm:ml-0">Discover local offers and bookies</div>
          </div>
          <div className="inline-flex items-center text-sm font-semibold text-gray-900 font-['General_Sans']">
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

// Async most searches component
async function MostSearches() {
  const searches = await getMostSearches();
  
  if (searches.length === 0) return null;
  
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4 sm:px-0">
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2 font-['General_Sans']">Popular Searches</h3>
        <p className="text-sm text-gray-500 font-['General_Sans']">Discover what others are looking for</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {searches.map((term, index) => (
          <button
            key={index}
            className="bg-white hover:bg-gray-50 text-gray-700 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-sm font-['General_Sans']"
            onClick={() => {
              // This will be handled by the HomeNavbar search functionality
              const searchInput = document.querySelector('input[type="text"]');
              if (searchInput) {
                searchInput.value = term;
                searchInput.focus();
              }
            }}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}

// Loading fallback for PPR
function CountryCardsLoading() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#F5F5F7] rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 animate-pulse">
          <div className="flex items-center gap-4 mb-3 sm:mb-0">
            <div className="w-9 h-9 bg-gray-300 rounded"></div>
            <div>
              <div className="h-5 sm:h-6 bg-gray-300 rounded w-24 mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
      ))}
    </div>
  );
}

// Loading fallback for most searches
function MostSearchesLoading() {
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4 sm:px-0">
      <div className="text-center mb-4">
        <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full w-20 animate-pulse"></div>
        ))}
      </div>
    </div>
  );
}

// Main page component with PPR structure
export default async function Home() {
  // Check if landing page is hidden
  const isLandingPageHidden = await checkLandingPageVisibility();
  
  if (isLandingPageHidden) {
    return (
      <ExpiredOfferPage 
        isHidden={true}
        contentType="landing page"
        embedded={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <HomeNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex flex-col items-center flex-1">
        {/* Static content - prerendered */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-4 font-['General_Sans']">
          No Bias. No Hype.
        </h1>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center text-gray-900 mb-6 sm:mb-8 font-['General_Sans']">
          Just Betting Options.
        </h1>
        <p className="text-center text-gray-600 mb-6 sm:mb-8 font-['General_Sans'] text-sm sm:text-base lg:text-lg max-w-4xl leading-relaxed">
          Booldo is built to help you bet smarter. We show you all the top bookmakers and offers, even those we<br className="hidden sm:block" />
          don't partner with, so you can decide with confidence. No noisy tips. No clutter. Just clear, honest info.
        </p>
        
        {/* Dynamic most searches - uses PPR */}
        <Suspense fallback={<MostSearchesLoading />}>
          <MostSearches />
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