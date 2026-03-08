export interface ConnectionMockData {
  initials: string;
  name: string;
  title: string;
  badges?: string[];
  trustScore: number;
  type: 'connection' | 'pending' | 'suggested';
  meta?: string;
  sentTime?: string;
}

export const connectionMockData: ConnectionMockData[] = [
  {
    initials: 'YI',
    name: 'Yusuf Ibrahim',
    title: 'Islamic Finance Consultant',
    badges: ['Biometric', 'Business'],
    trustScore: 890,
    type: 'connection',
  },
  {
    initials: 'AP',
    name: 'Aisha Patel',
    title: 'Halal Food Business Owner',
    badges: ['Two-Witness', 'Institutional'],
    trustScore: 765,
    type: 'connection',
  },
  {
    initials: 'MA',
    name: 'Muhammad Ali',
    title: 'Real Estate Developer',
    badges: ['Biometric', 'Business', 'Institutional'],
    trustScore: 920,
    type: 'connection',
  },
  {
    initials: 'FA',
    name: 'Fatima Al-Rashid',
    title: 'Marketing Director',
    trustScore: 820,
    type: 'pending',
    meta: '12 mutual connections',
    sentTime: 'Sent 2 days ago',
  },
  {
    initials: 'OK',
    name: 'Omar Khan',
    title: 'Islamic Scholar',
    trustScore: 950,
    type: 'suggested',
    meta: '8 mutual connections',
    sentTime: 'Based on your profile',
  },
];


