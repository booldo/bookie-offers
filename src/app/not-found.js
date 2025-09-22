import React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Link from "next/link";
import Image from "next/image";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-7xl mx-auto w-full px-4 flex-1">
        {/* Back Button - positioned like breadcrumb */}
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link href="/" className="hover:underline flex items-center gap-1 flex-shrink-0">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </Link>
        </div>

        {/* 404 Error Content */}
        <div className="py-12 flex items-center justify-center">
          <div className="text-center">
            {/* 404 Status Icon */}
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
                  <path d="m15 9-6 6" />
                  <path d="m9 9 6 6" />
                </svg>
              </div>
            </div>

            {/* Error Code */}
            <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>

            {/* Main Message */}
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Page Not Found
            </h2>

            {/* Description */}
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or may have been moved. Please check the URL or browse our available content.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition flex items-center justify-center gap-2"
              >
                <Image src="/assets/back-arrow.png" alt="Back" width={20} height={20} />
                Go Home
              </Link>
            </div>

            {/* Additional Info */}
            {/* <div className="mt-8 text-sm text-gray-500">
              <p>Looking for similar content? Check out our latest offerings!</p>
            </div> */}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}