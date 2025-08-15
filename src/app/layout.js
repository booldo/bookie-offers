import "./globals.css";
import { getLandingPageSettings } from "../sanity/lib/seo";

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
      </head>
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}