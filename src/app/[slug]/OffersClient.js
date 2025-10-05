"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { urlFor } from "../../sanity/lib/image";
import imageUrlBuilder from '@sanity/image-url';
import { client } from "../../sanity/lib/client";
import MultiSelectDropdown from "../../components/BonusTypeDropdown";
import { formatDate } from "../../utils/dateFormatter";
import { PortableText } from "@portabletext/react";

const sortOptions = ["Latest", "Name (A-Z)"];

// Helper function to validate Sanity asset references or URL strings
const isValidAssetRef = (asset) => {
  if (!asset) return false;

  // Check if it's a URL string
  if (typeof asset === 'string' && (asset.startsWith('http://') || asset.startsWith('https://'))) {
    return true;
  }

  // Check if it's a direct asset object with _ref
  if (asset._ref) {
    const ref = asset._ref;
    return ref.startsWith('image-') && ref.length > 10 && !ref.includes('undefined');
  }

  // Check if it's a direct asset object with asset property
  if (asset.asset && asset.asset._ref) {
    const ref = asset.asset._ref;
    return ref.startsWith('image-') && ref.length > 10 && !ref.includes('undefined');
  }

  return false;
};

// PortableText components for rendering content with images
const portableTextComponents = {
  types: {
    image: ({ value }) => {
      const imageSource = value?.asset || value;
      const src = imageSource ? imageUrlBuilder(client).image(imageSource).width(800).url() : '';
      const alt = value?.alt || 'Offer image';
      if (!src) return null;
      return (
        <figure className="my-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto rounded-md"
            loading="lazy"
          />
          {value?.caption && (
            <figcaption className="text-sm text-gray-500 mt-2">{value.caption}</figcaption>
          )}
        </figure>
      );
    },
  },
};

export default function OffersClient({
  countrySlug,
  initialOffers,
  bonusTypeOptions,
  bookmakerOptions,
  advancedOptions,
  initialFilter,
  pageTitle,
  countryData,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [offers] = useState(initialOffers);
  const [selectedBonusTypes, setSelectedBonusTypes] = useState([]);
  const [selectedBookmakers, setSelectedBookmakers] = useState([]);
  const [selectedAdvanced, setSelectedAdvanced] = useState([]);
  const [sortBy, setSortBy] = useState("Latest");
  const [sortByOpen, setSortByOpen] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
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
    const found = options.find((opt) => slugify(opt.name) === slug);
    return found ? found.name : slug;
  };

  const getFiltersFromUrl = () => {
    if (!countrySlug) return { bonusTypes: [], bookmakers: [], advanced: [] };

    let bonusTypes = [],
      bookmakers = [],
      advanced = [];
    const dynamicMatch = pathname.match(new RegExp(`^/${countrySlug}/(.+)$`));
    if (dynamicMatch && !pathname.includes("/offers")) {
      const slug = dynamicMatch[1];
      if (bonusTypeOptions.length) {
        const bt = unslugify(slug, bonusTypeOptions);
        if (bonusTypeOptions.some((opt) => opt.name === bt)) bonusTypes = [bt];
      }
      if (bookmakerOptions.length && bonusTypes.length === 0) {
        const bm = unslugify(slug, bookmakerOptions);
        if (bookmakerOptions.some((opt) => opt.name === bm)) bookmakers = [bm];
      }
      if (
        advancedOptions.length &&
        bonusTypes.length === 0 &&
        bookmakers.length === 0
      ) {
        const advFlat = advancedOptions.flatMap(
          (cat) => cat.subcategories || []
        );
        const adv = unslugify(slug, advFlat);
        if (advFlat.some((opt) => opt.name === adv)) advanced = [adv];
      }
    }
    if (pathname.includes("/offers")) {
      const getArr = (key) => {
        const val = searchParams.get(key);
        return val
          ? val.split(",").map((v) =>
              v
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())
                .replace(/\s+/g, " ")
                .trim()
            )
          : [];
      };
      bonusTypes = getArr("bonustypes");
      bookmakers = getArr("bookmakers");
      advanced = getArr("advanced");
      if (bonusTypeOptions.length)
        bonusTypes = bonusTypes.map((slug) =>
          unslugify(slugify(slug), bonusTypeOptions)
        );
      if (bookmakerOptions.length)
        bookmakers = bookmakers.map((slug) =>
          unslugify(slugify(slug), bookmakerOptions)
        );
      if (advancedOptions.length) {
        const advFlat = advancedOptions.flatMap(
          (cat) => cat.subcategories || []
        );
        advanced = advanced.map((slug) => unslugify(slugify(slug), advFlat));
      }
    }
    return { bonusTypes, bookmakers, advanced };
  };

  const buildUrl = ({ bonusTypes, bookmakers, advanced }) => {
    if (!countrySlug) return "/";

    if (
      bonusTypes.length === 1 &&
      bookmakers.length === 0 &&
      advanced.length === 0
    ) {
      return `/${countrySlug}/${slugify(bonusTypes[0])}`;
    }
    if (
      bookmakers.length === 1 &&
      bonusTypes.length === 0 &&
      advanced.length === 0
    ) {
      return `/${countrySlug}/${slugify(bookmakers[0])}`;
    }
    if (
      advanced.length === 1 &&
      bonusTypes.length === 0 &&
      bookmakers.length === 0
    ) {
      return `/${countrySlug}/${slugify(advanced[0])}`;
    }
    const params = [];
    if (bonusTypes.length)
      params.push(`bonustypes=${bonusTypes.map(slugify).join(",")}`);
    if (bookmakers.length)
      params.push(`bookmakers=${bookmakers.map(slugify).join(",")}`);
    if (advanced.length)
      params.push(`advanced=${advanced.map(slugify).join(",")}`);

    if (params.length > 0) {
      return `/${countrySlug}/offers?${params.join("&")}`;
    } else {
      return `/${countrySlug}`;
    }
  };

  // URL/Filter sync effect
  useEffect(() => {
    const { bonusTypes, bookmakers, advanced } = getFiltersFromUrl();
    setSelectedBonusTypes(bonusTypes);
    setSelectedBookmakers(bookmakers);
    setSelectedAdvanced(advanced);
  }, [
    pathname,
    searchParams,
    bonusTypeOptions,
    bookmakerOptions,
    advancedOptions,
  ]);

  // Reset navigation loading state when route changes
  useEffect(() => {
    setIsNavigating(false);
    setFilterLoading(false);
  }, [pathname, searchParams]);

  // sort dropdown
  useEffect(() => {
    function handleClick(e) {
      if (sortByRef.current && !sortByRef.current.contains(e.target)) {
        setSortByOpen(false);
      }
    }
    if (sortByOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortByOpen]);

  const handleFilterChange = useCallback(({ bonusTypes, bookmakers, advanced }) => {
    const url = buildUrl({ bonusTypes, bookmakers, advanced });
    
    // Use requestAnimationFrame for smooth navigation
    requestAnimationFrame(() => {
      router.push(url);
    });
  }, [router, buildUrl]);

  const setSelectedBonusTypesWrapped = useCallback((arr) => {
    // Set loading state immediately for instant feedback
    setIsNavigating(true);
    setFilterLoading(true);
    
    // Update URL with navigation loading
    handleFilterChange({
      bonusTypes: arr,
      bookmakers: selectedBookmakers,
      advanced: selectedAdvanced,
    });
  }, [selectedBookmakers, selectedAdvanced, handleFilterChange]);

  const setSelectedBookmakersWrapped = useCallback((arr) => {
    // Set loading state immediately for instant feedback
    setIsNavigating(true);
    setFilterLoading(true);
    
    // Update URL with navigation loading
    handleFilterChange({
      bonusTypes: selectedBonusTypes,
      bookmakers: arr,
      advanced: selectedAdvanced,
    });
  }, [selectedBonusTypes, selectedAdvanced, handleFilterChange]);

  const setSelectedAdvancedWrapped = useCallback((arr) => {
    // Set loading state immediately for instant feedback
    setIsNavigating(true);
    setFilterLoading(true);
    
    // Update URL with navigation loading
    handleFilterChange({
      bonusTypes: selectedBonusTypes,
      bookmakers: selectedBookmakers,
      advanced: arr,
    });
  }, [selectedBonusTypes, selectedBookmakers, handleFilterChange]);

  const clearAllFilters = () => {
    // Set loading state for navigation
    setIsNavigating(true);
    setFilterLoading(true);
    
    // Clear filters and navigate
    setSelectedBonusTypes([]);
    setSelectedBookmakers([]);
    setSelectedAdvanced([]);
    if (countrySlug) {
      requestAnimationFrame(() => {
        router.push(`/${countrySlug}`);
      });
    }
  };

  // Generate dynamic header text based on selected filters
  const getDynamicHeaderText = useMemo(() => {
    const allSelectedFilters = [
      ...selectedBonusTypes,
      ...selectedBookmakers,
      ...selectedAdvanced
    ];

    if (allSelectedFilters.length === 0) {
      // No filters selected, use pageTitle from country data
      return countryData?.pageTitle || pageTitle || "Best Offers";
    }

    // Return comma-separated filter names
    return allSelectedFilters.join(", ");
  }, [selectedBonusTypes, selectedBookmakers, selectedAdvanced, countryData, pageTitle]);

  // Pre-compute lowercase versions of selected filters for better performance
  const selectedBookmakersLower = useMemo(() =>
    selectedBookmakers.map(bm => bm.toLowerCase()),
    [selectedBookmakers]
  );

  const selectedBonusTypesLower = useMemo(() =>
    selectedBonusTypes.map(bt => bt.toLowerCase()),
    [selectedBonusTypes]
  );

  const selectedAdvancedLower = useMemo(() =>
    selectedAdvanced.map(a => a.toLowerCase()),
    [selectedAdvanced]
  );

  // Memoized filter logic for better performance
  const filteredOffers = useMemo(() => {
    // Early return if no filters selected
    if (
      selectedBookmakers.length === 0 &&
      selectedBonusTypes.length === 0 &&
      selectedAdvanced.length === 0
    ) {
      return offers;
    }

    return offers.filter((offer) => {
      // Early bookmaker check (most common filter)
      if (selectedBookmakersLower.length > 0) {
        const offerBookmaker = offer.bookmaker?.name?.toLowerCase() || "";
        if (!selectedBookmakersLower.includes(offerBookmaker)) {
          return false;
        }
      }

      // Early bonus type check
      if (selectedBonusTypesLower.length > 0) {
        const offerBonusType = offer.bonusType?.name?.toLowerCase() || "";
        if (!selectedBonusTypesLower.includes(offerBonusType)) {
          return false;
        }
      }

      // Advanced filters check (only if needed)
      if (selectedAdvancedLower.length > 0) {
        let hasAdvancedMatch = false;

        // Check payment methods
        const paymentMethods = offer.bookmaker?.paymentMethods;
        if (Array.isArray(paymentMethods)) {
          for (const pm of paymentMethods) {
            if (pm?.name) {
              const pmName = pm.name.toLowerCase();
              if (selectedAdvancedLower.includes(pmName)) {
                hasAdvancedMatch = true;
                break;
              }
            }
          }
        }

        // Check licenses if no payment method match
        if (!hasAdvancedMatch) {
          const licenses = offer.bookmaker?.license;
          if (Array.isArray(licenses)) {
            for (const lc of licenses) {
              if (lc?.name) {
                const lcName = lc.name.toLowerCase();
                if (selectedAdvancedLower.includes(lcName)) {
                  hasAdvancedMatch = true;
                  break;
                }
              }
            }
          }
        }

        if (!hasAdvancedMatch) {
          return false;
        }
      }

      return true;
    });
  }, [offers, selectedBookmakersLower, selectedBonusTypesLower, selectedAdvancedLower]);

  // Memoized sorting logic for better performance
  const sortedOffers = useMemo(() => {
    if (sortBy === "Latest") {
      return [...filteredOffers].sort(
        (a, b) => new Date(a.published) - new Date(b.published)
      );
    } else if (sortBy === "Name (A-Z)") {
      return [...filteredOffers].sort((a, b) => {
        const aName = a.bookmaker?.name || "";
        const bName = b.bookmaker?.name || "";
        return aName.localeCompare(bName);
      });
    }
    return filteredOffers;
  }, [filteredOffers, sortBy]);

  return (
    <>
      {/* Page Title Header */}
      <div className="sticky top-16 z-40 bg-white sm:static sm:bg-transparent">
        <div className="flex items-center justify-between my-4">
          <h1 className=" font-semibold text-[24px] leading-[100%] text-[#272932] whitespace-nowrap">
            {/* {getDynamicHeaderText}{" "} */}
            <span className=" font-medium text-[16px] leading-[100%] tracking-[1%] align-middle text-[#696969]">
              ({filteredOffers.length})
            </span>
          </h1>
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-500 mr-0">Sort By:</label>
            <div className="relative" ref={sortByRef}>
              <button
                className="flex items-center gap-1 text-[#272932] text-[14px] leading-[24px] font-medium hover:text-gray-600 focus:outline-none bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                onClick={() => setSortByOpen((p) => !p)}
              >
                <span className="truncate">{sortBy}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${sortByOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Mobile slide-up panel */}
              <div
                className={`sm:hidden fixed bottom-0 left-0 right-0 rounded-t-2xl p-4 bg-white shadow-2xl border-t border-gray-200 z-[60] transform transition-transform duration-300 ${sortByOpen ? "translate-y-0" : "translate-y-full"}`}
              >
                <div className="flex justify-between items-center pb-2 mb-3">
                  <h3 className="font-semibold text-lg">Sort By</h3>
                  <button onClick={() => setSortByOpen(false)} className="p-1">
                    <svg
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100 rounded-lg"
                      onClick={() => {
                        setSortBy(option);
                        setSortByOpen(false);
                      }}
                    >
                      <span>{option}</span>
                      {sortBy === option && (
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="green"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop dropdown */}
              {sortByOpen && (
                <div className="hidden sm:block absolute right-0 mt-2 w-48 bg-[#FFFFFF] rounded-xl shadow-xl border border-gray-100 py-2 z-[60]">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-50 rounded-lg mx-1"
                      onClick={() => {
                        setSortBy(option);
                        setSortByOpen(false);
                      }}
                    >
                      <span className="text-[#272932] text-[14px] leading-[24px] font-medium font-['General_Sans']">
                        {option}
                      </span>
                      {sortBy === option && (
                        <svg
                          width="20"
                          height="20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="green"
                          strokeWidth="3"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
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
            <MultiSelectDropdown
              label="Bonus Type"
              options={bonusTypeOptions}
              selected={selectedBonusTypes}
              setSelected={setSelectedBonusTypesWrapped}
              showCount={true}
            />
            <MultiSelectDropdown
              label="Bookmaker"
              options={bookmakerOptions}
              selected={selectedBookmakers}
              setSelected={setSelectedBookmakersWrapped}
              showCount={false}
            />
            <MultiSelectDropdown
              label="Advanced"
              options={advancedOptions}
              selected={selectedAdvanced}
              setSelected={setSelectedAdvancedWrapped}
              showCount={false}
              nested={true}
            />
          </div>
        </div>
      </div>

      {/* Selected Filters Tags and Clear Filter */}
      {(selectedBonusTypes.length > 0 ||
        selectedBookmakers.length > 0 ||
        selectedAdvanced.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {selectedBonusTypes.map((type) => (
              <span
                key={type}
                className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium"
              >
                {type}
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() =>
                    setSelectedBonusTypesWrapped(
                      selectedBonusTypes.filter((t) => t !== type)
                    )
                  }
                  aria-label={`Remove ${type}`}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {selectedBookmakers.map((bm) => (
              <span
                key={bm}
                className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium"
              >
                {bm}
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() =>
                    setSelectedBookmakersWrapped(
                      selectedBookmakers.filter((b) => b !== bm)
                    )
                  }
                  aria-label={`Remove ${bm}`}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            {selectedAdvanced.map((adv) => (
              <span
                key={adv}
                className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium"
              >
                {adv}
                <button
                  className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                  onClick={() =>
                    setSelectedAdvancedWrapped(
                      selectedAdvanced.filter((a) => a !== adv)
                    )
                  }
                  aria-label={`Remove ${adv}`}
                >
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
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
      <div className="flex flex-col gap-3 mb-6">
        {(isNavigating || filterLoading) ? (
          <div className="flex flex-col gap-3">
            {/* Loading skeleton cards */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col w-full h-auto min-h-[174px] gap-[12px] animate-pulse"
              >
                {/* Top row skeleton */}
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 bg-gray-200 rounded-md"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                
                {/* Title skeleton */}
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                
                {/* Description skeleton */}
                <div className="space-y-2 mb-1">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                
                {/* Expires skeleton */}
                <div className="flex items-center gap-1 mt-auto mb-2">
                  <div className="w-4 h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-28"></div>
                </div>
              </div>
            ))}
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600 text-sm">Loading filtered results...</span>
            </div>
          </div>
        ) : (
          <>
            {sortedOffers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">
                  No offers match your current filters.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Offers list */}
            {sortedOffers.length > 0 && (
              <div className="flex flex-col gap-3 mb-6">
                {sortedOffers.map((offer) => (
              <div
                key={offer._id}
                className="group relative bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 hover:bg-[#F5F5F7] cursor-pointer w-full h-auto min-h-[174px] gap-[12px] opacity-100 border-radius-[12px] border-width-[1px]"
              >
                {countrySlug &&
                  offer.bonusType?.name &&
                  offer.slug?.current && (
                    <Link
                      href={`/${countrySlug}/${slugify(offer.bonusType.name)}/${offer.slug.current}`}
                      aria-label={offer.title}
                      className="absolute inset-0 z-10"
                    />
                  )}
                {/* Top row */}
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    {offer.bookmaker?.logo && isValidAssetRef(offer.bookmaker.logo) ? (
                      <img
                        src={offer.bookmaker.logo}
                        alt={offer.bookmaker.name}
                        width="44"
                        height="44"
                        className="rounded-md transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-gray-100 rounded-md transition-transform duration-200 group-hover:scale-105" />
                    )}
                    <span className="font-semibold text-gray-900 font-['General_Sans']">
                      {offer.bookmaker?.name}
                    </span>
                  </div>
                  <span className=" font-medium text-[14px] leading-[100%] tracking-[0.01em] text-[#696969]">
                    Published: {formatDate(offer.published)}
                  </span>
                </div>

                {/* Title */}
                <h3 className=" font-medium text-[16px] leading-[100%] tracking-[1%] text-[#272932] cursor-pointer mb-1 transition-all duration-200 group-hover:text-[#018651] group-hover:text-[20px] group-hover:font-medium group-hover:leading-[100%] group-hover:tracking-[1%]">
                  {offer.title}
                </h3>

                {/* Description */}
                <div className=" font-normal text-[16px] leading-[20px] tracking-[0.01em] text-[#696969] mb-1">
                  {offer.offerSummary && (
                    <PortableText value={offer.offerSummary} components={portableTextComponents} />
                  )}
                </div>

                {/* Expires */}
                {offer.expires && (
                  <div className="flex items-center gap-1 text-[#272932] mt-auto mb-2">
                    <img
                      src="/assets/calendar.png"
                      alt="Calendar"
                      width="16"
                      height="16"
                      className="flex-shrink-0"
                    />
                    <span className=" font-medium text-[14px] leading-[100%] tracking-[0.01em] text-[#272932]">
                      Expires: {formatDate(offer.expires)}
                    </span>
                  </div>
                )}
              </div>
            ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
