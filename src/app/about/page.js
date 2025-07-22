"use client";
import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { client } from "../../sanity/lib/client";
import imageUrlBuilder from '@sanity/image-url';
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source).url();
}

export default function AboutPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchArticles() {
      setLoading(true);
      try {
        const allArticles = await client.fetch(`*[_type == "article"]|order(_createdAt desc)[0...5]{
          _id,
          title,
          slug,
          mainImage
        }`);
        setArticles(allArticles);
        setLoading(false);
      } catch (err) {
        setError("Failed to load articles");
        setLoading(false);
      }
    }
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="focus:outline-none"
            aria-label="Go back"
          >
            <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
          </button>
          <h1 className="text-4xl font-bold">About us</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main About Content */}
          <div className="flex-1 text-gray-800 text-base space-y-5">
            <p>At Booldo.com, we are industry enthusiasts with years of experience in online sports betting. After working in major companies, we wanted to do things differently. In 2022, we started building Booldo with a clear mission: to create a site that focuses on what truly matters – reliable information and a wide selection of bookmakers and offers.</p>
            <p>We are an affiliate website, which means we may receive compensation if a user places a bet after visiting a bookmaker through our site. However, unlike many other affiliate sites that only showcase bookmakers they have deals with, we strive to list as many bookmakers and offers as possible – even those we don’t have partnerships with. Our goal is to provide bettors with the full picture, not just a curated selection.</p>
            <p>Currently, we operate in Nigeria, Kenya, and Ghana, and we are continuously working to expand our coverage. We also don’t focus on betting tips – over the years, we’ve found that good information and choice serve bettors better than predictions.</p>
            <p>Booldo is an independent sports betting affiliate platform – we are not a bookmaker, do not accept or process bets, and do not hold any gaming licenses. Our mission is to help users in Nigeria, Ghana, and Kenya discover the latest offers from betting brands licensed by reputable local and international regulatory authorities. Whether or not we maintain an affiliate partnership with a brand, we are committed to providing transparent, up-to-date information so users can make fully informed choices.</p>
            <p>We believe in letting our work speak for itself. That’s why you won’t find our faces or LinkedIn profiles here. Booldo isn’t about us – it’s about giving you the best betting options, with no distractions.</p>
          </div>
          {/* Sidebar */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="flex flex-col gap-4">
              {loading && <div className="text-gray-400">Loading articles...</div>}
              {error && <div className="text-red-500">{error}</div>}
              {!loading && !error && articles.map((article) => (
                <Link
                  key={article._id}
                  href={`/briefly/${article.slug.current}`}
                  className="flex gap-3 items-center bg-white rounded-lg shadow-sm p-2 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer"
                >
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {article.mainImage ? (
                      <img src={urlFor(article.mainImage)} alt={article.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 leading-tight">
                    {article.title}
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