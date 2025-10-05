"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const LinkPreview = ({ value }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    url,
    title,
    description,
    image,
    siteName,
    displayStyle = "card",
  } = value || {};

  // If manual data is provided, use it; otherwise fetch metadata
  const finalTitle = title || metadata?.title || url;
  const finalDescription = description || metadata?.description;
  const finalImage = image || metadata?.image;
  const finalSiteName = siteName || metadata?.siteName;

  useEffect(() => {
    // Only fetch if we don't have manual overrides for all fields
    if (!title || !description || !image) {
      fetchMetadata();
    }
  }, [url, title, description, image]);

  const fetchMetadata = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);

    try {
      // You can implement a serverless function to fetch metadata
      // For now, we'll use a simple approach with a third-party service
      const response = await fetch(
        `/api/link-metadata?url=${encodeURIComponent(url)}`
      );

      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
      } else {
        throw new Error("Failed to fetch metadata");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error fetching link metadata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!url) return null;

  // Loading state
  if (loading) {
    return (
      <div className="my-6 p-4 border border-gray-200 rounded-lg animate-pulse">
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - fallback to simple link
  if (error) {
    return (
      <div className="my-6">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-700 hover:text-green-800 underline"
        >
          {finalTitle}
        </a>
      </div>
    );
  }

  // Card style (default)
  if (displayStyle === "card") {
    return (
      <div
        className="my-6 border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-white"
        onClick={handleClick}
      >
        {finalImage && (
          <div className="w-full h-48 relative bg-gray-100">
            <img
              src={finalImage}
              alt={finalTitle}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-4">
          {finalSiteName && (
            <div className="text-sm text-gray-500 mb-1">{finalSiteName}</div>
          )}
          <h3 className="font-semibold text-gray-900 mb-2 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {finalTitle}
          </h3>
          {finalDescription && (
            <p className="text-gray-600 text-sm mb-2 overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical'
            }}>
              {finalDescription}
            </p>
          )}
          <div className="text-xs text-gray-400 truncate">{url}</div>
        </div>
      </div>
    );
  }

  // Compact style
  if (displayStyle === "compact") {
    return (
      <div
        className="my-4 flex gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
        onClick={handleClick}
      >
        {finalImage && (
          <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
            <img
              src={finalImage}
              alt={finalTitle}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {finalSiteName && (
            <div className="text-xs text-gray-500 mb-1">{finalSiteName}</div>
          )}
          <h4 className="font-medium text-gray-900 text-sm mb-1 overflow-hidden" style={{
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical'
          }}>
            {finalTitle}
          </h4>
          {finalDescription && (
            <p className="text-gray-600 text-xs mb-1 overflow-hidden" style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {finalDescription}
            </p>
          )}
          <div className="text-xs text-gray-400 truncate">{url}</div>
        </div>
      </div>
    );
  }

  // Inline style
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 underline my-2"
    >
      {finalImage && (
        <img
          src={finalImage}
          alt={finalTitle}
          className="w-4 h-4 rounded"
          loading="lazy"
        />
      )}
      <span>{finalTitle}</span>
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
};

export default LinkPreview;
