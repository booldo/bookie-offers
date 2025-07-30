import { client } from './client';

export interface ClickAnalytics {
  totalClicks: number;
  clicksByCountry: { [country: string]: number };
  clicksByLinkType: { [linkType: string]: number };
  topLinks: Array<{
    linkId: string;
    linkTitle: string;
    linkType: string;
    clicks: number;
  }>;
  recentClicks: Array<{
    linkId: string;
    linkTitle: string;
    linkType: string;
    country: string;
    clickedAt: string;
  }>;
}

export const getClickAnalytics = async (
  startDate?: string,
  endDate?: string
): Promise<ClickAnalytics> => {
  try {
    // Build date filter
    let dateFilter = '';
    if (startDate && endDate) {
      dateFilter = `&& clickedAt >= $startDate && clickedAt <= $endDate`;
    } else if (startDate) {
      dateFilter = `&& clickedAt >= $startDate`;
    } else if (endDate) {
      dateFilter = `&& clickedAt <= $endDate`;
    }

    // Get total clicks
    const totalClicksQuery = `count(*[_type == "clickTracking" ${dateFilter}])`;
    const totalClicks = await client.fetch(totalClicksQuery, { startDate, endDate });

    // Get clicks by country
    const countryClicksQuery = `*[_type == "clickTracking" ${dateFilter}] {
      country
    }`;
    const countryData = await client.fetch(countryClicksQuery, { startDate, endDate });
    const clicksByCountry = countryData.reduce((acc: any, item: any) => {
      const country = item.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {});

    // Get clicks by link type
    const linkTypeClicksQuery = `*[_type == "clickTracking" ${dateFilter}] {
      linkType
    }`;
    const linkTypeData = await client.fetch(linkTypeClicksQuery, { startDate, endDate });
    const clicksByLinkType = linkTypeData.reduce((acc: any, item: any) => {
      const linkType = item.linkType || 'Unknown';
      acc[linkType] = (acc[linkType] || 0) + 1;
      return acc;
    }, {});

    // Get top links
    const topLinksQuery = `*[_type == "clickTracking" ${dateFilter}] {
      linkId,
      linkTitle,
      linkType
    }`;
    const topLinksData = await client.fetch(topLinksQuery, { startDate, endDate });
    const linkCounts = topLinksData.reduce((acc: any, item: any) => {
      const key = item.linkId;
      if (!acc[key]) {
        acc[key] = {
          linkId: item.linkId,
          linkTitle: item.linkTitle,
          linkType: item.linkType,
          clicks: 0
        };
      }
      acc[key].clicks += 1;
      return acc;
    }, {});
    const topLinks = Object.values(linkCounts as Record<string, {
      linkId: string;
      linkTitle: string;
      linkType: string;
      clicks: number;
    }>)
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Get recent clicks
    const recentClicksQuery = `*[_type == "clickTracking" ${dateFilter}] | order(clickedAt desc) [0...20] {
      linkId,
      linkTitle,
      linkType,
      country,
      clickedAt
    }`;
    const recentClicks = await client.fetch(recentClicksQuery, { startDate, endDate });

    return {
      totalClicks,
      clicksByCountry,
      clicksByLinkType,
      topLinks,
      recentClicks
    };
  } catch (error) {
    console.error('Error fetching click analytics:', error);
    return {
      totalClicks: 0,
      clicksByCountry: {},
      clicksByLinkType: {},
      topLinks: [],
      recentClicks: []
    };
  }
};

export const getLinkSpecificAnalytics = async (linkId: string): Promise<any> => {
  try {
    const query = `*[_type == "clickTracking" && linkId == $linkId] | order(clickedAt desc) {
      linkId,
      linkTitle,
      linkType,
      linkUrl,
      country,
      pageUrl,
      clickedAt,
      userAgent,
      referrer
    }`;
    
    const clicks = await client.fetch(query, { linkId });
    
    return {
      totalClicks: clicks.length,
      clicksByCountry: clicks.reduce((acc: any, click: any) => {
        const country = click.country || 'Unknown';
        acc[country] = (acc[country] || 0) + 1;
        return acc;
      }, {}),
      clicksByPage: clicks.reduce((acc: any, click: any) => {
        const page = click.pageUrl || 'Unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {}),
      recentClicks: clicks.slice(0, 20)
    };
  } catch (error) {
    console.error('Error fetching link-specific analytics:', error);
    return {
      totalClicks: 0,
      clicksByCountry: {},
      clicksByPage: {},
      recentClicks: []
    };
  }
}; 