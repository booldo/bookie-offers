import { NextResponse } from "next/server";
import { getAllSitemapEntries, getSeoSettings } from "../../../sanity/lib/seo";

export async function GET() {
  const baseUrl = "https://yourdomain.com"; // TODO: Replace with your real domain
  const entries = await getAllSitemapEntries();
  const seo = await getSeoSettings();
  const extraUrls = seo?.sitemapExtraUrls || [];

  let urls = entries.map((entry) => {
    let path = "/";
    if (entry._type === "offer") path = `/gh/offers/${entry.slug?.current}`;
    else if (entry._type === "article") path = `/briefly/${entry.slug?.current}`;
    else if (entry._type === "banner") path = `/banner/${entry.slug?.current}`;
    else if (entry._type === "faq") path = `/faq/${entry.slug?.current}`;
    return {
      loc: `${baseUrl}${path}`,
      lastmod: entry._updatedAt ? new Date(entry._updatedAt).toISOString() : undefined,
    };
  });
  // Add extra URLs
  urls = urls.concat((extraUrls || []).map((url) => ({ loc: url })));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(
      (u) =>
        `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`
    )
    .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
    },
  });
} 