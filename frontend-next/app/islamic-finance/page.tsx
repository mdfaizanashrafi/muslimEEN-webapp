'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import '@/styles/islamic-finance.css';

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

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const BuildingIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4 8 4v14"/>
    <path d="M9 21v-6h6v6"/>
  </svg>
);

const CalculatorIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="10" x2="16" y2="10"/>
    <line x1="8" y1="14" x2="16" y2="14"/>
    <line x1="8" y1="18" x2="10" y2="18"/>
  </svg>
);

const HandCoinsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/>
    <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/>
    <path d="m2 16 6 6"/>
    <circle cx="16" cy="9" r="2.9"/>
    <circle cx="6" cy="5" r="3"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
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

interface CampaignCardProps {
  category: string;
  categoryColor: 'red' | 'green' | 'blue';
  title: string;
  description: string;
  raised: string;
  goal: string;
  progress: number;
  donors: number;
  daysLeft: number;
  orgName: string;
  orgInitials: string;
}

const CampaignCard = ({
  category,
  categoryColor,
  title,
  description,
  raised,
  goal,
  progress,
  donors,
  daysLeft,
  orgName,
  orgInitials
}: CampaignCardProps) => (
  <div className={`campaign-card campaign-${categoryColor}`}>
    <div className="campaign-image">
      <div className="campaign-image-placeholder">
        {category === 'Emergency Relief' && '🆘'}
        {category === 'Education' && '📚'}
        {category === 'Water' && '💧'}
      </div>
      <span className={`campaign-category badge-${categoryColor}`}>{category}</span>
    </div>
    <div className="campaign-content">
      <h3 className="campaign-title">{title}</h3>
      <p className="campaign-description">{description}</p>
      
      <div className="campaign-progress">
        <div className="campaign-progress-header">
          <span className="campaign-raised">{raised}</span>
          <span className="campaign-goal">of {goal}</span>
        </div>
        <div className="progress-bar campaign-progress-bar">
          <div className={`progress-fill ${categoryColor}`} style={{ width: `${progress}%` }}></div>
        </div>
        <div className="campaign-progress-footer">
          <span><UsersIcon /> {donors} donors</span>
          <span><ClockIcon /> {daysLeft} days left</span>
        </div>
      </div>
      
      <div className="campaign-org">
        <div className="org-avatar">{orgInitials}</div>
        <span className="org-name">{orgName}</span>
      </div>
      
      <button className="btn btn-primary btn-full">Donate Now</button>
    </div>
  </div>
);

interface DonationHistoryItemProps {
  campaign: string;
  date: string;
  amount: string;
}

const DonationHistoryItem = ({ campaign, date, amount }: DonationHistoryItemProps) => (
  <div className="donation-item">
    <div className="donation-info">
      <span className="donation-campaign">{campaign}</span>
      <span className="donation-date">{date}</span>
    </div>
    <span className="donation-amount">{amount}</span>
  </div>
);

interface QuickToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const QuickToolCard = ({ icon, title, description, href }: QuickToolCardProps) => (
  <Link href={href} className="quick-tool-card">
    <div className="quick-tool-icon">{icon}</div>
    <h4 className="quick-tool-title">{title}</h4>
    <p className="quick-tool-description">{description}</p>
  </Link>
);

function IslamicFinanceContent() {
  const searchParams = useSearchParams();
  const tool = searchParams.get('tool') || 'sadaqah';
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(tool);

  useEffect(() => {
    setActiveTab(tool);
  }, [tool]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const tabs = [
    { id: 'sadaqah', label: 'Sadaqah' },
    { id: 'waqf', label: 'Waqf' },
    { id: 'zakat', label: 'Zakat' },
    { id: 'qardhasan', label: 'Qard Hasan' },
    { id: 'takaful', label: 'Takaful' },
  ];

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
              <h4 className="nav-section-title">Islamic Finance</h4>
              <ul className="nav-list">
                <li>
                  <NavLink href="/islamic-finance?tool=sadaqah" icon={<HeartIcon />} isActive={activeTab === 'sadaqah'}>
                    Sadaqah
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/islamic-finance?tool=waqf" icon={<BuildingIcon />} isActive={activeTab === 'waqf'}>
                    Waqf
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/islamic-finance?tool=zakat" icon={<CalculatorIcon />} isActive={activeTab === 'zakat'}>
                    Zakat Calculator
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/islamic-finance?tool=qardhasan" icon={<HandCoinsIcon />} isActive={activeTab === 'qardhasan'}>
                    Qard Hasan
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/islamic-finance?tool=takaful" icon={<ShieldIcon />} isActive={activeTab === 'takaful'}>
                    Takaful
                  </NavLink>
                </li>
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
          <section className="finance-header">
            <div className="finance-header-content">
              <div className="finance-titles">
                <span className="finance-arabic-title">التمويل الإسلامي</span>
                <h1 className="finance-english-title">Islamic Finance Tools</h1>
                <p className="finance-subtitle">Shariah-compliant financial services for the Muslim community</p>
              </div>
            </div>
          </section>
          
          {/* Finance Tools Tabs */}
          <div className="finance-tabs-container">
            <div className="tabs finance-tabs">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={`/islamic-finance?tool=${tab.id}`}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="tab-content-wrapper">
            {activeTab === 'sadaqah' && (
              <div className="sadaqah-section">
                {/* Section Intro */}
                <div className="section-intro">
                  <h2>Sadaqah Campaigns</h2>
                  <p>Give charity voluntarily to help those in need. Every donation is a seed planted for your akhirah.</p>
                </div>
                
                {/* Campaigns Grid */}
                <div className="campaigns-grid">
                  <CampaignCard
                    category="Emergency Relief"
                    categoryColor="red"
                    title="Emergency Relief Fund"
                    description="Help provide urgent aid to families affected by recent disasters. Your sadaqah can save lives."
                    raised="£67,000"
                    goal="£100,000"
                    progress={67}
                    donors={234}
                    daysLeft={12}
                    orgName="Muslim Aid UK"
                    orgInitials="MA"
                  />
                  <CampaignCard
                    category="Education"
                    categoryColor="green"
                    title="Islamic School Building"
                    description="Support the construction of a new Islamic school in Birmingham. Educating the next generation."
                    raised="£125,000"
                    goal="£250,000"
                    progress={50}
                    donors={456}
                    daysLeft={45}
                    orgName="EduCare Foundation"
                    orgInitials="EC"
                  />
                  <CampaignCard
                    category="Water"
                    categoryColor="blue"
                    title="Clean Water Wells"
                    description="Build sustainable water wells in drought-affected regions. Sadaqah jariyah that keeps giving."
                    raised="£34,500"
                    goal="£50,000"
                    progress={69}
                    donors={189}
                    daysLeft={23}
                    orgName="Water Relief Intl"
                    orgInitials="WR"
                  />
                </div>
                
                {/* Donation History */}
                <div className="donation-history-card">
                  <div className="card-header">
                    <h3>Your Donation History</h3>
                    <Link href="#" className="text-link">View All</Link>
                  </div>
                  <div className="card-body">
                    <div className="donation-list">
                      <DonationHistoryItem 
                        campaign="Emergency Relief Fund" 
                        date="Jan 15, 2026" 
                        amount="£150" 
                      />
                      <DonationHistoryItem 
                        campaign="Islamic School Building" 
                        date="Jan 8, 2026" 
                        amount="£100" 
                      />
                      <DonationHistoryItem 
                        campaign="Clean Water Wells" 
                        date="Dec 28, 2025" 
                        amount="£75" 
                      />
                      <DonationHistoryItem 
                        campaign="Ramadan Food Drive" 
                        date="Dec 15, 2025" 
                        amount="£100" 
                      />
                    </div>
                    <div className="donation-total">
                      <span className="total-label">Total Given YTD</span>
                      <span className="total-amount">£425</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'waqf' && (
              <div className="placeholder-section">
                <div className="placeholder-icon"><BuildingIcon /></div>
                <h2>Waqf</h2>
                <p>Create everlasting charity through endowment. Coming soon.</p>
              </div>
            )}
            
            {activeTab === 'zakat' && (
              <div className="placeholder-section">
                <div className="placeholder-icon"><CalculatorIcon /></div>
                <h2>Zakat Calculator</h2>
                <p>Calculate your zakat obligations with ease. Coming soon.</p>
              </div>
            )}
            
            {activeTab === 'qardhasan' && (
              <div className="placeholder-section">
                <div className="placeholder-icon"><HandCoinsIcon /></div>
                <h2>Qard Hasan</h2>
                <p>Interest-free benevolent loans for the community. Coming soon.</p>
              </div>
            )}
            
            {activeTab === 'takaful' && (
              <div className="placeholder-section">
                <div className="placeholder-icon"><ShieldIcon /></div>
                <h2>Takaful</h2>
                <p>Islamic cooperative insurance solutions. Coming soon.</p>
              </div>
            )}
          </div>
          
          {/* Quick Tools Section */}
          <section className="quick-tools-section">
            <h2 className="section-title">Quick Tools</h2>
            <div className="quick-tools-grid">
              <QuickToolCard
                icon={<CalculatorIcon />}
                title="Zakat Calculator"
                description="Calculate your zakat on cash, gold, silver, and investments"
                href="/islamic-finance?tool=zakat"
              />
              <QuickToolCard
                icon={<BuildingIcon />}
                title="Waqf Explorer"
                description="Discover and contribute to ongoing waqf projects"
                href="/islamic-finance?tool=waqf"
              />
              <QuickToolCard
                icon={<HandCoinsIcon />}
                title="Qard Hasan"
                description="Request or offer interest-free loans within the community"
                href="/islamic-finance?tool=qardhasan"
              />
              <QuickToolCard
                icon={<ShieldIcon />}
                title="Takaful"
                description="Explore halal insurance and protection plans"
                href="/islamic-finance?tool=takaful"
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

export default function IslamicFinancePage() {
  return (
    <Suspense fallback={<div className="loading-screen">Loading...</div>}>
      <IslamicFinanceContent />
    </Suspense>
  );
}
