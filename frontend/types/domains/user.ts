export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: 'muslim_verified' | 'muslim_unverified' | 'non_muslim' | 'business_provider';
  verificationTier: 'basic' | 'full' | 'business';
  trustScore: number;
  trustScoreHistory: Array<{ date: string; score: number }>;
  bio: string;
  location: string;
  industry: string;
  skills: string[];
  endorsements: number;
  connections: number;
  profileViews: number;
  isWitnessEligible: boolean;
  badges: ('biometric' | 'two_witness' | 'business' | 'institutional')[];
  workHistory: WorkHistory[];
  education: Education[];
  createdAt: string;
  lastLogin: string;
}

export interface WorkHistory {
  id: string;
  company: string;
  title: string;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
}
