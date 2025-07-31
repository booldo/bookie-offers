"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { client } from "../sanity/lib/client";
import { urlFor } from "../sanity/lib/image";
import Link from "next/link";

const flags = [
  { src: "/assets/flags.png", name: "World Wide", path: "/", topIcon: "/assets/dropdown.png" },
  { src: "/assets/ghana-square.png", name: "Ghana", path: "/gh", topIcon: "/assets/ghana.png" },
  { src: "/assets/nigeria-square.png", name: "Nigeria", path: "/ng", topIcon: "/assets/nigeria.png" },
];

const popularSearches = [
  "Welcome bonus",
  "Deposit bonus",
  "Best bonus",
  "Best bookies",
  "Best bookies"
];

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(flags[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const router = useRouter();
  const pathname = usePathname();
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
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

  // Update selected flag based on current path
  useEffect(() => {
    let currentFlag = flags[0];
    if (pathname.startsWith("/ng")) {
      currentFlag = flags.find(flag => flag.name === "Nigeria");
    } else if (pathname.startsWith("/gh")) {
      currentFlag = flags.find(flag => flag.name === "Ghana");
    } else if (pathname === "/") {
      currentFlag = flags[0];
    }
    setSelectedFlag(currentFlag);
  }, [pathname]);

  // Determine country from pathname
  const country = pathname.startsWith("/ng") ? "Nigeria" : pathname.startsWith("/gh") ? "Ghana" : null;

  // Search handler
  const handleSearch = async (term) => {
    if (!term || !country) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    addRecentSearch(term);
    try {
      const query = `*[_type == "offers" && country == $country && (
        bonusType->name match $term ||
        bookmaker->name match $term
      )] | order(_createdAt desc) {
        _id,
        slug,
        bonusType->{name},
        bookmaker->{name},
        country,
        maxBonus,
        minDeposit,
        description,
        expires,
        published,
        bookmaker->{paymentMethods, logo}
      }`;
      const results = await client.fetch(query, { country, term: `*${term}*` });
      setSearchResults(results);
    } catch (err) {
      setSearchError("Failed to search offers");
    } finally {
      setSearchLoading(false);
    }
  };

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
    }, 300);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchValue, country, searchOpen]);

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

  const handleFlagSelect = (flag) => {
    setSelectedFlag(flag);
    setDropdownOpen(false);
    router.push(flag.path);
  };

  return (
    <>
    <nav className="w-full flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
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
        {/* Logo - hide on mobile when search is open */}
        <Link href={pathname.startsWith("/ng") ? "/ng" : pathname.startsWith("/gh") ? "/gh" : "/"} className={`${searchOpen ? 'hidden sm:block' : ''}`}>
          <Image src="/assets/logo.png" alt="Booldo Logo" width={80} height={80} className="cursor-pointer" />
        </Link>
      </div>
      {/* Search & Flag */}
      <div className="flex items-center gap-0 sm:gap-4 flex-1 justify-end">
        {/* Search input - desktop only */}
        <div className="hidden sm:flex items-center bg-[#f6f7f9] border border-gray-200 rounded-lg px-3 py-1 w-48 cursor-pointer" onClick={() => setSearchOpen(true)}>
          <svg className="text-gray-400 mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-gray-700 w-full placeholder-gray-400"
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            readOnly={!searchOpen}
          />
        </div>
        {/* Search icon - mobile only */}
        {!searchOpen && (
          <button className="flex sm:hidden p-2" onClick={() => setSearchOpen(true)}>
            <svg className="text-gray-400" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}
        {/* Search input - mobile only, expanded when open */}
        {searchOpen && (
          <div className="flex sm:hidden items-center bg-[#f6f7f9] border border-gray-200 rounded-lg px-3 py-1 w-full max-w-xs flex-1">
            <svg className="text-gray-400 mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-gray-700 w-full placeholder-gray-400"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              autoFocus
            />
            <button className="ml-2 text-gray-500 text-base font-medium hover:underline" onClick={() => setSearchOpen(false)}>Cancel</button>
          </div>
        )}
        {/* Flag dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1 p-2 rounded hover:bg-gray-100"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <Image src={selectedFlag.topIcon} alt={selectedFlag.name} width={24} height={24} />
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-20">
              {flags.map(flag => (
                <button
                  key={flag.name}
                  className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100"
                  onClick={() => handleFlagSelect(flag)}
                >
                  <div className="flex items-center gap-2">
                    <Image src={flag.src} alt={flag.name} width={20} height={20} />
                    <span>{flag.name}</span>
                  </div>
                  {selectedFlag.name === flag.name && (
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
    </nav>
      {/* Hamburger Menu Overlay */}
      {menuOpen && (
        <div ref={menuRef} className="fixed left-0 right-0 top-[64px] w-full bg-white shadow-2xl z-50 rounded-b-xl animate-slide-down">
          <div className="flex flex-col gap-6 px-10 py-4 text-gray-800 text-base font-medium">
            <Link href="/briefly" className="hover:underline">Blog</Link>
            <Link href="/calculator" className="hover:underline">Calculator</Link>
            <Link href="/about" className="hover:underline">About Us</Link>
            <Link href="/contact" className="hover:underline">Contact Us</Link>
          </div>
        </div>
      )}
      {/* Search Suggestion Panel + Results */}
      {searchOpen && (
        <div className="fixed top-0 left-0 w-full bg-white z-50 px-0 sm:px-0 pt-8 pb-12 animate-slide-down min-h-screen">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <Image src="/assets/logo.png" alt="Booldo Logo" width={100} height={40} className="hidden sm:block" />
              <div className="flex-1 flex items-center bg-[#f6f7f9] border border-gray-200 rounded-lg px-3 py-2">
                <svg className="text-gray-400 mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="search"
                  className="bg-transparent outline-none text-gray-700 w-full placeholder-gray-400"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="ml-4 text-gray-500 text-base font-medium hover:underline" onClick={() => setSearchOpen(false)}>Cancel</button>
            </div>
            {/* Search Results */}
            <div>
              {searchLoading && <div className="text-center text-gray-400">Searching...</div>}
              {searchError && <div className="text-center text-red-500">{searchError}</div>}
              {!searchLoading && !searchError && searchResults.length === 0 && searchValue && (
                <div className="text-center text-gray-400">No results found.</div>
              )}
              {!searchLoading && !searchError && searchResults.length > 0 && (
                <div className="flex flex-col gap-4 mb-6">
                  {searchResults.map((offer) => (
                    <div
                      key={offer._id || offer.id}
                      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/${country === "Nigeria" ? "ng" : "gh"}/offers?offerId=${offer.id}`);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {offer.logo ? (
                          <Image src={urlFor(offer.logo).width(48).height(48).url()} alt={offer.bookmaker} width={48} height={48} className="rounded-md" />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md" />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900 text-base hover:underline cursor-pointer">{offer.title}</div>
                          <div className="text-sm text-gray-500 mt-1">{offer.description}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                            <span className="inline-flex items-center gap-1"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> Expires: {offer.expires}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end mt-4 sm:mt-0">
                        <span className="text-xs text-gray-400 mb-2">Published: {offer.published}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Popular Searches */}
              {!searchLoading && !searchError && !searchValue && (
                <div className="mb-6">
                  <div className="text-gray-500 text-sm mb-2 font-medium">Popular Searches</div>
                  <div className="flex flex-wrap gap-2">
                    {popularSearches.map((term, idx) => (
                      <button
                        key={term + idx}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 text-sm font-medium transition"
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
                      <div className="text-gray-500 text-sm mb-2 font-medium">Recent Searches</div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, idx) => (
                          <button
                            key={term + idx}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full px-4 py-2 text-sm font-medium transition"
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