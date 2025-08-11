"use client";
import { useState, useEffect, createContext, useContext } from 'react';
import { client } from '../sanity/lib/client';
import { useParams, usePathname } from 'next/navigation';

const CountryContext = createContext(null);

export function CountryProvider({ children }) {
  const params = useParams();
  const pathname = usePathname();
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCountryData = async () => {
      // Determine slug from params or pathname (supports nested routes under /[slug]/...)
      let slugFromParams = params?.slug;
      let resolvedSlug = typeof slugFromParams === 'string' ? slugFromParams : Array.isArray(slugFromParams) ? slugFromParams[0] : slugFromParams;
      if (!resolvedSlug && pathname) {
        const parts = pathname.split('/').filter(Boolean);
        // first segment is the country slug when inside /[slug]/...
        if (parts.length > 0) {
          resolvedSlug = parts[0];
        }
      }

      if (!resolvedSlug) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const query = `*[_type == "countryPage" && slug.current == $slug && isActive == true][0]{
          _id,
          title,
          countryCode,
          country,
          slug,
          flag,
          banner,
          bannerAlt,
          content,
          metaTitle,
          metaDescription,
          noindex,
          nofollow,
          canonicalUrl,
          sitemapInclude
        }`;
        
        const data = await client.fetch(query, { slug: resolvedSlug });
        
        if (!data) {
          setError(`Country page not found for slug: ${resolvedSlug}`);
        } else {
          setCountryData(data);
        }
      } catch (error) {
        console.error('Error fetching country data:', error);
        setError('Failed to load country data');
      } finally {
        setLoading(false);
      }
    };

    fetchCountryData();
  }, [params?.slug, pathname]);

  const value = {
    countryData,
    loading,
    error,
    // Helper function to get country slug
    getCountrySlug: () => countryData?.slug?.current,
    // Helper function to get country name
    getCountryName: () => countryData?.country,
    // Helper function to check if country is loaded
    isCountryLoaded: () => !loading && !error && countryData
  };

  return (
    <CountryContext.Provider value={value}>
      {children}
    </CountryContext.Provider>
  );
}

export const useCountryContext = () => {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountryContext must be used within a CountryProvider');
  }
  return context;
};