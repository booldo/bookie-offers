import "./globals.css";
import { getLandingPageSettings } from "../sanity/lib/seo";
import CookieBanner from "../components/CookieBanner";
import AnalyticsInitializer from "../components/AnalyticsInitializer";
import { VisualEditing } from "next-sanity";
import { draftMode } from "next/headers";
import { DisableDraftMode } from "../components/DisableDraftMode";
import Script from 'next/script';


export async function generateMetadata() {
  const landingPage = await getLandingPageSettings();
  return {
    title: landingPage?.defaultMetaTitle || "Booldo",
    description: landingPage?.defaultMetaDescription || "Your amazing website",
    icons: {
      icon: "/assets/favicon.ico",
    },
  };
}

export default async function RootLayout({ children }) {
  const { isEnabled } = await draftMode();
  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="Tf7OJjEAuhjBBSwECHzz_jqZsPXcnSUQ4_kVeXPDHCo" />
        <link rel="icon" href="/assets/favicon.ico" type="image/x-icon" />
        {/* font share load */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        {/* <link rel="preconnect" href="https://fontshare.com" />
        <link rel="preconnect"
      href="https://fonts.gstatic.com"
      crossorigin /> */}

<link rel="preload"
      as="style"
      href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700,800&display=swap" />

  <link rel="stylesheet"
        href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700,800&display=swap" />

      </head>
      <body className={`antialiased`} style={{ fontFamily: "var(--font-sans)" }}>
        {children}
        <CookieBanner />
        <AnalyticsInitializer />

        {isEnabled && (
          <>
            <VisualEditing  />
            <DisableDraftMode />
          </>
        )}

         <Script src="https://www.googletagmanager.com/gtag/js?id=G-0KX3WGKZ7J" strategy="afterInteractive" />
     <Script id="gtag-init" strategy="afterInteractive">
       {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-0KX3WGKZ7J');`}
     </Script>
      </body>
    </html>
  );
}