import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Stack, 
  Button, 
  Text, 
  Badge, 
  Flex, 
  Box,
  TextInput,
  Select,
  Spinner,
  ToastProvider,
  useToast
} from '@sanity/ui';
import { 
  useClient, 
  useSchema, 
  useProjectId, 
  useDataset 
} from 'sanity';
import { 
  ClockIcon, 
  EyeOpenIcon, 
  EyeClosedIcon,
  RefreshIcon
} from '@sanity/icons';

export function ExpiredOffersTool() {
  const client = useClient({ apiVersion: '2023-05-03' });
  const schema = useSchema();
  const projectId = useProjectId();
  const dataset = useDataset();
  
  const [offers, setOffers] = useState([]);
  const [allOffers, setAllOffers] = useState([]); // Store all offers for accurate counts
  const [otherPages, setOtherPages] = useState([]);
  const [allOtherPages, setAllOtherPages] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    country: 'all',
    search: ''
  });
  const [processing, setProcessing] = useState(false);
  
  const toast = useToast();

  // Fetch all offers, countries, and other pages
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all offers
      const offersQuery = `*[_type == "offers" && !(_id in path("drafts.**"))] {
         _id,
         _type,
         title,
         slug,
         expires,
         published,
         noindex,
         sitemapInclude,
         
         bookmaker->{name},
        country->{_id, country, slug},
         bonusType->{name}
       } | order(expires asc)`;

      // Fetch all countries
      const countriesQuery = `*[_type == "countryPage" && isActive == true] | order(country asc) {
        _id,
        country,
        slug
      }`;

      // Fetch other pages for redirection management
      const otherPagesQuery = `{
        "about": *[_type == "about" && !(_id in path("drafts.**"))]{ _id, _type, title, "path": "/about", sitemapInclude, noindex, _updatedAt },
        "contact": *[_type == "contact" && !(_id in path("drafts.**"))]{ _id, _type, title, "path": "/contact", sitemapInclude, noindex, _updatedAt },
        "country": *[_type == "countryPage" && !(_id in path("drafts.**"))]{ _id, _type, country, slug, sitemapInclude, noindex, _updatedAt }{
          _id, _type, "title": country, "path": "/" + slug.current, sitemapInclude, noindex, _updatedAt
        },
        "articles": *[_type == "article" && !(_id in path("drafts.**"))]{ _id, _type, title, slug, sitemapInclude, noindex, _updatedAt }{
          _id, _type, title, "path": "/briefly/" + slug.current, sitemapInclude, noindex, _updatedAt
        },
        "calculators": *[_type == "calculator" && !(_id in path("drafts.**"))]{ _id, _type, title, slug, sitemapInclude, noindex, _updatedAt }{
          _id, _type, title, "path": "/briefly/calculator/" + slug.current, sitemapInclude, noindex, _updatedAt
        },
        "hamburgerMenu": *[_type == "hamburgerMenu" && !(_id in path("drafts.**"))]{ 
          _id, _type, title, sitemapInclude, noindex, _updatedAt,
          "additionalMenuItems": additionalMenuItems[]{
            _id,
            label,
            isActive,
            sitemapInclude,
            noindex,
            _updatedAt
          }
        },
        "footer": *[_type == "footer" && !(_id in path("drafts.**"))]{
          _id, _type, sitemapInclude, noindex, _updatedAt,
          "bottomRowLinks": bottomRowLinks.links[]{
            _id,
            label,
            slug,
            sitemapInclude,
            noindex,
            _updatedAt
          }
        }
      }`;

      const [offersResult, countriesResult, otherPagesResult] = await Promise.all([
        client.fetch(offersQuery),
        client.fetch(countriesQuery),
        client.fetch(otherPagesQuery)
      ]);

      setAllOffers(offersResult);
      setCountries(countriesResult);
      
      // Process and flatten the other pages data
      const flattenedPages = [];
      
      // Add about pages
      if (otherPagesResult?.about && otherPagesResult.about.length > 0) {
        flattenedPages.push(...otherPagesResult.about.map(page => ({
          ...page,
          contentType: 'About Page',
          displayTitle: page.title || 'About Us'
        })));
      } else {
        // Add placeholder for missing About document
        flattenedPages.push({
          _id: 'about-placeholder',
          _type: 'about',
          title: 'About Us',
          path: '/about',
          contentType: 'About Page',
          displayTitle: 'About Us',
          isMissing: true,
          noindex: false,
          sitemapInclude: true
        });
      }
      
      // Add contact pages
      if (otherPagesResult?.contact && otherPagesResult.contact.length > 0) {
        flattenedPages.push(...otherPagesResult.contact.map(page => ({
          ...page,
          contentType: 'Contact Page',
          displayTitle: page.title || 'Contact Us'
        })));
      } else {
        // Add placeholder for missing Contact document
        flattenedPages.push({
          _id: 'contact-placeholder',
          _type: 'contact',
          title: 'Contact Us',
          path: '/contact',
          contentType: 'Contact Page',
          displayTitle: 'Contact Us',
          isMissing: true,
          noindex: false,
          sitemapInclude: true
        });
      }
      
      // Add country pages
      if (otherPagesResult?.country) {
        flattenedPages.push(...otherPagesResult.country.map(page => ({
          ...page,
          contentType: 'Country Page',
          displayTitle: page.title || 'Country'
        })));
      }
      
      // Add articles
      if (otherPagesResult?.articles) {
        flattenedPages.push(...otherPagesResult.articles.map(page => ({
          ...page,
          contentType: 'Article',
          displayTitle: page.title || 'Article'
        })));
      }
      
      // Add calculators
      if (otherPagesResult?.calculators) {
        flattenedPages.push(...otherPagesResult.calculators.map(page => ({
          ...page,
          contentType: 'Calculator',
          displayTitle: page.title || 'Calculator'
        })));
      }
      
      // Add hamburger menu items
      if (otherPagesResult?.hamburgerMenu) {
        otherPagesResult.hamburgerMenu.forEach(menu => {
          // Add main menu item
          flattenedPages.push({
            _id: menu._id,
            _type: menu._type,
            title: menu.title,
            path: `/hamburger-menu/${menu.title?.toLowerCase().replace(/\s+/g, '-')}`,
            sitemapInclude: menu.sitemapInclude,
            noindex: menu.noindex,
            _updatedAt: menu._updatedAt,
            contentType: 'Hamburger Menu',
            displayTitle: menu.title || 'Hamburger Menu'
          });
          
          // Add additional menu items
          if (menu.additionalMenuItems) {
            menu.additionalMenuItems.forEach(item => {
              if (item.isActive) {
                flattenedPages.push({
                  _id: item._id,
                  _type: 'hamburgerMenuItem',
                  title: item.label,
                  path: `/hamburger-menu/${item.label?.toLowerCase().replace(/\s+/g, '-')}`,
                  sitemapInclude: item.sitemapInclude,
                  noindex: item.noindex,
                  _updatedAt: item._updatedAt,
                  contentType: 'Hamburger Menu Item',
                  displayTitle: item.label || 'Menu Item'
                });
              }
            });
          }
        });
      }
      
      // Add footer links
      if (otherPagesResult?.footer?.bottomRowLinks) {
        otherPagesResult.footer.bottomRowLinks.forEach(link => {
          flattenedPages.push({
            _id: link._id,
            _type: 'footerLink',
            title: link.label,
            path: link.path,
            sitemapInclude: link.sitemapInclude,
            noindex: link.noindex,
            _updatedAt: link._updatedAt,
            contentType: 'Footer Link',
            displayTitle: link.label || 'Footer Link'
          });
        });
      }
      
      setAllOtherPages(flattenedPages);
      
      // Apply filters to get displayed offers
      applyFilters(offersResult, filters);
      applyOtherPagesFilters(flattenedPages, filters);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.push({
        status: 'error',
        title: 'Error fetching data',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  }, [client, toast]);

  // Apply filters to offers
  const applyFilters = useCallback((offersToFilter, currentFilters) => {
    let filteredResults = offersToFilter;
    
    if (currentFilters.status !== 'all') {
      if (currentFilters.status === 'active') {
        filteredResults = filteredResults.filter(offer => (!offer.expires || new Date(offer.expires) >= new Date()));
      } else if (currentFilters.status === 'expired') {
        filteredResults = filteredResults.filter(offer => offer.expires && new Date(offer.expires) < new Date());
      }
    }
    
    if (currentFilters.country !== 'all') {
      filteredResults = filteredResults.filter(offer => 
        offer.country?._id === currentFilters.country
      );
    }
    
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
        filteredResults = filteredResults.filter(offer => 
          offer.title?.toLowerCase().includes(searchLower) ||
          offer.bookmaker?.name?.toLowerCase().includes(searchLower) ||
          offer.country?.country?.toLowerCase().includes(searchLower)
        );
      }
      
    setOffers(filteredResults);
  }, []);

  // Update filters and reapply
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    applyFilters(allOffers, updatedFilters);
    applyOtherPagesFilters(allOtherPages, updatedFilters);
  }, [filters, allOffers, allOtherPages, applyFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if offer is expired
  const isExpired = (offer) => {
    if (!offer.expires) return false;
    return new Date(offer.expires) < new Date();
  };

  // Other pages filter function
  const applyOtherPagesFilters = useCallback((pagesToFilter, currentFilters) => {
    let filteredResults = pagesToFilter;

    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filteredResults = filteredResults.filter(page => 
        page.title?.toLowerCase().includes(searchLower) ||
        page.path?.toLowerCase().includes(searchLower)
      );
    }

    setOtherPages(filteredResults);
  }, []);

  const isPageHidden = (page) => {
    // Handle placeholder pages (missing documents)
    if (page.isMissing) {
      return false; // Placeholder pages are always visible
    }
    
    return page.noindex === true || page.sitemapInclude === false;
  };

  const getPageVisibilityButtonProps = (page) => {
    if (isPageHidden(page)) {
      return { text: 'Show', tone: 'positive', title: 'Show this page (indexable, in sitemap)' };
    }
    return { text: 'Hide', tone: 'critical', title: 'Hide this page (noindex, exclude from sitemap)' };
  };

  const togglePageVisibility = async (page) => {
    setProcessing(true);
    try {
      // Handle placeholder pages (missing documents)
      if (page.isMissing) {
        toast.push({
          status: 'info',
          title: 'Document not found',
          description: `Please create a ${page.contentType} document in Sanity Studio first.`
        });
        setProcessing(false);
        return;
      }
      
      const makeHidden = !isPageHidden(page);
      await client
        .patch(page._id)
        .set({ noindex: makeHidden, sitemapInclude: !makeHidden })
        .commit();

      toast.push({
        status: 'success',
        title: makeHidden ? 'Page hidden' : 'Page visible',
        description: makeHidden ? 'Set noindex and removed from sitemap.' : 'Unset noindex and included in sitemap.'
      });

      await fetchData();
    } catch (error) {
      console.error('Error toggling page visibility:', error);
      toast.push({ status: 'error', title: 'Failed to toggle visibility', description: error.message });
    } finally {
      setProcessing(false);
    }
  };

  // Get status text for display
  const getStatusText = (offer) => {
    if (isExpired(offer)) return 'Expired';
    return 'Active';
  };

  // Get status badge color
  const getStatusColor = (offer) => {
    if (isExpired(offer)) return 'red';
    return 'green';
  };

  // Get background color for offer cards
  const getCardBackground = (offer) => {
    if (isExpired(offer)) return '#4B5563';
    return '#1F2937';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  // Get accurate counts for each filter
  const getFilterCounts = () => {
    const total = allOffers.length;
    const active = allOffers.filter(o => (!o.expires || new Date(o.expires) >= new Date())).length;
    const expired = allOffers.filter(o => o.expires && new Date(o.expires) < new Date()).length;
    return { total, active, expired };
  };

  // Get count for specific country
  const getCountryCount = (countryId) => {
    if (countryId === 'all') return allOffers.length;
    return allOffers.filter(o => o.country?._id === countryId).length;
  };

  const isOfferHidden = (offer) => offer?.noindex === true || offer?.sitemapInclude === false;

  // Toggle offer visibility (show/hide) using noindex/sitemapInclude
  const toggleOfferVisibility = async (offer) => {
    setProcessing(true);
    try {
      const makeHidden = !isOfferHidden(offer);
      await client
        .patch(offer._id)
        .set({ noindex: makeHidden, sitemapInclude: !makeHidden })
        .commit();
      
      toast.push({
        status: 'success',
        title: makeHidden ? 'Offer hidden' : 'Offer visible',
        description: makeHidden
          ? 'Set noindex and removed from sitemap.'
          : 'Unset noindex and included in sitemap.'
      });
      
      // Refresh the data
      await fetchData();
      
    } catch (error) {
      console.error('Error toggling offer visibility:', error);
      toast.push({
        status: 'error',
        title: 'Failed to toggle visibility',
        description: error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  // Get button text and tone for hide/show button
  const getVisibilityButtonProps = (offer) => {
    if (isOfferHidden(offer)) {
      return {
        text: 'Show',
        tone: 'positive',
        title: 'Show this offer in offer cards and sitemap'
      };
    } else {
      return {
        text: 'Hide',
        tone: 'critical',
        title: 'Hide this offer from offer cards and sitemap (noindex)'
      };
    }
  };

  const counts = getFilterCounts();

  return (
    <ToastProvider>
      <Box padding={4}>
        <Stack space={4}>
          {/* Header */}
          <Card padding={4} radius={2} shadow={1}>
            <Stack space={3}>
              <Text size={4} weight="bold">Redirection Tool</Text>
                             <Text size={2} muted>
                 Manage offer lifecycle, expiration status, and visibility control
               </Text>
               <Text size={1} muted>
                 Note: Hidden offers will show 410 errors on the frontend and won't appear in offer cards
               </Text>
            </Stack>
          </Card>

          {/* Filters and Actions */}
          <Card padding={4} radius={2} shadow={1}>
            <Stack space={3}>
              <Flex gap={3} align="center" wrap style={{ alignItems: 'center' }}>
                 <Text size={2} weight="semibold">Filters:</Text>
                <Box>
                 <Select
                   value={filters.status}
                   onChange={(event) => updateFilters({ status: event.target.value })}
                   fontSize={1}
                   radius={2}
                   style={{ minWidth: '240px', width: '240px', height: '36px' }}
                 >
                   <option value="all">All ({counts.total})</option>
                   <option value="active">Active ({counts.active})</option>
                   <option value="expired">Expired ({counts.expired})</option>
                 </Select>
                </Box>
                <Box>
                <Select
                  value={filters.country}
                  onChange={(event) => updateFilters({ country: event.target.value })}
                  fontSize={1}
                  radius={2}
                  style={{ minWidth: '240px', width: '240px', height: '36px' }}
                >
                  <option value="all">All Countries ({counts.total})</option>
                  {countries.map(country => (
                    <option key={country._id} value={country._id}>
                      {country.country} ({getCountryCount(country._id)})
                    </option>
                  ))}
                 </Select>
                </Box>
                <Box>
                 <TextInput
                  placeholder="Search offers & pages..."
                  value={filters.search}
                  onChange={(event) => updateFilters({ search: event.target.value })}
                  fontSize={1}
                  radius={2}
                  style={{ minWidth: '240px', width: '240px', height: '36px' }}
                />
                </Box>
                <Button
                  icon={RefreshIcon}
                  text="Refresh"
                  onClick={fetchData}
                  disabled={loading}
                  style={{ height: '36px' }}
                />
              </Flex>
            </Stack>
          </Card>

          {/* Offers List */}
          <Card padding={4} radius={2} shadow={1}>
            {loading ? (
              <Flex justify="center" padding={4}>
                <Spinner />
              </Flex>
            ) : (
              <Stack space={3}>
                {offers.length === 0 ? (
                  <Text align="center" muted>
                    No offers found matching the current filters
                  </Text>
                ) : (
                  offers.map((offer) => (
                    <Card
                      key={offer._id}
                      padding={3}
                      radius={2}
                      shadow={1}
                      style={{ backgroundColor: getCardBackground(offer) }}
                    >
                                             <Flex align="center" gap={3}>
                         <Button
                           size={1}
                          text={getVisibilityButtonProps(offer).text}
                          tone={getVisibilityButtonProps(offer).tone}
                           onClick={() => toggleOfferVisibility(offer)}
                           disabled={processing}
                          title={getVisibilityButtonProps(offer).title}
                         />
                        
                        <Box flex={1}>
                          <Stack space={2}>
                            <Flex align="center" gap={2}>
                              <Text weight="semibold">{offer.title}</Text>
                              <Badge tone={getStatusColor(offer)}>
                                {getStatusText(offer)}
                              </Badge>
                            </Flex>
                            
                            <Flex gap={4} wrap>
                              {offer.bookmaker?.name && (
                                <Text size={1} muted>
                                  Bookmaker: {offer.bookmaker.name}
                                </Text>
                              )}
                              {offer.country?.country && (
                                <Text size={1} muted>
                                  Country: {offer.country.country}
                                </Text>
                              )}
                              {offer.bonusType?.name && (
                                <Text size={1} muted>
                                  Type: {offer.bonusType.name}
                                </Text>
                              )}
                              {offer.expires && (
                                <Text size={1} muted>
                                  Expires: {formatDate(offer.expires)}
                                </Text>
                              )}
                              {offer.published && (
                                <Text size={1} muted>
                                  Published: {formatDate(offer.published)}
                                </Text>
                              )}
                            </Flex>
                          </Stack>
                        </Box>
                        
                        <Flex gap={1}>
                          {isOfferHidden(offer) && isExpired(offer) ? (
                            <Badge tone="critical" icon={EyeClosedIcon}>
                              HIDDEN & EXPIRED
                            </Badge>
                          ) : isOfferHidden(offer) ? (
                            <Badge tone="caution" icon={EyeClosedIcon}>
                              HIDDEN
                            </Badge>
                          ) : isExpired(offer) ? (
                            <Badge tone="critical" icon={ClockIcon}>
                              EXPIRED
                            </Badge>
                          ) : (
                            <Badge tone="positive" icon={EyeOpenIcon}>
                              VISIBLE
                            </Badge>
                          )}
                        </Flex>
                      </Flex>
                    </Card>
                  ))
                )}
              </Stack>
            )}
          </Card>
          {/* Other Pages List */}
          <Card padding={4} radius={2} shadow={1}>
            {loading ? (
              <Flex justify="center" padding={4}>
                <Spinner />
              </Flex>
            ) : (
              <Stack space={3}>
                <Text size={3} weight="semibold">Other Pages</Text>
                {otherPages.length === 0 ? (
                  <Text align="center" muted>
                    No pages found matching the current filters
                  </Text>
                ) : (
                  otherPages.map((page) => (
                    <Card key={page._id} padding={3} radius={2} shadow={1}>
                      <Flex align="center" gap={3}>
                        {page.isMissing ? (
                          <Button
                            size={1}
                            text="Create Document"
                            tone="caution"
                            onClick={() => togglePageVisibility(page)}
                            disabled={processing}
                            title="Document not found - click to see instructions"
                          />
                        ) : (
                          <Button
                            size={1}
                            text={getPageVisibilityButtonProps(page).text}
                            tone={getPageVisibilityButtonProps(page).tone}
                            onClick={() => togglePageVisibility(page)}
                            disabled={processing}
                            title={getPageVisibilityButtonProps(page).title}
                          />
                        )}

                        <Box flex={1}>
                          <Stack space={1}>
                            <Text weight="semibold">{page.displayTitle || page.title || page.path}</Text>
                            <Text size={1} muted>{page.path}</Text>
                            <Text size={1} muted style={{ color: '#6B7280' }}>{page.contentType}</Text>
        </Stack>
                        </Box>

                        <Flex gap={1}>
                          {page.isMissing ? (
                            <Badge tone="caution" icon={EyeClosedIcon}>MISSING</Badge>
                          ) : isPageHidden(page) ? (
                            <Badge tone="caution" icon={EyeClosedIcon}>HIDDEN</Badge>
                          ) : (
                            <Badge tone="positive" icon={EyeOpenIcon}>VISIBLE</Badge>
                          )}
                        </Flex>
                      </Flex>
                    </Card>
                  ))
                )}
              </Stack>
            )}
          </Card>
        </Stack>
      </Box>
    </ToastProvider>
  );
}
