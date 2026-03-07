'use client';

import { useState } from 'react';
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

export default function ProfilePage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

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
              <button type="button" className="btn btn-outline">
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
        <div className="modal">
          <div className="modal-backdrop" onClick={closeEditModal}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button type="button" className="modal-close" onClick={closeEditModal} aria-label="Close">
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="text-secondary">Profile editing functionality coming soon...</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeEditModal}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={closeEditModal}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
