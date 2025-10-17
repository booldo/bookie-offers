"use client";

import { useRouter } from "next/navigation";

export function PreviewBanner({ expiryDate }) {
  const router = useRouter();

  const handleExit = () => {
    // Remove preview query params and refresh
    const url = new URL(window.location.href);
    url.searchParams.delete("preview");
    url.searchParams.delete("draftId");
    router.push(url.pathname + url.search);
  };

  const isExpired = expiryDate && new Date() > new Date(expiryDate);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isExpired ? "bg-red-600" : "bg-yellow-500"
      } text-black px-4 py-3 shadow-lg`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <div>
            <span className="font-semibold">
              {isExpired ? "⚠️ Preview Expired" : "👁️ Preview Mode"}
            </span>
            <span className="ml-2 text-sm">
              {isExpired
                ? "This preview link has expired"
                : "You are viewing unpublished content"}
            </span>
            {expiryDate && !isExpired && (
              <span className="ml-2 text-xs opacity-75">
                (Expires: {new Date(expiryDate).toLocaleString()})
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleExit}
          className="px-4 py-1 bg-black text-white rounded hover:bg-gray-800 transition-colors font-semibold text-sm"
        >
          Exit Preview
        </button>
      </div>
    </div>
  );
}
