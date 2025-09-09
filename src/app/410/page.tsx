"use client";
import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function Gone410Page() {
  const handleBackClick = () => {
    window.location.href = '/';
  };

  const title = "Content No Longer Available";
  const description = "This content has been intentionally removed or hidden and is no longer accessible.";
  const buttonText = "Go Home";
  const buttonLink = "/";

  return (
    <div className={`min-h-screen bg-[#fafbfc] flex flex-col`}>
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 flex-1">
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <button onClick={handleBackClick} className="hover:underline flex items-center gap-1 flex-shrink-0">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </button>
        </div>

        <div className="py-12 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  width="48" 
                  height="48" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  viewBox="0 0 24 24"
                  className="text-red-600"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
            </div>

            <h1 className="text-6xl font-bold text-red-600 mb-4">410</h1>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {title}
            </h2>

            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={buttonLink} 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
              >
                <Image src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                {buttonText}
              </Link>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>Looking for similar content? Check out our latest offerings!</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


