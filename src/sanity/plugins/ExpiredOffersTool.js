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
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    country: 'all',
    search: ''
  });
  const [processing, setProcessing] = useState(false);
  
  const toast = useToast();

  // Fetch all offers and countries
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
        publishingStatus,
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

      const [offersResult, countriesResult] = await Promise.all([
        client.fetch(offersQuery),
        client.fetch(countriesQuery)
      ]);

      setAllOffers(offersResult);
      setCountries(countriesResult);
      
      // Apply filters to get displayed offers
      applyFilters(offersResult, filters);
      
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
      if (currentFilters.status === 'expired') {
        // Filter for offers that have expired (past expiration date)
        filteredResults = filteredResults.filter(offer => 
          offer.expires && new Date(offer.expires) < new Date()
        );
      } else {
        // Filter by exact publishing status
        filteredResults = filteredResults.filter(offer => 
          offer.publishingStatus === currentFilters.status
        );
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
  }, [filters, allOffers, applyFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Check if offer is expired
  const isExpired = (offer) => {
    if (!offer.expires) return false;
    return new Date(offer.expires) < new Date();
  };

  // Get status badge color
  const getStatusColor = (offer) => {
    if (isExpired(offer)) return 'red';
    if (offer.publishingStatus === 'published') return 'green';
    if (offer.publishingStatus === 'draft') return 'gray';
    if (offer.publishingStatus === 'hidden') return 'orange';
    if (offer.publishingStatus === 'review') return 'yellow';
    return 'blue';
  };

  // Get status text
  const getStatusText = (offer) => {
    if (isExpired(offer)) return 'Expired';
    if (offer.publishingStatus === 'hidden') return 'Hidden';
    return offer.publishingStatus || 'Draft';
  };

  // Get background color for offer cards
  const getCardBackground = (offer) => {
    if (isExpired(offer)) return '#FEF2F2'; // Light red background
    if (offer.publishingStatus === 'draft') return '#FFF7ED'; // Light orange background
    if (offer.publishingStatus === 'published') return '#F0FDF4'; // Light green background
    if (offer.publishingStatus === 'hidden') return '#FEF3C7'; // Light yellow background
    return '#FFFFFF'; // Default white background
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  // Get accurate counts for each filter
  const getFilterCounts = () => {
    const total = allOffers.length;
    const draft = allOffers.filter(o => o.publishingStatus === 'draft').length;
    const published = allOffers.filter(o => o.publishingStatus === 'published').length;
    const expired = allOffers.filter(o => o.expires && new Date(o.expires) < new Date()).length;
    const hidden = allOffers.filter(o => o.publishingStatus === 'hidden').length;
    
    return { total, draft, published, expired, hidden };
  };

  // Toggle offer visibility (show/hide)
  const toggleOfferVisibility = async (offerId, currentStatus) => {
    setProcessing(true);
    try {
      const newStatus = currentStatus === 'hidden' ? 'published' : 'hidden';
      
      console.log(`Toggling offer ${offerId} from ${currentStatus} to ${newStatus}`);
      
      await client
        .patch(offerId)
        .set({
          publishingStatus: newStatus,
          isVisible: newStatus === 'published'
        })
        .commit();
      
      toast.push({
        status: 'success',
        title: `Offer ${newStatus === 'published' ? 'shown' : 'hidden'}`,
        description: `Offer is now ${newStatus === 'published' ? 'visible' : 'hidden'} in offer cards. Refresh your frontend to see changes.`
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

  const counts = getFilterCounts();

  return (
    <ToastProvider>
      <Box padding={4}>
        <Stack space={4}>
          {/* Header */}
          <Card padding={4} radius={2} shadow={1}>
            <Stack space={3}>
              <Text size={4} weight="bold">
                Expired Offers Manager
              </Text>
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
              <Flex gap={3} align="center" wrap>
                <Text size={2} weight="semibold">Filters:</Text>
                
                <Select
                  value={filters.status}
                  onChange={(event) => updateFilters({ status: event.target.value })}
                >
                  <option value="all">All ({counts.total})</option>
                  <option value="draft">Draft ({counts.draft})</option>
                  <option value="published">Published ({counts.published})</option>
                  <option value="expired">Expired ({counts.expired})</option>
                  <option value="hidden">Hidden ({counts.hidden})</option>
                </Select>
                
                <Select
                  value={filters.country}
                  onChange={(event) => updateFilters({ country: event.target.value })}
                >
                  <option value="all">All Countries</option>
                  {countries.map(country => (
                    <option key={country._id} value={country._id}>
                      {country.country}
                    </option>
                  ))}
                </Select>
                
                <TextInput
                  placeholder="Search offers..."
                  value={filters.search}
                  onChange={(event) => updateFilters({ search: event.target.value })}
                  style={{ minWidth: '200px' }}
                />
                
                <Button
                  icon={RefreshIcon}
                  text="Refresh"
                  onClick={fetchData}
                  disabled={loading}
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
                          text={offer.publishingStatus === 'hidden' ? 'Show' : 'Hide'}
                          tone={offer.publishingStatus === 'hidden' ? 'positive' : 'caution'}
                          onClick={() => toggleOfferVisibility(offer._id, offer.publishingStatus)}
                          disabled={processing}
                          title={offer.publishingStatus === 'hidden' ? 'Show this offer in offer cards' : 'Hide this offer from offer cards'}
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
                          {isExpired(offer) ? (
                            <Badge tone="critical" icon={ClockIcon}>
                              EXPIRED
                            </Badge>
                          ) : (
                            <Badge tone="positive" icon={EyeOpenIcon}>
                              ACTIVE
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
        </Stack>
      </Box>
    </ToastProvider>
  );
}
