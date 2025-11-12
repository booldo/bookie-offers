import { getPageSeo } from "../../../../sanity/lib/seo";
import CalculatorInner from "./CalculatorInner";
import { getVisibleDocOrNull } from "../../../../sanity/lib/checkGoneStatus";
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const seo = await getPageSeo("calculator", slug);
      return {
    title: seo?.metaTitle || "Calculator | Booldo",
    description: seo?.metaDescription || "Use our calculator tools to make informed decisions.",
    robots: [
      seo?.noindex ? "noindex" : "index",
      seo?.nofollow ? "nofollow" : "follow"
    ].join(", "),
    alternates: {
      canonical: seo?.canonicalUrl || undefined,
    },
  };
}

export default async function CalculatorPage({ params }) {
  const awaitedParams = await params;
  const calculator = await getVisibleDocOrNull('calculator', awaitedParams.slug);
  if (!calculator) {
    notFound();
  }
  return <CalculatorInner slug={awaitedParams.slug} />;
}
