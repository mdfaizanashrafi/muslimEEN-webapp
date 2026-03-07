'use client';

import Link from 'next/link';
import { AppLayout } from '../../components/layout';
import { pillarCards, suggestedConnections } from '../../data/mocks/dashboard';
import '../../styles/dashboard.css';

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
  return (
    <AppLayout activeNav="dashboard">
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
              {suggestedConnections.map((connection) => (
                <SuggestedConnection key={connection.initials} {...connection} />
              ))}
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
    </AppLayout>
  );
}
