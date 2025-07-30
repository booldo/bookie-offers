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
}) => {
  const { trackLinkClick } = useClickTracking();

  const handleClick = async (e: React.MouseEvent) => {
    // Track the click
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
    >
      {children}
    </Link>
  );
};

export default TrackedLink; 