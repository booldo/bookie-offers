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
      if (currentFilters.status === 'active') {
        // Filter for offers that are published and not expired
        filteredResults = filteredResults.filter(offer => 
          offer.publishingStatus === 'published' && 
          (!offer.expires || new Date(offer.expires) >= new Date())
        );
      } else if (currentFilters.status === 'expired') {
           // Filter for offers that have expired (past expiration date)
           filteredResults = filteredResults.filter(offer => 
             offer.expires && new Date(offer.expires) < new Date()
           );
         } else if (currentFilters.status === 'hidden') {
          filteredResults = filteredResults.filter(offer => offer.publishingStatus === 'hidden');
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

  // Get status text for display
  const getStatusText = (offer) => {
    if (offer.publishingStatus === 'hidden' && isExpired(offer)) return 'Hidden & Expired';
    if (offer.publishingStatus === 'hidden') return 'Hidden';
    if (isExpired(offer)) return 'Expired';
    if (offer.publishingStatus === 'published' && (!offer.expires || new Date(offer.expires) >= new Date())) return 'Active';
    return offer.publishingStatus || 'Unknown';
  };

  // Get status badge color
  const getStatusColor = (offer) => {
    if (offer.publishingStatus === 'hidden' && isExpired(offer)) return 'red';
    if (offer.publishingStatus === 'hidden') return 'red';
    if (isExpired(offer)) return 'red';
    if (offer.publishingStatus === 'published' && (!offer.expires || new Date(offer.expires) >= new Date())) return 'green';
    if (offer.publishingStatus === 'review') return 'yellow';
    return 'blue';
  };

  // Get background color for offer cards
  const getCardBackground = (offer) => {
    if (offer.publishingStatus === 'hidden' && isExpired(offer)) return '#1F2937'; // Dark gray for hidden & expired
    if (offer.publishingStatus === 'hidden') return '#374151'; // Medium gray for hidden
    if (isExpired(offer)) return '#4B5563'; // Light gray for expired
    if (offer.publishingStatus === 'published' && (!offer.expires || new Date(offer.expires) >= new Date())) return '#1F2937'; // Dark gray for active
    return '#1F2937'; // Default dark gray background
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    return new Date(dateString).toLocaleDateString();
  };

  // Get accurate counts for each filter
  const getFilterCounts = () => {
    const total = allOffers.length;
    const active = allOffers.filter(o => 
      o.publishingStatus === 'published' && 
      (!o.expires || new Date(o.expires) >= new Date())
    ).length;
    const expired = allOffers.filter(o => 
      o.expires && new Date(o.expires) < new Date()
    ).length;
    const hidden = allOffers.filter(o => o.publishingStatus === 'hidden').length;
    
    return { total, active, expired, hidden };
  };

  // Get count for specific country
  const getCountryCount = (countryId) => {
    if (countryId === 'all') return allOffers.length;
    return allOffers.filter(o => o.country?._id === countryId).length;
  };

  // Toggle offer visibility (show/hide)
  const toggleOfferVisibility = async (offerId, currentStatus) => {
    setProcessing(true);
    try {
      // Determine the new status based on current status
      let newStatus;
      let newVisibility;
      
      if (currentStatus === 'hidden') {
        // If hidden, make it published and visible
        newStatus = 'published';
        newVisibility = true;
      } else {
        // If published/any other status, make it hidden
        newStatus = 'hidden';
        newVisibility = false;
      }
      
      console.log(`Toggling offer ${offerId} from ${currentStatus} to ${newStatus}`);
      
      await client
        .patch(offerId)
        .set({
          publishingStatus: newStatus,
          isVisible: newVisibility
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

  // Get button text and tone for hide/show button
  const getVisibilityButtonProps = (offer) => {
    if (offer.publishingStatus === 'hidden') {
      return {
        text: 'Show',
        tone: 'positive',
        title: 'Show this offer in offer cards'
      };
    } else {
      return {
        text: 'Hide',
        tone: 'critical',
        title: 'Hide this offer from offer cards (will show 410 error)'
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
                   <option value="hidden">Hidden ({counts.hidden})</option>
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
                  placeholder="Search offers..."
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
                           onClick={() => toggleOfferVisibility(offer._id, offer.publishingStatus)}
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
                          {offer.publishingStatus === 'hidden' && isExpired(offer) ? (
                            <Badge tone="critical" icon={EyeClosedIcon}>
                              HIDDEN & EXPIRED
                            </Badge>
                          ) : offer.publishingStatus === 'hidden' ? (
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
        </Stack>
      </Box>
    </ToastProvider>
  );
}
