'use client';

import { useState } from 'react';
import '../../../styles/settings.css';

export default function NotificationsSettingsPage() {
  const [emailSettings, setEmailSettings] = useState({
    connectionRequests: true,
    messages: true,
    mentions: true,
    marketplaceUpdates: true,
    weeklyDigest: true,
    platformAnnouncements: false,
  });

  const [pushSettings, setPushSettings] = useState({
    messages: true,
    connectionRequests: true,
    endorsements: false,
    trustScoreUpdates: true,
  });

  const toggleEmailSetting = (key: keyof typeof emailSettings) => {
    setEmailSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePushSetting = (key: keyof typeof pushSettings) => {
    setPushSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="settings-section">
      <h1 className="settings-title">Notifications</h1>
      
      {/* Email Notifications */}
      <div className="settings-card">
        <h2 className="card-title">Email notifications</h2>
        <div className="notification-options">
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={emailSettings.connectionRequests}
              onChange={() => toggleEmailSetting('connectionRequests')}
            />
            <div>
              <span>Connection requests</span>
              <p className="option-description">When someone sends you a connection request</p>
            </div>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={emailSettings.messages}
              onChange={() => toggleEmailSetting('messages')}
            />
            <div>
              <span>Direct messages</span>
              <p className="option-description">When you receive a new message</p>
            </div>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={emailSettings.mentions}
              onChange={() => toggleEmailSetting('mentions')}
            />
            <div>
              <span>Mentions</span>
              <p className="option-description">When someone mentions you in a post or comment</p>
            </div>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={emailSettings.marketplaceUpdates}
              onChange={() => toggleEmailSetting('marketplaceUpdates')}
            />
            <div>
              <span>Marketplace updates</span>
              <p className="option-description">Updates about your listings and inquiries</p>
            </div>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={emailSettings.weeklyDigest}
              onChange={() => toggleEmailSetting('weeklyDigest')}
            />
            <div>
              <span>Weekly digest</span>
              <p className="option-description">Summary of activity from your network</p>
            </div>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={emailSettings.platformAnnouncements}
              onChange={() => toggleEmailSetting('platformAnnouncements')}
            />
            <div>
              <span>Platform announcements</span>
              <p className="option-description">News and updates from MuslimEEN</p>
            </div>
          </label>
        </div>
      </div>

      {/* Push Notifications */}
      <div className="settings-card">
        <h2 className="card-title">Push notifications</h2>
        <div className="notification-options">
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={pushSettings.messages}
              onChange={() => togglePushSetting('messages')}
            />
            <span>Messages</span>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={pushSettings.connectionRequests}
              onChange={() => togglePushSetting('connectionRequests')}
            />
            <span>Connection requests</span>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={pushSettings.endorsements}
              onChange={() => togglePushSetting('endorsements')}
            />
            <span>Endorsements</span>
          </label>
          <label className="notification-option">
            <input 
              type="checkbox"
              checked={pushSettings.trustScoreUpdates}
              onChange={() => togglePushSetting('trustScoreUpdates')}
            />
            <span>Trust score updates</span>
          </label>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="settings-card">
        <h2 className="card-title">Quiet hours</h2>
        <p className="card-description">
          Pause notifications during specific hours.
        </p>
        <div className="quiet-hours-row">
          <div className="form-group">
            <label className="form-label">From</label>
            <select className="form-select">
              <option>10:00 PM</option>
              <option>11:00 PM</option>
              <option>12:00 AM</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">To</label>
            <select className="form-select">
              <option>7:00 AM</option>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
            </select>
          </div>
        </div>
        <label className="notification-option">
          <input type="checkbox" />
          <span>Enable quiet hours</span>
        </label>
      </div>
    </section>
  );
}
