"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f6f7f9] w-full px-4 pt-8 pb-4 text-gray-700 text-sm border-t mt-8">
      <div className="w-full flex flex-col gap-6">
        {/* Socials */}
        <div>
          <div className="mb-2 font-medium">Follow us on</div>
          <div className="flex gap-4 mb-4">
            {/* X (Twitter) */}
            <a href="#" aria-label="X" className="hover:text-black">
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><path d="M20.5 7.5l-13 13M7.5 7.5l13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </a>
            {/* Telegram */}
            <a href="#" aria-label="Telegram" className="hover:text-blue-500">
              <svg width="28" height="28" fill="none" viewBox="0 0 28 28"><path d="M23 5L5.5 12.5c-.7.3-.7 1.2 0 1.5l4.2 1.3 1.3 4.2c.2.7 1.2.7 1.5 0L23 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
            </a>
          </div>
          <hr className="my-2 border-gray-200" />
        </div>
        {/* Links */}
        <div className="flex flex-col gap-2">
        <a href="/faq" className="hover:underline">FAQ</a>
        <a href="/briefly" className="hover:underline">Blog</a>
          <a href="/about" className="hover:underline">About us</a>
          <a href="/contact" className="hover:underline">Contact us</a>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Affiliate Disclosure */}
        <div>
          <div className="font-semibold mb-1">Affiliate Disclosure</div>
          <div className="text-xs text-gray-600">
            Booldo is an independent sports betting affiliate site. We may earn a commission if you register or place a bet through some of the links on our site. <br />This does not influence which bookmakers or offers we feature – our team includes all available offers based on relevance, not commercial <br /> agreements. We strive to provide up-to-date licensing information for each bookie.
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Responsible Gambling */}
        <div>
          <div className="font-semibold mb-1">Responsible Gambling</div>
          <div className="text-xs text-gray-600">
            Betting should be an entertainment, not a solution to financial problems. Always be responsible. If you or someone you know is struggling with <br /> gambling, please seek help from local support services.
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Resources */}
        <div>
          <div className="mb-1">Need help? Visit these responsible gambling resources</div>
          <ul className="flex flex-col gap-1">
            <li><a href="#" className="text-blue-700 underline">GambleAlert</a></li>
            <li><a href="#" className="text-blue-700 underline">BeGambleAware</a></li>
            <li><a href="#" className="text-blue-700 underline">Gambling Therapy</a></li>
          </ul>
        </div>
        {/* Bottom row */}
        <div className="flex flex-wrap justify-center items-center text-xs text-gray-400 mt-6 gap-4">
          <a href="#" className="hover:underline">Terms & Conditions</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Responsible Gambling</a>
          <a href="#" className="hover:underline">Cookie Policy</a>
          <span>© Copyright 2025 BOOLDO</span>
        </div>
      </div>
    </footer>
  );
} 