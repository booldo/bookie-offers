import "./globals.css";
import { getSeoSettings } from "../sanity/lib/seo";

export async function generateMetadata() {
  const seo = await getSeoSettings();
  return {
    title: seo?.defaultMetaTitle || "Booldo",
    description: seo?.defaultMetaDescription || "Your amazing website",
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