import "./globals.css";
import { getLandingPageSettings } from "../sanity/lib/seo";
import CookieBanner from "../components/CookieBanner";
import AnalyticsInitializer from "../components/AnalyticsInitializer";

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

export default function RootLayout({ children }) {
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
      </body>
    </html>
  );
}