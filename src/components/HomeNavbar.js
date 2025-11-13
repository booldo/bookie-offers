"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { client } from "../sanity/lib/client";
import { urlFor } from "../sanity/lib/image";
import Link from "next/link";
import { formatDate } from "../utils/dateFormatter";
import { PortableText } from "@portabletext/react";
import { useGlobalData } from "../contexts/GlobalDataContext";

// Helper function to get image URL from Sanity asset or URL string
const getImageUrl = (asset) => {
  if (!asset) return null;

  // If it's a URL string, return it directly
  if (typeof asset === 'string' && (asset.startsWith('http://') || asset.startsWith('https://'))) {
    return asset;
  }

  // If it's a Sanity asset, use urlFor
  if (asset._ref || (asset.asset && asset.asset._ref)) {
    return urlFor(asset).width(48).height(48).url();
  }

  return null;
};

const WORLD_WIDE_FLAG = { src: "/assets/flags.png", name: "World Wide", path: "/", topIcon: "/assets/dropdown.png" };

export default function HomeNavbar() {
  // Get global data from context (no API calls needed!)
  const { flags, hamburgerMenus, popularSearches, loading: globalDataLoading } = useGlobalData();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(flags[0] || WORLD_WIDE_FLAG);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const router = useRouter();
  const pathname = usePathname();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [brieflyOpen, setBrieflyOpen] = useState(false);
  const searchDebounceRef = useRef();
  const menuRef = useRef();

  // Load recent searches from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recentSearches');
      if (stored) setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Save recent searches to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }
  }, [recentSearches]);

  // Add to recent searches when a search is performed
  const addRecentSearch = (term) => {
    if (!term) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, 5); // Keep max 5
    });
  };

  // All data now comes from GlobalDataContext - NO API CALLS HERE! 🎉

  // Update selected flag based on current path (dynamic)
  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) {
      setSelectedFlag(WORLD_WIDE_FLAG);
      return;
    }
    const match = flags.find(f => f.slug === parts[0] || f.path === `/${parts[0]}`);
    setSelectedFlag(match || WORLD_WIDE_FLAG);
  }, [pathname, flags]);

  // Search handler - memoized to prevent recreating on every render
  const handleSearch = useCallback(async (term) => {
    const q = (term || '').trim();
    if (!q || q.length < 4) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    addRecentSearch(q);
    try {
      let results = [];
      
      // Search offers (worldwide - both countries, excluding expired offers)
      const offersQuery = `*[_type == "offers" && (!defined(expires) || expires > now()) && (
        title match $term ||
        bonusType->name match $term ||
        bookmaker->name match $term ||
        pt::text(description) match $term
      )] | order(_createdAt desc) {
        _id,
        slug,
        title,
        offerSummary,
        bonusType->{
          _id,
          name
        },
        bookmaker->{
          _id,
          name,
          logo,
          paymentMethods[]->{
            _id,
            name
          }
        },
        country->{country, slug},
        maxBonus,
        minDeposit,
        description,
        expires,
        published,
        _type
      }`;
      const offersResults = await client.fetch(offersQuery, { term: `*${q}*` });
      results = [...results, ...offersResults];
      
      // Search articles (worldwide)
      const articlesQuery = `*[_type == "article" && (
        title match $term ||
        pt::text(content) match $term ||
        excerpt match $term
      )] | order(_createdAt desc) {
        _id,
        slug,
        title,
        excerpt,
        publishedAt,
        _type
      }`;
      const articlesResults = await client.fetch(articlesQuery, { term: `*${q}*` });
      results = [...results, ...articlesResults];
      
      // Search bonus types (worldwide)
      const bonusTypesQuery = `*[_type == "bonusType" && (
        name match $term ||
        pt::text(description) match $term
      )] | order(_createdAt desc) {
        _id,
        name,
        description,
        slug,
        _type
      }`;
      const bonusTypesResults = await client.fetch(bonusTypesQuery, { term: `*${q}*` });
      
      // Deduplicate bonus types by _id, then by normalized name to avoid visible duplicates
      const byId = bonusTypesResults.reduce((acc, bonusType) => {
        if (!acc.some(existing => existing._id === bonusType._id)) {
          acc.push(bonusType);
        }
        return acc;
      }, []);
      const seenNames = new Set();
      const uniqueBonusTypes = byId.filter(bt => {
        const key = (bt.name || '').toLowerCase().trim();
        if (!key) return false;
        if (seenNames.has(key)) return false;
        seenNames.add(key);
        return true;
      });
      
      // Also check if we already have offers with this bonus type to avoid duplicates
      const existingBonusTypeNames = results
        .filter(item => item._type === 'offers' && item.bonusType?.name)
        .map(item => item.bonusType.name.toLowerCase());
      
      const filteredBonusTypes = uniqueBonusTypes.filter(
        bonusType => !existingBonusTypeNames.includes((bonusType.name || '').toLowerCase())
      );
      
      results = [...results, ...filteredBonusTypes];
      
      // Search banners (worldwide)
      const bannersQuery = `*[_type == "banner" && (
        title match $term ||
        pt::text(imageAlt) match $term
      )] | order(order asc) {
        _id,
        title,
        image,
        imageAlt,
        country,
        order,
        isActive,
        _type
      }`;
      const bannersResults = await client.fetch(bannersQuery, { term: `*${q}*` });
      results = [...results, ...bannersResults];
      
      // Search home content (worldwide)
      const comparisonQuery = `*[_type == "comparison" && (
        title match $term ||
        pt::text(content) match $term
      )] | order(order asc) {
        _id,
        title,
        content,
        country,
        isActive,
        order,
        _type
      }`;
      const comparisonResults = await client.fetch(comparisonQuery, { term: `*${q}*` });
      results = [...results, ...comparisonResults];
      
      // Search FAQ (worldwide)
      const faqQuery = `*[_type == "faq" && (
        question match $term ||
        pt::text(answer) match $term
      )] | order(_createdAt desc) {
        _id,
        question,
        answer,
        _type
      }`;
      const faqResults = await client.fetch(faqQuery, { term: `*${q}*` });
      results = [...results, ...faqResults];
      
      // Deduplicate results based on _id and _type
      const uniqueResults = results.reduce((acc, item) => {
        const key = `${item._type}-${item._id}`;
        const exists = acc.some(existing => `${existing._type}-${existing._id}` === key);
        if (!exists) {
          acc.push(item);
        }
        return acc;
      }, []);
      
      setSearchResults(uniqueResults);
    } catch (err) {
      setSearchError("Failed to search content");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (!searchOpen) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchValue) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      handleSearch(searchValue);
    }, 1000);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchValue, searchOpen, handleSearch]);

  const handleFlagSelect = (flag) => {
    setSelectedFlag(flag);
    setDropdownOpen(false);
    router.push(flag.path);
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    if (!dropdownOpen) return;
    
    function handleClick(e) {
      const dropdownElement = e.target.closest('.flag-dropdown');
      if (!dropdownElement) {
        setDropdownOpen(false);
      }
    }
    
    function handleScroll() {
      setDropdownOpen(false);
    }
    
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("scroll", handleScroll, true);
    
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [dropdownOpen]);

  return (
    <>
    <nav className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
          {/* Hamburger/X Toggle */}
          <button className="p-2 focus:outline-none" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <>
          <span className="block w-6 h-0.5 bg-gray-800 mb-1"></span>
          <span className="block w-6 h-0.5 bg-gray-800 mb-1"></span>
          <span className="block w-6 h-0.5 bg-gray-800"></span>
              </>
            )}
        </button>
        {/* Logo */}
        <Link href={pathname.startsWith("/ng") ? "/ng" : pathname.startsWith("/gh") ? "/gh" : "/"}>
            <img src="/assets/Booldo.svg" alt="Booldo Logo" className="cursor-pointer w-[120px] h-[41px]" />
        </Link>
      </div>
      {/* Search & Flag */}
      <div className="flex items-center gap-0 md:gap-4 flex-1 justify-end">
        {/* Search input - desktop only */}
        <div className="hidden md:flex items-center bg-[#F5F5F7] border border-[#E3E3E3] rounded-lg px-3 py-1 w-48 cursor-pointer" onClick={() => setSearchOpen(true)}>
          <svg className="text-gray-400 mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
                  className="bg-transparent outline-none text-gray-700 w-full placeholder-gray-400 font-['General_Sans']"
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            readOnly={!searchOpen}
          />
        </div>
        {/* Search icon - mobile only, always visible */}
        <button className="flex md:hidden p-2" onClick={() => setSearchOpen(true)}>
          <svg className="text-gray-800" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        {/* Flag dropdown */}
        <div className="relative flag-dropdown">
          <button
            className="flex items-center gap-1 p-2 rounded hover:bg-gray-100"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <img src={selectedFlag.topIcon} alt={selectedFlag.name || selectedFlag.country} className="w-6 h-6 rounded-full object-cover" />
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-[#FFFFFF] rounded-xl shadow-xl border border-gray-100 py-2 z-[100]">
              {globalDataLoading ? (
                // Skeleton loading for countries
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between w-full px-3 py-2 animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))
              ) : (
                flags.map(flag => (
                                  <button
                  key={flag.name || flag.country}
                  className="flex items-center justify-between w-full px-3 py-2 hover:bg-gray-50 rounded-lg mx-1"
                  onClick={() => handleFlagSelect(flag)}
                >
                  <div className="flex items-center gap-2">
                    <img src={flag.src} alt={flag.name || flag.country} className="w-5 h-5 object-cover" />
                    <span className="text-[#272932] text-[14px] leading-[24px] font-medium font-['General_Sans']">{flag.name || flag.country}</span>
                  </div>
                                      {(selectedFlag.name || selectedFlag.country) === (flag.name || flag.country) && (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="green" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
      {/* Hamburger Menu Overlay */}
      {menuOpen && (
        <div ref={menuRef} className="fixed left-0 right-0 top-[64px] w-full bg-white shadow-2xl z-50 rounded-b-xl animate-slide-down">
          <div className="flex flex-col gap-6 px-10 py-4 text-gray-800 text-base font-medium">
            {/* Default Menu Items */}
            {/* <Link 
              href={pathname.startsWith('/ng') ? '/ng' : pathname.startsWith('/gh') ? '/gh' : '/'} 
              className="hover:underline"
            >
              Home
            </Link> */}
            <div className="relative">
              <button 
                onClick={() => setBrieflyOpen(!brieflyOpen)}
                className="hover:underline flex items-center gap-1 w-full text-left font-['General_Sans']"
              >
                Briefly
                <svg className={`w-4 h-4 transition-transform duration-200 ${brieflyOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {brieflyOpen && (
                <div className="mt-2 space-y-2">
                  <Link href="/briefly" className="block pl-6 hover:underline text-gray-800 text-base font-medium font-['General_Sans']">
                    Blog
                  </Link>
                  <Link href="/briefly/calculators" className="block pl-6 hover:underline text-gray-800 text-base font-medium font-['General_Sans']">
                    Calculators
                  </Link>
                </div>
              )}
            </div>
            {hamburgerMenus.map((menu) => (
              menu?.title && !menu.noindex && menu.sitemapInclude !== false && (
                menu.url ? (
                  <a
                    key={menu._id || menu.title}
                    href={menu.url}
                    className="hover:underline font-['General_Sans']"
                    target="_self"
                  >
                    {menu.title}
                  </a>
                ) : (
                  <Link
                    key={menu._id || menu.title}
                    href={`/${menu?.slug?.current || (menu.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`}
                    className="hover:underline font-['General_Sans']"
                  >
                    {menu.title}
                  </Link>
                )
              )
            ))}
            
            
          </div>
          
        </div>
      )}
      {/* Search Suggestion Panel + Results */}
      {searchOpen && (
        <div 
          className="fixed top-0 left-0 w-full bg-white z-50 px-0 sm:px-0 pt-8 pb-12 animate-slide-down overflow-y-auto max-h-screen"
          onClick={(e) => {
            // Prevent clicks on the overlay from interfering with card clicks
            if (e.target === e.currentTarget) {
              setSearchOpen(false);
              setSearchValue("");
              setSearchResults([]);
              setSearchLoading(false);
            }
          }}
        >
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-4 pb-8">
            <div className="flex items-center gap-2 md:gap-4 mb-6">
                              <img src="/assets/Booldo.svg" alt="Booldo Logo" className="hidden md:block w-[120px] h-[41px]" />
              <div className="flex-1 flex items-center bg-[#f6f7f9] border border-gray-200 rounded-lg px-3 py-2 min-w-0">
                <svg className="text-gray-400 mr-2 flex-shrink-0" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="search"
                  className="bg-transparent outline-none text-gray-700 w-full placeholder-gray-400 min-w-0"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="ml-2 md:ml-4 text-gray-500 text-sm md:text-base font-medium hover:underline font-['General_Sans'] flex-shrink-0" onClick={() => { setSearchOpen(false); setSearchValue(""); setSearchResults([]); setSearchLoading(false); }}>Cancel</button>
            </div>
            {/* Search Results */}
            <div>
              {searchLoading && <div className="text-center text-gray-400 font-['General_Sans']">Searching...</div>}
              {searchError && <div className="text-center text-red-500 font-['General_Sans']">{searchError}</div>}
              {!searchLoading && !searchError && searchValue && searchValue.trim().length < 4 && (
                <div className="text-center text-gray-400 font-['General_Sans']">Type at least 4 characters to search.</div>
              )}
              {!searchLoading && !searchError && searchResults.length > 0 && (
                <div className="flex flex-col gap-4 mb-6">
                  {searchResults.map((item) => {
                    // Handle different content types
                    const getItemTitle = () => {
                      switch (item._type) {
                        case 'offers':
                          const bonusTypeName = item.bonusType?.name || 'Bonus';
                          const bookmakerName = item.bookmaker?.name || 'Bookmaker';
                          // If we have both names, show them, otherwise show what we have
                          if (bonusTypeName && bookmakerName && bonusTypeName !== 'Bonus' && bookmakerName !== 'Bookmaker') {
                            return `${bonusTypeName} - ${bookmakerName}`;
                          } else if (bonusTypeName && bonusTypeName !== 'Bonus') {
                            return `${bonusTypeName} Offer`;
                          } else if (bookmakerName && bookmakerName !== 'Bookmaker') {
                            return `${bookmakerName} Offer`;
                          } else {
                            return 'Offer';
                          }
                        case 'article':
                          return item.title || 'Article';
                        case 'bonusType':
                          return item.name || 'Bonus Type';
                        case 'banner':
                          return item.title || 'Banner';
                        case 'comparison':
                          return item.title || 'Home Content';
                        case 'faq':
                          return item.question || 'FAQ';
                        default:
                          return 'Unknown';
                      }
                    };

                    const getItemDescription = () => {
                      switch (item._type) {
                        case 'offers':
                          // Handle PortableText or string
                          if (typeof item.description === 'string') {
                            return item.description;
                          } else if (item.description && Array.isArray(item.description)) {
                            // Extract text from PortableText blocks
                            return item.description
                              .map(block => {
                                if (block.children) {
                                  return block.children.map(child => child.text).join('');
                                }
                                return '';
                              })
                              .join(' ')
                              .substring(0, 150) + (item.description.length > 150 ? '...' : '');
                          }
                          return '';
                        case 'article':
                          return item.excerpt || '';
                        case 'bonusType':
                          return item.description || '';
                        case 'banner':
                          return item.imageAlt || '';
                        case 'comparison':
                          // Handle PortableText or string
                          if (typeof item.content === 'string') {
                            return item.content.substring(0, 150) + (item.content.length > 150 ? '...' : '');
                          } else if (item.content && Array.isArray(item.content)) {
                            return item.content
                              .map(block => {
                                if (block.children) {
                                  return block.children.map(child => child.text).join('');
                                }
                                return '';
                              })
                              .join(' ')
                              .substring(0, 150) + (item.content.length > 150 ? '...' : '');
                          }
                          return '';
                        case 'faq':
                          return item.answer || '';
                        default:
                          return '';
                      }
                    };

                    const getItemImage = () => {
                      switch (item._type) {
                        case 'offers':
                          return item.bookmaker?.logo;
                        case 'banner':
                          return item.image;
                        default:
                          return null;
                      }
                    };

                    const getItemDate = () => {
                      switch (item._type) {
                        case 'offers':
                          return item.published;
                        case 'article':
                          return item.publishedAt;
                        default:
                          return '';
                      }
                    };

                    const getItemUrl = () => {
                      const fallbackCountrySlug = selectedFlag?.slug || '';
                      switch (item._type) {
                        case 'offers': {
                          if (item.slug?.current) {
                            const countrySlug = item.country?.slug?.current || fallbackCountrySlug;
                            return countrySlug ? `/${countrySlug}/offers/${item.slug.current}` : '/';
                          }
                          return fallbackCountrySlug ? `/${fallbackCountrySlug}` : '/';
                        }
                        case 'article': {
                          if (item.slug?.current) {
                            return `/briefly/${item.slug.current}`;
                          }
                          return '/briefly';
                        }
                        case 'bonusType': {
                          if (item.slug?.current) {
                            return fallbackCountrySlug ? `/${fallbackCountrySlug}/${item.slug.current}` : `/${item.slug.current}`;
                          }
                          return fallbackCountrySlug ? `/${fallbackCountrySlug}` : '/';
                        }
                        case 'banner':
                          return fallbackCountrySlug ? `/${fallbackCountrySlug}` : '/';
                        case 'comparison':
                          return fallbackCountrySlug ? `/${fallbackCountrySlug}` : '/';
                        case 'faq':
                          return '/faq';
                        default:
                          return '/';
                      }
                    };

                    const getItemIcon = () => {
                      switch (item._type) {
                        case 'offers':
                          return (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          );
                        case 'article':
                          return (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14,2 14,8 20,8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                              <polyline points="10,9 9,9 8,9"/>
                            </svg>
                          );
                        case 'bonusType':
                          return (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          );
                        case 'banner':
                          return (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                              <circle cx="8.5" cy="8.5" r="1.5"/>
                              <polyline points="21,15 16,10 5,21"/>
                            </svg>
                          );
                        case 'comparison':
                          return (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M9 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z"/>
                              <path d="M21 11h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2z"/>
                              <path d="M15 3h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/>
                            </svg>
                          );
                        case 'faq':
                          return (
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/>
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                          );
                        default:
                          return null;
                      }
                    };

                    return (
                      <div
                        key={item._id}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 md:p-5 flex flex-col md:flex-row md:items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer group"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const url = getItemUrl();
                          if (url && url !== '#') {
                            // Close search first, then navigate
                            setSearchOpen(false);
                            setTimeout(() => {
                              try {
                              router.replace(url);
                              } catch (err) {
                                console.error('Navigation error:', err);
                                window.location.assign(url);
                              }
                            }, 100);
                          }
                        }}
                      >
                        <div className="flex items-center gap-2 md:gap-4">
                          {getItemImage() ? (
                            <img
                              src={getImageUrl(getItemImage())}
                              alt={getItemTitle()}
                              width={48}
                              height={48}
                              className="rounded-md"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                              {getItemIcon()}
                            </div>
                          )}
                          <div>
                            {item._type === 'offers' ? (
                              <>
                                {/* Bookmaker name */}
                                <div className="font-semibold text-gray-900 text-sm mb-1 font-['General_Sans']">{item.bookmaker?.name || 'Bookmaker'}</div>
                                {/* Offer title - main display like country home page */}
                                <div className="font-medium text-[16px] leading-[100%] tracking-[1%] text-[#272932] group-hover:text-[#018651] transition-colors font-['General_Sans'] mb-1">{item.title || getItemTitle()}</div>
                                {/* Offer summary/description */}
                                <div className="text-sm text-gray-500 mt-1 font-['General_Sans']">
                                  {item.offerSummary ? (
                                    <PortableText value={item.offerSummary} />
                                  ) : (
                                    getItemDescription()
                                  )}
                                </div>
                                {/* Expires date */}
                                {item.expires && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                    <span className="inline-flex items-center gap-1">
                                      <img src="/assets/calendar.png" alt="Calendar" width="16" height="16" className="flex-shrink-0" />
                                      Expires: {formatDate(item.expires)}
                                    </span>
                                  </div>
                                )}
                                {/* Country badge */}
                                {item.country && (
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                    <span className="inline-flex items-center gap-1">
                                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                      </svg>
                                      {item.country.country}
                                    </span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="font-semibold text-gray-900 text-base group-hover:text-green-600 transition-colors font-['General_Sans']">{getItemTitle()}</div>
                                <div className="text-sm text-gray-500 mt-1 font-['General_Sans']">{getItemDescription()}</div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end mt-4 md:mt-0">
                          <span className="text-xs text-gray-400 mb-2 font-['General_Sans']">
                            {getItemDate() && `Published: ${formatDate(getItemDate())}`}
                          </span>
                          <span className="text-xs text-gray-400 capitalize font-['General_Sans']">{item._type}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Popular Searches */}
              {!searchLoading && !searchError && !searchValue && (
                <div className="mb-6">
                  <div className="text-gray-500 text-sm mb-2 font-medium font-['General_Sans']">Popular Searches</div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term, idx) => (
                      <button
                        key={term + idx}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 text-sm font-medium transition font-['General_Sans']"
                        onClick={() => {
                          setSearchValue(term);
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mt-6">
                      <div className="text-gray-500 text-sm mb-2 font-medium font-['General_Sans']">Recent Searches</div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, idx) => (
                          <button
                            key={term + idx}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 text-sm font-medium transition font-['General_Sans']"
                            onClick={() => setSearchValue(term)}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
} 