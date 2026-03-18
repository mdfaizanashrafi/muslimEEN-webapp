'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { islamicFinance } from '@/lib/api';
import type { SadaqahCampaign, WaqfListing, QardHasanLoan } from '@/lib/api';
import '@/styles/islamic-finance.css';
import {
  HeartIcon,
  BuildingIcon,
  CalculatorIcon,
  HandCoinsIcon,
  ShieldIcon,
  UsersIcon,
  ClockIcon,
} from '@/components/icons/IslamicFinanceIcons';

interface CampaignCardProps {
  id: string;
  category: string;
  categoryColor: 'red' | 'green' | 'blue' | 'amber';
  title: string;
  description: string;
  raised: number;
  goal: number;
  donors: number;
  daysLeft?: number;
  beneficiary: string;
  onDonate: (id: string) => void;
}

const CampaignCard = ({
  id,
  category,
  categoryColor,
  title,
  description,
  raised,
  goal,
  donors,
  daysLeft,
  beneficiary,
  onDonate
}: CampaignCardProps) => {
  const progress = Math.min((raised / goal) * 100, 100);
  const raisedFormatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(raised);
  const goalFormatted = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(goal);
  
  // Truncate description
  const truncatedDescription = description.length > 120 
    ? description.substring(0, 120) + '...' 
    : description;
  
  return (
    <div className={`campaign-card campaign-${categoryColor}`}>
      <div className="campaign-image">
        <div className="campaign-image-placeholder">
          {category === 'Emergency Relief' && '🆘'}
          {category === 'Education' && '📚'}
          {category === 'Water' && '💧'}
          {category === 'Food' && '🍲'}
          {category === 'Healthcare' && '🏥'}
          {category === 'Housing' && '🏠'}
          {!['Emergency Relief', 'Education', 'Water', 'Food', 'Healthcare', 'Housing'].includes(category) && '❤️'}
        </div>
        <span className={`campaign-category badge-${categoryColor}`}>{category}</span>
      </div>
      <div className="campaign-content">
        <h3 className="campaign-title">{title}</h3>
        <p className="campaign-description">{truncatedDescription}</p>
        
        <div className="campaign-progress">
          <div className="campaign-progress-header">
            <span className="campaign-raised">{raisedFormatted}</span>
            <span className="campaign-goal">of {goalFormatted}</span>
          </div>
          <div className="progress-bar campaign-progress-bar">
            <div className={`progress-fill ${categoryColor}`} style={{ width: `${progress}%` }}></div>
          </div>
          <div className="campaign-progress-footer">
            <span><UsersIcon /> {donors} donors</span>
            {daysLeft !== undefined && (
              <span><ClockIcon /> {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
            )}
          </div>
        </div>
        
        <div className="campaign-org">
          <div className="org-avatar">{beneficiary.substring(0, 2).toUpperCase()}</div>
          <span className="org-name">{beneficiary}</span>
        </div>
        
        <button 
          className="btn btn-primary btn-full"
          onClick={() => onDonate(id)}
          disabled={progress >= 100}
        >
          {progress >= 100 ? 'Fully Funded' : 'Donate Now'}
        </button>
      </div>
    </div>
  );
};

interface DonationHistoryItemProps {
  campaign: string;
  date: string;
  amount: string;
}

const DonationHistoryItem = ({ campaign, date, amount }: DonationHistoryItemProps) => (
  <div className="donation-item">
    <div className="donation-info">
      <span className="donation-campaign">{campaign}</span>
      <span className="donation-date">{date}</span>
    </div>
    <span className="donation-amount">{amount}</span>
  </div>
);

interface QuickToolCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

const QuickToolCard = ({ icon, title, description, href }: QuickToolCardProps) => (
  <Link href={href} className="quick-tool-card">
    <div className="quick-tool-icon">{icon}</div>
    <h4 className="quick-tool-title">{title}</h4>
    <p className="quick-tool-description">{description}</p>
  </Link>
);

// Helper to get category color
const getCategoryColor = (category: string): 'red' | 'green' | 'blue' | 'amber' => {
  const colorMap: Record<string, 'red' | 'green' | 'blue' | 'amber'> = {
    'Emergency Relief': 'red',
    'Education': 'green',
    'Water': 'blue',
    'Food': 'amber',
    'Healthcare': 'red',
    'Housing': 'green',
  };
  return colorMap[category] || 'blue';
};

// Helper to calculate days left
const getDaysLeft = (endDate?: string): number | undefined => {
  if (!endDate) return undefined;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export default function IslamicFinanceClient() {
  const searchParams = useSearchParams();
  const tool = searchParams.get('tool') || 'sadaqah';
  const [activeTab, setActiveTab] = useState(tool);
  
  // Data states
  const [campaigns, setCampaigns] = useState<SadaqahCampaign[]>([]);
  const [waqfListings, setWaqfListings] = useState<WaqfListing[]>([]);
  const [qardHasanLoans, setQardHasanLoans] = useState<QardHasanLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(tool);
  }, [tool]);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        if (activeTab === 'sadaqah') {
          const response = await islamicFinance.getSadaqahCampaigns();
          setCampaigns(response.campaigns.filter(c => c.isActive));
        } else if (activeTab === 'waqf') {
          const response = await islamicFinance.getWaqfListings();
          setWaqfListings(response.listings);
        } else if (activeTab === 'qardhasan') {
          const response = await islamicFinance.getQardHasanLoans();
          setQardHasanLoans(response.loans);
        }
      } catch (err) {
        console.error('Failed to fetch Islamic finance data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  const tabs = [
    { id: 'sadaqah', label: 'Sadaqah' },
    { id: 'waqf', label: 'Waqf' },
    { id: 'zakat', label: 'Zakat' },
    { id: 'qardhasan', label: 'Qard Hasan' },
    { id: 'takaful', label: 'Takaful' },
  ];

  // Handle donation
  const handleDonate = async (campaignId: string) => {
    const amount = prompt('Enter donation amount (£):');
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    
    try {
      await islamicFinance.donate(campaignId, Number(amount));
      alert('Thank you for your donation!');
      // Refresh campaigns
      const response = await islamicFinance.getSadaqahCampaigns();
      setCampaigns(response.campaigns.filter(c => c.isActive));
    } catch (err) {
      console.error('Failed to process donation:', err);
      alert('Failed to process donation. Please try again.');
    }
  };

  if (isLoading && activeTab !== 'zakat' && activeTab !== 'takaful') {
    return (
      <AppLayout activeNav="islamic-finance">
        <div className="finance-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeNav="islamic-finance">
      {/* Finance Tools Tabs */}
      <div className="finance-tabs-container">
        <div className="tabs finance-tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={`/islamic-finance?tool=${tab.id}`}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
      
      {error && (
        <div className="alert alert-warning mb-4">
          {error}
        </div>
      )}
      
      {/* Tab Content */}
      <div className="tab-content-wrapper">
        {activeTab === 'sadaqah' && (
          <div className="sadaqah-section">
            {/* Section Intro */}
            <div className="section-intro">
              <h2>Sadaqah Campaigns</h2>
              <p>Give charity voluntarily to help those in need. Every donation is a seed planted for your akhirah.</p>
            </div>
            
            {/* Campaigns Grid */}
            <div className="campaigns-grid">
              {campaigns.length === 0 ? (
                <div className="empty-state">
                  <p className="text-secondary">No active campaigns at the moment.</p>
                  <p className="text-sm text-tertiary mt-2">
                    Check back soon for new sadaqah opportunities.
                  </p>
                </div>
              ) : (
                campaigns.map((campaign) => (
                  <CampaignCard 
                    key={campaign.id}
                    id={campaign.id}
                    category={campaign.category}
                    categoryColor={getCategoryColor(campaign.category)}
                    title={campaign.title}
                    description={campaign.description}
                    raised={campaign.raisedAmount}
                    goal={campaign.targetAmount}
                    donors={Math.floor(campaign.raisedAmount / 50)} // Estimate based on average donation
                    daysLeft={getDaysLeft(campaign.endDate)}
                    beneficiary={campaign.beneficiary}
                    onDonate={handleDonate}
                  />
                ))
              )}
            </div>
            
            {/* Donation History - Placeholder */}
            <div className="donation-history-card">
              <div className="card-header">
                <h3>Your Donation History</h3>
                <span className="text-link text-sm">Coming Soon</span>
              </div>
              <div className="card-body">
                <div className="text-center py-8">
                  <p className="text-secondary">Your donation history will appear here.</p>
                  <p className="text-sm text-tertiary mt-2">
                    Support campaigns above to start building your giving record.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'waqf' && (
          <div className="waqf-section">
            <div className="section-intro">
              <h2>Waqf (Endowment)</h2>
              <p>Create everlasting charity through endowment. Your contribution continues to benefit the community for generations.</p>
            </div>
            
            {waqfListings.length === 0 ? (
              <div className="empty-state">
                <div className="placeholder-icon"><BuildingIcon /></div>
                <h3>No Waqf Projects Available</h3>
                <p className="text-secondary">Waqf projects are being curated. Check back soon.</p>
              </div>
            ) : (
              <div className="waqf-grid">
                {waqfListings.map((waqf) => (
                  <div key={waqf.id} className="waqf-card">
                    <h3>{waqf.title}</h3>
                    <p>{waqf.description}</p>
                    <div className="waqf-details">
                      <span>Asset Type: {waqf.assetType}</span>
                      <span>Location: {waqf.location}</span>
                      <span>Value: {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(waqf.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'zakat' && (
          <div className="zakat-section">
            <div className="section-intro">
              <h2>Zakat Calculator</h2>
              <p>Calculate your zakat obligations with ease. Enter your assets below to determine your zakat due.</p>
            </div>
            
            <ZakatCalculator />
          </div>
        )}
        
        {activeTab === 'qardhasan' && (
          <div className="qardhasan-section">
            <div className="section-intro">
              <h2>Qard Hasan (Benevolent Loan)</h2>
              <p>Interest-free loans for the community. Lend to those in need or request assistance.</p>
            </div>
            
            {qardHasanLoans.length === 0 ? (
              <div className="empty-state">
                <div className="placeholder-icon"><HandCoinsIcon /></div>
                <h3>No Active Loans</h3>
                <p className="text-secondary">No Qard Hasan loans are currently available.</p>
                <button className="btn btn-primary mt-4">
                  Request a Loan
                </button>
              </div>
            ) : (
              <div className="loans-grid">
                {qardHasanLoans.map((loan) => (
                  <div key={loan.id} className="loan-card">
                    <h3>{loan.borrowerName}</h3>
                    <p>{loan.purpose}</p>
                    <div className="loan-amount">
                      {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(loan.amount)}
                    </div>
                    <span className={`loan-status ${loan.status}`}>{loan.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'takaful' && (
          <div className="placeholder-section">
            <div className="placeholder-icon"><ShieldIcon /></div>
            <h2>Takaful</h2>
            <p>Islamic cooperative insurance solutions. Coming soon.</p>
          </div>
        )}
      </div>
      
      {/* Quick Tools Section */}
      <section className="quick-tools-section">
        <h2 className="section-title">Quick Tools</h2>
        <div className="quick-tools-grid">
          <QuickToolCard
            icon={<CalculatorIcon />}
            title="Zakat Calculator"
            description="Calculate your zakat on cash, gold, silver, and investments"
            href="/islamic-finance?tool=zakat"
          />
          <QuickToolCard
            icon={<BuildingIcon />}
            title="Waqf Explorer"
            description="Discover and contribute to ongoing waqf projects"
            href="/islamic-finance?tool=waqf"
          />
          <QuickToolCard
            icon={<HandCoinsIcon />}
            title="Qard Hasan"
            description="Request or offer interest-free loans within the community"
            href="/islamic-finance?tool=qardhasan"
          />
          <QuickToolCard
            icon={<ShieldIcon />}
            title="Takaful"
            description="Explore halal insurance and protection plans"
            href="/islamic-finance?tool=takaful"
          />
        </div>
      </section>
    </AppLayout>
  );
}

// Zakat Calculator Component
function ZakatCalculator() {
  const [assets, setAssets] = useState({
    cash: 0,
    gold: 0,
    silver: 0,
    investments: 0,
    businessInventory: 0,
    debts: 0,
  });
  const [result, setResult] = useState<{
    totalAssets: number;
    totalDebts: number;
    netWealth: number;
    nisabThreshold: number;
    meetsNisab: boolean;
    zakatDue: number;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleChange = (field: string, value: string) => {
    setAssets(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const calculateZakat = async () => {
    setIsCalculating(true);
    try {
      const response = await islamicFinance.calculateZakat(assets);
      // Map API response to component state structure
      setResult({
        totalAssets: response.totalAssets,
        totalDebts: assets.debts || 0, // Use input debts since API doesn't return it
        netWealth: response.totalAssets - (assets.debts || 0),
        nisabThreshold: response.nisabThreshold,
        meetsNisab: response.isZakatDue,
        zakatDue: response.zakatAmount,
      });
    } catch (err) {
      console.error('Failed to calculate zakat:', err);
      alert('Failed to calculate zakat. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="zakat-calculator">
      <div className="calculator-form">
        <h3>Your Assets</h3>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Cash & Bank Balance (£)</label>
            <input
              type="number"
              className="form-input"
              value={assets.cash || ''}
              onChange={(e) => handleChange('cash', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Value of Gold (£)</label>
            <input
              type="number"
              className="form-input"
              value={assets.gold || ''}
              onChange={(e) => handleChange('gold', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Value of Silver (£)</label>
            <input
              type="number"
              className="form-input"
              value={assets.silver || ''}
              onChange={(e) => handleChange('silver', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Investments & Stocks (£)</label>
            <input
              type="number"
              className="form-input"
              value={assets.investments || ''}
              onChange={(e) => handleChange('investments', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Business Inventory (£)</label>
            <input
              type="number"
              className="form-input"
              value={assets.businessInventory || ''}
              onChange={(e) => handleChange('businessInventory', e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Outstanding Debts (£)</label>
            <input
              type="number"
              className="form-input"
              value={assets.debts || ''}
              onChange={(e) => handleChange('debts', e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        
        <button 
          className="btn btn-primary mt-4"
          onClick={calculateZakat}
          disabled={isCalculating}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Zakat'}
        </button>
      </div>
      
      {result && (
        <div className="calculator-result">
          <h3>Zakat Calculation Result</h3>
          <div className="result-grid">
            <div className="result-item">
              <span className="result-label">Total Assets</span>
              <span className="result-value">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(result.totalAssets)}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Total Debts</span>
              <span className="result-value">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(result.totalDebts)}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Net Wealth</span>
              <span className="result-value">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(result.netWealth)}
              </span>
            </div>
            <div className="result-item">
              <span className="result-label">Nisab Threshold</span>
              <span className="result-value">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(result.nisabThreshold)}
              </span>
            </div>
          </div>
          
          <div className={`zakat-due ${result.meetsNisab ? 'payable' : 'not-payable'}`}>
            <div className="zakat-due-header">
              <span className="zakat-due-label">
                {result.meetsNisab ? 'Zakat Due (2.5%)' : 'Zakat Not Due'}
              </span>
              <span className="zakat-due-amount">
                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(result.zakatDue)}
              </span>
            </div>
            {!result.meetsNisab && (
              <p className="zakat-note">
                Your net wealth is below the Nisab threshold. Zakat is not obligatory at this time.
              </p>
            )}
            {result.meetsNisab && (
              <p className="zakat-note">
                Your net wealth meets the Nisab threshold. Please pay your Zakat to purify your wealth.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
