import HomeNavbar from "../../components/HomeNavbar";
import Footer from "../../components/Footer";
import { client } from "../../sanity/lib/client";
import ExpiredOfferPage from "../[slug]/[...filters]/ExpiredOfferPage";
import Image from "next/image";

// Static data fetching for PPR
async function getContactData(countrySlug) {
  try {
    const doc = countrySlug
      ? await client.fetch(`*[_type == "contact" && references(*[_type == "countryPage" && slug.current == $slug]._id)][0]{
        title,
        subtitle,
        email,
        note,
        metaTitle,
        metaDescription,
        noindex,
        nofollow,
        canonicalUrl,
        sitemapInclude
      }`, { slug: countrySlug })
      : await client.fetch(`*[_type == "contact" && !defined(country)][0]{
        title,
        subtitle,
        email,
        note,
        metaTitle,
        metaDescription,
        noindex,
        nofollow,
        canonicalUrl,
        sitemapInclude
      }`);
    
    return doc;
  } catch (error) {
    console.error('Error fetching contact data:', error);
    return null;
  }
}

// Static metadata generation
export const revalidate = 60;

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const countryParam = sp?.country || undefined;
  const contact = await getContactData(countryParam);
  const title = (contact?.metaTitle || (contact?.title ? `${contact.title} | Booldo` : 'Contact Us | Booldo'));
  const description = contact?.metaDescription || contact?.subtitle || 'Get in touch with Booldo for questions, suggestions, or partnership inquiries.';
  const robots = [contact?.noindex ? 'noindex' : 'index', contact?.nofollow ? 'nofollow' : 'follow'].join(', ');
  const alternates = { canonical: contact?.canonicalUrl || undefined };

  return { title, description, robots, alternates };
}

// Main Contact page component with PPR
export default async function ContactPage({ searchParams }) {
  const sp = await searchParams;
  const countryParam = sp?.country || undefined;
  const contact = await getContactData(countryParam);

  // Check if the Contact page is hidden
  if (contact && (contact.noindex === true || contact.sitemapInclude === false)) {
    return (
      <ExpiredOfferPage 
        isHidden={true}
        contentType="contact page"
        embedded={false}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fafbfc]">
      <HomeNavbar />
      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-10">
        {/* Breadcrumb-like back to Home, styled like offer details */}
        <div className="max-w-xl mx-auto mb-4 sm:mb-6 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <a href="/" className="hover:underline flex items-center gap-1 flex-shrink-0" aria-label="Go to Home">
            <Image src="/assets/back-arrow.png" alt="Back" width={24} height={24} />
            Home
          </a>
        </div>
        <div className="bg-white rounded-2xl shadow-lg max-w-xl mx-auto w-full p-6 sm:p-8 flex flex-col items-center border border-gray-100">
          {/* Static contact icon */}
          <div className="mb-4">
            <svg width="56" height="56" fill="none" viewBox="0 0 56 56">
              <rect width="56" height="56" rx="16" fill="#e6f4ea" />
              <path d="M14 20l14 10 14-10" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="14" y="20" width="28" height="16" rx="2" stroke="#15803d" strokeWidth="2"/>
            </svg>
          </div>
          
          {/* Static content - prerendered */}
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-center text-green-800 font-['General_Sans']">
            {contact?.title || 'Contact Us'}
          </h1>
          <p className="mb-6 text-gray-600 text-center text-base sm:text-lg font-['General_Sans']">
            {contact?.subtitle || `We'd love to hear from you! For questions, suggestions, or partnership inquiries, reach out anytime:`}
          </p>
          
          {/* Static email link */}
          <a
            href={`mailto:${contact?.email || 'info@booldo.com'}`}
            className="text-green-700 text-lg sm:text-xl font-semibold underline hover:text-green-900 transition font-['General_Sans']"
          >
            {contact?.email || 'info@booldo.com'}
          </a>
          
          {/* Static note */}
          <div className="mt-8 text-gray-400 text-sm text-center font-['General_Sans']">
            {contact?.note || (
              <>
                We aim to respond to all emails within 24 hours.<br />Thank you for connecting with Booldo!
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}