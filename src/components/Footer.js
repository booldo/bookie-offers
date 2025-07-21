"use client";
import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f6f7f9] w-full px-4 pt-8 pb-4 text-gray-700 text-sm border-t mt-8">
      <div className="w-full flex flex-col gap-6">
        {/* Socials */}
        <div className="md:text-center">
          <div className="mb-2 font-medium">Follow us on</div>
          <div className="flex gap-4 mb-4 md:justify-center">
            {/* X (Twitter) */}
            <a href="#" aria-label="X" className="hover:opacity-80">
              <Image src="/assets/x.png" alt="X" width={28} height={28} />
            </a>
            {/* Telegram */}
            <a href="#" aria-label="Telegram" className="hover:opacity-80">
              <Image src="/assets/telegram.png" alt="Telegram" width={28} height={28} />
            </a>
          </div>
          <hr className="my-2 border-gray-200" />
        </div>
        {/* Links */}
        <div className="flex flex-col gap-2 md:items-center">
        <a href="/faq" className="hover:underline">FAQ</a>
        <a href="/briefly" className="hover:underline">Blog</a>
          <a href="/about" className="hover:underline">About us</a>
          <a href="/contact" className="hover:underline">Contact us</a>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Affiliate Disclosure */}
        <div className="md:text-center">
          <div className="font-semibold mb-1">Affiliate Disclosure</div>
          <div className="text-xs text-gray-600">
            Booldo is an independent sports betting affiliate site. We may earn a commission if you register or place a bet through some of the links on our site. <br />This does not influence which bookmakers or offers we feature – our team includes all available offers based on relevance, not commercial <br /> agreements. We strive to provide up-to-date licensing information for each bookie.
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Responsible Gambling */}
        <div className="md:text-center">
          <div className="font-semibold mb-1">Responsible Gambling</div>
          <div className="text-xs text-gray-600">
            Betting should be an entertainment, not a solution to financial problems. Always be responsible. If you or someone you know is struggling with <br /> gambling, please seek help from local support services.
          </div>
        </div>
        <hr className="my-2 border-gray-200" />
        {/* Resources */}
        <div className="md:text-center">
          <div className="mb-1">Need help? Visit these responsible gambling resources</div>
          <ul className="flex flex-col gap-1 md:items-center">
            <li><a href="#" className="text-gray-900 underline">GambleAlert</a></li>
            <li><a href="#" className="text-gray-900 underline">BeGambleAware</a></li>
            <li><a href="#" className="text-gray-900 underline">Gambling Therapy</a></li>
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