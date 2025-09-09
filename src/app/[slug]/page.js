import CountryPageShell, { generateStaticParams, generateMetadata } from './CountryPageShell';
import OffersServer from './OffersServer';
import { Suspense } from "react";

// Export the static generation functions from CountryPageShell
export { generateStaticParams, generateMetadata };

// Force dynamic rendering so middleware can intercept and return 410 when needed
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CountryPage({ params }) {
  const awaitedParams = await params;
  
  return (
    <CountryPageShell params={awaitedParams}>
      {/* Dynamic offers section with proper PPR streaming */}
      <Suspense fallback={
        <div className="space-y-6">
          
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
        <OffersServer countrySlug={awaitedParams.slug} initialFilter={null} />
      </Suspense>
    </CountryPageShell>
  );
}