import { NextResponse } from "next/server";
import { getSeoSettings } from "../../../sanity/lib/seo";

export async function GET() {
  const seo = await getSeoSettings();
  const robots = seo?.robotsTxt || `User-agent: *\nAllow: /\nSitemap: https://yourdomain.com/sitemap.xml`;
  return new NextResponse(robots, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
} 