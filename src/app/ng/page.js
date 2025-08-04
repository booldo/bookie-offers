"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Image from "next/image";
import { useState, useEffect, useRef, Suspense } from "react";
import MultiSelectDropdown from "../../components/BonusTypeDropdown";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import BannerCarousel from "../../components/BannerCarousel";
import { PortableText } from '@portabletext/react';

// Fetch offers from Sanity
const fetchOffers = async () => {
  const query = `*[_type == "offers" && country == "Nigeria"] | order(_createdAt desc) {
    _id,
    slug,
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
      country
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
    faq
  }`;
  return await client.fetch(query);
};

// Fetch metadata from Sanity
const fetchMetadata = async () => {
  const query = `*[_type == "seoSettings" && country == "Nigeria"][0]{
    defaultMetaTitle,
    defaultMetaDescription,
    defaultNoindex,
    defaultNofollow,
    defaultCanonicalUrl,
    defaultSitemapInclude
  }`;
  return await client.fetch(query);
};

// Fetch banners from Sanity
const fetchBanners = async () => {
  const query = `*[_type == "banner" && country == "Nigeria" && isActive == true] | order(order asc) {
    _id,
    title,
    image,
    imageAlt,
    country,
    order,
    isActive
  }`;
  return await client.fetch(query);
};

// Fetch comparison content from Sanity
const fetchComparison = async () => {
  const query = `*[_type == "comparison" && country == "Nigeria" && isActive == true] | order(order asc) {
    _id,
    title,
    content,
    country,
    isActive,
    order
  }`;
  return await client.fetch(query);
};

const sortOptions = ["Latest", "A-Z"];

function NigeriaHomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBonusTypes, setSelectedBonusTypes] = useState([]);
  const [selectedBookmakers, setSelectedBookmakers] = useState([]);
  const [selectedAdvanced, setSelectedAdvanced] = useState([]);
  const [sortBy, setSortBy] = useState("Latest");
  const [sortByOpen, setSortByOpen] = useState(false);
  const [bonusTypeOptions, setBonusTypeOptions] = useState([]);
  const [bookmakerOptions, setBookmakerOptions] = useState([]);
  const [advancedOptions, setAdvancedOptions] = useState([]);
  const sortByRef = useRef();
  const [banners, setBanners] = useState([]);
  const [comparisonContent, setComparisonContent] = useState(null);
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    function handleClick(e) {
      if (sortByRef.current && !sortByRef.current.contains(e.target)) {
        setSortByOpen(false);
      }
    }
    if (sortByOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortByOpen]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOffers(), fetchMetadata()])
      .then(([offersData, metadataData]) => {
        setOffers(offersData);
        setMetadata(metadataData);
        
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
        // Compute payment method counts 
        const paymentMethodCount = {};
        offersData.forEach(offer => {
          if (Array.isArray(offer.bookmaker?.paymentMethods)) {
            offer.bookmaker.paymentMethods.forEach(pm => {
              paymentMethodCount[pm] = (paymentMethodCount[pm] || 0) + 1;
            });
          }
        });
        // Create payment method subcategories from actual data
        const paymentSubcategories = Object.entries(paymentMethodCount).map(([name, count]) => ({ name, count }));
        
        // Advanced options with counts for payment methods
        setAdvancedOptions([
          {
            name: "Payment Method",
            subcategories: paymentSubcategories
          },
          {
            name: "License",
            subcategories: [
              { name: "Lagos State Lotteries and Gaming Authority (LSLGA) - State level" },
              { name: "National Lottery Regulatory Commission (NLRC) - Federal" }
            ]
          }
        ]);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load offers");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    Promise.all([fetchBanners(), fetchComparison()])
      .then(([bannersData, comparisonData]) => {
      // Attach imageUrl using urlFor
        setBanners(bannersData.map(b => ({ 
        ...b, 
        imageUrl: b.image ? urlFor(b.image).width(1200).height(200).url() : undefined,
        imageAlt: b.imageAlt || b.title
      })));
        
        // Get the first active comparison content
        setComparisonContent(comparisonData.length > 0 ? comparisonData[0] : null);
      })
      .catch((err) => {
        console.error("Failed to load banners or comparison content:", err);
    });
  }, []);

  // Filter logic (case-insensitive, robust)
  const filteredOffers = offers.filter((offer) => {
    // Normalize for case-insensitive comparison
    const offerBookmaker = offer.bookmaker?.name ? offer.bookmaker.name.toLowerCase() : "";
    const offerBonusType = offer.bonusType?.name ? offer.bonusType.name.toLowerCase() : "";
    const offerPaymentMethods = Array.isArray(offer.bookmaker?.paymentMethods) ? offer.bookmaker.paymentMethods.map(pm => pm.toLowerCase()) : [];

    if (selectedBookmakers.length > 0 && !selectedBookmakers.some(bm => bm.toLowerCase() === offerBookmaker)) return false;
    if (selectedBonusTypes.length > 0 && !selectedBonusTypes.some(bt => bt.toLowerCase() === offerBonusType)) return false;
    if (selectedAdvanced.length > 0) {
      // Advanced filter: match if any selectedAdvanced is in offer.bookmaker.paymentMethods
      const selectedAdvancedLower = selectedAdvanced.map(a => a.toLowerCase());
      const paymentMatch = offerPaymentMethods.some(pm => selectedAdvancedLower.includes(pm));
      if (!paymentMatch) return false;
    }
    return true;
  });

  // Sorting logic
  let sortedOffers = [...filteredOffers];
  if (sortBy === "Latest") {
    // Sort by published date, oldest first (ascending)
    sortedOffers.sort((a, b) => new Date(a.published) - new Date(b.published));
  } else if (sortBy === "A-Z") {
    // Sort by bookmaker name alphabetically
    sortedOffers.sort((a, b) => {
      const aName = a.bookmaker?.name || "";
      const bName = b.bookmaker?.name || "";
      return aName.localeCompare(bName);
    });
  }

  // --- URL/Filter Sync Logic ---
  // Helper: slugify for pretty URLs
  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .replace(/-+/g, "-");
  }
  function unslugify(slug, options) {
    if (!options) return slug;
    const found = options.find(opt => slugify(opt.name) === slug);
    return found ? found.name : slug;
  }
  function getFiltersFromUrl() {
    let bonusTypes = [], bookmakers = [], advanced = [];
    const prettyMatch = pathname.match(/^\/ng\/(.+)$/);
    if (prettyMatch && !pathname.includes("/offers")) {
      const slug = prettyMatch[1];
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
  }
  function buildUrl({ bonusTypes, bookmakers, advanced }) {
    if (bonusTypes.length === 1 && bookmakers.length === 0 && advanced.length === 0) {
      return `/ng/${slugify(bonusTypes[0])}`;
    }
    if (bookmakers.length === 1 && bonusTypes.length === 0 && advanced.length === 0) {
      return `/ng/${slugify(bookmakers[0])}`;
    }
    if (advanced.length === 1 && bonusTypes.length === 0 && bookmakers.length === 0) {
      return `/ng/${slugify(advanced[0])}`;
    }
    let url = "/ng/offers/?";
    const params = [];
    if (bonusTypes.length) params.push(`bonustypes=${bonusTypes.map(slugify).join(",")}`);
    if (bookmakers.length) params.push(`bookmakers=${bookmakers.map(slugify).join(",")}`);
    if (advanced.length) params.push(`advanced=${advanced.map(slugify).join(",")}`);
    url += params.join("&");
    return url;
  }
  useEffect(() => {
    if (!bonusTypeOptions.length && !bookmakerOptions.length && !advancedOptions.length) return;
    const { bonusTypes, bookmakers, advanced } = getFiltersFromUrl();
    setSelectedBonusTypes(bonusTypes);
    setSelectedBookmakers(bookmakers);
    setSelectedAdvanced(advanced);
    // eslint-disable-next-line
  }, [pathname, searchParams, bonusTypeOptions, bookmakerOptions, advancedOptions]);
  function handleFilterChange({ bonusTypes, bookmakers, advanced }) {
    const url = buildUrl({ bonusTypes, bookmakers, advanced });
    router.push(url);
  }
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
    router.push("/ng");
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-2 sm:px-4 flex-1">
        {/* SEO Metadata */}
        {metadata && (
          <>
            <title>{metadata.defaultMetaTitle || "Best Betting Sites Nigeria | Booldo"}</title>
            <meta name="description" content={metadata.defaultMetaDescription || "Discover the best betting sites in Nigeria with exclusive bonuses and offers. Compare bookmakers and find the perfect betting experience."} />
            {metadata.defaultNoindex && <meta name="robots" content="noindex, nofollow" />}
            {metadata.defaultCanonicalUrl && <link rel="canonical" href={metadata.defaultCanonicalUrl} />}
          </>
        )}
        {/* Banner Carousel - remove mt-4 and sm:mt-8 from BannerCarousel if present */}
        <div className="flex flex-col items-center">
          <BannerCarousel banners={banners} />
        </div>
        {/* Best Offers Header */}
        <div className="sticky top-16 z-10 bg-white sm:static sm:bg-transparent">
          <div className="flex items-center justify-between my-4">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 whitespace-nowrap">Best Offers <span className="text-gray-400 font-normal text-base sm:text-xl">{offers.length}</span></h1>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500 mr-1">Sort By:</label>
              <div className="relative" ref={sortByRef}>
                <button
                  className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-1 text-sm focus:outline-none"
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
              clear filter
            </button>
          </div>
        )}

        {/* Bonus Type Cards */}
        <div className="flex flex-col gap-4 mb-6">
          
          {error && <div className="text-center text-red-500">{error}</div>}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          {!loading && !error && sortedOffers.length === 0 && (
            <div className="text-center text-gray-400">No bonus types found.</div>
          )}
          {!loading && !error && sortedOffers.map((offer, idx) => (
            <div
              key={offer._id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer"
              onClick={() => router.push(`/ng/${offer.bonusType?.name?.toLowerCase().replace(/\s+/g, '-')}/${offer.slug?.current}`)}
            >
              {/* Top row */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                {offer.bookmaker?.logo ? (
                    <Image src={urlFor(offer.bookmaker.logo).width(32).height(32).url()} alt={offer.bookmaker.name} width={32} height={32} className="rounded-md" />
                ) : (
                    <div className="w-8 h-8 bg-gray-100 rounded-md" />
                )}
                  <span className="font-semibold text-gray-900">{offer.bookmaker?.name}</span>
                </div>
                <span className="text-xs text-gray-900">Published: {offer.published}</span>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-green-700 text-lg hover:underline cursor-pointer mb-1">{offer.bonusType?.name}</h3>

              {/* Description */}
              <div className="text-sm text-gray-500 mb-2">
                {offer.description && <PortableText value={offer.description} />}
              </div>

              {/* Expires */}
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-auto font-bold">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" className="flex-shrink-0"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <span className="text-xs">Expires: {offer.expires}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Loading more... */}
        {/*
          <div className="flex justify-center mb-8">
            <span className="text-gray-400 flex items-center gap-2"><svg className="animate-spin" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 0 1 8-8" /></svg> Loading more...</span>
          </div>
        */}

        {/* Comparison Section */}
        {comparisonContent && (
          <section className="bg-white rounded-xl p-4 sm:p-6 mb-10 shadow-sm border border-gray-100">
            <h2 className="text-xl sm:text-2xl font-semibold mb-3">{comparisonContent.title}</h2>
            <div className="text-gray-600 text-sm">
              <PortableText value={comparisonContent.content} />
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function NigeriaHome() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NigeriaHomeContent />
    </Suspense>
  );
} 