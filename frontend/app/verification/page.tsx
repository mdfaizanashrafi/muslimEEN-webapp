'use client';

import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import '@/styles/verification.css';

// Page-specific icons
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20,6 9,17 4,12"/>
  </svg>
);

const ShieldIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const BusinessIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const InstitutionIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18"/>
    <path d="M5 21V7l8-4 8 4v14"/>
    <path d="M9 21v-6h6v6"/>
  </svg>
);

interface VerificationStepProps {
  stepNumber: number;
  title: string;
  status: 'completed' | 'pending';
  meta: string;
  isOptional?: boolean;
}

const VerificationStep = ({ stepNumber, title, status, meta, isOptional }: VerificationStepProps) => (
  <div className="verification-step">
    <div className={`step-indicator ${status}`}>
      {status === 'completed' ? (
        <CheckIcon />
      ) : (
        <span>{stepNumber}</span>
      )}
    </div>
    <div className="step-content">
      <div className="step-title">{title}</div>
      <div className="step-meta" dangerouslySetInnerHTML={{ __html: meta }} />
    </div>
    <div className="step-badges">
      <span className={`step-badge ${status}`}>
        {status === 'completed' ? 'Completed' : 'Pending'}
      </span>
      {isOptional && <span className="step-badge optional">Optional</span>}
    </div>
    {status === 'pending' && (
      <button className="btn btn-primary btn-sm">Apply</button>
    )}
  </div>
);

interface TrustFactorProps {
  name: string;
  points: number;
  percentage: number;
}

const TrustFactor = ({ name, points, percentage }: TrustFactorProps) => (
  <div className="factor-item">
    <div className="factor-header">
      <span className="factor-name">{name}</span>
      <span className="factor-points">+{points}</span>
    </div>
    <div className="factor-bar-container">
      <div className="factor-bar">
        <div className="factor-bar-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="factor-percentage">{percentage}%</span>
    </div>
  </div>
);

export default function VerificationPage() {
  const router = useRouter();

  const handleBusinessVerification = () => {
    router.push('/verification/business');
  };

  const handleInstitutionalPartner = () => {
    router.push('/verification/institutional');
  };

  return (
    <AppLayout activeNav="verification">
      {/* Page Header */}
      <div className="page-header">
        <h1>Verification Status</h1>
        <p className="subtitle">Manage your verification level and trust score</p>
      </div>
      
      {/* Current Status Card */}
      <div className="status-card">
        <div className="status-header">
          <div className="status-badge">
            <span className="status-badge-icon">
              <CheckIcon />
            </span>
            Full Verification
          </div>
        </div>
        <p className="status-message">You have full access to all platform features</p>
        <div className="status-score-section">
          <div className="status-score-display">
            <span className="status-score-value">785</span>
            <span className="status-score-max">/1000</span>
            <span className="status-score-rank">Top 15% of members</span>
          </div>
          <div className="status-score-change">
            <span>+</span>
            <span>15 points this month</span>
          </div>
        </div>
      </div>
      
      {/* Verification Progress Section */}
      <div className="verification-section">
        <h2 className="section-title">Verification Progress</h2>
        <div className="verification-steps">
          <VerificationStep 
            stepNumber={1}
            title="Email Verification"
            status="completed"
            meta="Verified on <strong>15 Jan 2023</strong>"
          />
          <VerificationStep 
            stepNumber={2}
            title="Biometric Verification"
            status="completed"
            meta="Verified on <strong>20 Jan 2023</strong>"
          />
          <VerificationStep 
            stepNumber={3}
            title="Two-Witness Verification"
            status="completed"
            meta="Verified by <span class='witness'>Yusuf Ibrahim</span> and <span class='witness'>Aisha Patel</span>"
          />
          <VerificationStep 
            stepNumber={4}
            title="Business Verification"
            status="pending"
            meta="Optional verification for business accounts"
            isOptional={true}
          />
        </div>
      </div>
      
      {/* Trust Score Factors Section */}
      <div className="factors-section">
        <h2 className="section-title">Trust Score Factors</h2>
        <div className="factors-list">
          <TrustFactor name="Profile Completeness" points={50} percentage={85} />
          <TrustFactor name="Connection Quality" points={30} percentage={70} />
          <TrustFactor name="Community Contributions" points={25} percentage={60} />
          <TrustFactor name="Verification Level" points={100} percentage={100} />
          <TrustFactor name="Endorsements Received" points={47} percentage={47} />
        </div>
      </div>
      
      {/* Witness Eligibility Section */}
      <div className="witness-section">
        <h2 className="section-title">Witness Eligibility</h2>
        <div className="witness-card">
          <div className="witness-icon">
            <ShieldIcon />
          </div>
          <div className="witness-content">
            <h3 className="witness-title">You are eligible to vouch for new members</h3>
            <p className="witness-message">Your trust score and verification status allow you to witness for others</p>
            <div className="witness-stats">
              <div className="witness-stat">
                <span className="witness-stat-value">12</span>
                <span className="witness-stat-label">Members Vouched</span>
              </div>
              <div className="witness-stat">
                <span className="witness-stat-value">100%</span>
                <span className="witness-stat-label">Success Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upgrade Options Section */}
      <div className="upgrade-section">
        <h2 className="section-title">Upgrade Options</h2>
        <div className="upgrade-grid">
          {/* Business Verification Card */}
          <div className="upgrade-card business">
            <div className="upgrade-card-header">
              <div className="upgrade-card-icon">
                <BusinessIcon />
              </div>
              <h3 className="upgrade-card-title">Business Verification</h3>
            </div>
            <p className="upgrade-card-description">
              Verify your business to unlock marketplace features and build trust with potential partners and customers.
            </p>
            <ul className="upgrade-card-features">
              <li>Business profile badge</li>
              <li>Priority listing in marketplace</li>
              <li>Enhanced trust indicators</li>
              <li>Business analytics dashboard</li>
            </ul>
            <button className="upgrade-card-button" onClick={handleBusinessVerification}>
              Apply for Business Verification
            </button>
          </div>
          
          {/* Institutional Partner Card */}
          <div className="upgrade-card institutional">
            <div className="upgrade-card-header">
              <div className="upgrade-card-icon">
                <InstitutionIcon />
              </div>
              <h3 className="upgrade-card-title">Institutional Partner</h3>
            </div>
            <p className="upgrade-card-description">
              Join as an institutional partner to access exclusive features and collaborate with the MuslimEEN ecosystem.
            </p>
            <ul className="upgrade-card-features">
              <li>Institutional verification badge</li>
              <li>API access for integrations</li>
              <li>Co-marketing opportunities</li>
              <li>Dedicated account manager</li>
            </ul>
            <button className="upgrade-card-button" onClick={handleInstitutionalPartner}>
              Apply for Institutional Partner
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
