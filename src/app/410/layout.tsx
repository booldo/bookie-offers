import { headers } from 'next/headers';

export default async function Gone410Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set 410 status code for this route
  const headersList = headers();
  
  return (
    <html>
      <head>
        <meta httpEquiv="status" content="410" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

// This ensures the page returns a 410 status code
export const metadata = {
  title: "410 - Content Not Available | Booldo",
  icons: {
    icon: "/assets/favicon.ico",
  },
  other: {
    'http-equiv': 'status',
    content: '410'
  }
};
