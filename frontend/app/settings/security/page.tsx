'use client';

import { useState } from 'react';
import '../../../styles/settings.css';

export default function SecuritySettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to change password
    console.log('Changing password...');
  };

  return (
    <section className="settings-section">
      <h1 className="settings-title">Sign in & security</h1>
      
      {/* Change Password */}
      <div className="settings-card">
        <h2 className="card-title">Change password</h2>
        <form onSubmit={handlePasswordChange} className="password-form">
          <div className="form-group">
            <label className="form-label">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="form-input"
              placeholder="Enter current password"
            />
          </div>
          <div className="form-group">
            <label className="form-label">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-input"
              placeholder="Enter new password"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              placeholder="Confirm new password"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Change password
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication */}
      <div className="settings-card">
        <h2 className="card-title">Two-step verification</h2>
        <p className="card-description">
          Add an extra layer of security to your account by requiring a code in addition to your password.
        </p>
        <div className="security-option">
          <div className="option-info">
            <span className="option-label">Authenticator app</span>
            <span className="option-status">Not set up</span>
          </div>
          <button className="btn btn-outline btn-sm">Set up</button>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="settings-card">
        <h2 className="card-title">Where you&apos;re signed in</h2>
        <div className="sessions-list">
          <div className="session-item current">
            <div className="session-info">
              <span className="session-device">Windows - Chrome</span>
              <span className="session-location">London, UK</span>
              <span className="session-status">Current session</span>
            </div>
          </div>
        </div>
        <button className="btn btn-outline btn-sm mt-4">
          Sign out of all sessions
        </button>
      </div>
    </section>
  );
}
