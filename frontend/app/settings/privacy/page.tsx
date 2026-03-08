'use client';

import { useState } from 'react';
import '../../../styles/settings.css';

export default function PrivacySettingsPage() {
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [allowMessages, setAllowMessages] = useState('connections');
  const [dataSharing, setDataSharing] = useState(false);

  return (
    <section className="settings-section">
      <h1 className="settings-title">Privacy</h1>
      
      {/* Profile Visibility */}
      <div className="settings-card">
        <h2 className="card-title">Profile visibility</h2>
        <div className="form-group">
          <label className="form-label">Who can see your profile</label>
          <select 
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value)}
            className="form-select"
          >
            <option value="public">All MuslimEEN members</option>
            <option value="connections">Your connections only</option>
            <option value="verified">Verified members only</option>
            <option value="private">Nobody</option>
          </select>
        </div>
      </div>

      {/* Contact Info Visibility */}
      <div className="settings-card">
        <h2 className="card-title">Contact information</h2>
        <div className="privacy-options">
          <label className="privacy-option">
            <input 
              type="checkbox"
              checked={showEmail}
              onChange={(e) => setShowEmail(e.target.checked)}
            />
            <span>Show email on profile</span>
          </label>
          <label className="privacy-option">
            <input 
              type="checkbox"
              checked={showPhone}
              onChange={(e) => setShowPhone(e.target.checked)}
            />
            <span>Show phone number on profile</span>
          </label>
        </div>
      </div>

      {/* Messaging */}
      <div className="settings-card">
        <h2 className="card-title">Messaging preferences</h2>
        <div className="form-group">
          <label className="form-label">Who can message you</label>
          <select 
            value={allowMessages}
            onChange={(e) => setAllowMessages(e.target.value)}
            className="form-select"
          >
            <option value="all">All MuslimEEN members</option>
            <option value="connections">Connections only</option>
            <option value="none">Nobody</option>
          </select>
        </div>
      </div>

      {/* Data Sharing */}
      <div className="settings-card">
        <h2 className="card-title">Data and personalization</h2>
        <label className="privacy-option">
          <input 
            type="checkbox"
            checked={dataSharing}
            onChange={(e) => setDataSharing(e.target.checked)}
          />
          <div>
            <span>Allow data sharing for platform improvements</span>
            <p className="option-description">
              Anonymous usage data helps us improve MuslimEEN features and user experience.
            </p>
          </div>
        </label>
      </div>

      {/* Download Data */}
      <div className="settings-card">
        <h2 className="card-title">Download your data</h2>
        <p className="card-description">
          Request a copy of your personal data. We&apos;ll send you a link to download your information.
        </p>
        <button className="btn btn-outline">
          Request data export
        </button>
      </div>
    </section>
  );
}
