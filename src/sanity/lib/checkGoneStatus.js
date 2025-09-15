import { client } from "./client";

/**
 * Checks if a document is hidden/expired and should return 410.
 * @param {string} type - The Sanity document type (e.g. "article", "offers", etc.)
 * @param {string} slug - The slug to query.
 * @returns {object|null} - Returns the doc if found and visible, null if gone.
 */
export async function getVisibleDocOrNull(type, slug) {
  const doc = await client.fetch(
    `*[_type == $type && slug.current == $slug][0]{..., noindex, sitemapInclude}`,
    { type, slug }
  );
  if (!doc || doc.noindex === true || doc.sitemapInclude === false) {
    return null; // Gone
  }
  return doc;
}
