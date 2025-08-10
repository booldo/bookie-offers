"use client";
import { useState, useEffect, createContext, useContext } from 'react';
import { client } from '../sanity/lib/client';
import { useParams } from 'next/navigation';

const CountryContext = createContext(null);

export function CountryProvider({ children }) {
  const params = useParams();
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCountryData = async () => {
      if (!params.slug) {
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
        
        const data = await client.fetch(query, { slug: params.slug });
        
        if (!data) {
          setError(`Country page not found for slug: ${params.slug}`);
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
  }, [params.slug]);

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