"use client";
import React, { useEffect, useMemo, useState } from "react";
import { client } from "../../sanity/lib/client";

// Fetch all clickTracking docs from Sanity
async function fetchClicks({ country, linkType, from, to }) {
  const filters = ["_type == 'clickTracking'"];
  const params = {};

  if (country) {
    filters.push("country == $country");
    params.country = country;
  }
  if (linkType) {
    filters.push("linkType == $linkType");
    params.linkType = linkType;
  }
  if (from) {
    filters.push("clickedAt >= $from");
    params.from = from;
  }
  if (to) {
    filters.push("clickedAt <= $to");
    params.to = to;
  }

  const query = `*[$${""}filters]{
    linkId,
    linkTitle,
    linkType,
    country
  }`.replace("$filters", filters.join(" && "));

  return client.fetch(query, params);
}

function aggregateClicks(clicks) {
  const linkIdToStats = new Map();

  for (const c of clicks) {
    const key = c.linkId || "unknown";
    if (!linkIdToStats.has(key)) {
      linkIdToStats.set(key, {
        linkId: key,
        linkTitle: c.linkTitle || "Untitled",
        linkType: c.linkType || "offer",
        byCountry: {},
        total: 0,
      });
    }
    const entry = linkIdToStats.get(key);
    entry.total += 1;
    const countryKey = c.country || "Unknown";
    entry.byCountry[countryKey] = (entry.byCountry[countryKey] || 0) + 1;
  }

  return Array.from(linkIdToStats.values()).sort((a, b) => b.total - a.total);
}

export default function AnalyticsPage() {
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [country, setCountry] = useState(""); // "Nigeria" | "Ghana" | ""
  const [linkType, setLinkType] = useState(""); // "offer" | "bookmaker" | "banner" | "custom" | ""

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchClicks({ country, linkType });
        if (isMounted) setClicks(data || []);
      } catch (e) {
        if (isMounted) setError("Failed to load analytics");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [country, linkType]);

  const rows = useMemo(() => aggregateClicks(clicks), [clicks]);
  const totalClicks = useMemo(() => rows.reduce((sum, r) => sum + r.total, 0), [rows]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Affiliate Click Analytics</h1>

      <div className="flex flex-wrap gap-3 items-end mb-6">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Ghana">Ghana</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Link type</label>
          <select
            value={linkType}
            onChange={(e) => setLinkType(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">All</option>
            <option value="offer">Offer</option>
            <option value="bookmaker">Bookmaker</option>
            <option value="banner">Banner</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div className="ml-auto text-sm text-gray-600">Total clicks: <span className="font-semibold text-gray-900">{totalClicks}</span></div>
      </div>

      {loading && (
        <div className="text-gray-500">Loading analytics…</div>
      )}
      {error && (
        <div className="text-red-600">{error}</div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-md">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-3 border-b">Title</th>
                <th className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider p-3 border-b">Type</th>
                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider p-3 border-b">Nigeria</th>
                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider p-3 border-b">Ghana</th>
                <th className="text-right text-xs font-semibold text-gray-600 uppercase tracking-wider p-3 border-b">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.linkId} className="hover:bg-gray-50">
                  <td className="p-3 border-b text-sm text-gray-900">{r.linkTitle}</td>
                  <td className="p-3 border-b text-sm text-gray-600">{r.linkType}</td>
                  <td className="p-3 border-b text-sm text-right">{r.byCountry["Nigeria"] || 0}</td>
                  <td className="p-3 border-b text-sm text-right">{r.byCountry["Ghana"] || 0}</td>
                  <td className="p-3 border-b text-sm text-right font-semibold text-gray-900">{r.total}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-sm text-gray-500" colSpan={5}>No clicks yet for the selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}






