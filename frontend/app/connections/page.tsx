'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../../styles/connections.css';

// Icons as components
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

const MoreIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
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

interface ConnectionCardProps {
  initials: string;
  name: string;
  title: string;
  badges?: string[];
  trustScore: number;
  type: 'connection' | 'pending' | 'suggested';
  meta?: string;
  sentTime?: string;
}

const ConnectionCard = ({ initials, name, title, badges, trustScore, type, meta, sentTime }: ConnectionCardProps) => {
  const trustLevel = trustScore >= 800 ? 'high' : trustScore >= 600 ? 'medium' : 'low';
  
  return (
    <div className={`connection-card ${type}`}>
      <div className="avatar avatar-lg">{initials}</div>
      <div className="connection-info">
        <h4>{name}</h4>
        <p className="text-secondary">{title}</p>
        {meta && <p className="text-sm text-secondary mt-1">{meta}</p>}
        {sentTime && <p className="text-sm text-secondary mt-1">{sentTime}</p>}
        {badges && badges.length > 0 && (
          <div className="flex gap-2 mt-2">
            {badges.map((badge, index) => (
              <span key={index} className="badge badge-verified">✓ {badge}</span>
            ))}
          </div>
        )}
      </div>
      <div className="connection-trust">
        <div className="trust-mini">
          <span className={`trust-value ${trustLevel}`}>{trustScore}</span>
          <div className="trust-bar-mini">
            <div className="trust-fill-mini" style={{ width: `${trustScore / 10}%` }}></div>
          </div>
        </div>
      </div>
      <div className="connection-actions">
        {type === 'connection' && (
          <>
            <button className="btn btn-primary btn-sm">Message</button>
            <button className="btn btn-ghost btn-sm">
              <MoreIcon />
            </button>
          </>
        )}
        {type === 'pending' && (
          <>
            <button className="btn btn-primary btn-sm">Accept</button>
            <button className="btn btn-outline btn-sm">Decline</button>
          </>
        )}
        {type === 'suggested' && (
          <>
            <button className="btn btn-primary btn-sm">Connect</button>
            <button className="btn btn-ghost btn-sm">Remove</button>
          </>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  value: string;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => (
  <div className="stat-card">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

export default function ConnectionsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'suggested'>('connections');

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
              <li><NavLink href="/dashboard">Home</NavLink></li>
              <li><NavLink href="/profile">Profile</NavLink></li>
              <li><NavLink href="/connections" isActive>Network</NavLink></li>
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
                  <NavLink href="/dashboard" icon={<DashboardIcon />}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/profile" icon={<ProfileIcon />}>
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/connections" icon={<NetworkIcon />} isActive>
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
          {/* Page Header */}
          <section className="page-header">
            <h1>My Network</h1>
            <p className="text-secondary">Manage your connections and grow your professional circle</p>
          </section>
          
          {/* Network Stats */}
          <section className="network-stats">
            <div className="stats-row">
              <StatCard value="234" label="Connections" />
              <StatCard value="12" label="Pending" />
              <StatCard value="1,247" label="2nd Degree" />
              <StatCard value="47" label="Endorsements" />
            </div>
          </section>
          
          {/* Tabs */}
          <section className="network-tabs">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
                onClick={() => setActiveTab('connections')}
              >
                Connections
              </button>
              <button 
                className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending (12)
              </button>
              <button 
                className={`tab ${activeTab === 'suggested' ? 'active' : ''}`}
                onClick={() => setActiveTab('suggested')}
              >
                Suggested
              </button>
            </div>
            
            {/* Connections Tab */}
            {activeTab === 'connections' && (
              <div className="tab-content active">
                <div className="search-filter-bar">
                  <input type="text" className="form-input" placeholder="Search connections..." />
                  <select className="form-select">
                    <option value="">All Industries</option>
                    <option value="tech">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                  </select>
                </div>
                
                <div className="connections-list">
                  <ConnectionCard
                    initials="YI"
                    name="Yusuf Ibrahim"
                    title="Islamic Finance Consultant"
                    badges={['Biometric', 'Business']}
                    trustScore={890}
                    type="connection"
                  />
                  <ConnectionCard
                    initials="AP"
                    name="Aisha Patel"
                    title="Halal Food Business Owner"
                    badges={['Two-Witness', 'Institutional']}
                    trustScore={765}
                    type="connection"
                  />
                  <ConnectionCard
                    initials="MA"
                    name="Muhammad Ali"
                    title="Real Estate Developer"
                    badges={['Biometric', 'Business', 'Institutional']}
                    trustScore={920}
                    type="connection"
                  />
                </div>
              </div>
            )}
            
            {/* Pending Tab */}
            {activeTab === 'pending' && (
              <div className="tab-content active">
                <div className="pending-list">
                  <ConnectionCard
                    initials="FA"
                    name="Fatima Al-Rashid"
                    title="Marketing Director"
                    trustScore={820}
                    type="pending"
                    meta="12 mutual connections"
                    sentTime="Sent 2 days ago"
                  />
                </div>
              </div>
            )}
            
            {/* Suggested Tab */}
            {activeTab === 'suggested' && (
              <div className="tab-content active">
                <div className="suggested-list">
                  <ConnectionCard
                    initials="OK"
                    name="Omar Khan"
                    title="Islamic Scholar"
                    trustScore={950}
                    type="suggested"
                    meta="8 mutual connections"
                    sentTime="Based on your profile"
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
