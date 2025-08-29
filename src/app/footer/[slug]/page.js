"use client";

import HomeNavbar from "../../../components/HomeNavbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { client } from "../../../sanity/lib/client";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import Head from "next/head";
import ExpiredOfferPage from "../../[slug]/[...filters]/ExpiredOfferPage";

export default function FooterPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [page, setPage] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await client.fetch(`*[_type == "footer" && isActive == true][0]{
          bottomRowLinks{
            links[]{
              label,
              slug,
              content,
              metaTitle,
              metaDescription,
              keywords,
              noindex,
              sitemapInclude
            }
          }
        }`);

        const current = data?.bottomRowLinks?.links?.find(l => l?.slug?.current === slug);

        const recentArticles = await client.fetch(`*[_type == "article"]|order(_createdAt desc)[0...5]{
          _id,
          title,
          slug,
          mainImage
        }`);

        setPage(current || null);
        setArticles(recentArticles || []);
      } catch (e) {
        setPage(null);
      } finally {
        setLoading(false);
      }
    }
    if (slug) fetchData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 w-full">
          <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-4xl mx-auto py-12 sm:py-16 px-4 sm:px-6 font-['General_Sans']">Page not found</main>
        <Footer />
      </div>
    );
  }

  // Check if the footer link is hidden
  if (page.noindex === true || page.sitemapInclude === false) {
    return (
      <ExpiredOfferPage 
        isHidden={true}
        contentType="footer link"
        embedded={false}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <Head>
        <title>{page.metaTitle || `${page.label} | Booldo`}</title>
        <meta name="description" content={page.metaDescription || `Learn more about ${page.label} on Booldo.`} />
        {page.keywords && page.keywords.length > 0 && (
          <meta name="keywords" content={page.keywords.join(', ')} />
        )}
      </Head>
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <button onClick={() => router.back()} className="focus:outline-none" aria-label="Go back">
            <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold font-['General_Sans']">{page.label}</h1>
        </div>
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="text-gray-800 text-sm sm:text-base space-y-4 sm:space-y-6 mb-6 sm:mb-8 font-['General_Sans']">
              <PortableText value={page.content} />
            </div>
          </div>
          {/* Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-700 text-xl">●</span>
              <h2 className="text-lg sm:text-xl font-semibold font-['General_Sans']">Articles</h2>
            </div>
            <div className="flex flex-col gap-4">
              {articles.map((a) => (
                <Link
                  key={a._id}
                  href={`/briefly/${a.slug.current}`}
                  className="flex gap-3 items-center bg-white rounded-lg shadow-sm p-2 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer"
                >
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {a.mainImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.mainImage?.asset ? a.mainImage.asset._ref : ''} alt={a.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 leading-tight font-['General_Sans']">
                    {a.title}
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
