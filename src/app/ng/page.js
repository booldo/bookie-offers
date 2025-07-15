"use client";

import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Image from "next/image";
import { useState, useEffect } from "react";
import MultiSelectDropdown from "../../components/BonusTypeDropdown";
import { useRouter } from "next/navigation";
import { client } from "../../sanity/lib/client";
import { urlFor } from "../../sanity/lib/image";

// Fetch offers from Sanity
const fetchOffers = async () => {
  const query = `*[_type == "offer" && country == "Nigeria"] | order(published desc) {
    _id,
    id,
    title,
    bookmaker,
    bonusType,
    country,
    maxBonus,
    minDeposit,
    description,
    expires,
    published,
    paymentMethods,
    logo,
    terms,
    howItWorks
  }`;
  return await client.fetch(query);
};

const bonusTypeOptions = [
  { name: "Discount Bonus", count: 110 },
  { name: "Sign up Bonus", count: 125 },
  { name: "Free Bet", count: 24 },
  { name: "No Deposit Bonus", count: 24 },
  { name: "ACCA Boost", count: 12 },
  { name: "Cashback Offer", count: 24 },
  { name: "Refer-a-Friend", count: 32 },
  { name: "Odds Boost", count: 2 },
];
const bookmakerOptions = [
  { name: "Bet9ja" },
  { name: "BangBet" },
  { name: "Betika" },
  { name: "BetKing" },
  { name: "Betpawa" },
  { name: "Betway" },
  { name: "1xBet" },
  { name: "NairaBet" },
];
const advancedOptions = [
  {
    name: "Payment Method",
    subcategories: [
      { name: "Bank Transfer" },
      { name: "Credit Card" },
      { name: "Debit Card" },
      { name: "E-Wallet" },
      { name: "Mobile Money" },
      { name: "Cryptocurrency" }
    ]
  },
  {
    name: "License",
    subcategories: [
      { name: "Licensed" },
      { name: "Unlicensed" },
      { name: "Pending License" }
    ]
  }
];
const sortOptions = ["Latest", "Expiring Soon", "Highest Value"];

export default function NigeriaHome() {
  const router = useRouter();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBonusTypes, setSelectedBonusTypes] = useState([]);
  const [selectedBookmakers, setSelectedBookmakers] = useState([]);
  const [selectedAdvanced, setSelectedAdvanced] = useState([]);
  const [sortBy, setSortBy] = useState("Latest");

  useEffect(() => {
    setLoading(true);
    fetchOffers()
      .then((data) => {
        setOffers(data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load offers");
        setLoading(false);
      });
  }, []);

  // Filter logic (case-insensitive, robust)
  const filteredOffers = offers.filter((offer) => {
    // Normalize for case-insensitive comparison
    const offerBookmaker = offer.bookmaker ? offer.bookmaker.toLowerCase() : "";
    const offerBonusType = offer.bonusType ? offer.bonusType.toLowerCase() : "";
    const offerPaymentMethods = Array.isArray(offer.paymentMethods) ? offer.paymentMethods.map(pm => pm.toLowerCase()) : [];

    if (selectedBookmakers.length > 0 && !selectedBookmakers.some(bm => bm.toLowerCase() === offerBookmaker)) return false;
    if (selectedBonusTypes.length > 0 && !selectedBonusTypes.some(bt => bt.toLowerCase() === offerBonusType)) return false;
    if (selectedAdvanced.length > 0) {
      // Advanced filter: match if any selectedAdvanced is in offer.paymentMethods
      const selectedAdvancedLower = selectedAdvanced.map(a => a.toLowerCase());
      const paymentMatch = offerPaymentMethods.some(pm => selectedAdvancedLower.includes(pm));
      if (!paymentMatch) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      <Navbar />
      <main className="max-w-6xl mx-auto w-full px-2 sm:px-4 flex-1">
        {/* Banner */}
        <div className="w-full mt-8 flex flex-col items-center">
          <div className="w-full rounded-xl overflow-hidden shadow-sm">
            <Image
              src="/assets/ng-nigeria.png"
              alt="Nigeria Banner"
              width={1200}
              height={200}
              className="w-full h-48 object-cover"
              priority
            />
          </div>
          {/* Carousel dots */}
          <div className="flex justify-center mt-2 gap-2">
            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block" />
            <span className="w-2 h-2 bg-gray-300 rounded-full inline-block" />
            <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" />
          </div>
        </div>

        {/* Best Offers Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-8 mb-4 gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">Best Offers <span className="text-gray-400 font-normal">150</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 mr-1">Sort By:</label>
            <select
              className="border border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <MultiSelectDropdown label="Bonus Type" options={bonusTypeOptions} selected={selectedBonusTypes} setSelected={setSelectedBonusTypes} showCount={true} />
          <MultiSelectDropdown label="Bookmaker" options={bookmakerOptions} selected={selectedBookmakers} setSelected={setSelectedBookmakers} showCount={false} />
          <MultiSelectDropdown label="Advanced" options={advancedOptions} selected={selectedAdvanced} setSelected={setSelectedAdvanced} showCount={false} nested={true} />
        </div>
        {/* Selected Filters Tags and Clear Filter */}
        {(selectedBonusTypes.length > 0 || selectedBookmakers.length > 0 || selectedAdvanced.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              {selectedBonusTypes.map((type) => (
                <span key={type} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                  {type}
                  <button
                    className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                    onClick={() => setSelectedBonusTypes(selectedBonusTypes.filter(t => t !== type))}
                    aria-label={`Remove ${type}`}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              {selectedBookmakers.map((bm) => (
                <span key={bm} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                  {bm}
                  <button
                    className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                    onClick={() => setSelectedBookmakers(selectedBookmakers.filter(b => b !== bm))}
                    aria-label={`Remove ${bm}`}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
              {selectedAdvanced.map((adv) => (
                <span key={adv} className="flex items-center bg-gray-100 text-gray-700 rounded-full px-3 py-1 text-sm font-medium">
                  {adv}
                  <button
                    className="ml-1 text-gray-400 hover:text-gray-700 focus:outline-none"
                    onClick={() => setSelectedAdvanced(selectedAdvanced.filter(a => a !== adv))}
                    aria-label={`Remove ${adv}`}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
            <button
              className="ml-auto text-sm text-gray-500 underline hover:text-gray-700 font-medium"
              onClick={() => {
                setSelectedBonusTypes([]);
                setSelectedBookmakers([]);
                setSelectedAdvanced([]);
              }}
            >
              clear filter
            </button>
          </div>
        )}

        {/* Offer Cards */}
        <div className="flex flex-col gap-4 mb-6">
          {loading && <div className="text-center text-gray-400">Loading offers...</div>}
          {error && <div className="text-center text-red-500">{error}</div>}
          {!loading && !error && filteredOffers.length === 0 && (
            <div className="text-center text-gray-400">No offers found.</div>
          )}
          {!loading && !error && filteredOffers.map((offer, idx) => (
            <div
              key={offer._id || offer.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-gray-200 cursor-pointer"
              onClick={() => router.push(`/ng/welcome-offers?offerId=${offer.id}`)}
            >
              <div className="flex items-center gap-4">
                {offer.logo ? (
                  <Image src={urlFor(offer.logo).width(48).height(48).url()} alt={offer.bookmaker} width={48} height={48} className="rounded-md" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-md" />
                )}
                <div>
                  <div className="font-semibold text-gray-900 text-base hover:underline cursor-pointer">{offer.title}</div>
                  <div className="text-sm text-gray-500 mt-1">{offer.description}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <span className="inline-flex items-center gap-1"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg> Expires: {offer.expires}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end mt-4 sm:mt-0">
                <span className="text-xs text-gray-400 mb-2">Published: {offer.published}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Loading more... */}
        {/*
          <div className="flex justify-center mb-8">
            <span className="text-gray-400 flex items-center gap-2"><svg className="animate-spin" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M4 12a8 8 0 0 1 8-8" /></svg> Loading more...</span>
          </div>
        */}

        {/* Comparison Section */}
        <section className="bg-white rounded-xl p-6 mb-10 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-2">Compare the Best Betting Bonuses in Nigeria</h3>
          <p className="text-gray-600 text-sm mb-2">Looking to get the most out of your first deposit? At Booldo, we compare bonuses from Nigeria's top betting sites like <span className="font-semibold">Mozzartbet</span>, <span className="font-semibold">Betpawa</span>, and <span className="font-semibold">BetKing</span>. Popular offers include Free Bets, which let you place a risk-free wager, and Deposit Bonuses, where your first deposit is matched up to a certain amount—sometimes as much as ₦20,000.</p>
          <p className="text-gray-600 text-sm">Whether you're new to sports betting or just looking for the best deals, Booldo keeps you informed with up-to-date, verified offers in one place.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
} 