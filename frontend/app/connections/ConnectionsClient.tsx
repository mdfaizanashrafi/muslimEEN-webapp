'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { MoreIcon } from '@/components/icons/ConnectionIcons';
import { connections as connectionsApi } from '@/lib/api';
import type { Connection, PendingConnection } from '@/lib/api';
import '@/styles/connections.css';

interface ConnectionCardProps {
  id: string;
  initials: string;
  name: string;
  title?: string;
  badges?: string[];
  trustScore: number;
  type: 'connection' | 'pending' | 'suggested';
  meta?: string;
  sentTime?: string;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onConnect?: (id: string) => void;
  onMessage?: (id: string) => void;
}

const ConnectionCard = ({ 
  id, 
  initials, 
  name, 
  title, 
  badges, 
  trustScore, 
  type, 
  meta, 
  sentTime,
  onAccept,
  onReject,
  onConnect,
  onMessage
}: ConnectionCardProps) => {
  const trustLevel = trustScore >= 800 ? 'high' : trustScore >= 600 ? 'medium' : 'low';
  
  return (
    <div className={`connection-card ${type}`}>
      <div className="avatar avatar-lg">{initials}</div>
      <div className="connection-info">
        <h4>{name}</h4>
        <p className="text-secondary">{title || 'MuslimEEN Member'}</p>
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
            <div className="trust-fill-mini" style={{ width: `${Math.min(trustScore / 10, 100)}%` }}></div>
          </div>
        </div>
      </div>
      <div className="connection-actions">
        {type === 'connection' && (
          <>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => onMessage?.(id)}
            >
              Message
            </button>
            <button className="btn btn-ghost btn-sm" aria-label="More options">
              <MoreIcon />
            </button>
          </>
        )}
        {type === 'pending' && (
          <>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => onAccept?.(id)}
            >
              Accept
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => onReject?.(id)}
            >
              Decline
            </button>
          </>
        )}
        {type === 'suggested' && (
          <>
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => onConnect?.(id)}
            >
              Connect
            </button>
            <button className="btn btn-ghost btn-sm">Remove</button>
          </>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  value: string | number;
  label: string;
}

const StatCard = ({ value, label }: StatCardProps) => (
  <div className="stat-card">
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
);

// Helper function to get initials from name
const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

export default function ConnectionsClient() {
  const [activeTab, setActiveTab] = useState<'connections' | 'pending' | 'suggested'>('connections');
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch connections data
  useEffect(() => {
    const fetchConnectionsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch accepted connections
        const connectionsResponse = await connectionsApi.getConnections();
        setConnections(connectionsResponse);
        
        // Fetch pending requests
        const pendingResponse = await connectionsApi.getPendingRequests();
        setPendingRequests(pendingResponse);
      } catch (err) {
        console.error('Failed to fetch connections:', err);
        setError('Failed to load connections. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnectionsData();
  }, []);

  // Handle accept connection
  const handleAccept = async (connectionId: string) => {
    try {
      await connectionsApi.acceptRequest(connectionId);
      // Refresh data after accepting
      const connectionsResponse = await connectionsApi.getConnections();
      setConnections(connectionsResponse);
      const pendingResponse = await connectionsApi.getPendingRequests();
      setPendingRequests(pendingResponse);
    } catch (err) {
      console.error('Failed to accept connection:', err);
      alert('Failed to accept connection. Please try again.');
    }
  };

  // Handle reject connection
  const handleReject = async (connectionId: string) => {
    try {
      await connectionsApi.rejectRequest(connectionId);
      // Refresh pending list
      const pendingResponse = await connectionsApi.getPendingRequests();
      setPendingRequests(pendingResponse);
    } catch (err) {
      console.error('Failed to reject connection:', err);
      alert('Failed to reject connection. Please try again.');
    }
  };

  // Handle send connection request
  const handleConnect = async (userId: string) => {
    try {
      await connectionsApi.sendRequest(userId);
      alert('Connection request sent!');
    } catch (err) {
      console.error('Failed to send connection request:', err);
      alert('Failed to send connection request. Please try again.');
    }
  };

  // Handle message
  const handleMessage = (userId: string) => {
    // Navigate to messages page with user selected
    window.location.href = `/messages?user=${userId}`;
  };

  const tabLabels: Record<string, string> = {
    connections: `Connections (${connections.length})`,
    pending: `Pending (${pendingRequests.length})`,
    suggested: 'Suggested',
  };

  if (isLoading) {
    return (
      <AppLayout activeNav="connections">
        <div className="connections-loading">
          <div className="loading-spinner"></div>
          <p>Loading your network...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="connections">
      {/* Network Stats */}
      <section className="network-stats" aria-labelledby="network-stats-heading">
        <h2 id="network-stats-heading" className="visually-hidden">Network Statistics</h2>
        <div className="stats-row">
          <StatCard value={connections.length} label="Connections" />
          <StatCard value={pendingRequests.length} label="Pending" />
          <StatCard value="0" label="2nd Degree" />
          <StatCard value="0" label="Endorsements" />
        </div>
      </section>
      
      {error && (
        <div className="alert alert-warning mb-4">
          {error}
        </div>
      )}
      
      {/* Tabs */}
      <section className="network-tabs">
        <div className="tabs" role="tablist" aria-label="Connection categories">
          {(['connections', 'pending', 'suggested'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls={`${tab}-panel`}
              id={`${tab}-tab`}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
        
        {/* Connections Tab */}
        <div 
          id="connections-panel" 
          role="tabpanel" 
          aria-labelledby="connections-tab"
          className={`tab-content ${activeTab === 'connections' ? 'active' : ''}`}
        >
          <div className="search-filter-bar">
            <label htmlFor="search-connections" className="visually-hidden">Search connections</label>
            <input 
              id="search-connections"
              type="text" 
              className="form-input" 
              placeholder="Search connections..." 
            />
            <label htmlFor="filter-industry" className="visually-hidden">Filter by industry</label>
            <select id="filter-industry" className="form-select">
              <option value="">All Industries</option>
              <option value="tech">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
              <option value="education">Education</option>
            </select>
          </div>
          
          <div className="connections-list">
            {connections.length === 0 ? (
              <div className="empty-state">
                <p className="text-secondary">No connections yet.</p>
                <p className="text-sm text-tertiary mt-2">
                  Start building your network by connecting with other members.
                </p>
                <button 
                  className="btn btn-primary mt-4"
                  onClick={() => setActiveTab('suggested')}
                >
                  Find People to Connect
                </button>
              </div>
            ) : (
              connections.map((connection) => (
                <ConnectionCard 
                  key={connection.id}
                  id={connection.userId}
                  initials={getInitials(connection.firstName, connection.lastName)}
                  name={connection.fullName}
                  title={connection.industry}
                  trustScore={connection.trustScore}
                  type="connection"
                  badges={connection.verificationTier !== 'basic' ? [connection.verificationTier] : undefined}
                  meta={`Connected ${formatDate(connection.connectedAt)}`}
                  onMessage={handleMessage}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Pending Tab */}
        <div 
          id="pending-panel" 
          role="tabpanel" 
          aria-labelledby="pending-tab"
          className={`tab-content ${activeTab === 'pending' ? 'active' : ''}`}
        >
          <div className="pending-list">
            {pendingRequests.length === 0 ? (
              <div className="empty-state">
                <p className="text-secondary">No pending requests.</p>
                <p className="text-sm text-tertiary mt-2">
                  When someone sends you a connection request, it will appear here.
                </p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <ConnectionCard 
                  key={request.id}
                  id={request.id}
                  initials={getInitials(request.firstName, request.lastName)}
                  name={request.fullName}
                  trustScore={request.trustScore}
                  type="pending"
                  sentTime={`Sent ${formatDate(request.requestedAt)}`}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))
            )}
          </div>
        </div>
        
        {/* Suggested Tab */}
        <div 
          id="suggested-panel" 
          role="tabpanel" 
          aria-labelledby="suggested-tab"
          className={`tab-content ${activeTab === 'suggested' ? 'active' : ''}`}
        >
          <div className="suggested-list">
            <div className="empty-state">
              <p className="text-secondary">Suggested connections coming soon.</p>
              <p className="text-sm text-tertiary mt-2">
                We&apos;re working on personalized suggestions based on your profile and interests.
              </p>
              <p className="text-sm text-tertiary mt-4">
                In the meantime, you can invite friends directly using your invite codes.
              </p>
              <Link href="/invites" className="btn btn-primary mt-4">
                Manage Invites
              </Link>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
