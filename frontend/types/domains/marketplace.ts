export interface MarketplaceItem {
  id: string;
  vertical: 'earn' | 'build' | 'live' | 'protect';
  category: string;
  subcategory?: string;
  provider: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
    badges: string[];
  };
  title: string;
  description: string;
  location: string;
  rate?: string;
  salary?: string;
  seeking?: number;
  raised?: number;
  price?: string;
  coverage?: string;
  units?: number;
}

export interface SadaqahCampaign {
  id: string;
  name: string;
  organization: string;
  description: string;
  goal: number;
  raised: number;
  donors: number;
  daysLeft: number;
  category: string;
  verified: boolean;
}

export interface Waqf {
  id: string;
  name: string;
  location: string;
  description: string;
  value: number;
  annualIncome: number;
  beneficiaries: number;
}

export interface QardHasanLoan {
  id: string;
  borrower: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
  };
  amount: number;
  purpose: string;
  term: number;
  repaid: number;
  lenders: number;
}

export interface FeedItem {
  id: string;
  type: 'job_posting' | 'venture_opportunity' | 'connection_update';
  author: {
    id: string;
    name: string;
    trustScore: number;
    verified: boolean;
  };
  title?: string;
  content: string;
  location?: string;
  salary?: string;
  fundingGoal?: number;
  fundingRaised?: number;
  postedAt: string;
  likes: number;
  comments: number;
}
