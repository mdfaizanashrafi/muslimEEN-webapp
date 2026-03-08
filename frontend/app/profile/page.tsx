'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../components/layout';
import { workHistory, education, skills } from '../../data/mocks/profile';
import '../../styles/profile.css';

// Page-specific icons
const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const CopyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const QRCodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

interface CardProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Card = ({ title, action, children }: CardProps) => (
  <div className="card">
    <div className="card-header">
      <h3>{title}</h3>
      {action}
    </div>
    <div className="card-body">{children}</div>
  </div>
);

interface WidgetProps {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const Widget = ({ title, action, children }: WidgetProps) => (
  <div className="widget">
    <div className="widget-header">
      <h3>{title}</h3>
      {action}
    </div>
    <div className="widget-body">{children}</div>
  </div>
);

interface TimelineItemProps {
  title: string;
  subtitle: string;
  date: string;
  description?: string;
}

const TimelineItem = ({ title, subtitle, date, description }: TimelineItemProps) => (
  <div className="timeline-item">
    <div className="timeline-content">
      <h5>{title}</h5>
      <p className="text-secondary">{subtitle}</p>
      <p className="text-sm text-tertiary">{date}</p>
      {description && <p className="mt-2">{description}</p>}
    </div>
  </div>
);

interface SkillBadgeProps {
  name: string;
  count: number;
}

const SkillBadge = ({ name, count }: SkillBadgeProps) => (
  <span className="badge badge-verified">
    {name} <small>({count})</small>
  </span>
);

interface ActivityItemProps {
  icon: string;
  text: string;
  time: string;
}

const ActivityItem = ({ icon, text, time }: ActivityItemProps) => (
  <div className="activity-item">
    <span className="activity-icon">{icon}</span>
    <span className="activity-text">{text}</span>
    <span className="activity-time">{time}</span>
  </div>
);

// Edit Modal Section Component
interface EditSectionProps {
  title: string;
  children: React.ReactNode;
}

const EditSection = ({ title, children }: EditSectionProps) => (
  <div className="edit-section">
    <h4 className="edit-section-title">{title}</h4>
    {children}
  </div>
);

// Share Option Component
interface ShareOptionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ShareOption = ({ icon, label, onClick }: ShareOptionProps) => (
  <button className="share-option" onClick={onClick}>
    <span className="share-option-icon">{icon}</span>
    <span className="share-option-label">{label}</span>
  </button>
);

export default function ProfilePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: 'Ahmed',
    lastName: 'Hassan',
    headline: 'Software Engineer | Islamic Finance Enthusiast | Building ethical tech solutions',
    location: 'London, UK',
    about: 'Passionate software engineer with 5+ years of experience building scalable web applications. Specialized in fintech solutions with a focus on Islamic finance compliance.\n\nCurrently leading development at HalalTech Solutions, where we\'re building the next generation of Shariah-compliant financial tools for the Muslim community.',
  });

  const profileUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/profile`
    : 'https://muslimeen.org/profile';

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);
  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    // TODO: API call to save profile
    console.log('Saving profile:', editForm);
    closeEditModal();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    const text = 'Check out my MuslimEEN profile!';
    const url = encodeURIComponent(profileUrl);
    
    switch (platform) {
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + profileUrl)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent('My MuslimEEN Profile')}&body=${encodeURIComponent(text + '\n\n' + profileUrl)}`;
        break;
    }
  };

  return (
    <>
      <AppLayout activeNav="profile">
        {/* Profile Header */}
        <section className="profile-header">
          <div className="profile-cover">
            <div className="cover-pattern pattern-tessellation"></div>
          </div>
          <div className="profile-header-content">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <div className="avatar avatar-xl">AH</div>
                <button type="button" className="avatar-edit" aria-label="Change photo">
                  <CameraIcon />
                </button>
              </div>
            </div>
            
            <div className="profile-info-section">
              <div className="profile-info-main">
                <h1>Ahmed Hassan</h1>
                <p className="profile-bio">Software Engineer | Islamic Finance Enthusiast | Building ethical tech solutions</p>
                <p className="profile-location">
                  <LocationIcon />
                  London, UK
                </p>
                
                <div className="verification-badges mt-3">
                  <span className="verification-badge verified">✓ Biometric Verified</span>
                  <span className="verification-badge verified">✓ Two-Witness Verified</span>
                  <span className="verification-badge verified">✓ Institutional Fast-Track</span>
                </div>
              </div>
              
              <div className="profile-info-stats">
                <div className="profile-stat">
                  <span className="stat-number">234</span>
                  <span className="stat-label">Connections</span>
                </div>
                <div className="profile-stat">
                  <span className="stat-number">47</span>
                  <span className="stat-label">Endorsements</span>
                </div>
                <div className="profile-stat">
                  <span className="stat-number">128</span>
                  <span className="stat-label">Profile Views</span>
                </div>
              </div>
            </div>
            
            <div className="profile-actions">
              <button type="button" className="btn btn-primary" onClick={openEditModal}>
                Edit Profile
              </button>
              <button type="button" className="btn btn-outline" onClick={openShareModal}>
                <ShareIcon />
                Share Profile
              </button>
            </div>
          </div>
        </section>
        
        {/* Profile Content */}
        <div className="profile-content">
          {/* Left Column */}
          <div className="profile-main">
            {/* Trust Score Card */}
            <Card 
              title="Trust Score" 
              action={<Link href="/trust-score" className="text-sm text-link">View Details</Link>}
            >
              <div className="trust-score-container">
                <div className="trust-score-header">
                  <span className="trust-score-value high">785</span>
                  <span className="text-sm text-secondary">/1000</span>
                </div>
                <div className="trust-score-bar">
                  <div className="trust-score-fill high" style={{ width: '78.5%' }}></div>
                </div>
                <p className="text-sm text-secondary mt-2">+15 points this month • Top 15% of members</p>
              </div>
            </Card>
            
            {/* About Section */}
            <Card 
              title="About"
              action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>Edit</button>}
            >
              <p>Passionate software engineer with 5+ years of experience building scalable web applications. Specialized in fintech solutions with a focus on Islamic finance compliance.</p>
              <p className="mt-2">Currently leading development at HalalTech Solutions, where we&apos;re building the next generation of Shariah-compliant financial tools for the Muslim community.</p>
            </Card>
            
            {/* Experience Section */}
            <Card 
              title="Experience"
              action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>+ Add</button>}
            >
              <div className="timeline">
                {workHistory.map((item) => (
                  <TimelineItem key={item.title} {...item} />
                ))}
              </div>
            </Card>
            
            {/* Education Section */}
            <Card 
              title="Education"
              action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>+ Add</button>}
            >
              <div className="timeline">
                {education.map((item) => (
                  <TimelineItem key={item.title} {...item} />
                ))}
              </div>
            </Card>
            
            {/* Skills Section */}
            <Card 
              title="Skills & Endorsements"
              action={<button type="button" className="btn btn-ghost btn-sm" onClick={openEditModal}>+ Add</button>}
            >
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <SkillBadge key={skill.name} {...skill} />
                ))}
              </div>
            </Card>
          </div>
          
          {/* Right Column */}
          <aside className="profile-sidebar">
            {/* Profile Completeness */}
            <Widget title="Profile Strength">
              <div className="progress mb-2">
                <div className="progress-bar" style={{ width: '85%' }}></div>
              </div>
              <p className="text-sm text-secondary">85% complete</p>
              <ul className="completeness-checklist mt-4">
                <li className="complete">✓ Add profile photo</li>
                <li className="complete">✓ Add headline</li>
                <li className="complete">✓ Add location</li>
                <li className="complete">✓ Add work experience</li>
                <li className="complete">✓ Add education</li>
                <li className="incomplete">○ Add 3 more skills</li>
                <li className="incomplete">○ Get 5 endorsements</li>
              </ul>
            </Widget>
            
            {/* Verification Status */}
            <Widget 
              title="Verification"
              action={<Link href="/verification" className="text-sm text-link">Details</Link>}
            >
              <div className="verification-status">
                <div className="verification-tier">
                  <span className="tier-badge full">Full Verification</span>
                </div>
                <ul className="verification-steps">
                  <li className="complete">
                    <CheckIcon />
                    Email verified
                  </li>
                  <li className="complete">
                    <CheckIcon />
                    Biometric verified
                  </li>
                  <li className="complete">
                    <CheckIcon />
                    Two-witness verified
                  </li>
                </ul>
                <Link href="/verification" className="btn btn-outline btn-sm w-full mt-4">
                  Upgrade to Business
                </Link>
              </div>
            </Widget>
            
            {/* Activity */}
            <Widget title="Recent Activity">
              <div className="activity-list">
                <ActivityItem 
                  icon="👤"
                  text="Connected with Yusuf Ibrahim"
                  time="2 days ago"
                />
                <ActivityItem 
                  icon="⭐"
                  text="Received endorsement for Islamic Finance"
                  time="5 days ago"
                />
                <ActivityItem 
                  icon="📝"
                  text="Updated work experience"
                  time="1 week ago"
                />
              </div>
            </Widget>
          </aside>
        </div>
      </AppLayout>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal edit-profile-modal">
          <div className="modal-backdrop" onClick={closeEditModal}></div>
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button type="button" className="modal-close" onClick={closeEditModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Cover Photo Section */}
              <EditSection title="Cover Photo">
                <div className="cover-photo-edit">
                  <div className="cover-preview">
                    <div className="cover-pattern pattern-tessellation"></div>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm cover-change-btn">
                    <CameraIcon />
                    Change Cover
                  </button>
                </div>
              </EditSection>

              {/* Profile Photo Section */}
              <EditSection title="Profile Photo">
                <div className="profile-photo-edit">
                  <div className="avatar avatar-xl">AH</div>
                  <button type="button" className="btn btn-outline btn-sm">
                    <CameraIcon />
                    Change Photo
                  </button>
                </div>
              </EditSection>

              {/* Name Section */}
              <EditSection title="Name">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={editForm.firstName}
                      onChange={handleEditChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={editForm.lastName}
                      onChange={handleEditChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </EditSection>

              {/* Headline Section */}
              <EditSection title="Headline">
                <div className="form-group">
                  <input
                    type="text"
                    name="headline"
                    value={editForm.headline}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="e.g., Software Engineer at Company"
                  />
                </div>
              </EditSection>

              {/* Location Section */}
              <EditSection title="Location">
                <div className="form-group">
                  <input
                    type="text"
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="City, Country"
                  />
                </div>
              </EditSection>

              {/* About Section */}
              <EditSection title="About">
                <div className="form-group">
                  <textarea
                    name="about"
                    value={editForm.about}
                    onChange={handleEditChange}
                    className="form-textarea"
                    rows={6}
                    placeholder="Tell us about yourself..."
                  />
                  <p className="form-hint">Tell your story - your background, interests, and what you&apos;re looking for on MuslimEEN.</p>
                </div>
              </EditSection>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Profile Modal */}
      {isShareModalOpen && (
        <div className="modal share-modal">
          <div className="modal-backdrop" onClick={closeShareModal}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Share Profile</h2>
              <button type="button" className="modal-close" onClick={closeShareModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Profile Link */}
              <div className="share-section">
                <h4 className="share-section-title">Profile Link</h4>
                <div className="share-link-row">
                  <input
                    type="text"
                    value={profileUrl}
                    readOnly
                    className="form-input share-link-input"
                  />
                  <button 
                    type="button" 
                    className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                    onClick={handleCopyLink}
                  >
                    <CopyIcon />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Share on Social */}
              <div className="share-section">
                <h4 className="share-section-title">Share on</h4>
                <div className="share-options">
                  <ShareOption 
                    icon={<LinkedInIcon />}
                    label="LinkedIn"
                    onClick={() => handleShare('linkedin')}
                  />
                  <ShareOption 
                    icon={<TwitterIcon />}
                    label="X (Twitter)"
                    onClick={() => handleShare('twitter')}
                  />
                  <ShareOption 
                    icon={<WhatsAppIcon />}
                    label="WhatsApp"
                    onClick={() => handleShare('whatsapp')}
                  />
                  <ShareOption 
                    icon={<EmailIcon />}
                    label="Email"
                    onClick={() => handleShare('email')}
                  />
                </div>
              </div>

              {/* QR Code Option */}
              <div className="share-section">
                <h4 className="share-section-title">QR Code</h4>
                <div className="qr-code-container">
                  <div className="qr-code-placeholder">
                    <QRCodeIcon />
                    <span>QR Code Preview</span>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm">
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
