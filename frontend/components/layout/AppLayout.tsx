'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavLink } from './NavLink';
import {
  MenuIcon,
  LogoIcon,
  DashboardIcon,
  ProfileIcon,
  NetworkIcon,
  MessagesIcon,
} from '../icons/LayoutIcons';

export interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: 'dashboard' | 'profile' | 'connections' | 'messages' | string;
}

export const AppLayout = ({ children, activeNav }: AppLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            type="button" 
            className="header-menu-toggle btn btn-ghost" 
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
          
          <Link href="/dashboard" className="header-logo">
            <LogoIcon />
            <span>MuslimEEN</span>
          </Link>
          
          <nav className="header-nav">
            <ul className="nav">
              <li>
                <NavLink href="/dashboard" isActive={activeNav === 'dashboard'}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink href="/profile" isActive={activeNav === 'profile'}>
                  Profile
                </NavLink>
              </li>
              <li>
                <NavLink href="/connections" isActive={activeNav === 'connections'}>
                  Network
                </NavLink>
              </li>
              <li>
                <NavLink href="/messages" isActive={activeNav === 'messages'}>
                  Messages
                </NavLink>
              </li>
            </ul>
          </nav>
          
          <div className="header-actions">
            <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
              <button 
                type="button" 
                className="btn btn-ghost flex items-center gap-2"
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <div className="avatar avatar-sm">AH</div>
                <span className="hidden md:inline">Ahmed Hassan</span>
              </button>
              <div className="dropdown-menu">
                <Link href="/profile" className="dropdown-item">Your Profile</Link>
                <Link href="/verification" className="dropdown-item">Verification Status</Link>
                <Link href="/settings" className="dropdown-item">Settings</Link>
                <div className="dropdown-divider"></div>
                <Link href="/" className="dropdown-item">Sign Out</Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      ></div>
      
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-user">
            <div className="avatar avatar-lg mx-auto">AH</div>
            <h3 className="text-center mt-3 font-semibold">Ahmed Hassan</h3>
            <p className="text-center text-sm text-secondary">Software Engineer</p>
            <div className="trust-score-container mt-3">
              <div className="trust-score-header justify-center">
                <span className="trust-score-value high">785</span>
                <span className="text-sm text-secondary">/1000</span>
              </div>
              <div className="trust-score-bar">
                <div className="trust-score-fill high" style={{ width: '78.5%' }}></div>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h4 className="nav-section-title">Main</h4>
              <ul className="nav-list">
                <li>
                  <NavLink href="/dashboard" icon={<DashboardIcon />} isActive={activeNav === 'dashboard'}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/profile" icon={<ProfileIcon />} isActive={activeNav === 'profile'}>
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/connections" icon={<NetworkIcon />} isActive={activeNav === 'connections'}>
                    My Network
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/messages" icon={<MessagesIcon />} isActive={activeNav === 'messages'}>
                    Messages
                  </NavLink>
                </li>
              </ul>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-section-title">Marketplace</h4>
              <ul className="nav-list">
                <li>
                  <NavLink href="/marketplace/earn" className="nav-link-pillar">
                    <span className="nav-icon earn">رزق</span> EARN
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/marketplace/build" className="nav-link-pillar">
                    <span className="nav-icon build">بناء</span> BUILD
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/marketplace/live" className="nav-link-pillar">
                    <span className="nav-icon live">حياة</span> LIVE
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/marketplace/protect" className="nav-link-pillar">
                    <span className="nav-icon protect">حفظ</span> PROTECT
                  </NavLink>
                </li>
              </ul>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-section-title">Islamic Finance</h4>
              <ul className="nav-list">
                <li><NavLink href="/islamic-finance?tool=sadaqah">Sadaqah</NavLink></li>
                <li><NavLink href="/islamic-finance?tool=waqf">Waqf</NavLink></li>
                <li><NavLink href="/islamic-finance?tool=zakat">Zakat Calculator</NavLink></li>
                <li><NavLink href="/islamic-finance?tool=qardhasan">Qard Hasan</NavLink></li>
              </ul>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-section-title">Trust & Safety</h4>
              <ul className="nav-list">
                <li><NavLink href="/verification">Verification Status</NavLink></li>
                <li><NavLink href="/trust-score">Trust Score</NavLink></li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main with-sidebar">
        <div className="main-content">
          {children}
        </div>
      </main>
    </>
  );
};

export default AppLayout;
