"use client";
import { useParams } from "next/navigation";
import HomeNavbar from "../../../components/HomeNavbar";
import Footer from "../../../components/Footer";
import Link from "next/link";
import { client } from "../../../sanity/lib/client";
import imageUrlBuilder from '@sanity/image-url';
import { useEffect, useState } from "react";
import { PortableText } from '@portabletext/react';
import { useRouter } from "next/navigation";
import Image from "next/image";

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source).url();
}

// Custom components for PortableText rendering
const portableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold text-gray-900 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-lg font-semibold text-gray-900 mb-2">{children}</h4>
    ),
    normal: ({ children }) => (
      <p className="text-gray-800 leading-relaxed mb-4">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="list-disc list-inside space-y-1 text-gray-800 mb-4">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="list-decimal list-inside space-y-1 text-gray-800 mb-4">{children}</ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="ml-1">{children}</li>,
    number: ({ children }) => <li className="ml-1">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    link: ({ value, children }) => {
      const href = value?.href || '#';
      const isExternal = href.startsWith('http');
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="text-green-700 hover:text-green-800 underline"
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const src = value ? imageUrlBuilder(client).image(value).width(1200).url() : '';
      const alt = value?.alt || value?.asset?._ref || 'Article image';
      if (!src) return null;
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="w-full h-auto rounded-md"
            loading="lazy"
          />
          {value?.caption && (
            <figcaption className="text-sm text-gray-500 mt-2">{value.caption}</figcaption>
          )}
        </figure>
      );
    },
    codeBlock: ({ value }) => {
      if (!value?.code) return null;
      
      // embed and run the code
      if (value.type === 'execute') {
        return (
          <div className="my-6">
            {value.filename && (
              <div className="bg-blue-50 px-3 py-2 text-sm text-blue-700 font-medium border border-blue-200 rounded-t">
                <span className="font-semibold">Embedded Code:</span> {value.filename}
              </div>
            )}
            {value.description && (
              <div className="bg-gray-50 px-3 py-2 text-sm text-gray-600 border-b border-gray-200">
                {value.description}
              </div>
            )}
            <div 
              className={`border border-gray-200 rounded-lg overflow-hidden ${value.filename || value.description ? 'rounded-t-none' : ''}`}
              dangerouslySetInnerHTML={{ __html: value.code }}
            />
          </div>
        );
      }
      
      // show syntax highlighted code
      return (
        <div className="my-6">
          {value.filename && (
            <div className="bg-gray-100 px-3 py-1 text-sm text-gray-600 font-mono border-b border-gray-200 rounded-t">
              {value.filename}
            </div>
          )}
          <pre className={`p-4 bg-[#0b1020] text-[#e2e8f0] rounded-lg overflow-auto text-sm ${value.filename ? 'rounded-t-none' : ''}`}>
            <code className={`language-${value.language || 'javascript'}`}>
              {value.code}
            </code>
          </pre>
        </div>
      );
    },
  },
};

function ArticleInner({ slug }) {
  const router = useRouter();
  const [article, setArticle] = useState(null);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [articleData, allArticles] = await Promise.all([
          client.fetch(`*[_type == "article" && slug.current == $slug][0]{
            _id,
            title,
            slug,
            mainImage,
            content,
            noindex,
            sitemapInclude
          }`, { slug }),
          client.fetch(`*[_type == "article" && (noindex != true) && (sitemapInclude != false)]|order(_createdAt desc){
            _id,
            title,
            slug,
            mainImage
          }`)
        ]);
        
        // Check if article is hidden and set state
        if (articleData && (articleData.noindex === true || articleData.sitemapInclude === false)) {
          console.log('Article is hidden, setting hidden state');
          setError('This article has been removed or is no longer available.');
          setLoading(false);
          return;
        }
        
        setArticle(articleData);
        setArticles(allArticles);
        setLoading(false);
      } catch (err) {
        setError("Failed to load article");
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
          {/* Header skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex flex-col md:flex-row gap-8">
            {/* Main content skeleton */}
            <div className="flex-1 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            {/* Sidebar skeleton */}
            <aside className="w-full md:w-80 flex-shrink-0">
              <div className="flex flex-col gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 items-center bg-white rounded-lg shadow-sm p-2">
                    <div className="w-16 h-16 bg-gray-200 rounded animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fafbfc]">
        <HomeNavbar />
        <main className="flex-1 max-w-4xl mx-auto py-16 px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Content No Longer Available</h1>
            <p className="text-gray-600 mb-8">
              {error || 'This article has been removed or is no longer available.'}
            </p>
            <button
              onClick={() => router.push('/briefly')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg px-6 py-3 transition"
            >
              Back to Blog
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Sidebar
  const sidebarArticles = articles.slice(0, 5);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.push('/briefly')}
            className="focus:outline-none"
            aria-label="Go back"
          >
            <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
          </button>
          {/* <h1 className="text-3xl font-bold">{article.title}</h1> */}
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main Article Content */}
          <div className="flex-1">
            <div className="text-gray-800 text-base space-y-6 mb-8">
              <PortableText value={article.content} components={portableTextComponents} />
            </div>
          </div>
          {/* Sidebar */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <div className="flex flex-col gap-4">
              {sidebarArticles.map((a) => {
                const isActive = a.slug.current === article.slug.current;
                return (
                  <Link
                    key={a._id}
                    href={`/briefly/${a.slug.current}`}
                    className={`flex gap-3 items-center bg-white rounded-lg shadow-sm p-2 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer ${isActive ? "border-2 border-green-600" : ""}`}
                  >
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      {a.mainImage ? (
                        <img src={urlFor(a.mainImage)} alt={a.title} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 leading-tight">
                      {a.title}
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ArticleInner; 