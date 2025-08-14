import React from 'react';
import Link from 'next/link';
import { useClickTracking } from '../hooks/useClickTracking';

interface TrackedLinkProps {
  href: string;
  linkId: string;
  linkType: 'offer' | 'bookmaker' | 'banner' | 'custom';
  linkTitle?: string;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
  onClick?: (e: React.MouseEvent) => void;
  isAffiliate?: boolean;
  offerSlug?: string;
  countryCode?: string;
  bookmaker?: string;
  bonusType?: string;
}

export const TrackedLink: React.FC<TrackedLinkProps> = ({
  href,
  linkId,
  linkType,
  linkTitle,
  children,
  className,
  target,
  rel,
  onClick,
  isAffiliate = false,
  offerSlug,
  countryCode,
  bookmaker,
  bonusType,
}) => {
  const { trackLinkClick } = useClickTracking();

  // Determine the display URL
  let displayUrl = href;
  
  if (isAffiliate) {
    if (countryCode && bookmaker && bonusType) {
      // Format: /countrycode/bookmaker/bonustype
      displayUrl = `/${countryCode}/${bookmaker}/${bonusType}`;
    } else if (offerSlug) {
      // Fallback to existing offerSlug format
      displayUrl = `/${offerSlug}`;
    }
  }

  const handleClick = async (e: React.MouseEvent) => {
    // Track the click with the original affiliate URL
    await trackLinkClick(linkId, linkType, href, linkTitle);
    
    // Call the original onClick if provided
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <Link
      href={href}
      className={className}
      target={target}
      rel={rel}
      onClick={handleClick}
      title={isAffiliate ? displayUrl : undefined}
    >
      {children}
    </Link>
  );
};

export default TrackedLink; 