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

export default function BrieflyPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchArticles() {
      const data = await client.fetch(`*[_type == "article"]|order(_createdAt desc){
        _id,
        title,
        "slug": slug.current,
        mainImage
      }`);
      setArticles(data);
      setLoading(false);
    }
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.back()}
            className="focus:outline-none"
            aria-label="Go back"
          >
            <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
          </button>
          <span className="text-green-700 text-2xl">●</span>
          <h2 className="text-2xl font-bold">Latest</h2>
        </div>
        {loading ? (
          <div>Loading articles...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {articles.map((article) => (
              <Link
                key={article._id}
                href={`/briefly/${article.slug}`}
                className="flex gap-3 items-start bg-white rounded-lg shadow-sm p-2 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer"
              >
                <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                  {article.mainImage ? (
                    <img src={urlFor(article.mainImage)} alt={article.title} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
                <div className="text-base font-semibold text-gray-900 leading-tight mt-2">
                  {article.title}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
} 