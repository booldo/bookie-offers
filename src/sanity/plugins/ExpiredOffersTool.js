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
  const [redirects, setRedirects] = useState([]);
  const [redirectedPages, setRedirectedPages] = useState([]);
  const [redirect301States, setRedirect301States] = useState({});
  const [sourceUrls, setSourceUrls] = useState({});
  const [showRedirectInput, setShowRedirectInput] = useState({});
  
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
        "brieflyHomepage": *[_type == "brieflyHomepage" && !(_id in path("drafts.**"))]{ _id, _type, title, "path": "/briefly", sitemapInclude, noindex, _updatedAt },
        "calculatorHomepage": *[_type == "calculatorHomepage" && !(_id in path("drafts.**"))]{ _id, _type, title, "path": "/briefly/calculators", sitemapInclude, noindex, _updatedAt },
        "country": *[_type == "countryPage" && !(_id in path("drafts.**"))]{ _id, _type, country, slug, sitemapInclude, noindex, _updatedAt }{
          _id, _type, "title": country, "path": "/" + slug.current, sitemapInclude, noindex, _updatedAt
        },
        "articles": *[_type == "article" && !(_id in path("drafts.**"))]{ _id, _type, title, slug, sitemapInclude, noindex, _updatedAt }{
          _id, _type, title, "path": "/briefly/" + slug.current, sitemapInclude, noindex, _updatedAt
        },
        "calculators": *[_type == "calculator" && !(_id in path("drafts.**"))]{ _id, _type, title, slug, isActive, sitemapInclude, noindex, _updatedAt }{
          _id, _type, title, "path": "/briefly/calculator/" + slug.current, isActive, sitemapInclude, noindex, _updatedAt
        },
        "hamburgerMenu": *[_type == "hamburgerMenu" && !(_id in path("drafts.**"))]{ 
          _id, _type, title, slug, sitemapInclude, noindex, _updatedAt
        },
        "footer": *[_type == "footer" && !(_id in path("drafts.**"))][0]{
          _id, _type, sitemapInclude, noindex, _updatedAt,
          "bottomRowLinks": bottomRowLinks.links[]{
            _id,
            label,
            slug,
            url,
            sitemapInclude,
            noindex,
            _updatedAt
          },
          "resourceLinks": gamblingResources.resources[]{
            _id,
            name,
            url,
            isActive,
            sitemapInclude,
            noindex,
            _updatedAt
          }
        }
      }`;

      // Fetch existing redirects
      const redirectsQuery = `*[_type == "redirects" && isActive == true] | order(sourcePath asc) {
        _id,
        sourcePath,
        targetUrl,
        redirectType,
        description,
        _updatedAt
      }`;

      const [offersResult, countriesResult, otherPagesResult, redirectsResult] = await Promise.all([
        client.fetch(offersQuery),
        client.fetch(countriesQuery),
        client.fetch(otherPagesQuery),
        client.fetch(redirectsQuery)
      ]);

      setAllOffers(offersResult);
      setCountries(countriesResult);
      setRedirects(redirectsResult);
      
      // Process and flatten the other pages data
      const flattenedPages = [];
      
      // Add briefly homepage
      if (otherPagesResult?.brieflyHomepage) {
        otherPagesResult.brieflyHomepage.forEach(page => {
          flattenedPages.push({
            ...page,
            contentType: 'Briefly Homepage',
            displayTitle: page.title || 'Briefly (Blog)'
          });
        });
      } else {
        // Add placeholder for missing Briefly Homepage document
        flattenedPages.push({
          _id: 'briefly-homepage-placeholder',
          _type: 'brieflyHomepage',
          title: 'Briefly (Blog)',
          path: '/briefly',
          contentType: 'Briefly Homepage',
          displayTitle: 'Briefly (Blog)',
          isMissing: true,
          noindex: false,
          sitemapInclude: true
        });
      }
      
      // Add calculator homepage
      if (otherPagesResult?.calculatorHomepage) {
        otherPagesResult.calculatorHomepage.forEach(page => {
          flattenedPages.push({
            ...page,
            contentType: 'Calculator Homepage',
            displayTitle: page.title || 'Calculators'
          });
        });
         } else {
        // Add placeholder for missing Calculator Homepage document
        flattenedPages.push({
          _id: 'calculator-homepage-placeholder',
          _type: 'calculatorHomepage',
          title: 'Calculators',
          path: '/briefly/calculators',
          contentType: 'Calculator Homepage',
          displayTitle: 'Calculators',
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
        otherPagesResult.calculators.forEach(page => {
          if (page.isActive !== false) { // Include if isActive is true or undefined
            flattenedPages.push({
              ...page,
              contentType: 'Calculator',
              displayTitle: page.title || 'Calculator'
            });
          }
        });
      }
      
      // Add hamburger menu items
      if (otherPagesResult?.hamburgerMenu) {
        otherPagesResult.hamburgerMenu.forEach(menu => {
          // Add main menu item
          const menuPath = menu.slug?.current ? `/${menu.slug.current}` : `/${menu.title?.toLowerCase().replace(/\s+/g, '-')}`;
          flattenedPages.push({
            _id: menu._id,
            _type: menu._type,
            title: menu.title,
            path: menuPath,
            sitemapInclude: menu.sitemapInclude,
            noindex: menu.noindex,
            _updatedAt: menu._updatedAt,
            contentType: 'Hamburger Menu',
            displayTitle: menu.title || 'Hamburger Menu'
          });
        });
      }
      
      // Add footer links
      if (otherPagesResult?.footer?.bottomRowLinks) {
        otherPagesResult.footer.bottomRowLinks.forEach(link => {
          const linkPath = link.slug?.current ? `/${link.slug.current}` : link.url || '#';
          flattenedPages.push({
            _id: link._id,
            _type: 'footerLink',
            title: link.label,
            path: linkPath,
            sitemapInclude: link.sitemapInclude,
            noindex: link.noindex,
            _updatedAt: link._updatedAt,
            contentType: 'Footer Link',
            displayTitle: link.label || 'Footer Link'
          });
        });
      }
      
      // Add resource links
      if (otherPagesResult?.footer?.resourceLinks) {
        otherPagesResult.footer.resourceLinks.forEach(link => {
          if (link.isActive) {
            flattenedPages.push({
              _id: link._id,
              _type: 'resourceLink',
              title: link.name,
              path: link.url,
              sitemapInclude: link.sitemapInclude,
              noindex: link.noindex,
              _updatedAt: link._updatedAt,
              contentType: 'Resource Link',
              displayTitle: link.name || 'Resource Link'
            });
          }
        });
      }
      
      setAllOtherPages(flattenedPages);
      
      // Create redirected pages array by matching redirects with offers and other pages
      const redirectedPagesList = [];
      
      // Match redirects with offers
      offersResult.forEach(offer => {
        const offerPath = offer.slug?.current && offer.country?.slug?.current && offer.bonusType?.name ? 
          `/${offer.country.slug.current}/${offer.bonusType.name.toLowerCase().replace(/\s+/g, '-')}/${offer.slug.current}` : null;
        
        if (offerPath) {
          const matchingRedirect = redirectsResult.find(redirect => redirect.sourcePath === offerPath);
          if (matchingRedirect) {
            redirectedPagesList.push({
              ...offer,
              redirectId: matchingRedirect._id,
              targetUrl: matchingRedirect.targetUrl,
              redirectDescription: matchingRedirect.description,
              originalType: 'offer',
              originalPath: offerPath
            });
          }
        }
      });
      
      // Match redirects with other pages
      flattenedPages.forEach(page => {
        const matchingRedirect = redirectsResult.find(redirect => redirect.sourcePath === page.path);
        if (matchingRedirect) {
          redirectedPagesList.push({
            ...page,
            redirectId: matchingRedirect._id,
            targetUrl: matchingRedirect.targetUrl,
            redirectDescription: matchingRedirect.description,
            originalType: 'page',
            originalPath: page.path
          });
        }
      });
      
      setRedirectedPages(redirectedPagesList);
      
      // Apply filters to get displayed offers (excluding redirected ones)
      const nonRedirectedOffers = offersResult.filter(offer => {
        const offerPath = offer.slug?.current && offer.country?.slug?.current && offer.bonusType?.name ? 
          `/${offer.country.slug.current}/${offer.bonusType.name.toLowerCase().replace(/\s+/g, '-')}/${offer.slug.current}` : null;
        return !offerPath || !redirectsResult.find(redirect => redirect.sourcePath === offerPath);
      });
      
      const nonRedirectedPages = flattenedPages.filter(page => 
        !redirectsResult.find(redirect => redirect.sourcePath === page.path)
      );
      
      applyFilters(nonRedirectedOffers, filters);
      applyOtherPagesFilters(nonRedirectedPages, filters);
      
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
    
    // Filter out redirected pages from the main lists
    const nonRedirectedOffers = allOffers.filter(offer => {
      const offerPath = offer.slug?.current && offer.country?.slug?.current && offer.bonusType?.name ? 
        `/${offer.country.slug.current}/${offer.bonusType.name.toLowerCase().replace(/\s+/g, '-')}/${offer.slug.current}` : null;
      return !offerPath || !redirects.find(redirect => redirect.sourcePath === offerPath);
    });
    
    const nonRedirectedPages = allOtherPages.filter(page => 
      !redirects.find(redirect => redirect.sourcePath === page.path)
    );
    
    applyFilters(nonRedirectedOffers, updatedFilters);
    applyOtherPagesFilters(nonRedirectedPages, updatedFilters);
  }, [filters, allOffers, allOtherPages, redirects, applyFilters]);

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

  // Validate URL format
  const isValidUrlFormat = (url) => {
    if (!url || url.trim() === '') return true; // Empty is valid (not required)
    
    const trimmedUrl = url.trim();
    
    // Check for absolute URLs (http/https)
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      try {
        new URL(trimmedUrl);
        return true;
      } catch (error) {
        return false;
      }
    }
    // Check for relative URLs (starting with /)
    else if (trimmedUrl.startsWith('/')) {
      return trimmedUrl.length > 1 && !trimmedUrl.includes('..');
    }
    // Check for external URLs without protocol (add https:// and validate)
    else if (trimmedUrl.includes('.') && !trimmedUrl.includes('/')) {
      try {
        new URL(`https://${trimmedUrl}`);
        return true;
      } catch (error) {
        return false;
      }
    }
    
    return false;
  };

  // Toggle 301 redirect input for offers
  const toggle301RedirectState = (offerId) => {
    setRedirect301States(prev => ({
      ...prev,
      [offerId]: !prev[offerId]
    }));
    setShowRedirectInput(prev => ({
      ...prev,
      [offerId]: !prev[offerId]
    }));
  };

  // Toggle 301 redirect input for other pages
  const togglePage301RedirectState = (pageId) => {
    setRedirect301States(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
    setShowRedirectInput(prev => ({
      ...prev,
      [pageId]: !prev[pageId]
    }));
  };

  // Create a new redirect
  const createRedirect = async (sourcePath, targetUrl, description = '', itemId = null) => {
    if (!sourcePath || !targetUrl || targetUrl.trim() === '') {
      toast.push({
        status: 'error',
        title: 'Missing information',
        description: 'Please provide both source path and target URL.'
      });
      return;
    }

    // Process and validate source path
    let processedSourcePath = sourcePath.trim();
    
    // If source path is a full URL, extract just the path portion
    if (processedSourcePath.startsWith('http://') || processedSourcePath.startsWith('https://')) {
      try {
        const url = new URL(processedSourcePath);
        processedSourcePath = url.pathname;
        console.log('🔧 Extracted path from full URL:', processedSourcePath);
      } catch (error) {
        toast.push({
          status: 'error',
          title: 'Invalid source URL',
          description: 'Please enter a valid URL or path.'
        });
        return;
      }
    }
    
    // Ensure source path starts with /
    if (!processedSourcePath.startsWith('/')) {
      processedSourcePath = '/' + processedSourcePath;
    }

    // Validate target URL format
    const trimmedTargetUrl = targetUrl.trim();
    
    if (!isValidUrlFormat(trimmedTargetUrl)) {
      toast.push({
        status: 'error',
        title: 'Invalid URL format',
        description: 'Please enter a valid URL. Examples:\n• https://booldo.com\n• /about\n• example.com'
      });
      return;
    }

    setProcessing(true);
    try {
      console.log('🔄 Creating redirect:', { 
        originalSourcePath: sourcePath, 
        processedSourcePath: processedSourcePath, 
        targetUrl: trimmedTargetUrl, 
        description 
      });
      
      // Create new redirect document
      await client.create({
        _type: 'redirects',
        sourcePath: processedSourcePath,
        targetUrl: trimmedTargetUrl,
        redirectType: '301',
        isActive: true,
        description: description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.push({
        status: 'success',
        title: 'Redirect created successfully',
        description: `${processedSourcePath} will now redirect to ${trimmedTargetUrl}`
      });
      
      // Clear input and collapse fields for this specific item
      if (itemId) {
        setSourceUrls(prev => ({ 
          ...prev, 
          [itemId]: '', 
          [`${itemId}_desc`]: '' 
        }));
        
        // Collapse the input fields for this specific item
        setShowRedirectInput(prev => ({ 
          ...prev, 
          [itemId]: false 
        }));
        
        // Also clear the redirect states
        setRedirect301States(prev => ({ 
          ...prev, 
          [itemId]: false 
        }));
      }
      
      await fetchData();
      
    } catch (error) {
      console.error('Error creating redirect:', error);
      toast.push({
        status: 'error',
        title: 'Failed to create redirect',
        description: error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  // Remove a redirect
  const removeRedirect = async (redirectId) => {
    setProcessing(true);
    try {
      await client
        .patch(redirectId)
        .set({ isActive: false })
        .commit();

      toast.push({
        status: 'success',
        title: 'Redirect removed',
        description: 'The redirect has been deactivated'
      });
      
      await fetchData();
      
    } catch (error) {
      console.error('Error removing redirect:', error);
      toast.push({
        status: 'error',
        title: 'Failed to remove redirect',
        description: error.message
      });
    } finally {
      setProcessing(false);
    }
  };

  const getPageVisibilityButtonProps = (page) => {
    if (isPageHidden(page)) {
      return { text: 'Show', tone: 'critical', title: 'Show this page (indexable, in sitemap)' };
    }
    return { text: 'Hide', tone: 'positive', title: 'Hide this page (noindex, exclude from sitemap) and Show 410 code' };
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

  // Get button text and tone for 410/show button
  const getVisibilityButtonProps = (offer) => {
    if (isOfferHidden(offer)) {
      return {
        text: 'Unhide',
        tone: 'critical',
        title: 'Unhide this offer (make visible)'
      };
    } else {
      return {
        text: 'Hide',
        tone: 'positive',
        title: 'Hide this offer from offer cards and sitemap (noindex)'
      };
    }
  };

  const counts = getFilterCounts();

  return (
    <ToastProvider>
      <Box padding={4}>
        <Stack space={4}>

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
                <Text size={3} weight="semibold">All Offers</Text>
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
                         
                         <Button
                           size={1}
                          text="301"
                          tone="positive"
                           onClick={() => toggle301RedirectState(offer._id)}
                           disabled={processing}
                          title="Set 301 redirect to another URL"
                         />
                         
                         {showRedirectInput[offer._id] && (
                           <Stack space={2}>
                             <TextInput
                               size={1}
                               placeholder="Source URL to redirect FROM (e.g., /source-page-path or http://localhost:3000/source-page-path)"
                               value={sourceUrls[offer._id] || ''}
                               onChange={(event) => setSourceUrls(prev => ({
                                 ...prev,
                                 [offer._id]: event.target.value
                               }))}
                               style={{ minWidth: '300px' }}
                             />
                             {sourceUrls[offer._id] && (
                               <Text size={1} style={{ 
                                 color: isValidUrlFormat(sourceUrls[offer._id]) ? '#059669' : '#DC2626',
                                 fontSize: '12px'
                               }}>
                                 {isValidUrlFormat(sourceUrls[offer._id]) 
                                   ? '✅ Valid URL format' 
                                   : '❌ Invalid URL format'
                                 }
                               </Text>
                             )}
                             <TextInput
                               size={1}
                               placeholder="Description (optional)"
                               value={sourceUrls[`${offer._id}_desc`] || ''}
                               onChange={(event) => setSourceUrls(prev => ({
                                 ...prev,
                                 [`${offer._id}_desc`]: event.target.value
                               }))}
                               style={{ minWidth: '300px' }}
                             />
                             <Button
                               size={1}
                               text="Create Redirect FROM Source URL"
                               tone="positive"
                               onClick={() => createRedirect(
                                 sourceUrls[offer._id], // Source URL (what user enters)
                                 offer.slug?.current && offer.country?.slug?.current && offer.bonusType?.name ? 
                                   `/${offer.country.slug.current}/${offer.bonusType.name.toLowerCase().replace(/\s+/g, '-')}/${offer.slug.current}` : '', // Current offer URL (target)
                                 sourceUrls[`${offer._id}_desc`] || '',
                                 offer._id
                               )}
                               disabled={processing || !sourceUrls[offer._id]?.trim() || !isValidUrlFormat(sourceUrls[offer._id])}
                             />
                           </Stack>
                         )}
                        
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
          {/* Redirects List */}
          <Card padding={4} radius={2} shadow={1}>
            {loading ? (
              <Flex justify="center" padding={4}>
                <Spinner />
              </Flex>
            ) : (
              <Stack space={3}>
                <Text size={3} weight="semibold">Active Redirects</Text>
                {redirects.length === 0 ? (
                  <Text align="center" muted>
                    No active redirects found
                  </Text>
                ) : (
                  redirects.map((redirect) => (
                    <Card key={redirect._id} padding={3} radius={2} shadow={1}>
                      <Flex align="center" gap={3}>
                        <Box flex={1}>
                          <Stack space={1}>
                            <Text weight="semibold">{redirect.sourcePath}</Text>
                            <Text size={1} muted>Redirects to: {redirect.targetUrl}</Text>
                            {redirect.description && (
                              <Text size={1} muted>{redirect.description}</Text>
                            )}
                          </Stack>
                        </Box>
                        <Button
                          size={1}
                          text="Remove"
                          tone="critical"
                          onClick={() => removeRedirect(redirect._id)}
                          disabled={processing}
                          title="Deactivate this redirect"
                        />
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
                          <>
                            <Button
                              size={1}
                              text={getPageVisibilityButtonProps(page).text}
                              tone={getPageVisibilityButtonProps(page).tone}
                              onClick={() => togglePageVisibility(page)}
                              disabled={processing}
                              title={getPageVisibilityButtonProps(page).title}
                            />
                            
                            <Button
                              size={1}
                              text="301"
                              tone="positive"
                              onClick={() => togglePage301RedirectState(page._id)}
                              disabled={processing}
                              title="Set 301 redirect to another URL"
                            />
                            
                            {showRedirectInput[page._id] && (
                              <Stack space={2}>
                                <TextInput
                                  size={1}
                                  placeholder="Source URL to redirect FROM (e.g., /source-page-path)"
                                  value={sourceUrls[page._id] || ''}
                                  onChange={(event) => setSourceUrls(prev => ({
                                    ...prev,
                                    [page._id]: event.target.value
                                  }))}
                                  style={{ minWidth: '300px' }}
                                />
                                {sourceUrls[page._id] && (
                                  <Text size={1} style={{ 
                                    color: isValidUrlFormat(sourceUrls[page._id]) ? '#059669' : '#DC2626',
                                    fontSize: '12px'
                                  }}>
                                    {isValidUrlFormat(sourceUrls[page._id]) 
                                      ? '✅ Valid URL format' 
                                      : '❌ Invalid URL format'
                                    }
                                  </Text>
                                )}
                                <TextInput
                                  size={1}
                                  placeholder="Description (optional)"
                                  value={sourceUrls[`${page._id}_desc`] || ''}
                                  onChange={(event) => setSourceUrls(prev => ({
                                    ...prev,
                                    [`${page._id}_desc`]: event.target.value
                                  }))}
                                  style={{ minWidth: '300px' }}
                                />
                                                                  <Button
                                    size={1}
                                    text="Create Redirect FROM Source URL"
                                    tone="positive"
                                    onClick={() => createRedirect(
                                      sourceUrls[page._id], // Source URL (what user enters)
                                      page.path, // Current page path (target)
                                      sourceUrls[`${page._id}_desc`] || '',
                                      page._id
                                    )}
                                    disabled={processing || !sourceUrls[page._id]?.trim() || !isValidUrlFormat(sourceUrls[page._id])}
                                  />
                              </Stack>
                            )}
                          </>
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
