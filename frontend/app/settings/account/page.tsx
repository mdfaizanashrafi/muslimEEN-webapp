'use client';

import { useState } from 'react';
import '../../../styles/settings.css';

export default function AccountSettingsPage() {
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');

  const handleEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to update email
    console.log('Updating email to:', newEmail);
    setEditingEmail(false);
  };

  const handleDeactivate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to deactivate account
    console.log('Deactivating account with reason:', deactivateReason);
  };

  return (
    <section className="settings-section">
      <h1 className="settings-title">Account</h1>
      
      {/* Email Settings */}
      <div className="settings-card">
        <h2 className="card-title">Email addresses</h2>
        <div className="email-list">
          <div className="email-item">
            <div className="email-info">
              <span className="email-address">test@muslimeen.org</span>
              <span className="email-badge primary">Primary</span>
            </div>
            {!editingEmail ? (
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => setEditingEmail(true)}
              >
                Edit
              </button>
            ) : (
              <form onSubmit={handleEmailUpdate} className="email-edit-form">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="New email address"
                  className="form-input"
                  required
                />
                <button type="submit" className="btn btn-primary btn-sm">Save</button>
                <button 
                  type="button" 
                  className="btn btn-ghost btn-sm"
                  onClick={() => setEditingEmail(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Language & Region */}
      <div className="settings-card">
        <h2 className="card-title">Language and region</h2>
        <div className="form-group">
          <label className="form-label">Language</label>
          <select className="form-select">
            <option value="en">English</option>
            <option value="ar">Arabic</option>
            <option value="ur">Urdu</option>
            <option value="tr">Turkish</option>
            <option value="ms">Malay</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Time zone</label>
          <select className="form-select">
            <option value="UTC">UTC (Coordinated Universal Time)</option>
            <option value="EST">Eastern Standard Time</option>
            <option value="CST">Central Standard Time</option>
            <option value="MST">Mountain Standard Time</option>
            <option value="PST">Pacific Standard Time</option>
            <option value="GMT">Greenwich Mean Time</option>
            <option value="CET">Central European Time</option>
            <option value="IST">India Standard Time</option>
          </select>
        </div>
      </div>

      {/* Deactivate Account */}
      <div className="settings-card danger-zone">
        <h2 className="card-title text-red-600">Deactivate account</h2>
        <p className="card-description">
          Temporarily deactivate your account. Your profile will be hidden, but you can reactivate anytime by logging in.
        </p>
        {!deactivating ? (
          <button 
            className="btn-outline-danger"
            onClick={() => setDeactivating(true)}
          >
            Deactivate account
          </button>
        ) : (
          <form onSubmit={handleDeactivate} className="deactivate-form">
            <div className="form-group">
              <label className="form-label">Why are you deactivating?</label>
              <select 
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select a reason</option>
                <option value="not_useful">Not finding it useful</option>
                <option value="too_many_emails">Too many emails</option>
                <option value="privacy">Privacy concerns</option>
                <option value="time">Taking a break</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-outline-danger">Confirm deactivation</button>
              <button 
                type="button" 
                className="btn btn-ghost"
                onClick={() => setDeactivating(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
