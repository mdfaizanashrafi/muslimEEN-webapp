'use client';

import { useState } from 'react';
import '../../../styles/settings.css';

export default function VisibilitySettingsPage() {
  const [settings, setSettings] = useState({
    showTrustScore: true,
    allowEndorsements: true,
    showNetwork: true,
    allowFollowing: true,
    showActivity: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="settings-section">
      <h1 className="settings-title">Visibility</h1>
      
      {/* Trust Score Visibility */}
      <div className="settings-card">
        <h2 className="card-title">Trust score</h2>
        <label className="visibility-option">
          <input 
            type="checkbox"
            checked={settings.showTrustScore}
            onChange={() => toggleSetting('showTrustScore')}
          />
          <div>
            <span>Show trust score on profile</span>
            <p className="option-description">
              Your trust score helps build credibility in the community
            </p>
          </div>
        </label>
      </div>

      {/* Network Visibility */}
      <div className="settings-card">
        <h2 className="card-title">Network visibility</h2>
        <label className="visibility-option">
          <input 
            type="checkbox"
            checked={settings.showNetwork}
            onChange={() => toggleSetting('showNetwork')}
          />
          <div>
            <span>Show my connections</span>
            <p className="option-description">
              Allow others to see who you&apos;re connected with
            </p>
          </div>
        </label>
        <label className="visibility-option">
          <input 
            type="checkbox"
            checked={settings.allowFollowing}
            onChange={() => toggleSetting('allowFollowing')}
          />
          <div>
            <span>Allow others to follow you</span>
            <p className="option-description">
              People can follow your public updates without connecting
            </p>
          </div>
        </label>
      </div>

      {/* Activity Visibility */}
      <div className="settings-card">
        <h2 className="card-title">Activity</h2>
        <label className="visibility-option">
          <input 
            type="checkbox"
            checked={settings.showActivity}
            onChange={() => toggleSetting('showActivity')}
          />
          <div>
            <span>Share profile updates</span>
            <p className="option-description">
              Notify your network when you update your profile
            </p>
          </div>
        </label>
      </div>

      {/* Endorsements */}
      <div className="settings-card">
        <h2 className="card-title">Endorsements</h2>
        <label className="visibility-option">
          <input 
            type="checkbox"
            checked={settings.allowEndorsements}
            onChange={() => toggleSetting('allowEndorsements')}
          />
          <div>
            <span>Allow skill endorsements</span>
            <p className="option-description">
              Let your connections endorse your skills and expertise
            </p>
          </div>
        </label>
      </div>

      {/* Profile Viewers */}
      <div className="settings-card">
        <h2 className="card-title">Profile viewers</h2>
        <div className="form-group">
          <label className="form-label">Who can see you viewed their profile</label>
          <select className="form-select">
            <option value="all">Your connections and others</option>
            <option value="connections">Your connections only</option>
            <option value="none">Nobody</option>
          </select>
        </div>
      </div>
    </section>
  );
}
