import CountryPageShell, { generateStaticParams } from '../CountryPageShell';
import DynamicOffers from '../DynamicOffers';
import OfferDetailsInner from './OfferDetailsInner';
import { Suspense } from "react";

// Use the same static generation functions from CountryPageShell
export { generateStaticParams };

export default async function CountryFiltersPage({ params }) {
  const awaitedParams = await params;
  
  // Check if this is an offer details page (has 3 segments: country/bonus-type/offer-slug)
  const isOfferDetailsPage = awaitedParams.filters && awaitedParams.filters.length >= 2;
  
  if (isOfferDetailsPage) {
    // Extract the offer slug from the last segment
    const offerSlug = awaitedParams.filters[awaitedParams.filters.length - 1];
    return (
      <CountryPageShell params={awaitedParams} isOfferDetailsPage={true}>
        <Suspense fallback={
          <div className="flex justify-center items-center py-20">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        }>
          <OfferDetailsInner slug={offerSlug} />
        </Suspense>
      </CountryPageShell>
    );
  }
  
  return (
    <CountryPageShell params={awaitedParams}>
      <Suspense fallback={
        <div className="space-y-4">
          {/* Filter skeleton */}
          <div className="sticky top-16 z-10 bg-white sm:static sm:bg-transparent">
            <div className="flex items-center justify-between my-4">
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
            </div>
            <div className="sm:max-w-md">
              <div className="grid grid-cols-3 gap-2 mb-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Offer cards skeleton */}
          <div className="flex flex-col gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </div>
      }>
        <DynamicOffers countrySlug={awaitedParams.slug} />
      </Suspense>
    </CountryPageShell>
  );
}