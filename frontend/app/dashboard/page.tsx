'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { useAuth } from '@/lib/auth-context';
import { trustScore, connections, invites } from '@/lib/api';
import '@/styles/dashboard.css';

// Pillar card data (static content)
const pillarCards = [
  {
    href: '/marketplace/earn',
    arabic: 'اكسب',
    title: 'EARN',
    description: 'Halal income opportunities, freelance work, and career advancement for Muslims',
    stats: '1,234 opportunities',
    variant: 'earn' as const,
  },
  {
    href: '/marketplace/build',
    arabic: 'ابنِ',
    title: 'BUILD',
    description: 'Investment opportunities, business partnerships, and wealth building the halal way',
    stats: '567 projects',
    variant: 'build' as const,
  },
  {
    href: '/marketplace/live',
    arabic: 'عش',
    title: 'LIVE',
    description: 'Halal housing, ethical services, and lifestyle products for Muslim families',
    stats: '890 listings',
    variant: 'live' as const,
  },
  {
    href: '/marketplace/protect',
    arabic: 'احمِ',
    title: 'PROTECT',
    description: 'Shariah-compliant insurance, estate planning, and asset protection',
    stats: '123 providers',
    variant: 'protect' as const,
  },
];

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
  const { user, profile, isLoading: authLoading } = useAuth();
  const [trustData, setTrustData] = useState<{ score: number; factors: Array<{ name: string; score: number; weight: number }> } | null>(null);
  const [connectionCount, setConnectionCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [inviteQuota, setInviteQuota] = useState({ used: 0, remaining: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch trust score
        const trustResponse = await trustScore.getCurrentScore();
        setTrustData({ score: trustResponse.score, factors: trustResponse.factors });
        
        // Fetch connections count
        const connectionsResponse = await connections.getConnections();
        setConnectionCount(connectionsResponse.length);
        
        // Fetch pending requests count
        const pendingResponse = await connections.getPendingRequests();
        setPendingCount(pendingResponse.length);
        
        // Fetch invite quota
        const quotaResponse = await invites.getQuota();
        setInviteQuota(quotaResponse.quota);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load some dashboard data. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  // Get user's first name
  const firstName = user?.firstName || profile?.firstName || 'Guest';
  
  // Get trust score (from API or fallback to user data)
  const currentTrustScore = trustData?.score || user?.trustScore || 0;
  
  // Determine trust score class
  const getTrustScoreClass = (score: number) => {
    if (score >= 700) return 'high';
    if (score >= 300) return 'medium';
    return 'low';
  };
  
  const trustClass = getTrustScoreClass(currentTrustScore);
  const verificationStatus = user?.verificationTier || 'basic';

  if (authLoading || isLoading) {
    return (
      <AppLayout activeNav="dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="dashboard">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <h1>As-salamu alaykum, {firstName}</h1>
          <p className="welcome-subtitle">
            Your trust score: <span className={`trust-highlight trust-${trustClass}`}>{currentTrustScore}</span>
            {' • '}
            <span className="verification-status">
              {verificationStatus === 'basic' && 'Provisional Member'}
              {verificationStatus === 'verified' && 'Verified Member'}
              {verificationStatus === 'business' && 'Business Member'}
              {verificationStatus === 'institutional' && 'Institutional Member'}
            </span>
          </p>
        </div>
        <div className="welcome-actions">
          <Link href="/profile" className="btn btn-primary">Complete Profile</Link>
        </div>
      </section>
      
      {error && (
        <div className="alert alert-warning mb-4">
          {error}
        </div>
      )}
      
      {/* Four Pillars Grid */}
      <section className="pillars-section">
        <h2 className="section-title">
          <span className="arabic-text">الأركان الأربعة</span>
          <span>Four Pillars of Economic Empowerment</span>
        </h2>
        
        <div className="pillars-grid">
          {pillarCards.map((card) => (
            <PillarCard key={card.variant} {...card} />
          ))}
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
              <p className="text-sm text-tertiary mt-2">
                Connect with other members to see activity here
              </p>
            </div>
          </div>
        </section>
        
        {/* Sidebar Widgets */}
        <aside className="dashboard-sidebar">
          {/* Trust Score Widget */}
          <Widget title="Trust Score" action={{ href: '/verification', label: 'Details' }}>
            <div className="trust-score-container">
              <div className="trust-score-header">
                <span className={`trust-score-value ${trustClass}`}>{currentTrustScore}</span>
                <span className="text-sm text-secondary">/1000</span>
              </div>
              <div className="trust-score-bar">
                <div className={`trust-score-fill ${trustClass}`} style={{ width: `${Math.min(currentTrustScore / 10, 100)}%` }}></div>
              </div>
              <p className="text-sm text-secondary mt-2">
                {currentTrustScore < 300 && 'Complete your profile to increase your score'}
                {currentTrustScore >= 300 && currentTrustScore < 700 && 'Good standing - verify to unlock more features'}
                {currentTrustScore >= 700 && 'Excellent trust score!'}
              </p>
            </div>
          </Widget>
          
          {/* Network Stats */}
          <Widget title="Your Network" action={{ href: '/connections', label: 'Manage' }}>
            <div className="stats-grid">
              <StatItem value={connectionCount} label="Connections" />
              <StatItem value={0} label="Endorsements" />
              <StatItem value={0} label="Profile Views" />
              <StatItem value={pendingCount} label="Pending" />
            </div>
          </Widget>
          
          {/* Invites Widget */}
          <Widget title="Your Invites" action={{ href: '/invites', label: 'Manage' }}>
            <div className="trust-score-container">
              <div className="trust-score-header">
                <span className="trust-score-value high">{inviteQuota.remaining}</span>
                <span className="text-sm text-secondary">remaining</span>
              </div>
              <div className="trust-score-bar">
                <div 
                  className="trust-score-fill high" 
                  style={{ width: `${inviteQuota.total > 0 ? (inviteQuota.remaining / inviteQuota.total) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-sm text-secondary mt-2">
                {inviteQuota.remaining > 0 
                  ? `You have ${inviteQuota.remaining} invites to share with friends`
                  : 'No invites remaining. Complete verifications to earn more.'}
              </p>
              {inviteQuota.remaining > 0 && (
                <Link href="/invites" className="btn btn-primary btn-sm mt-3" style={{ width: '100%' }}>
                  Invite Friends
                </Link>
              )}
            </div>
          </Widget>
          
          {/* Islamic Finance Quick Links */}
          <Widget title="Islamic Finance">
            <div className="quick-links">
              <QuickLink href="/islamic-finance?tool=zakat" icon="🧮" text="Zakat Calculator" />
              <QuickLink href="/islamic-finance?tool=sadaqah" icon="❤️" text="Sadaqah Campaigns" />
              <QuickLink href="/islamic-finance?tool=qard" icon="🤝" text="Qard Hasan" />
              <QuickLink href="/islamic-finance?tool=waqf" icon="🕌" text="Waqf" />
            </div>
          </Widget>
        </aside>
      </div>
    </AppLayout>
  );
}
