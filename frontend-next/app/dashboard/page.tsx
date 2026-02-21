'use client';

import { useState } from 'react';
import Link from 'next/link';
import '@/styles/dashboard.css';

// Icons as components for better reusability
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const LogoIcon = () => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0L19 12L32 16L19 20L16 32L13 20L0 16L13 12L16 0Z" fill="url(#header-star)"/>
    <defs>
      <linearGradient id="header-star" x1="0" y1="0" x2="32" y2="32">
        <stop offset="0%" stopColor="#059669"/>
        <stop offset="100%" stopColor="#047857"/>
      </linearGradient>
    </defs>
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const NetworkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

const NavLink = ({ href, icon, children, isActive, className = '' }: NavLinkProps) => (
  <Link 
    href={href} 
    className={`nav-link ${isActive ? 'active' : ''} ${className}`}
  >
    {icon && <span className="nav-link-icon">{icon}</span>}
    {children}
  </Link>
);

interface PillarCardProps {
  href: string;
  arabic: string;
  title: string;
  description: string;
  stats: string;
  variant: 'earn' | 'build' | 'live' | 'protect';
}

const PillarCard = ({ href, arabic, title, description, stats, variant }: PillarCardProps) => (
  <Link href={href} className={`pillar-card pillar-${variant}`}>
    <div className="pillar-pattern"></div>
    <div className="pillar-content">
      <span className="pillar-arabic">{arabic}</span>
      <h3 className="pillar-title">{title}</h3>
      <p className="pillar-description">{description}</p>
      <div className="pillar-stats">
        <span>{stats}</span>
      </div>
    </div>
  </Link>
);

interface WidgetProps {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}

const Widget = ({ title, action, children }: WidgetProps) => (
  <div className="widget">
    <div className="widget-header">
      <h3>{title}</h3>
      {action && <Link href={action.href} className="text-sm text-link">{action.label}</Link>}
    </div>
    <div className="widget-body">{children}</div>
  </div>
);

interface StatItemProps {
  value: string | number;
  label: string;
}

const StatItem = ({ value, label }: StatItemProps) => (
  <div className="stat-item">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

interface SuggestedConnectionProps {
  initials: string;
  name: string;
  meta: string;
}

const SuggestedConnection = ({ initials, name, meta }: SuggestedConnectionProps) => (
  <div className="suggested-item">
    <div className="avatar avatar-sm">{initials}</div>
    <div className="suggested-info">
      <span className="suggested-name">{name}</span>
      <span className="suggested-meta">{meta}</span>
    </div>
    <button className="btn btn-outline btn-sm">Connect</button>
  </div>
);

interface QuickLinkProps {
  href: string;
  icon: string;
  text: string;
}

const QuickLink = ({ href, icon, text }: QuickLinkProps) => (
  <Link href={href} className="quick-link">
    <span className="quick-link-icon">{icon}</span>
    <span className="quick-link-text">{text}</span>
  </Link>
);

export default function DashboardPage() {
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
              <li><NavLink href="/dashboard" isActive>Home</NavLink></li>
              <li><NavLink href="/profile">Profile</NavLink></li>
              <li><NavLink href="/connections">Network</NavLink></li>
              <li><NavLink href="/messages">Messages</NavLink></li>
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
                  <NavLink href="/dashboard" icon={<DashboardIcon />} isActive>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/profile" icon={<ProfileIcon />}>
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/connections" icon={<NetworkIcon />}>
                    My Network
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/messages" icon={<MessagesIcon />}>
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
          {/* Welcome Section */}
          <section className="welcome-section">
            <div className="welcome-content">
              <h1>As-salamu alaykum, Ahmed</h1>
              <p className="welcome-subtitle">
                Your trust score: <span className="trust-highlight">785</span> • Verified Member
              </p>
            </div>
            <div className="welcome-actions">
              <Link href="/profile" className="btn btn-primary">Complete Profile</Link>
            </div>
          </section>
          
          {/* Four Pillars Grid */}
          <section className="pillars-section">
            <h2 className="section-title">
              <span className="arabic-text">الأركان الأربعة</span>
              <span>Four Pillars of Economic Empowerment</span>
            </h2>
            
            <div className="pillars-grid">
              <PillarCard
                href="/marketplace/earn"
                arabic="رزق"
                title="EARN"
                description="Jobs, Freelancers, Professional Services, Education, Trades"
                stats="1,247 opportunities"
                variant="earn"
              />
              <PillarCard
                href="/marketplace/build"
                arabic="بناء"
                title="BUILD"
                description="Ventures, Partnerships, Real Estate, Agriculture, Tech"
                stats="89 ventures seeking investment"
                variant="build"
              />
              <PillarCard
                href="/marketplace/live"
                arabic="حياة"
                title="LIVE"
                description="Housing, Food, Travel, Wellness, Creative Services"
                stats="356 service providers"
                variant="live"
              />
              <PillarCard
                href="/marketplace/protect"
                arabic="حفظ"
                title="PROTECT"
                description="Health, Security, Insurance, Legal, Advocacy"
                stats="124 protection services"
                variant="protect"
              />
            </div>
          </section>
          
          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Activity Feed */}
            <section className="feed-section">
              <div className="section-header">
                <h2>Activity Feed</h2>
                <Link href="#" className="btn btn-ghost btn-sm">View All</Link>
              </div>
              
              <div className="feed-container">
                <div className="text-center py-8">
                  <p className="text-secondary">No recent activity</p>
                </div>
              </div>
            </section>
            
            {/* Sidebar Widgets */}
            <aside className="dashboard-sidebar">
              {/* Trust Score Widget */}
              <Widget title="Trust Score" action={{ href: '/trust-score', label: 'Details' }}>
                <div className="trust-score-container">
                  <div className="trust-score-header">
                    <span className="trust-score-value high">785</span>
                    <span className="text-sm text-secondary">/1000</span>
                  </div>
                  <div className="trust-score-bar">
                    <div className="trust-score-fill high" style={{ width: '78.5%' }}></div>
                  </div>
                  <p className="text-sm text-secondary mt-2">+15 points this month</p>
                </div>
              </Widget>
              
              {/* Network Stats */}
              <Widget title="Your Network" action={{ href: '/connections', label: 'Manage' }}>
                <div className="stats-grid">
                  <StatItem value="234" label="Connections" />
                  <StatItem value="47" label="Endorsements" />
                  <StatItem value="128" label="Profile Views" />
                  <StatItem value="12" label="Pending" />
                </div>
              </Widget>
              
              {/* Suggested Connections */}
              <Widget title="Suggested Connections">
                <div className="suggested-connections">
                  <SuggestedConnection 
                    initials="YI" 
                    name="Yusuf Ibrahim" 
                    meta="Islamic Finance • 12 mutual" 
                  />
                  <SuggestedConnection 
                    initials="AP" 
                    name="Aisha Patel" 
                    meta="Halal Food • 8 mutual" 
                  />
                </div>
              </Widget>
              
              {/* Islamic Finance Quick Links */}
              <Widget title="Islamic Finance">
                <div className="quick-links">
                  <QuickLink href="/islamic-finance?tool=zakat" icon="🧮" text="Zakat Calculator" />
                  <QuickLink href="/islamic-finance?tool=sadaqah" icon="❤️" text="Sadaqah Campaigns" />
                </div>
              </Widget>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
