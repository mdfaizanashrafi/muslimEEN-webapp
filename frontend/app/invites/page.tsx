'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { invites } from '@/lib/api';
import type { Invite } from '@/lib/api';
import '@/styles/invites.css';

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

export default function InvitesPage() {
  const [userInvites, setUserInvites] = useState<Invite[]>([]);
  const [quota, setQuota] = useState({ used: 0, remaining: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState('');

  // Fetch invites data
  useEffect(() => {
    fetchInvitesData();
  }, []);

  const fetchInvitesData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [invitesResponse, quotaResponse] = await Promise.all([
        invites.getUserInvites(),
        invites.getQuota(),
      ]);
      
      setUserInvites(invitesResponse.invites);
      setQuota(quotaResponse.quota);
    } catch (err) {
      console.error('Failed to fetch invites:', err);
      setError('Failed to load invites. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create new invite
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quota.remaining <= 0) {
      alert('You have no remaining invites.');
      return;
    }
    
    setIsCreating(true);
    try {
      const response = await invites.createInvite(newInviteEmail || undefined);
      
      // Refresh the list
      await fetchInvitesData();
      
      // Close modal and reset
      setShowCreateModal(false);
      setNewInviteEmail('');
      
      // Show the new invite code
      alert(`Invite created successfully! Code: ${response.invite.code}`);
    } catch (err) {
      console.error('Failed to create invite:', err);
      alert('Failed to create invite. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  // Revoke invite
  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) {
      return;
    }
    
    try {
      await invites.revokeInvite(inviteId);
      await fetchInvitesData();
    } catch (err) {
      console.error('Failed to revoke invite:', err);
      alert('Failed to revoke invite. Please try again.');
    }
  };

  // Copy invite code
  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Share invite
  const handleShare = (code: string) => {
    const text = `Join me on MuslimEEN - the Muslim Economic Empowerment Network! Use my invite code: ${code}\n\nhttps://muslimeen.space/login`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join MuslimEEN',
        text: text,
        url: 'https://muslimeen.space/login',
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Invite link copied to clipboard!');
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <AppLayout activeNav="invites">
        <div className="invites-loading">
          <div className="loading-spinner"></div>
          <p>Loading your invites...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="invites">
      <div className="invites-container">
        {/* Header Section */}
        <section className="invites-header">
          <h1>Manage Invites</h1>
          <p className="text-secondary">Invite trusted friends and colleagues to join MuslimEEN</p>
        </section>

        {error && (
          <div className="alert alert-warning mb-4">
            {error}
          </div>
        )}

        {/* Quota Stats */}
        <section className="quota-section">
          <div className="quota-cards">
            <div className="quota-card total">
              <span className="quota-value">{quota.total}</span>
              <span className="quota-label">Total Invites</span>
            </div>
            <div className="quota-card used">
              <span className="quota-value">{quota.used}</span>
              <span className="quota-label">Used</span>
            </div>
            <div className="quota-card remaining">
              <span className="quota-value">{quota.remaining}</span>
              <span className="quota-label">Remaining</span>
            </div>
          </div>
          
          <div className="quota-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${quota.total > 0 ? (quota.used / quota.total) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="quota-hint">
              {quota.remaining > 0 
                ? `You have ${quota.remaining} invites remaining this month`
                : 'You have used all your invites. Complete verifications to earn more.'}
            </p>
          </div>
        </section>

        {/* Create Invite Button */}
        <section className="create-invite-section">
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => setShowCreateModal(true)}
            disabled={quota.remaining <= 0}
          >
            <PlusIcon />
            Create New Invite
          </button>
        </section>

        {/* Invites List */}
        <section className="invites-list-section">
          <h2>Your Invite Codes</h2>
          
          {userInvites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎟️</div>
              <h3>No Active Invites</h3>
              <p className="text-secondary">
                You haven&apos;t created any invite codes yet.
              </p>
              <p className="text-tertiary text-sm mt-2">
                Create your first invite to bring friends into the network.
              </p>
            </div>
          ) : (
            <div className="invites-table-wrapper">
              <table className="invites-table">
                <thead>
                  <tr>
                    <th>Invite Code</th>
                    <th>Email (Optional)</th>
                    <th>Uses</th>
                    <th>Created</th>
                    <th>Expires</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userInvites.map((invite) => (
                    <tr key={invite.id} className={!invite.isActive ? 'revoked' : ''}>
                      <td>
                        <code className="invite-code">{invite.code}</code>
                      </td>
                      <td>{invite.email || '-'}</td>
                      <td>
                        <span className={`uses-badge ${invite.usedCount >= invite.maxUses ? 'full' : ''}`}>
                          {invite.usedCount} / {invite.maxUses}
                        </span>
                      </td>
                      <td>{formatDate(invite.createdAt)}</td>
                      <td>
                        {invite.expiresAt 
                          ? formatDate(invite.expiresAt)
                          : 'Never'
                        }
                      </td>
                      <td>
                        <div className="action-buttons">
                          {invite.isActive && invite.usedCount < invite.maxUses && (
                            <>
                              <button 
                                className={`btn btn-sm ${copiedId === invite.id ? 'btn-success' : 'btn-outline'}`}
                                onClick={() => handleCopyCode(invite.code, invite.id)}
                                title="Copy code"
                              >
                                <CopyIcon />
                                {copiedId === invite.id ? 'Copied!' : 'Copy'}
                              </button>
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => handleShare(invite.code)}
                                title="Share invite"
                              >
                                <ShareIcon />
                                Share
                              </button>
                              <button 
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleRevokeInvite(invite.id)}
                                title="Revoke invite"
                              >
                                <TrashIcon />
                              </button>
                            </>
                          )}
                          {!invite.isActive && (
                            <span className="badge badge-secondary">Revoked</span>
                          )}
                          {invite.isActive && invite.usedCount >= invite.maxUses && (
                            <span className="badge badge-success">Fully Used</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="how-it-works">
          <h2>How Invites Work</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create an Invite</h3>
              <p>Generate a unique invite code for someone you trust.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Share Securely</h3>
              <p>Send the code via WhatsApp, email, or in person.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>They Join</h3>
              <p>Your friend uses the code during registration.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Network Grows</h3>
              <p>Your trust score increases with successful invites.</p>
            </div>
          </div>
        </section>

        {/* Guidelines */}
        <section className="guidelines">
          <h2>Invitation Guidelines</h2>
          <ul className="guidelines-list">
            <li>✓ Only invite people you know and trust personally</li>
            <li>✓ Ensure they understand the platform&apos;s values and commitments</li>
            <li>✓ Your trust score is affected by who you invite</li>
            <li>✓ Invites are tracked to maintain network quality</li>
            <li>✗ Do not sell or trade invite codes</li>
            <li>✗ Do not post codes publicly on social media</li>
          </ul>
        </section>
      </div>

      {/* Create Invite Modal */}
      {showCreateModal && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Create New Invite</h2>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setShowCreateModal(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateInvite}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">
                    Friend&apos;s Email (Optional)
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="friend@example.com"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                  />
                  <p className="form-hint">
                    Adding an email reserves this invite for that specific person.
                  </p>
                </div>
                
                <div className="invite-preview">
                  <h4>What happens next?</h4>
                  <ul>
                    <li>An invite code will be generated</li>
                    <li>You can copy and share it securely</li>
                    <li>Your remaining invites will decrease by 1</li>
                  </ul>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
