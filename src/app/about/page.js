import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import Link from "next/link";
import { client } from "../../sanity/lib/client";
import imageUrlBuilder from '@sanity/image-url';
import Image from "next/image";
import { PortableText } from '@portabletext/react';
import { Suspense } from "react";
import ExpiredOfferPage from "../[slug]/[...filters]/ExpiredOfferPage";

// Custom components for PortableText
const portableTextComponents = {
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null;
      return (
        <div className="my-4 sm:my-6">
          <Image
            src={getImageUrl(value)}
            alt={value.alt || 'About page image'}
            width={800}
            height={600}
            className="rounded-lg shadow-sm w-full h-auto"
          />
          {value.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center font-['General_Sans']">
              {value.caption}
            </p>
          )}
        </div>
      );
    },
  },
  block: {
    h1: ({ children }) => <h1 className="text-2xl sm:text-3xl font-bold mb-4 mt-6 font-['General_Sans']">{children}</h1>,
    h2: ({ children }) => <h2 className="text-xl sm:text-2xl font-bold mb-3 mt-5 font-['General_Sans']">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg sm:text-xl font-semibold mb-2 mt-4 font-['General_Sans']">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base sm:text-lg font-semibold mb-2 mt-3 font-['General_Sans']">{children}</h4>,
    normal: ({ children }) => <p className="mb-3 sm:mb-4 leading-relaxed font-['General_Sans']">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700 font-['General_Sans']">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 font-['General_Sans']">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 font-['General_Sans']">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="ml-4 font-['General_Sans']">{children}</li>,
    number: ({ children }) => <li className="ml-4 font-['General_Sans']">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold font-['General_Sans']">{children}</strong>,
    em: ({ children }) => <em className="italic font-['General_Sans']">{children}</em>,
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target={value?.blank ? '_blank' : '_self'}
        rel={value?.blank ? 'noopener noreferrer' : undefined}
        className="text-blue-600 hover:text-blue-800 underline font-['General_Sans']"
      >
        {children}
      </a>
    ),
  },
};

const builder = imageUrlBuilder(client);
function urlFor(source) {
  return builder.image(source);
}

function getImageUrl(source, width = 800, height = 600) {
  return builder.image(source).width(width).height(height).url();
}

// Static data fetching for PPR
async function getAboutData(countrySlug) {
  try {
    const [aboutDoc, allArticles] = await Promise.all([
      // If a country slug is provided, try country-scoped; if 'default', try default-scoped; otherwise fallback to global
      countrySlug
        ? client.fetch(`*[_type == "about" && references(*[_type == "countryPage" && slug.current == $slug]._id)][0]{
          _id,
          title,
          content,
          metaTitle,
          metaDescription,
          noindex,
          nofollow,
          canonicalUrl,
          sitemapInclude
        }`, { slug: countrySlug })
        : client.fetch(`*[_type == "about"][0]{
          _id,
          title,
          content,
          metaTitle,
          metaDescription,
          noindex,
          nofollow,
          canonicalUrl,
          sitemapInclude
        }`),
      client.fetch(`*[_type == "article" && (noindex != true) && (sitemapInclude != false)]|order(_createdAt desc)[0...5]{
          _id,
          title,
          slug,
          mainImage
      }`)
    ]);
    
    // If no country match found and a specific default is requested, try default
    if (!aboutDoc && countrySlug === 'default') {
      const fallbackDefault = await client.fetch(`*[_type == "about" && references(*[_type == "countryPage" && slug.current == "default"]._id)][0]{
        _id,
        title,
        content,
        metaTitle,
        metaDescription,
        noindex,
        nofollow,
        canonicalUrl,
        sitemapInclude
      }`);
      return { about: fallbackDefault, articles: allArticles };
    }
    return { about: aboutDoc, articles: allArticles };
  } catch (error) {
    console.error('Error fetching about data:', error);
    return { about: null, articles: [] };
  }
}

// Static metadata generation
export const revalidate = 60;

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const countryParam = sp?.country || undefined;
  const { about } = await getAboutData(countryParam);
  const title = (about?.metaTitle || (about?.title ? `${about.title} | Booldo` : 'About Us | Booldo'));
  const description = about?.metaDescription || 'Learn more about Booldo and our mission to provide unbiased betting information.';
  const robots = [about?.noindex ? 'noindex' : 'index', about?.nofollow ? 'nofollow' : 'follow'].join(', ');
  const alternates = { canonical: about?.canonicalUrl || undefined };

  return { title, description, robots, alternates };
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
                      <img src={getImageUrl(article.mainImage, 64, 64)} alt={article.title} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 leading-tight font-['General_Sans']">
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
export default async function AboutPage({ searchParams }) {
  const sp = await searchParams;
  const countryParam = sp?.country || undefined;
  const { about, articles } = await getAboutData(countryParam);

  // Check if the About page is hidden
  if (about && (about.noindex === true || about.sitemapInclude === false)) {
    return (
      <ExpiredOfferPage 
        isHidden={true}
        contentType="about page"
        embedded={false}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 w-full">
        {/* Breadcrumb-like back to Home, styled like offer details */}
        <div className="mt-0 mb-4 sm:mb-6 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link href="/" className="hover:underline flex items-center gap-1 flex-shrink-0" aria-label="Go to Home">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-['General_Sans']">{about?.title || 'About us'}</h1>
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Main About Content - Static */}
          <div className="flex-1 text-gray-800 text-sm sm:text-base space-y-4 sm:space-y-5 font-['General_Sans']">
            {about?.content ? (
              <PortableText value={about.content} components={portableTextComponents} />
            ) : (
              <p className="text-gray-500 font-['General_Sans']">No content available yet.</p>
            )}
          </div>
          
          {/* Sidebar - Static with fallback */}
          <aside className="w-full lg:w-80 flex-shrink-0">
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