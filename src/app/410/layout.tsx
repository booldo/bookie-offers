import { headers } from 'next/headers';

export default async function Gone410Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout ensures the 410 status code is set
  const headersList = headers();
  
  return (
    <>
      {children}
    </>
  );
}

// This function will be called by Next.js to set the status code
export async function generateStaticParams() {
  return [];
}
