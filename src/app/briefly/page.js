"use client";
import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { client } from "../../sanity/lib/client";
import imageUrlBuilder from '@sanity/image-url';
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getLandingPageSettings } from "../../sanity/lib/seo";

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source).url();
}

export default function BrieflyPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const articlesData = await client.fetch(`*[_type == "article" && (noindex != true) && (sitemapInclude != false)]|order(_createdAt desc){
            _id,
            title,
            "slug": slug.current,
            mainImage
        }`);
        setArticles(articlesData);
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
        if (landingPage?.blogPageTitle) {
          setPageTitle(landingPage.blogPageTitle);
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
      <main className="flex-1 max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.push('/')} 
            className="focus:outline-none"
            aria-label="Go back"
          >
            <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
          </button>
          <span className="text-green-700 text-2xl">●</span>
          <h1 className="text-xl sm:text-2xl font-bold font-['General_Sans']">{pageTitle}</h1>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="w-32 h-32 bg-gray-200 rounded mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {articles.map((article) => (
                  <Link
                    key={article._id}
                    href={`/briefly/${article.slug}`}
                className="flex flex-col items-center bg-white rounded-lg shadow-sm p-4 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer"
                  >
                <div className="w-full h-40 md:w-56 md:h-56 rounded overflow-hidden bg-gray-100 mb-3">
                      {article.mainImage ? (
                    <img
                      src={article.mainImage}
                      alt={article.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                    </div>
                  )}
                      </div>
                <div className="text-sm sm:text-base font-semibold text-gray-900 leading-tight text-center font-['General_Sans']">
                  {article.title}
                    </div>
                {/* <span className="mt-2 px-3 py-1 bg-green-700 text-white text-xs rounded font-['General_Sans']">Briefly</span> */}
                  </Link>
                ))}
              </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 