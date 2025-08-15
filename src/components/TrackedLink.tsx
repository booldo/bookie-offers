import React from 'react';
import Link from 'next/link';
import { useClickTracking } from '../hooks/useClickTracking';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();

  // Extract country code from current pathname
  const countryCodeFromPath = pathname.split('/')[1] || 'ng'; // e.g., "ng" from "/ng/..." with fallback
  
  // Determine the display URL for hover tooltip
  let displayUrl = href;
  
  if (isAffiliate && prettyLink) {
    // Use the pretty link if provided (format: country/bookmaker/bonustype)
    const prettyLinkValue = typeof prettyLink === 'string' ? prettyLink : prettyLink?.current || '';
    if (prettyLinkValue && prettyLinkValue.trim()) {
      displayUrl = `/${countryCodeFromPath}/${prettyLinkValue}`;
    }
  } else if (isAffiliate && offerSlug) {
    // Fallback to existing offerSlug format
    displayUrl = `/${countryCodeFromPath}/${offerSlug}`;
  }

  // For affiliate links, we need to use the pretty link for the href so it shows in browser status bar
  // but the onClick handler will prevent navigation and redirect to affiliate URL
  let linkHref = href;
  if (isAffiliate && prettyLink) {
    const prettyLinkValue = typeof prettyLink === 'string' ? prettyLink : prettyLink?.current || '';
    if (prettyLinkValue && prettyLinkValue.trim()) {
      // Use pretty link for display in browser status bar (with country code)
      linkHref = `/${countryCodeFromPath}/${prettyLinkValue}`;
    }
  }

  const handleClick = async (e: React.MouseEvent) => {
    // For affiliate links, prevent default navigation and redirect to affiliate URL
    if (isAffiliate && href && href !== '#') {
      e.preventDefault();
      e.stopPropagation();
      
      // Track the click with the original affiliate URL
      await trackLinkClick(linkId, linkType, href, linkTitle);
      
      // Open affiliate URL in new tab
      window.open(href, target || '_blank', 'noopener,noreferrer');
      return;
    }
    
    // Track the click with the original URL
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
    >
      {children}
    </Link>
  );
};

export default TrackedLink; 