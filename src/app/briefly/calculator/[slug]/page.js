import { client } from "../../../../sanity/lib/client";
import { urlFor } from "../../../../sanity/lib/image";
import { PortableText } from '@portabletext/react';
import HomeNavbar from "../../../../components/HomeNavbar";
import Footer from "../../../../components/Footer";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

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
      const src = value ? urlFor(value).width(1200).url() : '';
      const alt = value?.alt || value?.asset?._ref || 'Calculator image';
      if (!src) return null;
      return (
        <figure className="my-6">
          <img
            src={src}
            alt={alt}
            className="w-full h-auto rounded-md"
            loading="lazy"
          />
          {value?.caption && (
            <figcaption className="text-center text-sm text-gray-600 mt-2">
              {value.caption}
            </figcaption>
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
                <span className="font-semibold">Calculator Output:</span> {value.filename}
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

export default async function CalculatorPage({ params }) {
  const { slug } = await params;
  
  // Fetch calculator data
  const calculator = await client.fetch(`*[_type == "calculator" && slug.current == $slug && isActive == true][0]{
    _id,
    title,
    calculatorImage,
    calculatorImageAlt,
    briefDescription,
    codeOutput,
    metaTitle,
    metaDescription
  }`, { slug });

  if (!calculator) {
    notFound();
  }

  // Fetch articles for sidebar and other calculators for read more section
  const [articles, otherCalculators] = await Promise.all([
    client.fetch(`*[_type == "article"]|order(_createdAt desc)[0...5]{
      _id,
      title,
      "slug": slug.current,
      mainImage
    }`),
    client.fetch(`*[_type == "calculator" && slug.current != $slug && isActive == true]|order(_createdAt desc)[0...3]{
      _id,
      title,
      "slug": slug.current,
      calculatorImage,
      briefDescription
    }`, { slug })
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 max-w-6xl mx-auto py-10 px-4 w-full">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/briefly" className="focus:outline-none">
            <Image src="/assets/back-arrow.png" alt="Back" width={28} height={28} />
          </Link>
          <span className="text-green-700 text-2xl">●</span>
          <h2 className="text-2xl font-bold">Calculator</h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {calculator.title}
              </h1>
              
              {calculator.briefDescription && (
                <p className="text-lg text-gray-600 mb-6">
                  {calculator.briefDescription}
                </p>
              )}

              {calculator.codeOutput && calculator.codeOutput.length > 0 && (
                <div className="prose max-w-none">
                  <PortableText 
                    value={calculator.codeOutput}
                    components={portableTextComponents}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Articles Only */}
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
                          src={urlFor(article.mainImage).width(64).height(64).url()} 
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

        {/* Read More Section - Additional Calculators */}
        <hr className="my-10 border-gray-200" />
        <div className="flex items-center gap-2 mb-6">
          <span className="text-green-700 text-2xl">●</span>
          <h2 className="text-2xl font-bold">Read More</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          {otherCalculators.map((calculator) => (
            <Link
              key={calculator._id}
              href={`/briefly/calculator/${calculator.slug}`}
              className="flex flex-col items-center bg-white rounded-lg shadow-sm p-4 transition hover:shadow-lg hover:scale-[1.03] cursor-pointer"
            >
              <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 mb-3">
                {calculator.calculatorImage ? (
                  <img 
                    src={urlFor(calculator.calculatorImage).width(64).height(64).url()} 
                    alt={calculator.title} 
                    className="object-cover w-full h-full" 
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="inline-block bg-green-600 text-white text-xs px-2 py-1 rounded-md mb-2">
                Calculators
              </div>
              <div className="text-base font-semibold text-gray-900 leading-tight text-center">
                {calculator.title}
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
