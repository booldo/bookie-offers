import { client } from './client';

export async function getSeoSettings() {
  const query = `*[_type == "seoSettings"][0]{
    robotsTxt,
    sitemapExtraUrls,
    defaultMetaTitle,
    defaultMetaDescription,
    defaultNoindex,
    defaultNofollow,
    defaultCanonicalUrl,
    defaultSitemapInclude
  }`;
  return client.fetch(query);
}

export async function getPageSeo(type, slug) {
  // type: 'offer', 'article', etc. slug: string or object
  const query = `*[_type == $type && slug.current == $slug][0]{
    metaTitle,
    metaDescription,
    noindex,
    nofollow,
    canonicalUrl,
    sitemapInclude
  }`;
  return client.fetch(query, { type, slug });
}

export async function getAllSitemapEntries() {
  // Fetch all docs with sitemapInclude != false
  const query = `*[_type in ["offer","article","banner","faq"] && (sitemapInclude == true || !defined(sitemapInclude))]{
    _type,
    slug,
    _updatedAt
  }`;
  return client.fetch(query);
} 