"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { client } from '../sanity/lib/client';

// Create context
const RedirectsContext = createContext();

// Cache settings
const CACHE_KEY = 'bookie_redirects_cache';
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export function RedirectsProvider({ children }) {
  const [redirects, setRedirects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRedirects() {
      try {
        // Check for cached data first
        const cachedData = getCachedRedirects();
        if (cachedData) {
          setRedirects(cachedData);
          setIsLoading(false);
          return;
        }

        // Fetch all redirects if no cache
        console.log('📦 Fetching all redirects from Sanity');
        const allRedirects = await client.fetch(`
          *[_type == "redirects" && isActive == true] {
            "id": _id,
            sourcePath,
            targetUrl,
            redirectType,
            matchExact,
            isActive
          }
        `);

        // Save to state and cache
        setRedirects(allRedirects);
        cacheRedirects(allRedirects);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching redirects:', error);
        setIsLoading(false);
      }
    }

    loadRedirects();
  }, []);

  // Check if a path should redirect - maintains the same logic as server-side cache
  function getRedirect(path) {
    if (isLoading || !redirects || redirects.length === 0) {
      return null;
    }

    // Normalize path: remove trailing slash for consistency unless it's root
    const normalizedPath = path.endsWith('/') && path !== '/' ? path.slice(0, -1) : path;
    const pathWithSlash = normalizedPath + '/';
    
    console.log('🔍 Client: Checking paths for redirects:', {
      original: path,
      normalized: normalizedPath,
      withSlash: pathWithSlash
    });
    
    // Find matching redirect
    const redirect = redirects.find(r => {
      if (r.matchExact === true) {
        return r.sourcePath === path;
      } else {
        return r.sourcePath === normalizedPath || r.sourcePath === pathWithSlash;
      }
    });

    if (!redirect) return null;
    
    // Handle 410 type explicitly
    if (redirect.redirectType === '410') {
      return { type: '410' };
    }

    // Handle normal redirects
    if (redirect.targetUrl) {
      return {
        url: redirect.targetUrl,
        type: redirect.redirectType || '301'
      };
    }
    
    return null;
  }

  // Cache functions
  function getCachedRedirects() {
    if (typeof window === 'undefined') return null;
    
    try {
      const cacheJson = localStorage.getItem(CACHE_KEY);
      if (!cacheJson) return null;
      
      const cache = JSON.parse(cacheJson);
      const now = Date.now();
      
      if (now - cache.timestamp < CACHE_TTL) {
        console.log('📦 Using cached redirects data');
        return cache.data;
      } else {
        console.log('📦 Redirects cache expired');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
    } catch (error) {
      console.error('Error reading redirects cache:', error);
      return null;
    }
  }

  function cacheRedirects(data) {
    if (typeof window === 'undefined') return;
    
    try {
      const cache = {
        timestamp: Date.now(),
        data: data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      console.log('📦 Redirects cached successfully');
    } catch (error) {
      console.error('Error caching redirects:', error);
    }
  }

  // Public API
  const value = {
    redirects,
    isLoading,
    getRedirect,
  };

  return (
    <RedirectsContext.Provider value={value}>
      {children}
    </RedirectsContext.Provider>
  );
}

// Custom hook for accessing redirects data
export function useRedirects() {
  const context = useContext(RedirectsContext);
  if (context === undefined) {
    throw new Error('useRedirects must be used within a RedirectsProvider');
  }
  return context;
}
