'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../../styles/verification.css';

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

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const BusinessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const InstitutionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4 8 4v14"/>
    <path d="M9 21v-6h6v6"/>
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

interface VerificationStepProps {
  stepNumber: number;
  title: string;
  status: 'completed' | 'pending';
  meta: string;
  isOptional?: boolean;
}

const VerificationStep = ({ stepNumber, title, status, meta, isOptional }: VerificationStepProps) => (
  <div className="verification-step">
    <div className={`step-indicator ${status}`}>
      {status === 'completed' ? (
        <CheckIcon />
      ) : (
        <span>{stepNumber}</span>
      )}
    </div>
    <div className="step-content">
      <div className="step-title">{title}</div>
      <div className="step-meta" dangerouslySetInnerHTML={{ __html: meta }} />
    </div>
    <div className="step-badges">
      <span className={`step-badge ${status}`}>
        {status === 'completed' ? 'Completed' : 'Pending'}
      </span>
      {isOptional && <span className="step-badge optional">Optional</span>}
    </div>
    {status === 'pending' && (
      <button className="btn btn-primary btn-sm">Apply</button>
    )}
  </div>
);

interface TrustFactorProps {
  name: string;
  points: number;
  percentage: number;
}

const TrustFactor = ({ name, points, percentage }: TrustFactorProps) => (
  <div className="factor-item">
    <div className="factor-header">
      <span className="factor-name">{name}</span>
      <span className="factor-points">+{points}</span>
    </div>
    <div className="factor-bar-container">
      <div className="factor-bar">
        <div className="factor-bar-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="factor-percentage">{percentage}%</span>
    </div>
  </div>
);

export default function VerificationPage() {
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
              <li><NavLink href="/dashboard">Home</NavLink></li>
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
                <li><NavLink href="/verification" isActive>Verification Status</NavLink></li>
                <li><NavLink href="/trust-score">Trust Score</NavLink></li>
                <li><NavLink href="/dispute-resolution">Dispute Resolution</NavLink></li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main with-sidebar">
        <div className="main-content">
          {/* Page Header */}
          <div className="page-header">
            <h1>Verification Status</h1>
            <p className="subtitle">Manage your verification level and trust score</p>
          </div>
          
          {/* Current Status Card */}
          <div className="status-card">
            <div className="status-header">
              <div className="status-badge">
                <span className="status-badge-icon">
                  <CheckIcon />
                </span>
                Full Verification
              </div>
            </div>
            <p className="status-message">You have full access to all platform features</p>
            <div className="status-score-section">
              <div className="status-score-display">
                <span className="status-score-value">785</span>
                <span className="status-score-max">/1000</span>
                <span className="status-score-rank">Top 15% of members</span>
              </div>
              <div className="status-score-change">
                <span>+</span>
                <span>15 points this month</span>
              </div>
            </div>
          </div>
          
          {/* Verification Progress Section */}
          <div className="verification-section">
            <h2 className="section-title">Verification Progress</h2>
            <div className="verification-steps">
              <VerificationStep 
                stepNumber={1}
                title="Email Verification"
                status="completed"
                meta="Verified on <strong>15 Jan 2023</strong>"
              />
              <VerificationStep 
                stepNumber={2}
                title="Biometric Verification"
                status="completed"
                meta="Verified on <strong>20 Jan 2023</strong>"
              />
              <VerificationStep 
                stepNumber={3}
                title="Two-Witness Verification"
                status="completed"
                meta="Verified by <span class='witness'>Yusuf Ibrahim</span> and <span class='witness'>Aisha Patel</span>"
              />
              <VerificationStep 
                stepNumber={4}
                title="Business Verification"
                status="pending"
                meta="Optional verification for business accounts"
                isOptional={true}
              />
            </div>
          </div>
          
          {/* Trust Score Factors Section */}
          <div className="factors-section">
            <h2 className="section-title">Trust Score Factors</h2>
            <div className="factors-list">
              <TrustFactor name="Profile Completeness" points={50} percentage={85} />
              <TrustFactor name="Connection Quality" points={30} percentage={70} />
              <TrustFactor name="Community Contributions" points={25} percentage={60} />
              <TrustFactor name="Verification Level" points={100} percentage={100} />
              <TrustFactor name="Endorsements Received" points={47} percentage={47} />
            </div>
          </div>
          
          {/* Witness Eligibility Section */}
          <div className="witness-section">
            <h2 className="section-title">Witness Eligibility</h2>
            <div className="witness-card">
              <div className="witness-icon">
                <ShieldIcon />
              </div>
              <div className="witness-content">
                <h3 className="witness-title">You are eligible to vouch for new members</h3>
                <p className="witness-message">Your trust score and verification status allow you to witness for others</p>
                <div className="witness-stats">
                  <div className="witness-stat">
                    <span className="witness-stat-value">12</span>
                    <span className="witness-stat-label">Members Vouched</span>
                  </div>
                  <div className="witness-stat">
                    <span className="witness-stat-value">100%</span>
                    <span className="witness-stat-label">Success Rate</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upgrade Options Section */}
          <div className="upgrade-section">
            <h2 className="section-title">Upgrade Options</h2>
            <div className="upgrade-grid">
              {/* Business Verification Card */}
              <div className="upgrade-card business">
                <div className="upgrade-card-header">
                  <div className="upgrade-card-icon">
                    <BusinessIcon />
                  </div>
                  <h3 className="upgrade-card-title">Business Verification</h3>
                </div>
                <p className="upgrade-card-description">
                  Verify your business to unlock marketplace features and build trust with potential partners and customers.
                </p>
                <ul className="upgrade-card-features">
                  <li>Business profile badge</li>
                  <li>Priority listing in marketplace</li>
                  <li>Enhanced trust indicators</li>
                  <li>Business analytics dashboard</li>
                </ul>
                <button className="upgrade-card-button">Apply for Business Verification</button>
              </div>
              
              {/* Institutional Partner Card */}
              <div className="upgrade-card institutional">
                <div className="upgrade-card-header">
                  <div className="upgrade-card-icon">
                    <InstitutionIcon />
                  </div>
                  <h3 className="upgrade-card-title">Institutional Partner</h3>
                </div>
                <p className="upgrade-card-description">
                  Join as an institutional partner to access exclusive features and collaborate with the MuslimEEN ecosystem.
                </p>
                <ul className="upgrade-card-features">
                  <li>Institutional verification badge</li>
                  <li>API access for integrations</li>
                  <li>Co-marketing opportunities</li>
                  <li>Dedicated account manager</li>
                </ul>
                <button className="upgrade-card-button">Apply for Institutional Partner</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
