'use client';

import { AppLayout } from '@/components/layout';
import '@/styles/trust-score.css';
import Link from 'next/link';

// Types
interface TrustFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

interface ScoreHistoryPoint {
  date: string;
  score: number;
}

interface ConnectionComparison {
  percentile: number;
  averageScore: number;
  yourScore: number;
}

// Mock data - will be replaced with API call
const mockTrustFactors: TrustFactor[] = [
  {
    name: 'Profile Completeness',
    score: 100,
    maxScore: 100,
    description: 'Based on how complete your profile is',
  },
  {
    name: 'Connection Quality',
    score: 85,
    maxScore: 100,
    description: 'Quality and engagement of your network',
  },
  {
    name: 'Community Contributions',
    score: 60,
    maxScore: 100,
    description: 'Endorsements, recommendations, and helpful interactions',
  },
  {
    name: 'Verification Level',
    score: 150,
    maxScore: 150,
    description: 'Identity verification and witness validations',
  },
  {
    name: 'Account Activity',
    score: 200,
    maxScore: 250,
    description: 'Regular platform usage and engagement',
  },
  {
    name: 'Trust endorsements',
    score: 90,
    maxScore: 150,
    description: 'Endorsements from verified members',
  },
];

const mockScoreHistory: ScoreHistoryPoint[] = [
  { date: 'Aug 2025', score: 650 },
  { date: 'Sep 2025', score: 685 },
  { date: 'Oct 2025', score: 710 },
  { date: 'Nov 2025', score: 740 },
  { date: 'Dec 2025', score: 765 },
  { date: 'Jan 2026', score: 785 },
];

const mockComparison: ConnectionComparison = {
  percentile: 85,
  averageScore: 620,
  yourScore: 785,
};

// Components
const ScoreHeader = () => (
  <section className="trust-score-header-section">
    <div className="score-main-display">
      <div className="score-circle">
        <span className="score-value">785</span>
        <span className="score-label">/1000</span>
      </div>
      <div className="score-info">
        <h1>Your Trust Score</h1>
        <p className="score-rank">Top 15% of members</p>
        <p className="score-change positive">+35 points this month</p>
      </div>
    </div>
  </section>
);

const ScoreProgressBar = ({ current, max }: { current: number; max: number }) => {
  const percentage = (current / max) * 100;
  return (
    <div className="progress-bar-container">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <span className="progress-text">
        {current} / {max}
      </span>
    </div>
  );
};

const TrustFactorItem = ({ factor }: { factor: TrustFactor }) => (
  <div className="trust-factor-item">
    <div className="factor-header">
      <h3>{factor.name}</h3>
      <span className="factor-score">{factor.score} pts</span>
    </div>
    <p className="factor-description">{factor.description}</p>
    <ScoreProgressBar current={factor.score} max={factor.maxScore} />
  </div>
);

const TrustFactorsSection = () => (
  <section className="trust-factors-section">
    <h2>Score Breakdown</h2>
    <p className="section-description">Your trust score is calculated based on these factors</p>
    <div className="factors-list">
      {mockTrustFactors.map(factor => (
        <TrustFactorItem key={factor.name} factor={factor} />
      ))}
    </div>
  </section>
);

const ScoreHistoryChart = () => (
  <section className="score-history-section">
    <h2>Score History</h2>
    <div className="history-chart">
      {mockScoreHistory.map((point, index) => {
        const height = (point.score / 1000) * 100;
        return (
          <div key={point.date} className="chart-bar-container">
            <div className="chart-bar" style={{ height: `${height}%` }}>
              <span className="bar-value">{point.score}</span>
            </div>
            <span className="bar-label">{point.date}</span>
          </div>
        );
      })}
    </div>
  </section>
);

const ConnectionComparisonSection = () => (
  <section className="comparison-section">
    <h2>Comparison with Connections</h2>
    <div className="comparison-card">
      <div className="percentile-display">
        <span className="percentile-value">{mockComparison.percentile}th</span>
        <span className="percentile-label">percentile</span>
      </div>
      <p className="comparison-text">
        Your trust score is higher than {mockComparison.percentile}% of your connections
      </p>
      <div className="comparison-stats">
        <div className="stat-item">
          <span className="stat-label">Your Score</span>
          <span className="stat-value your-score">{mockComparison.yourScore}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Connections Avg</span>
          <span className="stat-value avg-score">{mockComparison.averageScore}</span>
        </div>
      </div>
    </div>
  </section>
);

const ImprovementSuggestions = () => {
  const suggestions = [
    { action: 'Complete your profile', points: '+20 points', icon: '👤' },
    { action: 'Get 3 more endorsements', points: '+30 points', icon: '⭐' },
    { action: 'Verify with two witnesses', points: '+50 points', icon: '✓' },
    { action: 'Connect with 10 more members', points: '+15 points', icon: '🤝' },
  ];

  return (
    <section className="suggestions-section">
      <h2>Improve Your Score</h2>
      <div className="suggestions-list">
        {suggestions.map(suggestion => (
          <div key={suggestion.action} className="suggestion-item">
            <span className="suggestion-icon">{suggestion.icon}</span>
            <div className="suggestion-content">
              <span className="suggestion-action">{suggestion.action}</span>
              <span className="suggestion-points">{suggestion.points}</span>
            </div>
            <Link href="/verification" className="btn btn-sm btn-primary">
              Start
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
};

// Main Page Component
export default function TrustScorePage() {
  return (
    <AppLayout activeNav="profile">
      <div className="trust-score-page">
        <ScoreHeader />

        <div className="trust-score-content">
          <div className="main-column">
            <TrustFactorsSection />
            <ScoreHistoryChart />
          </div>

          <aside className="sidebar-column">
            <ConnectionComparisonSection />
            <ImprovementSuggestions />
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
