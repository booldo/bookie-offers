import { getPageSeo } from "../../../sanity/lib/seo";
import ArticleInner from "./ArticleInner";

export async function generateMetadata({ params }) {
  const { slug } = params;
  const seo = await getPageSeo("article", slug);
  return {
    title: seo?.metaTitle || "Article | Booldo",
    description: seo?.metaDescription || "Read the latest article.",
    robots: [
      seo?.noindex ? "noindex" : "index",
      seo?.nofollow ? "nofollow" : "follow"
    ].join(", "),
    alternates: {
      canonical: seo?.canonicalUrl || undefined,
    },
  };
}

export default function ArticlePage({ params }) {
  return <ArticleInner slug={params.slug} />;
} 