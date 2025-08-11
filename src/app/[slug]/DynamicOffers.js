"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import MultiSelectDropdown from "../../components/BonusTypeDropdown";
import { formatDate } from '../../utils/dateFormatter';
import { PortableText } from '@portabletext/react';

const sortOptions = ["Latest", "A-Z"];

// Fetch offers from Sanity
const fetchOffers = async (countryData) => {
  if (!countryData) {
    console.log('❌ fetchOffers: No country data provided');
    return [];
  }
  
  // Extract country name from country data
  // countryData can be either a string (country name) or an object with country property
  let countryName;
  if (typeof countryData === 'string') {
    countryName = countryData;
  } else {
    countryName = countryData.country || countryData.name || countryData.title || countryData.slug;
  }
  
  if (!countryName) {
    console.log('❌ fetchOffers: Could not extract country name from data:', countryData);
    return [];
  }
  
  console.log('🔍 Fetching offers for country:', countryName);
  
  // Updated query to handle country as a reference
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
    howItWorks,
    faq,
    offerSummary,
    title
  }`;
  
  try {
    const result = await client.fetch(query, { countryName });
    console.log('Offers fetched:', result.length, 'offers found for', countryName);
    
    // Debug: Let's also check what countries exist in offers
    const allCountries = await client.fetch(`*[_type == "offers"]{ country->country }`);
    const uniqueCountries = [...new Set(allCountries.map(o => o.country?.country).filter(Boolean))];
    console.log('Available countries in offers:', uniqueCountries);
    
    // Debug: Check if there are any offers at all
    const totalOffers = await client.fetch(`count(*[_type == "offers"])`);
    console.log('Total offers in system:', totalOffers);
    
    // Debug: Check offers for this specific country
    const countryOffers = await client.fetch(`*[_type == "offers" && country->country == $countryName]{ title, country->country }`, { countryName });
    console.log('Offers for', countryName, ':', countryOffers);
    
    return result;
  } catch (error) {
    console.error('Error fetching offers:', error);
    throw error;
  }
};

export default function DynamicOffers({ countrySlug }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countryData, setCountryData] = useState(null);
  const [selectedBonusTypes, setSelectedBonusTypes] = useState([]);
  const [selectedBookmakers, setSelectedBookmakers] = useState([]);
  const [selectedAdvanced, setSelectedAdvanced] = useState([]);
  const [sortBy, setSortBy] = useState("Latest");
  const [sortByOpen, setSortByOpen] = useState(false);
  const [bonusTypeOptions, setBonusTypeOptions] = useState([]);
  const [bookmakerOptions, setBookmakerOptions] = useState([]);
  const [advancedOptions, setAdvancedOptions] = useState([]);
  const [loadingStage, setLoadingStage] = useState('initial'); // 'initial', 'country', 'offers', 'complete'
  const [filterLoading, setFilterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [offersPerPage] = useState(10);
  const sortByRef = useRef();

  // Helper functions for URL/Filter sync
  const slugify = (str) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .replace(/-+/g, "-");
  };
  
  const unslugify = (slug, options) => {
    if (!options) return slug;
    const found = options.find(opt => slugify(opt.name) === slug);
    return found ? found.name : slug;
  };
  
  const getFiltersFromUrl = () => {
    if (!countrySlug || !countryData) return { bonusTypes: [], bookmakers: [], advanced: [] };
    
    let bonusTypes = [], bookmakers = [], advanced = [];
    const dynamicMatch = pathname.match(new RegExp(`^/${countrySlug}/(.+)$`));
    if (dynamicMatch && !pathname.includes("/offers")) {
      const slug = dynamicMatch[1];
      if (bonusTypeOptions.length) {
        const bt = unslugify(slug, bonusTypeOptions);
        if (bonusTypeOptions.some(opt => opt.name === bt)) bonusTypes = [bt];
      }
      if (bookmakerOptions.length && bonusTypes.length === 0) {
        const bm = unslugify(slug, bookmakerOptions);
        if (bookmakerOptions.some(opt => opt.name === bm)) bookmakers = [bm];
      }
      if (advancedOptions.length && bonusTypes.length === 0 && bookmakers.length === 0) {
        const advFlat = advancedOptions.flatMap(cat => cat.subcategories || []);
        const adv = unslugify(slug, advFlat);
        if (advFlat.some(opt => opt.name === adv)) advanced = [adv];
      }
    }
    if (pathname.includes("/offers")) {
      const getArr = (key) => {
        const val = searchParams.get(key);
        return val ? val.split(",").map(v => v.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()).replace(/\s+/g, " ").trim()) : [];
      };
      bonusTypes = getArr("bonustypes");
      bookmakers = getArr("bookmakers");
      advanced = getArr("advanced");
      if (bonusTypeOptions.length) bonusTypes = bonusTypes.map(slug => unslugify(slugify(slug), bonusTypeOptions));
      if (bookmakerOptions.length) bookmakers = bookmakers.map(slug => unslugify(slugify(slug), bookmakerOptions));
      if (advancedOptions.length) {
        const advFlat = advancedOptions.flatMap(cat => cat.subcategories || []);
        advanced = advanced.map(slug => unslugify(slugify(slug), advFlat));
      }
    }
    return { bonusTypes, bookmakers, advanced };
  };
  
  const buildUrl = ({ bonusTypes, bookmakers, advanced }) => {
    if (!countrySlug || !countryData) return '/';
    
    if (bonusTypes.length === 1 && bookmakers.length === 0 && advanced.length === 0) {
      return `/${countrySlug}/${slugify(bonusTypes[0])}`;
    }
    if (bookmakers.length === 1 && bonusTypes.length === 0 && advanced.length === 0) {
      return `/${countrySlug}/${slugify(bookmakers[0])}`;
    }
    if (advanced.length === 1 && bonusTypes.length === 0 && bookmakers.length === 0) {
      return `/${countrySlug}/${slugify(advanced[0])}`;
    }
    let url = `/${countrySlug}/offers/?`;
    const params = [];
    if (bonusTypes.length) params.push(`bonustypes=${bonusTypes.map(slugify).join(",")}`);
    if (bookmakers.length) params.push(`bookmakers=${bookmakers.map(slugify).join(",")}`);
    if (advanced.length) params.push(`advanced=${advanced.map(slugify).join(",")}`);
    url += params.join("&");
    return url;
  };

  // Event handlers
  useEffect(() => {
    function handleClick(e) {
      if (sortByRef.current && !sortByRef.current.contains(e.target)) {
        setSortByOpen(false);
      }
    }
    if (sortByOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortByOpen]);

  // Fetch country data and offers
  useEffect(() => {
    if (!countrySlug) return;

    setLoading(true);
    setLoadingStage('initial');
    
    // First fetch country data
    const fetchCountryData = async () => {
      try {
        setLoadingStage('country');
        const data = await client.fetch(`
          *[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
            country,
            slug
          }
        `, { slug: countrySlug });
        
        if (!data) {
          throw new Error('Country not found');
        }
        
        setCountryData(data);
        return data;
      } catch (error) {
        console.error('Error fetching country data:', error);
        setError('Country not found');
        setLoading(false);
        setLoadingStage('initial');
        return null;
      }
    };

    const loadCountryData = async () => {
      try {
        const data = await fetchCountryData();
        if (!data) return;
        
        console.log(' Country data fetched:', data);
        setLoadingStage('offers');
        const offersData = await fetchOffers(data.country);
        
        if (!offersData) {
          console.log(' No offers data returned');
          setOffers([]);
          setError('No offers data available');
          setLoading(false);
          setLoadingStage('initial');
          return;
        }
        
        console.log('Processing', offersData.length, 'offers for', data.country);
        
        if (offersData.length === 0) {
          setError(`No offers found for ${data.country}. Please check if offers exist in Sanity CMS for this country.`);
          setLoading(false);
          setLoadingStage('initial');
          return;
        }
        
        setOffers(offersData);
        setLoadingStage('complete');
        
        // Compute bonus type counts and unique bonus types
        const bonusTypeCount = {};
        offersData.forEach(offer => {
          const bt = offer.bonusType?.name || "Other";
          bonusTypeCount[bt] = (bonusTypeCount[bt] || 0) + 1;
        });
        const bonusOptions = Object.entries(bonusTypeCount).map(([name, count]) => ({ name, count }));
        setBonusTypeOptions(bonusOptions);
        
        // Compute bookmaker counts and unique bookmakers
        const bookmakerCount = {};
        offersData.forEach(offer => {
          const bm = offer.bookmaker?.name || "Other";
          bookmakerCount[bm] = (bookmakerCount[bm] || 0) + 1;
        });
        const bmOptions = Object.entries(bookmakerCount).map(([name, count]) => ({ name, count }));
        setBookmakerOptions(bmOptions);
        
        // Compute payment method counts from actual data
        const paymentMethodCount = {};
        offersData.forEach(offer => {
          if (Array.isArray(offer.bookmaker?.paymentMethods)) {
            offer.bookmaker.paymentMethods.forEach(pm => {
              paymentMethodCount[pm] = (paymentMethodCount[pm] || 0) + 1;
            });
          }
        });
        const paymentSubcategories = Object.entries(paymentMethodCount).map(([name, count]) => ({ name, count }));
        
        // Dynamic license options based on country
        let licenseOptions = [];
        // Now we need to access the country name from the reference structure
        const countryName = data.country;
        if (countryName === "Ghana") {
          licenseOptions = [{ name: "Ghana Gaming Commission (GCG) Licenses" }];
        } else if (countryName === "Nigeria") {
          licenseOptions = [
            { name: "Lagos State Lotteries and Gaming Authority (LSLGA) - State level" },
            { name: "National Lottery Regulatory Commission (NLRC) - Federal" }
          ];
        }
        
        // Set advanced options
        setAdvancedOptions([
          {
            name: "Payment Methods",
            subcategories: paymentSubcategories
          },
          {
            name: "Licenses",
            subcategories: licenseOptions
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error(' Error loading data:', error);
        setError('Failed to load offers. Please try again.');
        setLoading(false);
        setLoadingStage('initial');
      }
    };

    loadCountryData();
  }, [countrySlug]);

  // URL/Filter sync effect
  useEffect(() => {
    if (!bonusTypeOptions.length && !bookmakerOptions.length && !advancedOptions.length) return;
    const { bonusTypes, bookmakers, advanced } = getFiltersFromUrl();
    setSelectedBonusTypes(bonusTypes);
    setSelectedBookmakers(bookmakers);
    setSelectedAdvanced(advanced);
  }, [pathname, searchParams, bonusTypeOptions, bookmakerOptions, advancedOptions]);

  const handleFilterChange = ({ bonusTypes, bookmakers, advanced }) => {
    setFilterLoading(true);
    
    // Simulate a small delay to show loading state
    setTimeout(() => {
      setFilterLoading(false);
    }, 300);
    
    const url = buildUrl({ bonusTypes, bookmakers, advanced });
    if (url !== pathname + (searchParams.toString() ? '?' + searchParams.toString() : '')) {
      router.push(url);
    }
  };

  const setSelectedBonusTypesWrapped = (arr) => {
    setSelectedBonusTypes(arr);
    handleFilterChange({ bonusTypes: arr, bookmakers: selectedBookmakers, advanced: selectedAdvanced });
  };

  const setSelectedBookmakersWrapped = (arr) => {
    setSelectedBookmakers(arr);
    handleFilterChange({ bonusTypes: selectedBonusTypes, bookmakers: arr, advanced: selectedAdvanced });
  };

  const setSelectedAdvancedWrapped = (arr) => {
    setSelectedAdvanced(arr);
    handleFilterChange({ bonusTypes: selectedBonusTypes, bookmakers: selectedBookmakers, advanced: arr });
  };

  const clearAllFilters = () => {
    setSelectedBonusTypes([]);
    setSelectedBookmakers([]);
    setSelectedAdvanced([]);
    if (countrySlug) {
      router.push(`/${countrySlug}`);
    }
  };

  // Filter logic (case-insensitive, robust)
  const filteredOffers = offers.filter((offer) => {
    const offerBookmaker = offer.bookmaker?.name ? offer.bookmaker.name.toLowerCase() : "";
    const offerBonusType = offer.bonusType?.name ? offer.bonusType.name.toLowerCase() : "";
    const offerPaymentMethods = Array.isArray(offer.bookmaker?.paymentMethods) ? offer.bookmaker.paymentMethods.map(pm => pm.toLowerCase()) : [];

    if (selectedBookmakers.length > 0 && !selectedBookmakers.some(bm => bm.toLowerCase() === offerBookmaker)) return false;
    if (selectedBonusTypes.length > 0 && !selectedBonusTypes.some(bt => bt.toLowerCase() === offerBonusType)) return false;
    if (selectedAdvanced.length > 0) {
      const selectedAdvancedLower = selectedAdvanced.map(a => a.toLowerCase());
      const paymentMatch = offerPaymentMethods.some(pm => selectedAdvancedLower.includes(pm));
      if (!paymentMatch) return false;
    }
    return true;
  });

  // Sorting logic
  let sortedOffers = [...filteredOffers];
  if (sortBy === "Latest") {
    sortedOffers.sort((a, b) => new Date(a.published) - new Date(b.published));
  } else if (sortBy === "A-Z") {
    sortedOffers.sort((a, b) => {
      const aName = a.bookmaker?.name || "";
      const bName = b.bookmaker?.name || "";
      return aName.localeCompare(bName);
    });
  }

  // Pagination logic
  const totalPages = Math.ceil(sortedOffers.length / offersPerPage);
  const startIndex = (currentPage - 1) * offersPerPage;
  const endIndex = startIndex + offersPerPage;
  const currentOffers = sortedOffers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBonusTypes, selectedBookmakers, selectedAdvanced]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Loading indicator component
  const LoadingIndicator = ({ stage }) => {
    const getStageText = () => {
      switch (stage) {
        case 'initial': return 'Initializing...';
        case 'country': return 'Loading country data...';
        case 'offers': return 'Fetching offers...';
        case 'complete': return 'Complete!';
        default: return 'Loading...';
      }
    };

    const getStageProgress = () => {
      switch (stage) {
        case 'initial': return 25;
        case 'country': return 50;
        case 'offers': return 75;
        case 'complete': return 100;
        default: return 0;
      }
    };

    return (
      <div className="text-center py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getStageProgress()}%` }}
              ></div>
            </div>
          </div>
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {getStageText()}
          </div>

        </div>
      </div>
    );
  };

  return (
    <>
      {/* Best Offers Header */}
      <div className="sticky top-16 z-10 bg-white sm:static sm:bg-transparent">
        <div className="flex items-center justify-between my-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap font-['General_Sans']">
            Best Offers <span className="text-gray-400 font-normal text-base sm:text-xl">{offers.length}</span>
            {totalPages > 1 && (
              <span className="text-gray-400 font-normal text-base sm:text-xl ml-2">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </h1>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 mr-1">Sort By:</label>
            <div className="relative" ref={sortByRef}>
              <button
                className="flex items-center gap-2 rounded-md px-3 py-1 text-sm focus:outline-none text-gray-500"
                onClick={() => setSortByOpen(p => !p)}
              >
                {sortBy}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>

              {/* Mobile slide-up panel */}
              <div className={`sm:hidden fixed bottom-0 left-0 right-0 rounded-t-2xl p-4 bg-white shadow-2xl border-t z-20 transform transition-transform duration-300 ${sortByOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="flex justify-between items-center pb-2 mb-3">
                  <h3 className="font-semibold text-lg">Sort By</h3>
                  <button onClick={() => setSortByOpen(false)} className="p-1">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {sortOptions.map(option => (
                    <button
                      key={option}
                      className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => { setSortBy(option); setSortByOpen(false); }}
                    >
                      <span>{option}</span>
                      {sortBy === option && (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="green" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop dropdown */}
              {sortByOpen && (
                <div className="hidden sm:block absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-20">
                  {sortOptions.map(option => (
                    <button
                      key={option}
                      className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100"
                      onClick={() => { setSortBy(option); setSortByOpen(false); }}
                    >
                      <span>{option}</span>
                      {sortBy === option && (
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="green" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="sm:max-w-md">
          <div className="grid grid-cols-3 gap-2 mb-6">
            <MultiSelectDropdown label="Bonus Type" options={bonusTypeOptions} selected={selectedBonusTypes} setSelected={setSelectedBonusTypesWrapped} showCount={true} />
            <MultiSelectDropdown label="Bookmaker" options={bookmakerOptions} selected={selectedBookmakers} setSelected={setSelectedBookmakersWrapped} showCount={true} />
            <MultiSelectDropdown label="Advanced" options={advancedOptions} selected={selectedAdvanced} setSelected={setSelectedAdvancedWrapped} showCount={true} nested={true} />
          </div>
        </div>
      </div>

      {/* Selected Filters Tags and Clear Filter */}
      {(selectedBonusTypes.length > 0 || selectedBookmakers.length > 0 || selectedAdvanced.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {selectedBonusTypes.map((type) => (
              <span key={type} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                {type}
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => setSelectedBonusTypesWrapped(selectedBonusTypes.filter(t => t !== type))}
                  aria-label={`Remove ${type}`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
            {selectedBookmakers.map((bm) => (
              <span key={bm} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                {bm}
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => setSelectedBookmakersWrapped(selectedBookmakers.filter(b => b !== bm))}
                  aria-label={`Remove ${bm}`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
            {selectedAdvanced.map((adv) => (
              <span key={adv} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                {adv}
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() => setSelectedAdvancedWrapped(selectedAdvanced.filter(a => a !== adv))}
                  aria-label={`Remove ${adv}`}
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
          <button
            className="ml-auto text-sm text-gray-500 underline hover:text-gray-700 font-medium"
            onClick={clearAllFilters}
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Offer Cards */}
      <div className="flex flex-col gap-4 mb-6">
        {error && <div className="text-center text-red-500">{error}</div>}
        {loading && (
          <LoadingIndicator stage={loadingStage} />
        )}
                  {!loading && !error && currentOffers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No offers match your current filters.</p>
              <button
                onClick={clearAllFilters}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Clear All Filters
              </button>
            </div>
          )}
          
          {/* Filter loading indicator */}
          {filterLoading && (
            <div className="text-center py-4">
              <div className="inline-flex items-center px-3 py-1 text-sm text-blue-600 bg-blue-100 rounded-full">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating filters...
              </div>
            </div>
          )}
        
        {/* Offers list */}
        {!loading && !error && currentOffers.length > 0 && (
          <div className="flex flex-col gap-4 mb-6">
            {currentOffers.map((offer) => (
              <div
                key={offer._id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer"
                onClick={() => {
                  if (countrySlug && offer.bonusType?.name && offer.slug?.current) {
                    router.push(`/${countrySlug}/${offer.bonusType.name.toLowerCase().replace(/\s+/g, '-')}/${offer.slug.current}`);
                  }
                }}
              >
                {/* Top row */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {offer.bookmaker?.logo ? (
                      <img src={urlFor(offer.bookmaker.logo).width(32).height(32).url()} alt={offer.bookmaker.name} width="32" height="32" className="rounded-md" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-md" />
                    )}
                    <span className="font-semibold text-gray-900 font-['General_Sans']">{offer.bookmaker?.name}</span>
                  </div>
                  <span className="text-xs text-gray-900">Published: {formatDate(offer.published)}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-lg hover:underline cursor-pointer mb-1 font-['General_Sans']">{offer.title}</h3>

                {/* Description */}
                <div className="text-sm text-gray-500 mb-2 font-['General_Sans']">
                  {offer.offerSummary && <PortableText value={offer.offerSummary} />}
                </div>

                {/* Expires */}
                <div className="flex items-center gap-1 text-sm text-black mt-auto">
                  <img src="/assets/calendar.png" alt="Calendar" width="16" height="16" className="flex-shrink-0" />
                  <span className="text-xs">Expires: {formatDate(offer.expires)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 mb-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </>
  );
}