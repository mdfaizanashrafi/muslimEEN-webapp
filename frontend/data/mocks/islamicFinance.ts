export interface SadaqahCampaign {
  category: string;
  categoryColor: 'red' | 'green' | 'blue';
  title: string;
  description: string;
  raised: string;
  goal: string;
  progress: number;
  donors: number;
  daysLeft: number;
  orgName: string;
  orgInitials: string;
}

export interface WaqfListing {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'upcoming';
}

export interface QardHasanLoan {
  id: string;
  borrowerName: string;
  amount: string;
  purpose: string;
  status: 'funded' | 'seeking' | 'repaid';
}

export const sadaqahCampaigns: SadaqahCampaign[] = [
  {
    category: 'Emergency Relief',
    categoryColor: 'red',
    title: 'Emergency Relief Fund',
    description: 'Help provide urgent aid to families affected by recent disasters. Your sadaqah can save lives.',
    raised: '£67,000',
    goal: '£100,000',
    progress: 67,
    donors: 234,
    daysLeft: 12,
    orgName: 'Muslim Aid UK',
    orgInitials: 'MA',
  },
  {
    category: 'Education',
    categoryColor: 'green',
    title: 'Islamic School Building',
    description: 'Support the construction of a new Islamic school in Birmingham. Educating the next generation.',
    raised: '£125,000',
    goal: '£250,000',
    progress: 50,
    donors: 456,
    daysLeft: 45,
    orgName: 'EduCare Foundation',
    orgInitials: 'EC',
  },
  {
    category: 'Water',
    categoryColor: 'blue',
    title: 'Clean Water Wells',
    description: 'Build sustainable water wells in drought-affected regions. Sadaqah jariyah that keeps giving.',
    raised: '£34,500',
    goal: '£50,000',
    progress: 69,
    donors: 189,
    daysLeft: 23,
    orgName: 'Water Relief Intl',
    orgInitials: 'WR',
  },
];

export const waqfListings: WaqfListing[] = [
  {
    id: '1',
    name: 'Community Center Waqf',
    description: 'Endowment for a local community center serving the Muslim community',
    status: 'active',
  },
  {
    id: '2',
    name: 'Educational Scholarship Waqf',
    description: 'Supporting Islamic education for underprivileged students',
    status: 'upcoming',
  },
];

export const qardHasanLoans: QardHasanLoan[] = [
  {
    id: '1',
    borrowerName: 'Ahmed Khan',
    amount: '£5,000',
    purpose: 'Small business startup',
    status: 'seeking',
  },
  {
    id: '2',
    borrowerName: 'Fatima Ali',
    amount: '£3,000',
    purpose: 'Medical expenses',
    status: 'funded',
  },
];
