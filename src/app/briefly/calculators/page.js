"use client";
import HomeNavbar from "../../../components/HomeNavbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { client } from "../../../sanity/lib/client";
import imageUrlBuilder from '@sanity/image-url';
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getLandingPageSettings } from "../../../sanity/lib/seo";

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source).url();
}


export default function CalculatorsPage() {
  const [articles, setArticles] = useState([]);
  const [calculators, setCalculators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const [articlesData, calculatorsData] = await Promise.all([
          client.fetch(`*[_type == "article" && (noindex != true) && (sitemapInclude != false)]|order(_createdAt desc)[0...5]{
            _id,
            title,
            "slug": slug.current,
            mainImage
          }`),
          client.fetch(`*[_type == "calculator" && isActive == true && (noindex != true) && (sitemapInclude != false)]|order(_createdAt desc){
            _id,
            title,
            "slug": slug.current,
            calculatorImage,
            briefDescription
          }`)
        ]);
        setArticles(articlesData);
        setCalculators(calculatorsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    async function fetchTitle() {
      try {
        const landingPage = await getLandingPageSettings();
        if (landingPage?.calculatorPageTitle) {
          setPageTitle(landingPage.calculatorPageTitle);
        }
      } catch (error) {
        console.error('Error fetching page title:', error);
      }
    }
    fetchTitle();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.push('/')} 
            className="focus:outline-none"
            aria-label="Go back"
          >
            <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
          </button>
          <span className="text-green-700 text-2xl">●</span>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 items-start bg-white rounded-lg shadow-sm p-4 animate-pulse">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4" />
                      <div className="h-6 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {calculators.map((calculator) => (
                  <Link
                    key={calculator._id}
                    href={`/briefly/calculator/${calculator.slug}`}
                    className="flex gap-4 items-start bg-white rounded-lg shadow-sm p-4 transition hover:shadow-lg hover:scale-[1.01] cursor-pointer"
                  >
                    {/* Calculator Icon */}
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {calculator.calculatorImage ? (
                        <img 
                          src={urlFor(calculator.calculatorImage)} 
                          alt={calculator.title} 
                          className="object-cover w-full h-full" 
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Category Tag */}
                      <div className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-md mb-2">
                        Calculators
                      </div>
                      
                      {/* Title - */}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                        {calculator.title}
                      </h3>
                      <p>Rendered at: {new Date().toISOString()}</p>
                      {/* Description*/}
                      {calculator.briefDescription && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
                          {calculator.briefDescription}
                        </p>
                      )}
                      
                      {/* Read More Link - "Read more »" */}
                      <div className="text-gray-900 font-medium text-sm">
                        Read more »
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Articles */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-blue-600 text-xl">●</span>
                <h2 className="text-xl font-semibold">Articles</h2>
              </div>
              <div className="flex flex-col gap-4">
                {articles.map((article) => (
                  <Link
                    key={article._id}
                    href={`/briefly/${article.slug}`}
                    className="flex gap-3 items-center bg-gray-50 rounded-lg p-3 transition hover:bg-gray-100 hover:scale-[1.02] cursor-pointer"
                  >
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      {article.mainImage ? (
                        <img
                          src={article.mainImage}
                          alt={article.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {article.title}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
