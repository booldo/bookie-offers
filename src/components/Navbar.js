"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const flags = [
  { src: "/assets/flags.png", name: "World Wide", path: "/" },
  { src: "/assets/ghana-circle.png", name: "Ghana", path: "/gh" },
  { src: "/assets/nigeria-cirle.png", name: "Nigeria", path: "/ng" },
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
  const router = useRouter();
  const pathname = usePathname();

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
        {/* Logo */}
        <Image src="/assets/logo.png" alt="Booldo Logo" width={80} height={80} />
      </div>
      {/* Search & Flag */}
      <div className="flex items-center gap-4">
        {/* Search input */}
          <div className="flex items-center bg-[#f6f7f9] border border-gray-200 rounded-lg px-3 py-1 w-48 cursor-pointer" onClick={() => setSearchOpen(true)}>
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
              onFocus={() => setSearchOpen(true)}
              readOnly={!searchOpen}
          />
        </div>
        {/* Flag dropdown */}
        <div className="relative">
          <button
            className="flex items-center gap-1 p-2 rounded hover:bg-gray-100"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <Image src={selectedFlag.src} alt={selectedFlag.name} width={24} height={24} className="rounded-full" />
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-20">
              {flags.filter(f => f.name !== selectedFlag.name).map(flag => (
                <button
                  key={flag.name}
                  className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                  onClick={() => handleFlagSelect(flag)}
                >
                  <Image src={flag.src} alt={flag.name} width={20} height={20} className="rounded-full" />
                  <span>{flag.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
      {/* Hamburger Menu Overlay */}
      {menuOpen && (
        <div className="fixed left-0 right-0 top-[64px] w-full bg-white shadow-2xl z-50 rounded-b-xl animate-slide-down">
          <div className="flex flex-col gap-6 px-10 py-10 text-gray-800 text-base font-medium">
            <a href="#" className="hover:underline">Briefly</a>
            <a href="#" className="hover:underline">Calculator</a>
            <a href="#" className="hover:underline">About Us</a>
            <a href="#" className="hover:underline">Contact Us</a>
          </div>
        </div>
      )}
      {/* Search Suggestion Panel */}
      {searchOpen && (
        <div className="fixed top-0 left-0 w-full bg-white z-50 px-0 sm:px-0 pt-8 pb-12 animate-slide-down">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-6">
              <Image src="/assets/logo.png" alt="Booldo Logo" width={100} height={40} />
              <div className="flex-1 flex items-center bg-[#f6f7f9] border border-gray-200 rounded-lg px-3 py-2">
                <svg className="text-gray-400 mr-2" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Bonus"
                  className="bg-transparent outline-none text-gray-700 w-full placeholder-gray-400"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  autoFocus
                />
              </div>
              <button className="ml-4 text-gray-500 text-base font-medium hover:underline" onClick={() => setSearchOpen(false)}>Cancel</button>
            </div>
            <div>
              <div className="text-gray-500 text-base font-medium mb-3">Popular Search Terms</div>
              <div className="flex flex-wrap gap-3">
                {popularSearches.map((term, i) => (
                  <button key={i} className="bg-gray-100 text-gray-700 rounded-full px-4 py-2 text-sm font-medium hover:bg-gray-200 transition">
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 