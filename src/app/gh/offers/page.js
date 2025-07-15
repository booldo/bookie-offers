"use client";
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { client } from "../../../sanity/lib/client";
import { urlFor } from "../../../sanity/lib/image";

function OfferDetailsInner() {
  const params = useSearchParams();
  const offerId = params.get("offerId");
  const [offer, setOffer] = useState(null);
  const [moreOffers, setMoreOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!offerId) return;
    setLoading(true);
    // Fetch the main offer and more offers from Sanity
    const fetchData = async () => {
      try {
        // Fetch the main offer by id
        const mainOfferQuery = `*[_type == "offer" && country == "Ghana" && id == $id][0]{
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
          howItWorks,
          banner
        }`;
        const mainOffer = await client.fetch(mainOfferQuery, { id: offerId });
        // Fetch more offers, excluding the current one
        const moreOffersQuery = `*[_type == "offer" && country == "Ghana" && id != $id] | order(published desc)[0...4]{
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
          howItWorks,
          banner
        }`;
        const more = await client.fetch(moreOffersQuery, { id: offerId });
        setOffer(mainOffer);
        setMoreOffers(more);
        setLoading(false);
      } catch (err) {
        setError("Failed to load offer details");
        setLoading(false);
      }
    };
    fetchData();
  }, [offerId]);

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
          <span className="text-gray-700 font-medium">{offer?.bonusType || "Bonus"}</span>
        </div>
                    {/* Banner */}
            {loading && <div className="text-center text-gray-400">Loading offer...</div>}
            {error && <div className="text-center text-red-500">{error}</div>}
            {!loading && !error && offer && (
              <>
                <div className="w-full rounded-xl overflow-hidden shadow-sm mb-6">
                  <Image src="/assets/ng-nigeria.png" alt="Nigeria Banner" width={1200} height={200} className="w-full h-40 object-cover" priority />
                </div>
            {/* Offer Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-3 mb-2">
                {offer.logo ? (
                  <Image src={urlFor(offer.logo).width(40).height(40).url()} alt={offer.bookmaker} width={40} height={40} className="rounded-md" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-md" />
                )}
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
              {offer.howItWorks && offer.howItWorks.length > 0 && (
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
              )}
              {/* Payment Method */}
              {offer.paymentMethods && offer.paymentMethods.length > 0 && (
                <div className="mb-4">
                  <div className="font-semibold text-gray-900 mb-1">Payment Method</div>
                  <div className="flex flex-wrap gap-2 text-gray-700 text-sm">
                    {offer.paymentMethods.map((pm, i) => (
                      <span key={i} className="border border-gray-200 rounded px-2 py-1 bg-gray-50">{pm}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Terms & Condition */}
              {offer.terms && offer.terms.length > 0 && (
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Terms & Condition</div>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 pl-4">
                    {offer.terms.map((term, i) => (
                      <li key={i}>{term}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}
        {/* More Offers */}
        {!loading && !error && moreOffers.length > 0 && (
          <div className="mb-10">
            <div className="font-semibold text-lg text-gray-900 mb-3">More Offers</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {moreOffers.map((o) => (
                <Link
                  key={o._id || o.id}
                  href={`?offerId=${o.id}`}
                  scroll={false}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between transition cursor-pointer hover:bg-gray-50 hover:shadow-lg hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {o.logo ? (
                      <Image src={urlFor(o.logo).width(28).height(28).url()} alt={o.bookmaker} width={28} height={28} className="rounded-md" />
                    ) : (
                      <div className="w-7 h-7 bg-gray-100 rounded-md" />
                    )}
                    <span className="font-semibold text-gray-900 text-base">{o.bookmaker}</span>
                    <span className="ml-auto text-xs text-gray-500">Published: {o.published}</span>
                  </div>
                  <div className="font-semibold text-gray-900 text-sm mb-1">{o.title}</div>
                  <div className="text-xs text-gray-500 mb-2">{o.description}</div>
                  <span className="flex items-center gap-1 text-green-700 text-xs font-medium">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    Expires: {o.expires}
                  </span>
                </Link>
              ))}
            </div>
            <div className="flex justify-center mt-6">
              <button className="px-6 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition">Load More</button>
            </div>
          </div>
        )}
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