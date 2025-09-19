// API route to check if a country slug exists in Sanity
import { NextResponse } from 'next/server'
import { client } from '../../../sanity/lib/client'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ exists: false })
  const country = await client.fetch(`*[_type == "countryPage" && slug.current == $slug][0]{_id}`, { slug })
  return NextResponse.json({ exists: !!country })
}
