import { getPageSeo } from "../../../../sanity/lib/seo";
import CalculatorInner from "./CalculatorInner";

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

export const revalidate = 60;

export default function CalculatorPage({ params }) {
  return <CalculatorInner slug={params.slug} />;
}
