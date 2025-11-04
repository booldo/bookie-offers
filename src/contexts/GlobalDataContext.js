"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../sanity/lib/client';
import { urlFor } from '../sanity/lib/image';

const GlobalDataContext = createContext(null);

const CACHE_KEY = 'booldo_global_data';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export function GlobalDataProvider({ children }) {
  const [countries, setCountries] = useState([]);
  const [flags, setFlags] = useState([]);
  const [hamburgerMenus, setHamburgerMenus] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const WORLD_WIDE_FLAG = {
    src: "/assets/flags.png",
    name: "World Wide",
    path: "/",
    topIcon: "/assets/dropdown.png",
  };

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all global data in parallel - ONE batch request
        const [countriesData, menusData, searchesData] = await Promise.all([
          client.fetch(`*[_type == "countryPage" && isActive == true]{
            _id,
            country,
            slug,
            navigationBarFlag
          } | order(country asc)`),
          
          client.fetch(`*[_type == "hamburgerMenu" && selectedPage->_type == "landingPage"]{
            _id,
            title,
            slug,
            url,
            content,
            noindex,
            sitemapInclude
          } | order(title asc)`),
          
          client.fetch(`*[_type == "landingPage"][0]{
            mostSearches[]{
              searchTerm,
              isActive,
              order
            }
          }`)
        ]);

        // Process countries into flags format
        const dynamicFlags = (countriesData || []).map(c => ({
          src: c.navigationBarFlag 
            ? urlFor(c.navigationBarFlag).width(24).height(24).url() 
            : "/assets/flags.png",
          name: c.country,
          path: `/${c.slug?.current || ''}`,
          topIcon: c.navigationBarFlag 
            ? urlFor(c.navigationBarFlag).width(24).height(24).url() 
            : "/assets/dropdown.png",
          slug: c.slug?.current || '',
          _id: c._id
        }));

        const allFlags = [WORLD_WIDE_FLAG, ...dynamicFlags];

        // Process popular searches
        const activeSearches = searchesData?.mostSearches
          ? searchesData.mostSearches
              .filter(search => search.isActive)
              .sort((a, b) => (a.order || 1) - (b.order || 1))
              .map(search => search.searchTerm)
          : [
              "Welcome bonus",
              "Deposit bonus",
              "Best bonus",
              "Best bookies",
              "Free bets"
            ];

        // Update state
        setCountries(countriesData || []);
        setFlags(allFlags);
        setHamburgerMenus(menusData || []);
        setPopularSearches(activeSearches);

        // Cache in localStorage with timestamp
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              countries: countriesData,
              flags: allFlags,
              hamburgerMenus: menusData,
              popularSearches: activeSearches,
              timestamp: Date.now()
            }));
          } catch (e) {
            console.warn('Failed to cache global data:', e);
          }
        }
      } catch (err) {
        console.error('Failed to fetch global data:', err);
        setError(err.message);
        
        // Use fallback data
        setFlags([WORLD_WIDE_FLAG]);
        setPopularSearches([
          "Welcome bonus",
          "Deposit bonus",
          "Best bonus",
          "Best bookies",
          "Free bets"
        ]);
      } finally {
        setLoading(false);
      }
    };

    // Check localStorage cache first
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { countries: cachedCountries, flags: cachedFlags, hamburgerMenus: cachedMenus, popularSearches: cachedSearches, timestamp } = JSON.parse(cached);
          
          // Use cache if less than 1 hour old
          if (Date.now() - timestamp < CACHE_DURATION) {
            setCountries(cachedCountries || []);
            setFlags(cachedFlags || [WORLD_WIDE_FLAG]);
            setHamburgerMenus(cachedMenus || []);
            setPopularSearches(cachedSearches || []);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Failed to load cached data:', e);
      }
    }

    // Fetch fresh data if no valid cache
    fetchGlobalData();
  }, []);

  // Helper function to refresh data manually
  const refreshGlobalData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CACHE_KEY);
    }
    window.location.reload();
  };

  const value = {
    // Data
    countries,
    flags,
    hamburgerMenus,
    popularSearches,
    
    // State
    loading,
    error,
    
    // Actions
    refreshGlobalData,
    
    // Helper getters
    getCountryBySlug: (slug) => countries.find(c => c.slug?.current === slug),
    getFlagBySlug: (slug) => flags.find(f => f.slug === slug),
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
};
