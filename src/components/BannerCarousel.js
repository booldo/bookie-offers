"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { urlFor } from "../sanity/lib/image";

export default function BannerCarousel({ banners = [] }) {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef();
  const delay = 4000; // 4 seconds

  useEffect(() => {
    if (banners.length <= 1) return;
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, delay);
    return () => clearTimeout(timeoutRef.current);
  }, [current, banners.length]);

  if (!banners.length) return null;

  return (
    <div className="w-full flex flex-col items-center mt-4 sm:mt-8">
      <div className="w-full rounded-xl overflow-hidden shadow-sm relative h-24 sm:h-48 z-0">
        {banners.map((banner, idx) => {
          // Handle Sanity image objects with proper validation
          let imageUrl = null;
          if (banner.image && banner.image._type === 'image' && banner.image.asset) {
            try {
              imageUrl = urlFor(banner.image).width(1200).height(200).url();
            } catch (error) {
              console.warn('Invalid banner image structure in carousel:', banner.image);
              imageUrl = null;
            }
          }
          
          // Don't render if no valid image
          if (!imageUrl) return null;
          
          return (
            <div
              key={banner._id || idx}
              className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ${idx === current ? 'opacity-100' : 'opacity-0'}`}
            >
              <Image
                src={imageUrl}
                alt={banner.imageAlt || banner.title || "Banner"}
                width={1200}
                height={200}
                className="w-full h-24 sm:h-48 object-cover"
                priority={idx === current}
              />
            </div>
          );
        })}
      </div>
      {/* Dots */}
      <div className="flex justify-center mt-2 gap-2">
        {banners.map((_, idx) => (
          <span
            key={idx}
            className={`w-2 h-2 rounded-full inline-block ${idx === current ? 'bg-gray-800' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
} 