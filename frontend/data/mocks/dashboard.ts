export interface PillarCardData {
  href: string;
  arabic: string;
  title: string;
  description: string;
  stats: string;
  variant: 'earn' | 'build' | 'live' | 'protect';
}

export interface SuggestedConnection {
  initials: string;
  name: string;
  meta: string;
}

export const pillarCards: PillarCardData[] = [
  {
    href: '/marketplace/earn',
    arabic: 'رزق',
    title: 'EARN',
    description: 'Jobs, Freelancers, Professional Services, Education, Trades',
    stats: '1,247 opportunities',
    variant: 'earn',
  },
  {
    href: '/marketplace/build',
    arabic: 'بناء',
    title: 'BUILD',
    description: 'Ventures, Partnerships, Real Estate, Agriculture, Tech',
    stats: '89 ventures seeking investment',
    variant: 'build',
  },
  {
    href: '/marketplace/live',
    arabic: 'حياة',
    title: 'LIVE',
    description: 'Housing, Food, Travel, Wellness, Creative Services',
    stats: '356 service providers',
    variant: 'live',
  },
  {
    href: '/marketplace/protect',
    arabic: 'حفظ',
    title: 'PROTECT',
    description: 'Health, Security, Insurance, Legal, Advocacy',
    stats: '124 protection services',
    variant: 'protect',
  },
];

export const suggestedConnections: SuggestedConnection[] = [
  {
    initials: 'YI',
    name: 'Yusuf Ibrahim',
    meta: 'Islamic Finance • 12 mutual',
  },
  {
    initials: 'AP',
    name: 'Aisha Patel',
    meta: 'Halal Food • 8 mutual',
  },
];
