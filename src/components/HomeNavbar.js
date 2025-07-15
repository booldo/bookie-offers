"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const flags = [
  { src: "/assets/flags.png", name: "World Wide", path: "/" },
  { src: "/assets/ghana-circle.png", name: "Ghana", path: "/gh" },
  { src: "/assets/nigeria-cirle.png", name: "Nigeria", path: "/ng" },
];

export default function HomeNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(flags[0]);
  const [menuOpen, setMenuOpen] = useState(false);
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
      {/* Flag dropdown */}
      <div className="flex items-center gap-4">
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
    </>
  );
} 