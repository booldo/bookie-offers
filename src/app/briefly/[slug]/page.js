import { getPageSeo } from "../../../sanity/lib/seo";
import ArticleInner from "./ArticleInner";

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

import Gone410Page from '../../410/Gone410Page';
import { getVisibleDocOrNull } from '../../../sanity/lib/checkGoneStatus';

export default async function ArticlePage({ params }) {
  const { slug } = params;
  const article = await getVisibleDocOrNull('article', slug);
  if (!article) {
    // Optionally throw new Response(null, { status: 410 });
    return <Gone410Page contentType="article" />;
  }
  return <ArticleInner slug={slug} />;
}