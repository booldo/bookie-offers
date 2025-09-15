import { headers } from 'next/headers';

export async function generateMetadata() {
  return {
    title: "410 - Content No Longer Available | Booldo",
    description: "This content has been intentionally removed or hidden and is no longer accessible.",
    robots: "noindex, nofollow",
    icons: {
      icon: "/assets/favicon.ico",
    },
  };
}

export default async function Gone410Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout ensures the 410 status code is set
  const headersList = headers();
  
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/assets/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

// This function will be called by Next.js to set the status code
export async function generateStaticParams() {
  return [];
}
