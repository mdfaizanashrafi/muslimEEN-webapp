/**
 * Invites Widget
 * 
 * Dashboard component for managing invite codes.
 * Shows remaining invites and allows users to generate new invite links.
 */

'use client';

import { useState, useEffect } from 'react';
import { invites as invitesApi } from '@/lib/api';
import './InvitesWidget.css';

// Local interface matching the actual API response
interface Invite {
  id: string;
  token: string;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  expiresAt: string;
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
}

interface InviteQuota {
  remaining: number;
  used: number;
  total: number;
  isUnlimited: boolean;
}

interface NewInvite {
  id: string;
  token: string;
  inviteLink: string;
  expiresAt: string;
}

export default function InvitesWidget() {
  const [quota, setQuota] = useState<InviteQuota | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newInvite, setNewInvite] = useState<NewInvite | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Fetch invites and quota on mount
  useEffect(() => {
    fetchInvitesData();
  }, []);

  const fetchInvitesData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Fetch quota and invites in parallel
      const [quotaRes, invitesRes] = await Promise.all([
        invitesApi.getQuota(),
        invitesApi.getUserInvites(),
      ]);
      
      setQuota({
        remaining: quotaRes.quota.remaining,
        used: quotaRes.quota.used,
        total: quotaRes.quota.total,
        isUnlimited: quotaRes.quota.remaining === -1, // -1 indicates unlimited
      });
      // Map API response to local interface
      const mappedInvites: Invite[] = invitesRes.invites.map((i: any) => ({
        id: i.id,
        token: i.token || i.code || '',
        status: i.status || 'pending',
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
        usedBy: i.usedBy,
        usedAt: i.usedAt,
      }));
      setInvites(mappedInvites);
    } catch (err: any) {
      setError(err.message || 'Failed to load invites');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!quota?.isUnlimited && quota?.remaining === 0) {
      setError('You have no invites remaining');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      
      const response = await invitesApi.createInvite();
      const invite: NewInvite = {
        id: response.invite.id,
        token: response.invite.code || '',
        inviteLink: `${window.location.origin}/invite?code=${response.invite.code}`,
        expiresAt: response.invite.expiresAt || '',
      };
      
      setNewInvite(invite);
      
      // Refresh data
      await fetchInvitesData();
    } catch (err: any) {
      const message = err.message || 'Failed to create invite';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (token: string, id: string) => {
    const inviteLink = `${window.location.origin}/invite?code=${token}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback: show the link
      alert(`Copy this link: ${inviteLink}`);
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) {
      return;
    }

    try {
      await invitesApi.revokeInvite(inviteId);
      
      // Refresh data
      await fetchInvitesData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke invite');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (expiresAt: string) => {
    if (!expiresAt) return 'N/A';
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days` : 'Expired';
  };

  if (isLoading) {
    return (
      <div className="invites-widget loading">
        <div className="widget-spinner"></div>
        <p>Loading invites...</p>
      </div>
    );
  }

  return (
    <div className="invites-widget">
      {/* Header */}
      <div className="widget-header">
        <h3>Your Invites</h3>
        {quota && (
          <div className="quota-badge">
            {quota.isUnlimited ? (
              <span className="unlimited">Unlimited</span>
            ) : (
              <span className="remaining">{quota.remaining} remaining</span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      {quota && !quota.isUnlimited && (
        <div className="quota-stats">
          <div className="stat-bar">
            <div 
              className="stat-fill"
              style={{ 
                width: `${quota.total > 0 ? (quota.used / quota.total) * 100 : 0}%` 
              }}
            />
          </div>
          <p className="stat-text">
            {quota.used} used • {quota.remaining} remaining
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="widget-error">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Newly Created Invite */}
      {newInvite && (
        <div className="new-invite-banner">
          <div className="banner-header">
            <span className="banner-icon">🎉</span>
            <span>Invite Created!</span>
          </div>
          <div className="invite-link-box">
            <code>{newInvite.inviteLink}</code>
            <button 
              onClick={() => handleCopyLink(newInvite.token, newInvite.id)}
              className="btn btn-sm btn-primary"
            >
              {copiedId === newInvite.id ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="banner-hint">
            Share this link with someone you trust. It expires in 7 days.
          </p>
          <button 
            onClick={() => setNewInvite(null)}
            className="btn-close"
          >
            ×
          </button>
        </div>
      )}

      {/* Create Button */}
      <button
        onClick={handleCreateInvite}
        disabled={isCreating || (!quota?.isUnlimited && quota?.remaining === 0)}
        className="btn btn-primary btn-full create-invite-btn"
      >
        {isCreating ? (
          <>
            <span className="spinner"></span>
            Creating...
          </>
        ) : (
          <>
            <span className="btn-icon">+</span>
            Generate Invite Link
          </>
        )}
      </button>

      {/* Empty State */}
      {invites.length === 0 && (
        <div className="empty-invites">
          <div className="empty-icon">🎁</div>
          <p>No invites yet</p>
          <p className="empty-hint">
            Generate your first invite to bring someone into the community.
          </p>
        </div>
      )}

      {/* Invites List */}
      {invites.length > 0 && (
        <div className="invites-list">
          <h4>Your Invite Links</h4>
          
          {invites.map((invite) => (
            <div 
              key={invite.id} 
              className={`invite-item ${invite.status}`}
            >
              <div className="invite-info">
                <div className="invite-code">
                  <code>{invite.token.slice(0, 16)}...</code>
                  <span className={`status-badge ${invite.status}`}>
                    {invite.status}
                  </span>
                </div>
                <div className="invite-meta">
                  {invite.status === 'pending' && (
                    <span>Expires in {getDaysRemaining(invite.expiresAt)}</span>
                  )}
                  {invite.status === 'used' && invite.usedAt && (
                    <span>Used on {formatDate(invite.usedAt)}</span>
                  )}
                  {invite.status === 'expired' && (
                    <span>Expired on {formatDate(invite.expiresAt)}</span>
                  )}
                  {invite.status === 'revoked' && (
                    <span>Revoked</span>
                  )}
                  <span>•</span>
                  <span>Created {formatDate(invite.createdAt)}</span>
                </div>
              </div>
              
              <div className="invite-actions">
                {invite.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleCopyLink(invite.token, invite.id)}
                      className="btn btn-sm btn-outline"
                      title="Copy invite link"
                    >
                      {copiedId === invite.id ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleRevokeInvite(invite.id)}
                      className="btn btn-sm btn-ghost text-danger"
                      title="Revoke invite"
                    >
                      Revoke
                    </button>
                  </>
                )}
                {invite.status === 'used' && (
                  <span className="used-check">✓ Used</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Hint */}
      <div className="widget-footer">
        <p>💡 <strong>Tip:</strong> Only invite people you trust. Your invites reflect on your reputation.</p>
      </div>
    </div>
  );
}
