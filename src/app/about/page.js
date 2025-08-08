"use client";
import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { client } from "../../sanity/lib/client";
import imageUrlBuilder from '@sanity/image-url';
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PortableText } from '@portabletext/react';

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source).url();
}

export default function AboutPage() {
  const [about, setAbout] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [aboutDoc, allArticles] = await Promise.all([
          client.fetch(`*[_type == "about"][0]{
            _id,
            title,
            mainImage,
            content
          }`),
          client.fetch(`*[_type == "article"]|order(_createdAt desc)[0...5]{
            _id,
            title,
            slug,
            mainImage
          }`)
        ]);
        setAbout(aboutDoc);
        setArticles(allArticles);
        setLoading(false);
      } catch (err) {
        setError("Failed to load content");
        setLoading(false);
      }
    }
    fetchData();
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
          <h1 className="text-4xl font-bold">{about?.title || 'About us'}</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main About Content */}
          <div className="flex-1 text-gray-800 text-base space-y-5">
            {about?.content ? (
              <PortableText value={about.content} />
            ) : (
              <p className="text-gray-500">No content available yet.</p>
            )}
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