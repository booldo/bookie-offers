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

export default async function ArticlePage({ params, searchParams }) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  const { slug } = awaitedParams;
  
  // Check if this is preview mode
  const isPreview = awaitedSearchParams?.preview === 'true';
  const draftId = awaitedSearchParams?.draftId;
  
  // If preview mode, skip article existence check and let ArticleInner handle it
  if (isPreview && draftId) {
    return <ArticleInner slug={slug} isPreview={true} draftId={draftId} />;
  }
  
  // Normal mode: check if article exists
  const article = await getVisibleDocOrNull('article', slug);
  if (!article) {
    notFound();
  }
  return <ArticleInner slug={slug} />;
}