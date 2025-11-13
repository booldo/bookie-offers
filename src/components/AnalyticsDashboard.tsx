import React, { useState, useEffect } from 'react';
import { getClickAnalytics, getLinkSpecificAnalytics } from '../sanity/lib/analytics';

interface AnalyticsDashboardProps {
  className?: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7d'); // 7d, 30d, 90d, all

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        let startDate: string | undefined;
        const endDate = new Date().toISOString();

        switch (dateRange) {
          case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '30d':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            break;
          case '90d':
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
            break;
          default:
            startDate = undefined;
        }

        const data = await getClickAnalytics(startDate, endDate);
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load analytics');
        console.error('Analytics error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [dateRange]);

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center text-gray-500">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-white rounded-lg shadow ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Click Analytics</h2>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{analytics.totalClicks}</div>
          <div className="text-sm text-blue-500">Total Clicks</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {Object.keys(analytics.clicksByCountry).length}
          </div>
          <div className="text-sm text-green-500">Countries</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {Object.keys(analytics.clicksByLinkType).length}
          </div>
          <div className="text-sm text-purple-500">Link Types</div>
        </div>
      </div>

      {/* Clicks by Country */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Clicks by Country</h3>
        <div className="space-y-2">
          {Object.entries(analytics.clicksByCountry)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .map(([country, clicks]: [string, number]) => (
              <div key={country} className="flex justify-between items-center">
                <span className="text-gray-700">{country}</span>
                <span className="font-semibold text-gray-900">{clicks}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Top Links */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Performing Links</h3>
        <div className="space-y-2">
          {analytics.topLinks.map((link: any, index: number) => (
            <div key={link.linkId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{link.linkTitle || 'Untitled'}</div>
                <div className="text-sm text-gray-500">{link.linkType}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">{link.clicks}</div>
                <div className="text-xs text-gray-500">clicks</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Clicks */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Clicks</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {analytics.recentClicks.map((click: any, index: number) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{click.linkTitle || 'Untitled'}</div>
                <div className="text-sm text-gray-500">
                  {click.country} • {new Date(click.clickedAt).toLocaleDateString('en-GB')}
                </div>
              </div>
              <div className="text-xs text-gray-500">{click.linkType}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 