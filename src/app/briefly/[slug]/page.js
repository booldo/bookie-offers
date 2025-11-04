import { getPageSeo } from "../../../sanity/lib/seo";
import ArticleInner from "./ArticleInner";
import { notFound } from 'next/navigation';
import { client } from '../../../sanity/lib/client';

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

export const revalidate = 3600;

import { getVisibleDocOrNull } from '../../../sanity/lib/checkGoneStatus';

export default async function ArticlePage({ params, searchParams }) {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;
  const { slug } = awaitedParams;
  
  // Check if this is preview mode
  const isPreview = awaitedSearchParams?.preview === 'true';
  const draftId = awaitedSearchParams?.draftId;
  
  // Fetch article data server-side
  let articleQuery;
  let queryParams;
  
  if (isPreview && draftId) {
    console.log('👁️ Fetching draft article by ID:', draftId);
    articleQuery = `*[_id == $draftId][0]{
      _id,
      title,
      slug,
      mainImage,
      content,
      faq,
      noindex,
      sitemapInclude,
      draftPreview
    }`;
    queryParams = { draftId };
  } else {
    articleQuery = `*[_type == "article" && slug.current == $slug][0]{
      _id,
      title,
      slug,
      mainImage,
      content,
      faq,
      noindex,
      sitemapInclude
    }`;
    queryParams = { slug };
  }
  
  // Fetch article and sidebar articles in parallel
  const [article, allArticles] = await Promise.all([
    client.fetch(articleQuery, queryParams),
    client.fetch(`*[_type == "article" && (noindex != true) && (sitemapInclude != false)]|order(_createdAt desc){
      _id,
      title,
      slug,
      mainImage
    }`)
  ]);
  
  // Check if article exists and is visible
  if (!article || article.noindex === true || article.sitemapInclude === false) {
    notFound();
  }
  
  return <ArticleInner initialArticle={article} initialArticles={allArticles} />;
}