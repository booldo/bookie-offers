import "./globals.css";
import { getLandingPageSettings } from "../sanity/lib/seo";
import CookieBanner from "../components/CookieBanner";
import AnalyticsInitializer from "../components/AnalyticsInitializer";
import { VisualEditing } from "next-sanity";
import { draftMode } from "next/headers";
import { DisableDraftMode } from "../components/DisableDraftMode";


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
        <link rel="icon" href="/assets/favicon.ico" type="image/x-icon" />
        <link href="https://api.fontshare.com/v2/css?f[]=general-sans@300,400,500,600,700,800&display=swap" rel="stylesheet" />
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
      </body>
    </html>
  );
}