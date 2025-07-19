"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import MultiSelectDropdown from "../../components/BonusTypeDropdown";
import { useRouter } from "next/navigation";
import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";

// Fetch offers from Sanity
const fetchOffers = async () => {
  const query = `*[_type == "offer" && country == "Ghana"] | order(published desc) {
    _id,
    id,
    title,
    bookmaker,
    bonusType,
    country,
    maxBonus,
    minDeposit,
    description,
    expires,
    published,
    paymentMethods,
    logo,
    terms,
    howItWorks
  }`;
  return await client.fetch(query);
};

// Fetch banners from Sanity
const fetchBanners = async () => {
  const query = `*[_type == "banner" && country == "Ghana" && isActive == true] | order(order asc) {
    _id,
    title,
    image,
    country,
    order
  }`;
  
  try {
    const banners = await client.fetch(query);
    // If no active banners, get all Ghana banners
    if (banners.length === 0) {
      const allBanners = await client.fetch(`*[_type == "banner" && country == "Ghana"] | order(order asc) {
        _id,
        title,
        image,
        country,
        order
      }`);
      return allBanners;
    }
    return banners;
  } catch (error) {
    console.error('Error fetching Ghana banners:', error);
    return [];
  }
};

const bonusTypeOptions = [
  { name: "Discount Bonus", count: 95 },
  { name: "Sign up Bonus", count: 110 },
  { name: "Free Bet", count: 20 },
  { name: "No Deposit Bonus", count: 18 },
  { name: "ACCA Boost", count: 8 },
  { name: "Cashback Offer", count: 22 },
  { name: "Refer-a-Friend", count: 28 },
  { name: "Odds Boost", count: 3 },
];

const bookmakerOptions = [
  { name: "Betway" },
  { name: "1xBet" },
  { name: "Merrybet" },
  { name: "Betika" },
  { name: "SportyBet" },
  { name: "BangBet" },
  { name: "BetKing" },
  { name: "NairaBet" },
];

const advancedOptions = [
  {
    name: "Payment Method",
    subcategories: [
      { name: "Mobile Money" },
      { name: "Bank Transfer" },
      { name: "Credit Card" },
      { name: "Debit Card" },
      { name: "E-Wallet" },
      { name: "Cryptocurrency" }
    ]
  },
  {
    name: "License",
    subcategories: [
      { name: "Licensed" },
      { name: "Unlicensed" },
      { name: "Pending License" }
    ]
  }
];

const sortOptions = ["Latest", "Expiring Soon", "Lowest Minimum Deposit", "Most Popular"];

export default function GhanaHome() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBonusTypes, setSelectedBonusTypes] = useState([]);
  const [selectedBookmakers, setSelectedBookmakers] = useState([]);
  const [selectedAdvanced, setSelectedAdvanced] = useState([]);
  const [sortBy, setSortBy] = useState("Latest");
  const [bonusTypeOptions, setBonusTypeOptions] = useState([]);
  const [bookmakerOptions, setBookmakerOptions] = useState([]);
  const [advancedOptions, setAdvancedOptions] = useState([]);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerIntervalRef = useRef();

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    if (sortDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortDropdownOpen]);

  // Auto-advance banner carousel
  useEffect(() => {
    if (banners.length > 1) {
      bannerIntervalRef.current = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000); // Change banner every 5 seconds
    }
    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    };
  }, [banners.length]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchOffers(), fetchBanners()])
      .then(([offersData, bannersData]) => {
        setOffers(offersData);
        setBanners(bannersData);
        // Compute bonus type counts and unique bonus types
        const bonusTypeCount = {};
        offersData.forEach(offer => {
          const bt = offer.bonusType || "Other";
          bonusTypeCount[bt] = (bonusTypeCount[bt] || 0) + 1;
        });
        const bonusOptions = Object.entries(bonusTypeCount).map(([name, count]) => ({ name, count }));
        setBonusTypeOptions(bonusOptions);
        // Compute bookmaker counts and unique bookmakers
        const bookmakerCount = {};
        offersData.forEach(offer => {
          const bm = offer.bookmaker || "Other";
          bookmakerCount[bm] = (bookmakerCount[bm] || 0) + 1;
        });
        const bmOptions = Object.entries(bookmakerCount).map(([name, count]) => ({ name, count }));
        setBookmakerOptions(bmOptions);
        // Compute payment method counts
        const paymentMethodCount = {};
        offersData.forEach(offer => {
          if (Array.isArray(offer.paymentMethods)) {
            offer.paymentMethods.forEach(pm => {
              paymentMethodCount[pm] = (paymentMethodCount[pm] || 0) + 1;
            });
          }
        });
        const paymentMethods = [
          "Mobile Money",
          "Bank Transfer",
          "Credit Card",
          "Debit Card",
          "E-Wallet",
          "Cryptocurrency"
        ];
        const paymentSubcategories = paymentMethods.map(name => ({ name, count: paymentMethodCount[name] || 0 }));
        // Advanced options with counts for payment methods
        setAdvancedOptions([
          {
            name: "Payment Method",
            subcategories: paymentSubcategories
          },
          {
            name: "License",
            subcategories: [
              { name: "Licensed" },
              { name: "Unlicensed" },
              { name: "Pending License" }
            ]
          }
        ]);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, []);

  // Filter logic (case-insensitive, robust)
  const filteredOffers = offers.filter((offer) => {
    // Normalize for case-insensitive comparison
    const offerBookmaker = offer.bookmaker ? offer.bookmaker.toLowerCase() : "";
    const offerBonusType = offer.bonusType ? offer.bonusType.toLowerCase() : "";
    const offerPaymentMethods = Array.isArray(offer.paymentMethods) ? offer.paymentMethods.map(pm => pm.toLowerCase()) : [];

    if (selectedBookmakers.length > 0 && !selectedBookmakers.some(bm => bm.toLowerCase() === offerBookmaker)) return false;
    if (selectedBonusTypes.length > 0 && !selectedBonusTypes.some(bt => bt.toLowerCase() === offerBonusType)) return false;
    if (selectedAdvanced.length > 0) {
      // Advanced filter: match if any selectedAdvanced is in offer.paymentMethods
      const selectedAdvancedLower = selectedAdvanced.map(a => a.toLowerCase());
      const paymentMatch = offerPaymentMethods.some(pm => selectedAdvancedLower.includes(pm));
      if (!paymentMatch) return false;
    }
    return true;
  });

  // Sorting logic
  let sortedOffers = [...filteredOffers];
  if (sortBy === "Latest") {
    sortedOffers.sort((a, b) => new Date(b.published) - new Date(a.published));
  } else if (sortBy === "Expiring Soon") {
    sortedOffers.sort((a, b) => new Date(a.expires) - new Date(b.expires));
  } else if (sortBy === "Lowest Minimum Deposit") {
    sortedOffers.sort((a, b) => {
      const aMin = a.minDeposit !== undefined && a.minDeposit !== null ? Number(a.minDeposit) : Infinity;
      const bMin = b.minDeposit !== undefined && b.minDeposit !== null ? Number(b.minDeposit) : Infinity;
      return aMin - bMin;
    });
  } else if (sortBy === "Most Popular") {
    // Count frequency of each bookmaker in filteredOffers
    const freq = {};
    filteredOffers.forEach(offer => {
      const bm = offer.bookmaker || "Unknown";
      freq[bm] = (freq[bm] || 0) + 1;
    });
    // Sort offers by bookmaker frequency (descending), then by published date (desc)
    sortedOffers.sort((a, b) => {
      const freqDiff = (freq[b.bookmaker || "Unknown"] || 0) - (freq[a.bookmaker || "Unknown"] || 0);
      if (freqDiff !== 0) return freqDiff;
      return new Date(b.published) - new Date(a.published);
    });
  }

  const goToBanner = (index) => {
    setCurrentBannerIndex(index);
    // Reset auto-advance timer
    if (bannerIntervalRef.current) {
      clearInterval(bannerIntervalRef.current);
    }
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
  };

  const nextBanner = () => {
    goToBanner((currentBannerIndex + 1) % banners.length);
  };

  const prevBanner = () => {
    goToBanner(currentBannerIndex === 0 ? banners.length - 1 : currentBannerIndex - 1);
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-2 sm:px-4 flex-1">
        {/* Banner Carousel */}
        <div className="w-full mt-8 flex flex-col items-center">
          <div className="w-full rounded-xl overflow-hidden shadow-sm relative">
            {banners.length > 0 ? (
              <>
            <Image
                  src={urlFor(banners[currentBannerIndex].image).width(1200).height(400).url()}
                  alt={banners[currentBannerIndex].title}
              width={1200}
                  height={400}
                  className="w-full h-32 sm:h-56 md:h-64 object-contain sm:object-cover"
              priority
            />
                {/* Navigation Arrows */}
                {banners.length > 1 && (
                  <>
                    <button
                      onClick={prevBanner}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                      aria-label="Previous banner"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={nextBanner}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all duration-200"
                      aria-label="Next banner"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

              </>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-xl flex items-center justify-center">
                <span className="text-gray-500">No banners available</span>
              </div>
            )}
          </div>
          {/* Carousel dots */}
          {banners.length > 0 && (
          <div className="flex justify-center mt-2 gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentBannerIndex ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
          </div>
          )}
        </div>

        {/* Best Offers Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 mb-4 gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Best Offers <span className="text-gray-400 font-normal">{offers.length}</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-medium mr-2">Sort By:</label>
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-900 focus:outline-none hover:border-gray-400 hover:shadow-sm transition-all duration-200 cursor-pointer min-w-[140px] sm:min-w-[160px] shadow-sm flex items-center justify-between"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                <span>{sortBy}</span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${sortDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortDropdownOpen && (
                <>
                  {/* Mobile: Full-width bottom sheet */}
                  <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 py-4 max-h-[60vh] overflow-y-auto animate-slide-up sm:hidden" style={{ left: 0, right: 0 }}>
                    <div className="px-4 pb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Sort By</h3>
                      <div className="flex flex-col gap-1">
                        {sortOptions.map(option => (
                          <button
                            key={option}
                            className={`w-full text-left px-3 py-3 rounded-lg transition ${
                              sortBy === option 
                                ? 'bg-blue-50 text-blue-700 font-medium' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              setSortBy(option);
                              setSortDropdownOpen(false);
                            }}
            >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Desktop: Normal popover */}
                  <div className="hidden sm:block">
                    <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in">
              {sortOptions.map(option => (
                        <button
                          key={option}
                          className={`w-full text-left px-4 py-2 text-sm transition ${
                            sortBy === option 
                              ? 'bg-blue-50 text-blue-700 font-medium' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setSortBy(option);
                            setSortDropdownOpen(false);
                          }}
                        >
                          {option}
                        </button>
              ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-nowrap gap-2 mb-6">
          <MultiSelectDropdown label="Bonus Type" options={bonusTypeOptions} selected={selectedBonusTypes} setSelected={setSelectedBonusTypes} showCount={true} />
          <MultiSelectDropdown label="Bookmaker" options={bookmakerOptions} selected={selectedBookmakers} setSelected={setSelectedBookmakers} showCount={true} />
          <MultiSelectDropdown label="Advanced" options={advancedOptions} selected={selectedAdvanced} setSelected={setSelectedAdvanced} showCount={true} nested={true} />
        </div>
        {/* Selected Filters Tags and Clear Filter */}
        {(selectedBonusTypes.length > 0 || selectedBookmakers.length > 0 || selectedAdvanced.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 justify-between mb-4 text-xs sm:text-sm">
            <div className="flex flex-wrap gap-2">
              {selectedBonusTypes.map((type) => (
                <span key={type} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-2 sm:px-3 py-1 font-medium">
                  {type}
                  <button
                    className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                    onClick={() => setSelectedBonusTypes(selectedBonusTypes.filter(t => t !== type))}
                    aria-label={`Remove ${type}`}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              {selectedBookmakers.map((bm) => (
                <span key={bm} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-2 sm:px-3 py-1 font-medium">
                  {bm}
                  <button
                    className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                    onClick={() => setSelectedBookmakers(selectedBookmakers.filter(b => b !== bm))}
                    aria-label={`Remove ${bm}`}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              {selectedAdvanced.map((adv) => (
                <span key={adv} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-2 sm:px-3 py-1 font-medium">
                  {adv}
                  <button
                    className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                    onClick={() => setSelectedAdvanced(selectedAdvanced.filter(a => a !== adv))}
                    aria-label={`Remove ${adv}`}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
            <button
              className="ml-auto text-xs sm:text-sm text-gray-500 underline hover:text-gray-700 font-medium"
              onClick={() => {
                setSelectedBonusTypes([]);
                setSelectedBookmakers([]);
                setSelectedAdvanced([]);
              }}
            >
              clear filter
            </button>
          </div>
        )}
        {/* Offer Cards */}
        <div className="flex flex-col gap-4 mb-6">
          {loading && <div className="text-center text-gray-400">Loading offers...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}
          {!loading && !error && sortedOffers.length === 0 && (
            <div className="text-center text-gray-400">No offers found.</div>
          )}
          {!loading && !error && sortedOffers.map((offer, idx) => (
            <div
              key={offer._id || offer.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer"
              onClick={() => router.push(`/gh/offers?offerId=${offer.id}`)}
            >
              <div className="flex items-center gap-3 sm:gap-4">
                {offer.logo ? (
                  <Image src={urlFor(offer.logo).width(48).height(48).url()} alt={offer.bookmaker} width={48} height={48} className="rounded-md" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-md" />
                )}
                <div>
                  <div className="font-semibold text-gray-900 text-sm sm:text-base hover:underline cursor-pointer">{offer.title}</div>
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">{offer.description}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <span className="inline-flex items-center gap-1"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> Expires: {offer.expires}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end mt-2 sm:mt-4">
                <span className="text-xs text-gray-400 mb-2">Published: {offer.published}</span>
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
        <section className="bg-white rounded-xl p-6 mb-10 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-2">Compare the Best Betting Bonuses in Ghana</h3>
          <p className="text-gray-600 text-sm mb-2">Looking to get the most out of your first deposit? At Booldo, we compare bonuses from Ghana's top betting sites like <span className="font-semibold">Betway Ghana</span>, <span className="font-semibold">1xBet Ghana</span>, and <span className="font-semibold">Merrybet</span>. Popular offers include Free Bets, which let you place a risk-free wager, and Deposit Bonuses, where your first deposit is matched up to a certain amount—sometimes as much as ₵500.</p>
          <p className="text-gray-600 text-sm">Whether you're new to sports betting or just looking for the best deals, Booldo keeps you informed with up-to-date, verified offers in one place.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
} 