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

  // Extract country code from current pathname or use provided countryCode prop
  // Validate that it looks like a country code (2-3 lowercase letters)
  const pathSegments = pathname.split('/').filter(Boolean);
  let countryCodeFromPath = pathSegments[0] || 'ng';
  
  // Validate country code format (should be 2-3 lowercase letters)
  if (!/^[a-z]{2,3}$/.test(countryCodeFromPath)) {
    countryCodeFromPath = 'ng'; // fallback to Nigeria
  }
  
  // Use provided countryCode prop if available, otherwise use extracted one
  const finalCountryCode = countryCode || countryCodeFromPath;
  
  // Determine the display URL for hover tooltip
  let displayUrl = href;
  
  if (isAffiliate && prettyLink) {
    // Use the pretty link if provided (format: country/bookmaker/bonustype)
    const prettyLinkValue = typeof prettyLink === 'string' ? prettyLink : prettyLink?.current || '';
    if (prettyLinkValue && prettyLinkValue.trim()) {
      displayUrl = `/${finalCountryCode}/${prettyLinkValue}`;
    }
  } else if (isAffiliate && offerSlug) {
    // Fallback to existing offerSlug format
    displayUrl = `/${finalCountryCode}/${offerSlug}`;
  }

  // For affiliate links, use the pretty link for the href so it shows in browser status bar
  // and lets the server route handle the redirect to the affiliate URL
  let linkHref = href;
  if (isAffiliate && prettyLink) {
    const prettyLinkValue = typeof prettyLink === 'string' ? prettyLink : prettyLink?.current || '';
    if (prettyLinkValue && prettyLinkValue.trim()) {
      // Use pretty link for display in browser status bar (with country code)
      linkHref = `/${finalCountryCode}/${prettyLinkValue}`;
    }
  }

  const handleClick = async (e: React.MouseEvent) => {
    // For affiliate links with prettyLink, allow normal navigation to prettyLink;
    // the server will redirect to the external affiliate URL. Still track the click.
    if (isAffiliate && prettyLink) {
      // Fire-and-forget to avoid blocking navigation
      try { void trackLinkClick(linkId, linkType, href, linkTitle); } catch {}
      return;
    }
    // If it's an affiliate without a prettyLink fallback, open the affiliate URL directly
    if (isAffiliate && !prettyLink && href && href !== '#') {
      e.preventDefault();
      e.stopPropagation();
      await trackLinkClick(linkId, linkType, href, linkTitle);
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