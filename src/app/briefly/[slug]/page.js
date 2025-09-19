import { getPageSeo } from "../../../sanity/lib/seo";
import ArticleInner from "./ArticleInner";
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
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

export const revalidate = 60;

import { getVisibleDocOrNull } from '../../../sanity/lib/checkGoneStatus';

export default async function ArticlePage({ params }) {
  const awaitedParams = await params;
  const { slug } = awaitedParams;
  const article = await getVisibleDocOrNull('article', slug);
  if (!article) {
    notFound();
  }
  return <ArticleInner slug={slug} />;
}