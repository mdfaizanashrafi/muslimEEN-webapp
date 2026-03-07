'use client';

import { useState } from 'react';
import { AppLayout } from '../../components/layout';
import { MoreIcon } from '../../components/icons/LayoutIcons';
import { connectionMockData } from '../../data/mocks/connections';
import '../../styles/connections.css';

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
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'suggested'>('connections');

  return (
    <AppLayout activeNav="connections">
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
              {connectionMockData
                .filter((c) => c.type === 'connection')
                .map((connection) => (
                  <ConnectionCard key={connection.initials} {...connection} />
                ))}
            </div>
          </div>
        )}
        
        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <div className="tab-content active">
            <div className="pending-list">
              {connectionMockData
                .filter((c) => c.type === 'pending')
                .map((connection) => (
                  <ConnectionCard key={connection.initials} {...connection} />
                ))}
            </div>
          </div>
        )}
        
        {/* Suggested Tab */}
        {activeTab === 'suggested' && (
          <div className="tab-content active">
            <div className="suggested-list">
              {connectionMockData
                .filter((c) => c.type === 'suggested')
                .map((connection) => (
                  <ConnectionCard key={connection.initials} {...connection} />
                ))}
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
