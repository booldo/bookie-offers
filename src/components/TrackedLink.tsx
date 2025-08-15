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
  prettyLink?: string | { current: string };
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
  prettyLink,
}) => {
  const { trackLinkClick } = useClickTracking();

  // Determine the display URL for hover tooltip
  let displayUrl = href;
  
  if (isAffiliate && prettyLink) {
    // Use the pretty link if provided (format: bookmaker/bonustype)
    const prettyLinkValue = typeof prettyLink === 'string' ? prettyLink : prettyLink?.current || '';
    if (prettyLinkValue && prettyLinkValue.trim()) {
      displayUrl = `/${prettyLinkValue}`;
    }
  } else if (isAffiliate && offerSlug) {
    // Fallback to existing offerSlug format
    displayUrl = `/${offerSlug}`;
  }

  // For affiliate links, always redirect to the actual affiliate URL (href)
  // The prettyLink is just for display purposes in the hover tooltip
  const linkHref = href;

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
      href={linkHref}
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