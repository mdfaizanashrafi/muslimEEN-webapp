'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../../styles/profile.css';

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

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
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

interface CardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Card = ({ title, action, children }: CardProps) => (
  <div className="card">
    <div className="card-header">
      <h3>{title}</h3>
      {action}
    </div>
    <div className="card-body">{children}</div>
  </div>
);

interface WidgetProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Widget = ({ title, action, children }: WidgetProps) => (
  <div className="widget">
    <div className="widget-header">
      <h3>{title}</h3>
      {action}
    </div>
    <div className="widget-body">{children}</div>
  </div>
);

interface TimelineItemProps {
  title: string;
  subtitle: string;
  date: string;
  description?: string;
}

const TimelineItem = ({ title, subtitle, date, description }: TimelineItemProps) => (
  <div className="timeline-item">
    <div className="timeline-content">
      <h5>{title}</h5>
      <p className="text-secondary">{subtitle}</p>
      <p className="text-sm text-tertiary">{date}</p>
      {description && <p className="mt-2">{description}</p>}
    </div>
  </div>
);

interface SkillBadgeProps {
  name: string;
  count: number;
}

const SkillBadge = ({ name, count }: SkillBadgeProps) => (
  <span className="badge badge-verified">
    {name} <small>({count})</small>
  </span>
);

interface ActivityItemProps {
  icon: string;
  text: string;
  time: string;
}

const ActivityItem = ({ icon, text, time }: ActivityItemProps) => (
  <div className="activity-item">
    <span className="activity-icon">{icon}</span>
    <span className="activity-text">{text}</span>
    <span className="activity-time">{time}</span>
  </div>
);

export default function ProfilePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);
  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

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
              <li><NavLink href="/profile" isActive>Profile</NavLink></li>
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
                  <NavLink href="/profile" icon={<ProfileIcon />} isActive>
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
          </nav>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main with-sidebar">
        <div className="main-content">
          {/* Profile Header */}
          <section className="profile-header">
            <div className="profile-cover">
              <div className="cover-pattern pattern-tessellation"></div>
            </div>
            <div className="profile-header-content">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  <div className="avatar avatar-xl">AH</div>
                  <button type="button" className="avatar-edit" aria-label="Change photo">
                    <CameraIcon />
                  </button>
                </div>
              </div>
              
              <div className="profile-info-section">
                <div className="profile-info-main">
                  <h1>Ahmed Hassan</h1>
                  <p className="profile-bio">Software Engineer | Islamic Finance Enthusiast | Building ethical tech solutions</p>
                  <p className="profile-location">
                    <LocationIcon />
                    London, UK
                  </p>
                  
                  <div className="verification-badges mt-3">
                    <span className="verification-badge verified">✓ Biometric Verified</span>
                    <span className="verification-badge verified">✓ Two-Witness Verified</span>
                    <span className="verification-badge verified">✓ Institutional Fast-Track</span>
                  </div>
                </div>
                
                <div className="profile-info-stats">
                  <div className="profile-stat">
                    <span className="stat-number">234</span>
                    <span className="stat-label">Connections</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-number">47</span>
                    <span className="stat-label">Endorsements</span>
                  </div>
                  <div className="profile-stat">
                    <span className="stat-number">128</span>
                    <span className="stat-label">Profile Views</span>
                  </div>
                </div>
              </div>
              
              <div className="profile-actions">
                <button type="button" className="btn btn-primary" onClick={openEditModal}>
                  Edit Profile
                </button>
                <button type="button" className="btn btn-outline">
                  Share Profile
                </button>
              </div>
            </div>
          </section>
          
          {/* Profile Content */}
          <div className="profile-content">
            {/* Left Column */}
            <div className="profile-main">
              {/* Trust Score Card */}
              <Card 
                title="Trust Score" 
                action={<Link href="/trust-score" className="text-sm text-link">View Details</Link>}
              >
                <div className="trust-score-container">
                  <div className="trust-score-header">
                    <span className="trust-score-value high">785</span>
                    <span className="text-sm text-secondary">/1000</span>
                  </div>
                  <div className="trust-score-bar">
                    <div className="trust-score-fill high" style={{ width: '78.5%' }}></div>
                  </div>
                  <p className="text-sm text-secondary mt-2">+15 points this month • Top 15% of members</p>
                </div>
              </Card>
              
              {/* About Section */}
              <Card 
                title="About"
                action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>Edit</button>}
              >
                <p>Passionate software engineer with 5+ years of experience building scalable web applications. Specialized in fintech solutions with a focus on Islamic finance compliance.</p>
                <p className="mt-2">Currently leading development at HalalTech Solutions, where we&apos;re building the next generation of Shariah-compliant financial tools for the Muslim community.</p>
              </Card>
              
              {/* Experience Section */}
              <Card 
                title="Experience"
                action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>+ Add</button>}
              >
                <div className="timeline">
                  <TimelineItem 
                    title="Senior Software Engineer"
                    subtitle="HalalTech Solutions"
                    date="Mar 2022 - Present"
                    description="Leading development of Shariah-compliant fintech solutions"
                  />
                  <TimelineItem 
                    title="Full Stack Developer"
                    subtitle="Global Devs Inc"
                    date="Jun 2019 - Feb 2022"
                    description="Built scalable web applications for enterprise clients"
                  />
                </div>
              </Card>
              
              {/* Education Section */}
              <Card 
                title="Education"
                action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>+ Add</button>}
              >
                <div className="timeline">
                  <TimelineItem 
                    title="MSc Computer Science"
                    subtitle="University of Manchester"
                    date="2017 - 2019"
                  />
                </div>
              </Card>
              
              {/* Skills Section */}
              <Card 
                title="Skills & Endorsements"
                action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>+ Add</button>}
              >
                <div className="flex flex-wrap gap-2">
                  <SkillBadge name="JavaScript" count={12} />
                  <SkillBadge name="Islamic Finance" count={8} />
                  <SkillBadge name="Project Management" count={5} />
                  <SkillBadge name="Community Building" count={7} />
                  <SkillBadge name="React" count={9} />
                  <SkillBadge name="Node.js" count={6} />
                </div>
              </Card>
            </div>
            
            {/* Right Column */}
            <aside className="profile-sidebar">
              {/* Profile Completeness */}
              <Widget title="Profile Strength">
                <div className="progress mb-2">
                  <div className="progress-bar" style={{ width: '85%' }}></div>
                </div>
                <p className="text-sm text-secondary">85% complete</p>
                <ul className="completeness-checklist mt-4">
                  <li className="complete">✓ Add profile photo</li>
                  <li className="complete">✓ Add headline</li>
                  <li className="complete">✓ Add location</li>
                  <li className="complete">✓ Add work experience</li>
                  <li className="complete">✓ Add education</li>
                  <li className="incomplete">○ Add 3 more skills</li>
                  <li className="incomplete">○ Get 5 endorsements</li>
                </ul>
              </Widget>
              
              {/* Verification Status */}
              <Widget 
                title="Verification"
                action={<Link href="/verification" className="text-sm text-link">Details</Link>}
              >
                <div className="verification-status">
                  <div className="verification-tier">
                    <span className="tier-badge full">Full Verification</span>
                  </div>
                  <ul className="verification-steps">
                    <li className="complete">
                      <CheckIcon />
                      Email verified
                    </li>
                    <li className="complete">
                      <CheckIcon />
                      Biometric verified
                    </li>
                    <li className="complete">
                      <CheckIcon />
                      Two-witness verified
                    </li>
                  </ul>
                  <Link href="/verification" className="btn btn-outline btn-sm w-full mt-4">
                    Upgrade to Business
                  </Link>
                </div>
              </Widget>
              
              {/* Activity */}
              <Widget title="Recent Activity">
                <div className="activity-list">
                  <ActivityItem 
                    icon="👤"
                    text="Connected with Yusuf Ibrahim"
                    time="2 days ago"
                  />
                  <ActivityItem 
                    icon="⭐"
                    text="Received endorsement for Islamic Finance"
                    time="5 days ago"
                  />
                  <ActivityItem 
                    icon="📝"
                    text="Updated work experience"
                    time="1 week ago"
                  />
                </div>
              </Widget>
            </aside>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal">
          <div className="modal-backdrop" onClick={closeEditModal}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button type="button" className="modal-close" onClick={closeEditModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="text-secondary">Profile editing functionality coming soon...</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={closeEditModal}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
