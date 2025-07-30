"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const flags = [
  { src: "/assets/flags.png", name: "World Wide", path: "/", topIcon: "/assets/dropdown.png" },
  { src: "/assets/ghana-square.png", name: "Ghana", path: "/gh", topIcon: "/assets/ghana.png" },
  { src: "/assets/nigeria-square.png", name: "Nigeria", path: "/ng", topIcon: "/assets/nigeria.png" },
];

export default function HomeNavbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(flags[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef();

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

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

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
        <Link href={pathname.startsWith("/ng") ? "/ng" : pathname.startsWith("/gh") ? "/gh" : "/"}>
          <Image src="/assets/logo.png" alt="Booldo Logo" width={80} height={80} className="cursor-pointer" />
        </Link>
      </div>
      {/* Flag dropdown */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            className="flex items-center gap-1 p-2 rounded hover:bg-gray-100"
            onClick={() => setDropdownOpen((v) => !v)}
          >
            <Image src={selectedFlag.topIcon} alt={selectedFlag.name} width={24} height={24} />
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded shadow-lg z-20">
              {flags.map(flag => (
                <button
                  key={flag.name}
                  className="flex items-center justify-between w-full px-4 py-2 hover:bg-gray-100"
                  onClick={() => handleFlagSelect(flag)}
                >
                  <div className="flex items-center gap-2">
                    <Image src={flag.src} alt={flag.name} width={20} height={20} />
                    <span>{flag.name}</span>
                  </div>
                  {selectedFlag.name === flag.name && (
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="green" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
      {/* Hamburger Menu Overlay */}
      {menuOpen && (
        <div ref={menuRef} className="fixed left-0 right-0 top-[64px] w-full bg-white shadow-2xl z-50 rounded-b-xl animate-slide-down">
          <div className="flex flex-col gap-6 px-10 py-4 text-gray-800 text-base font-medium">
            <a href="/briefly" className="hover:underline">Blog</a>
            <a href="#" className="hover:underline">Calculator</a>
            <a href="/about" className="hover:underline">About Us</a>
            <a href="/contact" className="hover:underline">Contact Us</a>
          </div>
        </div>
      )}
    </>
  );
} 