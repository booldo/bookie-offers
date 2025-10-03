"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";
import MultiSelectDropdown from "../../components/BonusTypeDropdown";
import { formatDate } from "../../utils/dateFormatter";
import { PortableText } from "@portabletext/react";
import {
  fetchBookmakersForCountry,
  processBookmakerOptions,
  fetchBonusTypesForCountry,
} from "../../lib/bookmakerFetcher";

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

// Fetch offers from Sanity
const fetchOffers = async (countryData) => {
  if (!countryData) {
    console.log("fetchOffers: No country data provided");
    return [];
  }

  // Extract country name from country data
  let countryName;
  if (typeof countryData === "string") {
    countryName = countryData;
  } else {
    countryName =
      countryData.country ||
      countryData.name ||
      countryData.title ||
      countryData.slug;
  }

  if (!countryName) {
    console.log(
      "fetchOffers: Could not extract country name from data:",
      countryData
    );
    return [];
  }

  // Query offers by country reference name, excluding hidden offers and expired offers
  const query = `*[_type == "offers" && country->country == $countryName && (noindex != true) && (sitemapInclude != false) && (!defined(expires) || expires > now())] | order(_createdAt desc) {
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
      logoUrl,
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
    const result = await client.fetch(query, { countryName });
    return result;
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
};

export default function DynamicOffers({
  countrySlug,
  initialFilter = null,
  filterInfo = null,
}) {
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
  const [countryId, setCountryId] = useState(null);
  const [loadingStage, setLoadingStage] = useState("initial");
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
    const found = options.find((opt) => slugify(opt.name) === slug);
    return found ? found.name : slug;
  };

  // Apply initial filter if provided
  const applyInitialFilter = (filterSlug) => {
    if (
      !filterSlug ||
      !bonusTypeOptions.length ||
      !bookmakerOptions.length ||
      !advancedOptions.length
    )
      return;

    // Try to match with bonus types first
    const bonusTypeMatch = bonusTypeOptions.find(
      (bt) => slugify(bt.name) === filterSlug
    );
    if (bonusTypeMatch) {
      setSelectedBonusTypes([bonusTypeMatch.name]);
      return;
    }

    // Try to match with bookmakers
    const bookmakerMatch = bookmakerOptions.find(
      (bm) => slugify(bm.name) === filterSlug
    );
    if (bookmakerMatch) {
      setSelectedBookmakers([bookmakerMatch.name]);
      return;
    }

    // Try to match with advanced options (payment methods, licenses)
    const advancedFlat = advancedOptions.flatMap(
      (cat) => cat.subcategories || []
    );
    const advancedMatch = advancedFlat.find(
      (adv) => slugify(adv.name) === filterSlug
    );
    if (advancedMatch) {
      setSelectedAdvanced([advancedMatch.name]);
      return;
    }
  };

  const getFiltersFromUrl = () => {
    if (!countrySlug || !countryData)
      return { bonusTypes: [], bookmakers: [], advanced: [] };

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
        bonusTypes = bonusTypes.map((s) =>
          unslugify(slugify(s), bonusTypeOptions)
        );
      if (bookmakerOptions.length)
        bookmakers = bookmakers.map((s) =>
          unslugify(slugify(s), bookmakerOptions)
        );
      if (advancedOptions.length) {
        const advFlat = advancedOptions.flatMap(
          (cat) => cat.subcategories || []
        );
        advanced = advanced.map((s) => unslugify(slugify(s), advFlat));
      }
    }
    return { bonusTypes, bookmakers, advanced };
  };

  const buildUrl = ({ bonusTypes, bookmakers, advanced }) => {
    if (!countrySlug || !countryData) return "/";

    // If no filters are selected, go to base country page
    if (
      bonusTypes.length === 0 &&
      bookmakers.length === 0 &&
      advanced.length === 0
    ) {
      return `/${countrySlug}`;
    }

    // Single filter cases (for clean URLs)
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

    // Multiple filters or mixed filters - use query parameters
    const params = [];
    if (bonusTypes.length > 0)
      params.push(`bonustypes=${bonusTypes.map(slugify).join(",")}`);
    if (bookmakers.length > 0)
      params.push(`bookmakers=${bookmakers.map(slugify).join(",")}`);
    if (advanced.length > 0)
      params.push(`advanced=${advanced.map(slugify).join(",")}`);

    if (params.length > 0) {
      return `/${countrySlug}/offers?${params.join("&")}`;
    } else {
      return `/${countrySlug}`;
    }
  };

  // Apply initial filter when options are loaded
  useEffect(() => {
    if (
      initialFilter &&
      bonusTypeOptions.length > 0 &&
      bookmakerOptions.length > 0 &&
      advancedOptions.length > 0
    ) {
      applyInitialFilter(initialFilter);
    }
  }, [initialFilter, bonusTypeOptions, bookmakerOptions, advancedOptions]);

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

    setError(null);
    setLoading(true);
    setLoadingStage("initial");

    // First fetch country data
    const fetchCountryData = async () => {
      try {
        setLoadingStage("country");
        const data = await client.fetch(
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

        if (!data) {
          throw new Error("Country not found");
        }

        setCountryData(data);
        setCountryId(data._id);
        return data;
      } catch (error) {
        console.error("Error fetching country data:", error);
        setError("Country not found");
        setLoading(false);
        setLoadingStage("initial");
        return null;
      }
    };

    const loadCountryData = async () => {
      try {
        const data = await fetchCountryData();
        if (!data) return;

        console.log(" Country data fetched:", data);
        setLoadingStage("offers");
        const offersData = await fetchOffers(data.country);

        if (!offersData) {
          setOffers([]);
          setError("No offers data available");
          setLoading(false);
          setLoadingStage("initial");
          return;
        }

        console.log(
          "Processing",
          offersData.length,
          "offers for",
          data.country
        );

        if (offersData.length === 0) {
          setError(
            `No offers found for ${data.country}. Please check if offers exist in Sanity CMS for this country.`
          );
          setLoading(false);
          setLoadingStage("initial");
          return;
        }

        setOffers(offersData);
        setLoadingStage("complete");

        // Fetch all bonus types and bookmakers for the country using enhanced fetcher
        let allBonusTypes = [];
        let allBookmakers = [];
        if (data?._id) {
          try {
            const [btList, bmList] = await Promise.all([
              fetchBonusTypesForCountry(data._id),
              fetchBookmakersForCountry(data._id, data.country),
            ]);
            allBonusTypes = btList || [];
            allBookmakers = bmList || [];
          } catch (e) {
            console.error("Failed fetching full lists:", e);
          }
        }

        // Compute bonus type counts and unique bonus types
        const bonusTypeCount = {};
        offersData.forEach((offer) => {
          const bt = offer.bonusType?.name || "Other";
          bonusTypeCount[bt] = (bonusTypeCount[bt] || 0) + 1;
        });
        const bonusOptions = Object.entries(bonusTypeCount)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setBonusTypeOptions(bonusOptions);

        // Process bookmaker options using enhanced utility
        const bmOptions = processBookmakerOptions(offersData, allBookmakers);
        setBookmakerOptions(bmOptions);

        // Compute payment method counts from actual data
        const paymentMethodCount = {};
        offersData.forEach((offer) => {
          if (Array.isArray(offer.bookmaker?.paymentMethods)) {
            offer.bookmaker.paymentMethods.forEach((pm) => {
              // Handle both old string format and new reference format
              const pmName = typeof pm === "string" ? pm : pm.name;
              if (pmName) {
                paymentMethodCount[pmName] =
                  (paymentMethodCount[pmName] || 0) + 1;
              }
            });
          }
        });
        const paymentSubcategories = Object.entries(paymentMethodCount).map(
          ([name, count]) => ({ name, count })
        );

        // Compute license counts from actual offers data
        const licenseCount = {};
        offersData.forEach((offer) => {
          if (Array.isArray(offer.bookmaker?.license)) {
            offer.bookmaker.license.forEach((license) => {
              // Handle both old string format and new reference format
              const licenseName =
                typeof license === "string" ? license : license.name;
              if (licenseName) {
                licenseCount[licenseName] =
                  (licenseCount[licenseName] || 0) + 1;
              }
            });
          }
        });
        const licenseOptions = Object.entries(licenseCount).map(
          ([name, count]) => ({ name, count })
        );

        // Set advanced options
        setAdvancedOptions([
          {
            name: "Payment Methods",
            subcategories: paymentSubcategories,
          },
          {
            name: "Licenses",
            subcategories: licenseOptions,
          },
        ]);

        setLoading(false);
      } catch (error) {
        console.error(" Error loading data:", error);
        setError("Failed to load offers. Please try again.");
        setLoading(false);
        setLoadingStage("initial");
      }
    };

    loadCountryData();
  }, [countrySlug]);

  // URL/Filter sync effect
  useEffect(() => {
    if (
      !bonusTypeOptions.length &&
      !bookmakerOptions.length &&
      !advancedOptions.length
    )
      return;
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

  // Apply initial filter when component loads
  useEffect(() => {
    if (
      bonusTypeOptions.length > 0 &&
      bookmakerOptions.length > 0 &&
      advancedOptions.length > 0
    ) {
      if (filterInfo?.type === "combination") {
        // Handle combination filters
        const { parts, combinationType, partCount } = filterInfo;
        let bonusTypes = [];
        let bookmakers = [];
        let advanced = [];

        // Enhanced parsing for higher-order combinations
        if (combinationType === "2-way") {
          // 2-way combinations: try to match each part intelligently
          parts.forEach((part) => {
            const partLower = part.toLowerCase();
            matchFilterPart(
              partLower,
              bonusTypeOptions,
              bookmakerOptions,
              advancedOptions,
              bonusTypes,
              bookmakers,
              advanced
            );
          });
        } else if (combinationType === "3-way") {
          // 3-way combinations: typically Bonus Type + Bookmaker + Payment Method
          if (parts.length === 3) {
            // Try to match in order: bonus type, bookmaker, payment method
            const [part1, part2, part3] = parts;

            // First part: likely bonus type
            matchFilterPart(
              part1.toLowerCase(),
              bonusTypeOptions,
              [],
              [],
              bonusTypes,
              [],
              []
            );

            // Second part: likely bookmaker
            matchFilterPart(
              part2.toLowerCase(),
              [],
              bookmakerOptions,
              [],
              [],
              bookmakers,
              []
            );

            // Third part: likely payment method or license
            matchFilterPart(
              part3.toLowerCase(),
              [],
              [],
              advancedOptions,
              [],
              [],
              advanced
            );
          }
        } else if (combinationType === "4-way") {
          // 4-way combinations: Bonus Type + Bookmaker + Payment Method + License
          if (parts.length === 4) {
            const [part1, part2, part3, part4] = parts;

            // Structured matching for 4-way combinations
            matchFilterPart(
              part1.toLowerCase(),
              bonusTypeOptions,
              [],
              [],
              bonusTypes,
              [],
              []
            );
            matchFilterPart(
              part2.toLowerCase(),
              [],
              bookmakerOptions,
              [],
              [],
              bookmakers,
              []
            );
            matchFilterPart(
              part3.toLowerCase(),
              [],
              [],
              advancedOptions,
              [],
              [],
              advanced
            );
            matchFilterPart(
              part4.toLowerCase(),
              [],
              [],
              advancedOptions,
              [],
              [],
              advanced
            );
          }
        } else if (combinationType === "5-way+") {
          // 5-way+ combinations: Bonus Type + Bookmaker + Payment Method + License + Features
          if (parts.length >= 5) {
            const [part1, part2, part3, part4, ...remainingParts] = parts;

            // First 4 parts follow the same pattern as 4-way
            matchFilterPart(
              part1.toLowerCase(),
              bonusTypeOptions,
              [],
              [],
              bonusTypes,
              [],
              []
            );
            matchFilterPart(
              part2.toLowerCase(),
              [],
              bookmakerOptions,
              [],
              [],
              bookmakers,
              []
            );
            matchFilterPart(
              part3.toLowerCase(),
              [],
              [],
              advancedOptions,
              [],
              [],
              advanced
            );
            matchFilterPart(
              part4.toLowerCase(),
              [],
              [],
              advancedOptions,
              [],
              [],
              advanced
            );

            // Remaining parts are likely features or additional criteria
            remainingParts.forEach((part) => {
              matchFilterPart(
                part.toLowerCase(),
                [],
                [],
                advancedOptions,
                [],
                [],
                advanced
              );
            });
          }
        }

        if (
          bonusTypes.length > 0 ||
          bookmakers.length > 0 ||
          advanced.length > 0
        ) {
          setSelectedBonusTypes(bonusTypes);
          setSelectedBookmakers(bookmakers);
          setSelectedAdvanced(advanced);
          return;
        }
      } else if (initialFilter) {
        // Handle single filters (backward compatibility)
        const filterLower = initialFilter.toLowerCase();

        // Check bonus types
        const matchingBonusType = bonusTypeOptions.find(
          (bt) => bt.name.toLowerCase().replace(/\s+/g, "-") === filterLower
        );
        if (matchingBonusType) {
          setSelectedBonusTypes([matchingBonusType.name]);
          return;
        }

        // Check bookmakers
        const matchingBookmaker = bookmakerOptions.find(
          (bm) => bm.name.toLowerCase().replace(/\s+/g, "-") === filterLower
        );
        if (matchingBookmaker) {
          setSelectedBookmakers([matchingBookmaker.name]);
          return;
        }

        // Check advanced options (payment methods and licenses)
        const allAdvancedOptions = advancedOptions.flatMap(
          (cat) => cat.subcategories || []
        );
        const matchingAdvanced = allAdvancedOptions.find(
          (adv) => adv.name.toLowerCase().replace(/\s+/g, "-") === filterLower
        );
        if (matchingAdvanced) {
          setSelectedAdvanced([matchingAdvanced.name]);
          return;
        }
      }
    }
  }, [
    initialFilter,
    filterInfo,
    bonusTypeOptions,
    bookmakerOptions,
    advancedOptions,
  ]);

  // Helper function to match filter parts intelligently
  const matchFilterPart = (
    partLower,
    bonusTypeOptions,
    bookmakerOptions,
    advancedOptions,
    bonusTypes,
    bookmakers,
    advanced
  ) => {
    // Check bonus types
    const matchingBonusType = bonusTypeOptions.find(
      (bt) => bt.name.toLowerCase().replace(/\s+/g, "-") === partLower
    );
    if (matchingBonusType) {
      bonusTypes.push(matchingBonusType.name);
      return;
    }

    // Check bookmakers
    const matchingBookmaker = bookmakerOptions.find(
      (bm) => bm.name.toLowerCase().replace(/\s+/g, "-") === partLower
    );
    if (matchingBookmaker) {
      bookmakers.push(matchingBookmaker.name);
      return;
    }

    // Check advanced options (payment methods and licenses)
    const allAdvancedOptions = advancedOptions.flatMap(
      (cat) => cat.subcategories || []
    );
    const matchingAdvanced = allAdvancedOptions.find(
      (adv) => adv.name.toLowerCase().replace(/\s+/g, "-") === partLower
    );
    if (matchingAdvanced) {
      advanced.push(matchingAdvanced.name);
      return;
    }
  };

  const setSelectedBonusTypesWrapped = useCallback(
    (arr) => {
      // Update state immediately for instant UI response
      setSelectedBonusTypes(arr);

      // Update URL immediately
      const url = buildUrl({
        bonusTypes: arr,
        bookmakers: selectedBookmakers,
        advanced: selectedAdvanced,
      });
      const currentUrl =
        pathname +
        (searchParams.toString() ? "?" + searchParams.toString() : "");

      if (url !== currentUrl) {
        router.replace(url, { scroll: false });
      }
    },
    [selectedBookmakers, selectedAdvanced, pathname, searchParams, router, buildUrl]
  );

  const setSelectedBookmakersWrapped = useCallback(
    (arr) => {
      // Update state immediately for instant UI response
      setSelectedBookmakers(arr);

      // Update URL immediately
      const url = buildUrl({
        bonusTypes: selectedBonusTypes,
        bookmakers: arr,
        advanced: selectedAdvanced,
      });
      const currentUrl =
        pathname +
        (searchParams.toString() ? "?" + searchParams.toString() : "");

      if (url !== currentUrl) {
        router.replace(url, { scroll: false });
      }
    },
    [selectedBonusTypes, selectedAdvanced, pathname, searchParams, router, buildUrl]
  );

  const setSelectedAdvancedWrapped = useCallback(
    (arr) => {
      // Update state immediately for instant UI response
      setSelectedAdvanced(arr);

      // Update URL immediately
      const url = buildUrl({
        bonusTypes: selectedBonusTypes,
        bookmakers: selectedBookmakers,
        advanced: arr,
      });
      const currentUrl =
        pathname +
        (searchParams.toString() ? "?" + searchParams.toString() : "");

      if (url !== currentUrl) {
        router.replace(url, { scroll: false });
      }
    },
    [selectedBonusTypes, selectedBookmakers, pathname, searchParams, router, buildUrl]
  );

  const clearAllFilters = useCallback(() => {
    setSelectedBonusTypes([]);
    setSelectedBookmakers([]);
    setSelectedAdvanced([]);
    if (countrySlug) {
      router.replace(`/${countrySlug}`, { scroll: false });
    }
  }, [countrySlug]);

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
        if (selectedBookmakersLower.includes(offerBookmaker)) {
          return true;
        }
      }

      // Early bonus type check
      if (selectedBonusTypesLower.length > 0) {
        const offerBonusType = offer.bonusType?.name?.toLowerCase() || "";
        if (selectedBonusTypesLower.includes(offerBonusType)) {
          return true;
        }
      }

      // Advanced filters check (only if needed)
      if (selectedAdvancedLower.length > 0) {
        // Check payment methods
        const paymentMethods = offer.bookmaker?.paymentMethods;
        if (Array.isArray(paymentMethods)) {
          for (const pm of paymentMethods) {
            if (pm?.name) {
              const pmName = pm.name.toLowerCase();
              if (selectedAdvancedLower.includes(pmName)) {
                return true;
              }
            }
          }
        }

        // Check licenses
        const licenses = offer.bookmaker?.license;
        if (Array.isArray(licenses)) {
          for (const lc of licenses) {
            if (lc?.name) {
              const lcName = lc.name.toLowerCase();
              if (selectedAdvancedLower.includes(lcName)) {
                return true;
              }
            }
          }
        }
      }

      return false;
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

  // Memoized pagination logic for better performance
  const { totalPages, currentOffers } = useMemo(() => {
    const totalPages = Math.ceil(sortedOffers.length / offersPerPage);
    const startIndex = (currentPage - 1) * offersPerPage;
    const endIndex = startIndex + offersPerPage;
    const currentOffers = sortedOffers.slice(startIndex, endIndex);
    return { totalPages, currentOffers };
  }, [sortedOffers, currentPage, offersPerPage]);

  // Generate dynamic header text based on selected filters
  const getDynamicHeaderText = useMemo(() => {
    const allSelectedFilters = [
      ...selectedBonusTypes,
      ...selectedBookmakers,
      ...selectedAdvanced
    ];

    if (allSelectedFilters.length === 0) {
      // No filters selected, use default from Sanity
      return countryData?.pageTitle || "Best Offers";
    }

    // Return comma-separated filter names
    return allSelectedFilters.join(", ");
  }, [selectedBonusTypes, selectedBookmakers, selectedAdvanced, countryData]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBonusTypes, selectedBookmakers, selectedAdvanced]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading indicator component
  const LoadingIndicator = () => (
    <div className="space-y-6">
      {/* Filter skeleton */}
      <div className="sticky top-16 z-10 bg-white sm:static sm:bg-transparent">
        <div className="flex items-center justify-between my-4">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        <div className="sm:max-w-md">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Offer cards skeleton */}
      <div className="flex flex-col gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-32"></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Best Offers Header */}
      <div className="sticky top-16 z-40 bg-white sm:static sm:bg-transparent">
        <div className="flex items-center justify-between my-4">
          <h1 className=" font-semibold text-[24px] leading-[100%] text-[#272932] whitespace-nowrap">
            {getDynamicHeaderText}{" "}
            <span className=" font-medium text-[16px] leading-[100%] tracking-[1%] align-middle text-[#696969]">
              ({filteredOffers.length})
            </span>
            {totalPages > 1 && (
              <span className=" font-medium text-[16px] leading-[100%] tracking-[1%] align-middle text-[#696969] ml-2">
                (Page {currentPage} of {totalPages})
              </span>
            )}
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
        {error && <div className="text-center text-red-500">{error}</div>}
        {loading && <LoadingIndicator stage={loadingStage} />}
        {!loading && !error && currentOffers.length === 0 && (
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

        {/* Removed filter loading indicator */}

        {/* Offers list */}
        {!loading && !error && currentOffers.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            {currentOffers.map((offer) => (
              <div
                key={offer._id}
                className="group relative bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 hover:bg-[#F5F5F7] cursor-pointer w-full h-auto min-h-[174px] gap-[12px] opacity-100 border-radius-[12px] border-width-[1px]"
              >
                {countrySlug &&
                  offer.bonusType?.name &&
                  offer.slug?.current && (
                    <Link
                      href={`/${countrySlug}/${offer.bonusType.name.toLowerCase().replace(/\s+/g, "-")}/${offer.slug.current}`}
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
                    <span className=" font-medium text-[14px] leading-[100%] tracking-[0.01em] text-[#272932] align-middle">
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
                    <PortableText value={offer.offerSummary} />
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
                    ? "bg-blue-600 text-white"
                    : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
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
