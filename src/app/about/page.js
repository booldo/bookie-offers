import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { client } from "../../sanity/lib/client";
import imageUrlBuilder from '@sanity/image-url';
import Image from "next/image";
import { PortableText } from '@portabletext/react';
import { Suspense } from "react";

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source).url();
}

// Static data fetching for PPR
async function getAboutData() {
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
    
    return { about: aboutDoc, articles: allArticles };
  } catch (error) {
    console.error('Error fetching about data:', error);
    return { about: null, articles: [] };
  }
}

// Static metadata generation
export async function generateMetadata() {
  const { about } = await getAboutData();
  
  return {
    title: about?.title ? `${about.title} | Booldo` : 'About Us | Booldo',
    description: 'Learn more about Booldo and our mission to provide unbiased betting information.',
  };
}

// Loading fallback for articles sidebar
function ArticlesLoading() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-3 items-center bg-white rounded-lg shadow-sm p-2 animate-pulse">
          <div className="w-16 h-16 flex-shrink-0 rounded bg-gray-200"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
          </div>
  );
}

// Articles sidebar component
function ArticlesSidebar({ articles }) {
  return (
            <div className="flex flex-col gap-4">
      {articles.map((article) => (
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
  );
}

// Back button component (client-side)
import BackButton from './BackButton';

// Main About page component with PPR
export default async function AboutPage() {
  const { about, articles } = await getAboutData();

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex items-center gap-2 mb-4">
          <BackButton />
          <h1 className="text-4xl font-bold">{about?.title || 'About us'}</h1>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Main About Content - Static */}
          <div className="flex-1 text-gray-800 text-base space-y-5">
            {about?.content ? (
              <PortableText value={about.content} />
            ) : (
              <p className="text-gray-500">No content available yet.</p>
            )}
          </div>
          
          {/* Sidebar - Static with fallback */}
          <aside className="w-full md:w-80 flex-shrink-0">
            <Suspense fallback={<ArticlesLoading />}>
              <ArticlesSidebar articles={articles} />
            </Suspense>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
} 