import { Inter } from "next/font/google";
import "./globals.css";
import { getSeoSettings } from "../sanity/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

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
  // Get current path (for SSR/CSR compatibility, fallback to '')
  let path = '';
  if (typeof window !== 'undefined') {
    path = window.location.pathname;
  }
  // Fallback for SSR: try to use globalThis.location if available
  if (!path && typeof globalThis !== 'undefined' && globalThis.location) {
    path = globalThis.location.pathname;
  }
  // Determine hreflang
  let hreflangTag = null;
  if (path.startsWith('/ng')) {
    hreflangTag = <link rel="alternate" hreflang="en-ng" href="https://yourdomain.com/ng" />;
  } else if (path.startsWith('/gh')) {
    hreflangTag = <link rel="alternate" hreflang="en-gh" href="https://yourdomain.com/gh" />;
  }
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/favicon.ico" type="image/x-icon" />
        {hreflangTag}
      </head>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}