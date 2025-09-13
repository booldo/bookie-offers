"use client";

import DynamicOffers from './DynamicOffers';

export default function DynamicOffersWrapper({ countrySlug, initialFilter, filterInfo }) {
  return (
    <DynamicOffers 
      countrySlug={countrySlug} 
      initialFilter={initialFilter}
      filterInfo={filterInfo}
    />
  );
}
