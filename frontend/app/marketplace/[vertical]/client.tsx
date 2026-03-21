'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import '../../../styles/marketplace.css';

type VerticalType = 'earn' | 'build' | 'live' | 'protect';

interface VerticalConfig {
  id: VerticalType;
  arabic: string;
  title: string;
  description: string;
  longDescription: string;
  theme: {
    primary: string;
    secondary: string;
    gradient: string;
    light: string;
  };
  categories: Array<{
    id: string;
    name: string;
    icon: string;
    count: number;
  }>;
  actionButton: string;
}

const verticalsConfig: Record<VerticalType, VerticalConfig> = {
  earn: {
    id: 'earn',
    arabic: 'رزق',
    title: 'EARN',
    description: 'Jobs, Freelancers & Professional Services',
    longDescription: 'Find halal employment opportunities, connect with Muslim freelancers, and access professional services that align with Islamic values.',
    theme: {
      primary: 'var(--color-emerald-600)',
      secondary: 'var(--color-emerald-700)',
      gradient: 'linear-gradient(135deg, var(--color-emerald-600) 0%, var(--color-emerald-700) 100%)',
      light: 'var(--color-emerald-50)',
    },
    categories: [
      { id: 'jobs', name: 'Full-Time Jobs', icon: '💼', count: 0 },
      { id: 'freelance', name: 'Freelance Work', icon: '🎯', count: 0 },
      { id: 'consulting', name: 'Consulting', icon: '📊', count: 0 },
      { id: 'education', name: 'Education', icon: '📚', count: 0 },
      { id: 'trades', name: 'Skilled Trades', icon: '🔧', count: 0 },
      { id: 'remote', name: 'Remote Work', icon: '🌐', count: 0 },
      { id: 'internships', name: 'Internships', icon: '🌱', count: 0 },
      { id: 'part-time', name: 'Part-Time', icon: '⏰', count: 0 },
    ],
    actionButton: 'Apply Now',
  },
  build: {
    id: 'build',
    arabic: 'بناء',
    title: 'BUILD',
    description: 'Ventures, Partnerships & Real Estate',
    longDescription: 'Discover investment opportunities, business partnerships, and real estate ventures that contribute to the Muslim economy.',
    theme: {
      primary: 'var(--color-sapphire-600)',
      secondary: 'var(--color-sapphire-700)',
      gradient: 'linear-gradient(135deg, var(--color-sapphire-600) 0%, var(--color-sapphire-700) 100%)',
      light: 'var(--color-sapphire-50)',
    },
    categories: [
      { id: 'startups', name: 'Startups', icon: '🚀', count: 0 },
      { id: 'realestate', name: 'Real Estate', icon: '🏢', count: 0 },
      { id: 'partnerships', name: 'Partnerships', icon: '🤝', count: 0 },
      { id: 'franchises', name: 'Franchises', icon: '🏪', count: 0 },
      { id: 'agriculture', name: 'Agriculture', icon: '🌾', count: 0 },
      { id: 'technology', name: 'Technology', icon: '💻', count: 0 },
      { id: 'manufacturing', name: 'Manufacturing', icon: '🏭', count: 0 },
      { id: 'retail', name: 'Retail', icon: '🛍️', count: 0 },
    ],
    actionButton: 'Express Interest',
  },
  live: {
    id: 'live',
    arabic: 'حياة',
    title: 'LIVE',
    description: 'Housing, Food & Lifestyle Services',
    longDescription: 'Find halal housing, catering services, travel experiences, and lifestyle products that respect Islamic principles.',
    theme: {
      primary: 'var(--color-gold-600)',
      secondary: 'var(--color-gold-700)',
      gradient: 'linear-gradient(135deg, var(--color-gold-500) 0%, var(--color-gold-700) 100%)',
      light: 'var(--color-gold-50)',
    },
    categories: [
      { id: 'housing', name: 'Housing', icon: '🏠', count: 0 },
      { id: 'food', name: 'Halal Food', icon: '🍽️', count: 0 },
      { id: 'travel', name: 'Travel', icon: '✈️', count: 0 },
      { id: 'events', name: 'Events', icon: '🎉', count: 0 },
      { id: 'wellness', name: 'Wellness', icon: '🧘', count: 0 },
      { id: 'fashion', name: 'Modest Fashion', icon: '👔', count: 0 },
      { id: 'beauty', name: 'Beauty', icon: '✨', count: 0 },
      { id: 'automotive', name: 'Automotive', icon: '🚗', count: 0 },
    ],
    actionButton: 'Contact Provider',
  },
  protect: {
    id: 'protect',
    arabic: 'حفظ',
    title: 'PROTECT',
    description: 'Health, Security & Insurance',
    longDescription: 'Access Shariah-compliant insurance, healthcare services, legal assistance, and security solutions for you and your family.',
    theme: {
      primary: 'var(--color-amethyst-600)',
      secondary: 'var(--color-amethyst-700)',
      gradient: 'linear-gradient(135deg, var(--color-amethyst-600) 0%, var(--color-amethyst-700) 100%)',
      light: 'var(--color-amethyst-50)',
    },
    categories: [
      { id: 'takaful', name: 'Takaful Insurance', icon: '🛡️', count: 0 },
      { id: 'health', name: 'Healthcare', icon: '⚕️', count: 0 },
      { id: 'legal', name: 'Legal Services', icon: '⚖️', count: 0 },
      { id: 'security', name: 'Security', icon: '🔒', count: 0 },
      { id: 'accounting', name: 'Accounting', icon: '📊', count: 0 },
      { id: 'consulting', name: 'Business Consulting', icon: '💼', count: 0 },
      { id: 'cyber', name: 'Cybersecurity', icon: '🔐', count: 0 },
      { id: 'emergency', name: 'Emergency Services', icon: '🚨', count: 0 },
    ],
    actionButton: 'Get Protected',
  },
};

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

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
);

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const MoneyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);

const PillarsNav = ({ currentVertical }: { currentVertical: VerticalType }) => {
  const pillars: VerticalType[] = ['earn', 'build', 'live', 'protect'];
  
  return (
    <div className="nav-section">
      <h4 className="nav-section-title">Marketplace</h4>
      <ul className="nav-list">
        {pillars.map((pillar) => (
          <li key={pillar}>
            <Link 
              href={`/marketplace/${pillar}`}
              className={`nav-link ${currentVertical === pillar ? 'active' : ''}`}
            >
              <span className={`nav-icon ${pillar}`}>
                {verticalsConfig[pillar].arabic}
              </span>
              {verticalsConfig[pillar].title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

interface MarketplaceClientProps {
  vertical: string;
}

interface Listing {
  id: string;
  provider: {
    name: string;
    initials: string;
    industry: string;
    trustScore: number;
  };
  title: string;
  description: string;
  location: string;
  price: string;
  tags: string[];
}

export default function MarketplaceClient({ vertical }: MarketplaceClientProps) {
  const { user, isLoaded } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Validate vertical parameter
  const validVertical = verticalsConfig[vertical as VerticalType] 
    ? (vertical as VerticalType) 
    : 'earn';
  
  const config = verticalsConfig[validVertical];

  // Get user initials
  const userInitials = user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : user?.emailAddresses?.[0]?.emailAddress?.[0].toUpperCase() || '?';

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'User';

  // Fetch listings from API
  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch(`/api/marketplace/${validVertical}?category=${selectedCategory}&location=${selectedLocation}&q=${searchQuery}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setListings(data.listings || []);
      } catch {
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchListings();
  }, [validVertical, selectedCategory, selectedLocation, searchQuery]);

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            type="button" 
            className="header-menu-toggle btn btn-ghost"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          
          <Link href="/dashboard" className="header-logo">
            <LogoIcon />
            <span>MuslimEEN</span>
          </Link>
          
          <nav className="header-nav">
            <ul className="nav">
              <li><Link href="/dashboard" className="nav-link">Home</Link></li>
              <li><Link href="/profile" className="nav-link">Profile</Link></li>
              <li><Link href="/connections" className="nav-link">Network</Link></li>
              <li><Link href="/messages" className="nav-link">Messages</Link></li>
            </ul>
          </nav>
          
          <div className="header-actions">
            <button type="button" className="btn btn-ghost" aria-label="Search">
              <SearchIcon />
            </button>
            
            <div className={`dropdown ${isUserDropdownOpen ? 'open' : ''}`}>
              <button 
                type="button" 
                className="btn btn-ghost flex items-center gap-2"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                aria-expanded={isUserDropdownOpen}
                aria-haspopup="true"
              >
                <div className="avatar avatar-sm">{userInitials}</div>
                <span className="hidden md:inline">{userName}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              <div className="dropdown-menu">
                <Link href="/profile" className="dropdown-item">Your Profile</Link>
                <Link href="/verification" className="dropdown-item">Verification Status</Link>
                <Link href="/settings" className="dropdown-item">Settings</Link>
                <div className="dropdown-divider"></div>
                <a href="/" className="dropdown-item">Sign Out</a>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setIsSidebarOpen(false)}
      />
      
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-user">
            <div className="avatar avatar-lg mx-auto">{userInitials}</div>
            <h3 className="text-center mt-3 font-semibold">{userName}</h3>
            <p className="text-center text-sm text-secondary">Member</p>
          </div>
          
          <nav className="sidebar-nav">
            <PillarsNav currentVertical={validVertical} />
          </nav>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main with-sidebar">
        <div className="main-content">
          {/* Pillar Header */}
          <section 
            className="pillar-header"
            style={{ 
              background: config.theme.gradient,
              color: 'white'
            }}
          >
            <div className="pillar-header-content">
              <span className="pillar-arabic-title">{config.arabic}</span>
              <h1>{config.title} Marketplace</h1>
              <p>{config.description}</p>
            </div>
            <div className="pillar-header-pattern pattern-star-8"></div>
          </section>
          
          {/* Search & Filters */}
          <section className="search-filters">
            <div className="search-bar">
              <SearchIcon />
              <input 
                type="text" 
                className="form-input" 
                placeholder={`Search ${config.title.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="filters-row">
              <div className="filter-group">
                <label className="filter-label">Category</label>
                <select 
                  className="form-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {config.categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Location</label>
                <select 
                  className="form-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="">Any Location</option>
                  <option value="london">London</option>
                  <option value="manchester">Manchester</option>
                  <option value="birmingham">Birmingham</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              
              <div className="filter-group">
                <label className="filter-label">Trust Score</label>
                <select className="form-select">
                  <option value="">Any Score</option>
                  <option value="700+">700+ (Excellent)</option>
                  <option value="500-699">500-699 (Good)</option>
                  <option value="200-499">200-499 (Fair)</option>
                </select>
              </div>
            </div>
          </section>
          
          {/* Categories Grid */}
          <section className="categories-section">
            <h2>Browse by Category</h2>
            <div className="categories-grid">
              {config.categories.map((category) => (
                <a 
                  key={category.id}
                  href={`?category=${category.id}`}
                  className="category-card"
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">{category.count} listings</span>
                </a>
              ))}
            </div>
          </section>
          
          {/* Featured Listings */}
          <section className="listings-section">
            <div className="section-header">
              <h2>Featured Opportunities</h2>
              <div className="sort-options">
                <label>Sort by:</label>
                <select className="form-select form-select-sm">
                  <option value="recent">Most Recent</option>
                  <option value="trust">Trust Score</option>
                  <option value="relevant">Most Relevant</option>
                </select>
              </div>
            </div>
            
            {isLoading ? (
              <div className="listings-grid">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="card listing-card skeleton">
                    <div className="card-header">
                      <div className="flex items-center gap-3">
                        <div className="avatar skeleton-avatar">··</div>
                        <div className="flex-1">
                          <div className="skeleton-line" style={{ width: '60%' }} />
                          <div className="skeleton-line" style={{ width: '40%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="skeleton-line" style={{ width: '80%' }} />
                      <div className="skeleton-line" style={{ width: '100%' }} />
                      <div className="skeleton-line" style={{ width: '70%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎯</div>
                <h3>No listings yet</h3>
                <p>Be the first to post an opportunity in the {config.title} marketplace!</p>
                <button className="btn btn-primary">
                  Post {validVertical === 'earn' ? 'Job' : validVertical === 'build' ? 'Opportunity' : 'Listing'}
                </button>
              </div>
            ) : (
              <div className="listings-grid">
                {listings.map((listing) => (
                  <div key={listing.id} className="card listing-card">
                    <div className="card-header">
                      <div className="flex items-center gap-3">
                        <div className="avatar">{listing.provider.initials}</div>
                        <div>
                          <div className="font-semibold">{listing.provider.name}</div>
                          <div className="text-sm text-secondary">{listing.provider.industry}</div>
                        </div>
                        <div className="ml-auto">
                          <span className="badge badge-trust-high">{listing.provider.trustScore} TRUST</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-body">
                      <h4>{listing.title}</h4>
                      <p className="text-secondary mt-2">{listing.description}</p>
                      <div className="listing-meta mt-3">
                        <span className="meta-item">
                          <LocationIcon />
                          {listing.location}
                        </span>
                        <span className="meta-item">
                          <MoneyIcon />
                          {listing.price}
                        </span>
                      </div>
                      <div className="listing-tags mt-3">
                        {listing.tags.map((tag, idx) => (
                          <span key={idx} className="badge badge-verified">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="card-footer">
                      <div className="flex gap-2">
                        <button className="btn btn-primary btn-sm">{config.actionButton}</button>
                        <button className="btn btn-outline btn-sm">Save</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Load More */}
            {listings.length > 0 && (
              <div className="text-center mt-8">
                <button className="btn btn-outline">Load More Opportunities</button>
              </div>
            )}
          </section>
          
          {/* Post Opportunity CTA */}
          <section className="post-cta">
            <div className="cta-content">
              <h2>Have a {validVertical === 'earn' ? 'job' : validVertical === 'build' ? 'venture' : 'service'} to offer?</h2>
              <p>Post your opportunity to reach thousands of verified Muslim professionals</p>
            </div>
            <button className="btn btn-primary btn-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Post Opportunity
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
