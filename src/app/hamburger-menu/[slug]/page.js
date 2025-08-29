"use client";

import { useEffect, useState } from "react";
import { client } from "../../../sanity/lib/client";
import { PortableText } from "@portabletext/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import HomeNavbar from "../../../components/HomeNavbar";
import Footer from "../../../components/Footer";
import Image from "next/image";
import imageUrlBuilder from "@sanity/image-url";
import ExpiredOfferPage from "../../[slug]/[...filters]/ExpiredOfferPage";

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source).url();
}

export default function HamburgerMenuPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [articles, setArticles] = useState([]);
  const [isContentHidden, setIsContentHidden] = useState(false);
  const params = useParams();
  const { slug } = params;

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // First try to find content by slug in additionalMenuItems
        let query = `*[_type == "hamburgerMenu" && isActive == true]{
          additionalMenuItems[]{
            label,
            content,
            _key,
            noindex,
            sitemapInclude
          }
        }[0]`;
        
        const result = await client.fetch(query);
        
        if (result?.additionalMenuItems) {
          // Find the specific menu item by slug (converted from label)
          const menuItem = result.additionalMenuItems.find(item => {
            const itemSlug = item.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            return itemSlug === slug;
          });
          
          if (menuItem) {
            // Check if content is hidden
            if (menuItem.noindex === true || menuItem.sitemapInclude === false) {
              setIsContentHidden(true);
              return;
            }
            
            setContent({
              title: menuItem.label,
              content: menuItem.content,
              type: 'additional'
            });
            setError(null);
            return;
          }
        }
        
        // If not found in additional items, check if it's the main title
        if (slug === 'main') {
          query = `*[_type == "hamburgerMenu" && isActive == true][0]{
            title,
            content,
            noindex,
            sitemapInclude
          }`;
          
          const mainResult = await client.fetch(query);
          if (mainResult) {
            // Check if content is hidden
            if (mainResult.noindex === true || mainResult.sitemapInclude === false) {
              setIsContentHidden(true);
              return;
            }
            
            setContent({
              title: mainResult.title,
              content: mainResult.content,
              type: 'main'
            });
            setError(null);
            return;
          }
        }
        
        setError('Content not found');
      } catch (err) {
        console.error('Error fetching hamburger menu content:', err);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchContent();
    }
  }, [slug]);

  // Fetch recent articles for sidebar (independent of slug)
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const recent = await client.fetch(`*[_type == "article"]|order(_createdAt desc)[0...5]{
          _id,
          title,
          slug,
          mainImage
        }`);
        setArticles(recent || []);
      } catch (e) {
        setArticles([]);
      }
    };
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-4xl mx-auto py-16 px-4 w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  // Check if content is hidden and show expired offer page
  if (isContentHidden) {
    return (
      <ExpiredOfferPage 
        isHidden={true}
        contentType="hamburger menu item"
        embedded={false}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6 text-gray-800 leading-relaxed">
          {content.content && content.content.length > 0 ? (
              <PortableText 
                value={content.content}
                components={{
                  block: {
                    h1: ({children}) => <h1 className="text-3xl font-bold mb-4 mt-6">{children}</h1>,
                    h2: ({children}) => <h2 className="text-2xl font-bold mb-3 mt-5">{children}</h2>,
                    h3: ({children}) => <h3 className="text-xl font-bold mb-2 mt-4">{children}</h3>,
                    h4: ({children}) => <h4 className="text-lg font-bold mb-2 mt-3">{children}</h4>,
                    p: ({children}) => <p className="mb-4 text-base leading-6">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-4 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-4 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="text-base leading-6">{children}</li>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-green-600 pl-4 italic text-gray-700 mb-4">{children}</blockquote>,
                  }
                }}
              />
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>No content available for this menu item.</p>
            </div>
          )}
        </div>
      </div>
          {/* Sidebar */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-700 text-xl">●</span>
              <h2 className="text-xl font-semibold">Articles</h2>
            </div>
            <div className="flex flex-col gap-4">
              {articles.map((article) => (
                <Link
                  key={article._id}
                  href={`/briefly/${article.slug.current}`}
                  className="flex gap-3 items-center bg-white rounded-lg shadow-sm p-2 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer"
                >
                  <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {article.mainImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
