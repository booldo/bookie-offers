"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { urlFor } from "../../sanity/lib/image";
import MultiSelectDropdown from "../../components/BonusTypeDropdown";
import { formatDate } from "../../utils/dateFormatter";
import { PortableText } from "@portabletext/react";

const sortOptions = ["Latest", "A-Z"];

export default function OffersClient({
  countrySlug,
  initialOffers,
  bonusTypeOptions,
  bookmakerOptions,
  advancedOptions,
  initialFilter,
  pageTitle,
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
    let url = `/${countrySlug}/offers/?`;
    const params = [];
    if (bonusTypes.length)
      params.push(`bonustypes=${bonusTypes.map(slugify).join(",")}`);
    if (bookmakers.length)
      params.push(`bookmakers=${bookmakers.map(slugify).join(",")}`);
    if (advanced.length)
      params.push(`advanced=${advanced.map(slugify).join(",")}`);
    url += params.join("&");
    return url;
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

  const handleFilterChange = ({ bonusTypes, bookmakers, advanced }) => {
    const url = buildUrl({ bonusTypes, bookmakers, advanced });
    router.push(url);
  };

  const setSelectedBonusTypesWrapped = (arr) => {
    handleFilterChange({
      bonusTypes: arr,
      bookmakers: selectedBookmakers,
      advanced: selectedAdvanced,
    });
  };

  const setSelectedBookmakersWrapped = (arr) => {
    handleFilterChange({
      bonusTypes: selectedBonusTypes,
      bookmakers: arr,
      advanced: selectedAdvanced,
    });
  };

  const setSelectedAdvancedWrapped = (arr) => {
    handleFilterChange({
      bonusTypes: selectedBonusTypes,
      bookmakers: selectedBookmakers,
      advanced: arr,
    });
  };

  const clearAllFilters = () => {
    setSelectedBonusTypes([]);
    setSelectedBookmakers([]);
    setSelectedAdvanced([]);
    if (countrySlug) {
      router.push(`/${countrySlug}`);
    }
  };

  // Filter logic (case-insensitive)
  const filteredOffers = offers.filter((offer) => {
    const offerBookmaker = offer.bookmaker?.name
      ? offer.bookmaker.name.toLowerCase()
      : "";
    const offerBonusType = offer.bonusType?.name
      ? offer.bonusType.name.toLowerCase()
      : "";

    // Safely handle payment methods with null/undefined checks
    const offerPaymentMethods = Array.isArray(offer.bookmaker?.paymentMethods)
      ? offer.bookmaker.paymentMethods
          .filter((pm) => pm != null) // Filter out null/undefined values
          .map((pm) => {
            if (typeof pm === "string") return pm.toLowerCase();
            if (pm && typeof pm === "object" && pm.name)
              return pm.name.toLowerCase();
            return ""; // Return empty string for invalid items
          })
          .filter((pm) => pm !== "") // Filter out empty strings
      : [];

    // Safely handle licenses with null/undefined checks
    const offerLicenses = Array.isArray(offer.bookmaker?.license)
      ? offer.bookmaker.license
          .filter((lc) => lc != null) // Filter out null/undefined values
          .map((lc) => {
            if (typeof lc === "string") return lc.toLowerCase();
            if (lc && typeof lc === "object" && lc.name)
              return lc.name.toLowerCase();
            return ""; // Return empty string for invalid items
          })
          .filter((lc) => lc !== "") // Filter out empty strings
      : [];

    if (
      selectedBookmakers.length > 0 &&
      !selectedBookmakers.some((bm) => bm.toLowerCase() === offerBookmaker)
    )
      return false;
    if (
      selectedBonusTypes.length > 0 &&
      !selectedBonusTypes.some((bt) => bt.toLowerCase() === offerBonusType)
    )
      return false;
    if (selectedAdvanced.length > 0) {
      const selectedAdvancedLower = selectedAdvanced.map((a) =>
        a.toLowerCase()
      );
      const paymentMatch = offerPaymentMethods.some((pm) =>
        selectedAdvancedLower.includes(pm)
      );
      const licenseMatch = offerLicenses.some((lc) =>
        selectedAdvancedLower.includes(lc)
      );
      if (!paymentMatch && !licenseMatch) return false;
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

  return (
    <>
      {/* Page Title Header */}
      <div className="sticky top-16 z-40 bg-white sm:static sm:bg-transparent">
        <div className="flex items-center justify-between my-4">
          <h1 className="font-['General_Sans'] font-semibold text-[24px] leading-[100%] text-[#272932] whitespace-nowrap">
            {pageTitle || "Best Offers"}{" "}
            <span className="font-['General_Sans'] font-medium text-[16px] leading-[100%] tracking-[1%] align-middle text-[#696969]">
              {filteredOffers.length}
            </span>
          </h1>
          <div className="flex items-center gap-1">
            <label className="text-sm text-gray-500 mr-0">Sort By:</label>
            <div className="relative" ref={sortByRef}>
              <button
                className="flex items-center gap-1 text-[#272932] text-[14px] leading-[24px] font-medium font-['General_Sans'] hover:text-gray-600 focus:outline-none"
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
                    {offer.bookmaker?.logo ? (
                      <img
                        src={urlFor(offer.bookmaker.logo)
                          .width(44)
                          .height(44)
                          .url()}
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
                  <span className="font-['General_Sans'] font-medium text-[14px] leading-[100%] tracking-[0.01em] text-[#696969]">
                    Published: {formatDate(offer.published)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-['General_Sans'] font-medium text-[16px] leading-[100%] tracking-[1%] text-[#272932] cursor-pointer mb-1 transition-all duration-200 group-hover:text-[#018651] group-hover:text-[20px] group-hover:font-medium group-hover:leading-[100%] group-hover:tracking-[1%]">
                  {offer.title}
                </h3>

                {/* Description */}
                <div className="font-['General_Sans'] font-normal text-[16px] leading-[20px] tracking-[0.01em] text-[#696969] mb-1">
                  {offer.offerSummary && (
                    <PortableText value={offer.offerSummary} />
                  )}
                </div>

                {/* Expires */}
                <div className="flex items-center gap-1 text-[#272932] mt-auto mb-2">
                  <img
                    src="/assets/calendar.png"
                    alt="Calendar"
                    width="16"
                    height="16"
                    className="flex-shrink-0"
                  />
                  <span className="font-['General_Sans'] font-medium text-[14px] leading-[100%] tracking-[0.01em] text-[#272932]">
                    Expires: {formatDate(offer.expires)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
