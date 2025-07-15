"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Image from "next/image";
import Link from "next/link";

const staticOffers = [
  {
    id: 1,
    bookmaker: "Betway Ghana",
    logo: "/assets/ghana-circle.png",
    title: "200% Welcome Bonus up to ₵1000",
    description: "Get a massive 200% bonus on your first deposit up to ₵1000. Available to new users who register and fund their Betway Ghana account with ₵100 or more.",
    expires: "June 24, 2025",
    published: "June 10, 2025",
    banner: "/assets/ghana-circle.png",
    howItWorks: [
      "Register a new account on Betway Ghana",
      "Make your first deposit of ₵100 or more",
      "Receive 200% of that amount as a bonus",
      "Use your bonus on any sports market within 7 days",
      "Bonus winnings must be wagered 5x before withdrawal"
    ],
    paymentMethods: ["Mobile Money", "Bank Transfer", "Debit/Credit Card"],
    terms: [
      "Offer valid for first-time customers",
      "Minimum deposit of ₵100 required.",
      "Maximum bonus is ₵1000.",
      "Bonus winnings must be wagered 5 times at minimum odds of 1.50.",
      "Betway Ghana reserves the right to modify or end the promotion at any time."
    ]
  },
  {
    id: 2,
    bookmaker: "1xBet Ghana",
    logo: "/assets/flags.png",
    title: "Free Bet up to ₵200",
    description: "New customers get a free bet up to ₵200 when they register and place their first bet. No deposit required.",
    expires: "June 24, 2025",
    published: "June 10, 2025",
    banner: "/assets/ghana-circle.png",
    howItWorks: [
      "Register a new account on 1xBet Ghana",
      "Place your first bet of any amount",
      "Receive a free bet up to ₵200",
      "Use your free bet within 7 days"
    ],
    paymentMethods: ["Bank Transfer", "Debit/Credit Card"],
    terms: [
      "Offer valid for new customers only.",
      "No deposit required.",
      "Maximum free bet is ₵200.",
      "Free bet must be used within 7 days."
    ]
  },
  {
    id: 3,
    bookmaker: "Merrybet",
    logo: "/assets/kenya-circle.png",
    title: "50% Cashback on First Loss",
    description: "Get 50% cashback on your first losing bet up to ₵500. Perfect for new bettors who want to minimize risk.",
    expires: "June 24, 2025",
    published: "June 10, 2025",
    banner: "/assets/ghana-circle.png",
    howItWorks: [
      "Register a new account on Merrybet Ghana",
      "Place your first bet of any amount",
      "If you lose, get 50% cashback up to ₵500",
      "Cashback credited within 24 hours"
    ],
    paymentMethods: ["Mobile Money", "Bank Transfer"],
    terms: [
      "Offer valid for new customers only.",
      "Cashback only applies to first losing bet.",
      "Maximum cashback is ₵500.",
      "Cashback credited within 24 hours."
    ]
  },
  {
    id: 4,
    bookmaker: "Betika Ghana",
    logo: "/assets/nigeria-cirle.png",
    title: "150% Deposit Bonus + Free Spins",
    description: "New users get 150% bonus on first deposit plus 50 free spins on selected slots. Max bonus ₵750.",
    expires: "June 24, 2025",
    published: "June 10, 2025",
    banner: "/assets/ghana-circle.png",
    howItWorks: [
      "Register a new account on Betika Ghana",
      "Make your first deposit of any amount",
      "Receive 150% bonus plus 50 free spins",
      "Use bonus on sports and free spins on slots"
    ],
    paymentMethods: ["Bank Transfer", "Debit/Credit Card"],
    terms: [
      "Offer valid for new customers only.",
      "No minimum deposit required.",
      "Maximum bonus is ₵750.",
      "Free spins valid on selected slot games."
    ]
  },
  {
    id: 5,
    bookmaker: "SportyBet Ghana",
    logo: "/assets/ghana-circle.png",
    title: "₵50 No Deposit Bonus",
    description: "Claim ₵50 free bonus just for registering. No deposit required. Use on any sports market with 5x wagering.",
    expires: "June 24, 2025",
    published: "June 10, 2025",
    banner: "/assets/ghana-circle.png",
    howItWorks: [
      "Register a new account on SportyBet Ghana",
      "Complete registration verification",
      "Receive ₵50 free bonus automatically",
      "Use bonus on any sports market"
    ],
    paymentMethods: ["Mobile Money", "Debit/Credit Card"],
    terms: [
      "Offer valid for new customers only.",
      "No deposit required.",
      "Bonus amount is ₵50.",
      "5x wagering requirement applies."
    ]
  }
];

function OfferDetailsInner() {
  const params = useSearchParams();
  const offerId = parseInt(params.get("offerId"), 10);
  const offer = staticOffers.find(o => o.id === offerId) || staticOffers[0];
  const moreOffers = staticOffers.filter(o => o.id !== offer.id).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-4xl mx-auto w-full px-2 sm:px-4 flex-1">
        <div className="mt-6 mb-4 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/gh" className="hover:underline flex items-center gap-1">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
            Offers
          </Link>
          <span className="mx-1">/</span>
          <span className="text-gray-700 font-medium">Welcome Bonus</span>
        </div>
        {/* Banner */}
        <div className="w-full rounded-xl overflow-hidden shadow-sm mb-6">
          <Image src={offer.banner} alt="Offer Banner" width={1200} height={200} className="w-full h-40 object-cover" priority />
        </div>
        {/* Offer Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Image src={offer.logo} alt={offer.bookmaker} width={40} height={40} className="rounded-md" />
            <span className="font-semibold text-gray-900 text-lg">{offer.bookmaker}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{offer.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
            <span className="text-gray-500 text-sm">Published: {offer.published}</span>
            <span className="flex items-center gap-1 text-green-700 text-sm font-medium mt-2 sm:mt-0">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              Expires: {offer.expires}
            </span>
          </div>
          <p className="text-gray-700 mb-4">{offer.description}</p>
          <button className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-2 mb-4 transition">Get Bonus!</button>
          {/* How it works */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              <span className="font-semibold text-gray-900">How it works</span>
            </div>
            <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1 pl-4">
              {offer.howItWorks.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
          {/* Payment Method */}
          <div className="mb-4">
            <div className="font-semibold text-gray-900 mb-1">Payment Method</div>
            <div className="flex flex-wrap gap-2 text-gray-700 text-sm">
              {offer.paymentMethods.map((pm, i) => (
                <span key={i} className="border border-gray-200 rounded px-2 py-1 bg-gray-50">{pm}</span>
              ))}
            </div>
          </div>
          {/* Terms & Condition */}
          <div>
            <div className="font-semibold text-gray-900 mb-1">Terms & Condition</div>
            <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 pl-4">
              {offer.terms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>
        </div>
        {/* More Offers */}
        <div className="mb-10">
          <div className="font-semibold text-lg text-gray-900 mb-3">More Offers</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {moreOffers.map((o) => (
              <div key={o.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-1">
                  <Image src={o.logo} alt={o.bookmaker} width={28} height={28} className="rounded-md" />
                  <span className="font-semibold text-gray-900 text-base">{o.bookmaker}</span>
                  <span className="ml-auto text-xs text-gray-500">Published: {o.published}</span>
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{o.title}</div>
                <div className="text-xs text-gray-500 mb-2">{o.description}</div>
                <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  Expires: {o.expires}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6">
            <button className="px-6 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition">Load More</button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OfferDetails() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OfferDetailsInner />
    </Suspense>
  );
}