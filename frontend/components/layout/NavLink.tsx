'use client';

import React from 'react';
import Link from 'next/link';

export interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export const NavLink = ({ href, icon, children, isActive, className = '' }: NavLinkProps) => (
  <Link 
    href={href} 
    className={`nav-link ${isActive ? 'active' : ''} ${className}`}
  >
    {icon && <span className="nav-link-icon">{icon}</span>}
    {children}
  </Link>
);

export default NavLink;
