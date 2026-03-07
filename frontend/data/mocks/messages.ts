export interface Message {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: number;
  name: string;
  initials: string;
  avatarColor: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  trustScore: number;
  isOnline: boolean;
  messages: Message[];
}

export const sampleConversations: Conversation[] = [
  {
    id: 1,
    name: 'Fatima Al-Rashid',
    initials: 'FA',
    avatarColor: 'var(--color-emerald-500)',
    lastMessage: 'That sounds like a great opportunity!',
    timestamp: '2m ago',
    unreadCount: 2,
    trustScore: 842,
    isOnline: true,
    messages: [
      {
        id: 1,
        senderId: 1,
        text: "As-salamu alaykum Ahmed! I hope you're doing well.",
        timestamp: '10:30 AM',
        status: 'read'
      },
      {
        id: 2,
        senderId: 2,
        text: "Wa alaykum as-salam Fatima! Alhamdulillah, I'm well. How about you?",
        timestamp: '10:32 AM',
        status: 'read'
      },
      {
        id: 3,
        senderId: 1,
        text: "Alhamdulillah, blessed. I wanted to discuss a halal investment opportunity with you. It's a real estate development project focused on affordable housing for Muslim families.",
        timestamp: '10:35 AM',
        status: 'read'
      },
      {
        id: 4,
        senderId: 2,
        text: 'That sounds interesting. Is it structured according to Islamic finance principles?',
        timestamp: '10:40 AM',
        status: 'read'
      },
      {
        id: 5,
        senderId: 1,
        text: "Absolutely. It's based on Musharakah (partnership) model. No riba involved. The minimum investment is $10,000 and projected returns are 8-12% annually.",
        timestamp: '10:45 AM',
        status: 'read'
      },
      {
        id: 6,
        senderId: 2,
        text: "That sounds like a great opportunity! I'd love to learn more. Can we schedule a meeting to discuss the details?",
        timestamp: '10:50 AM',
        status: 'read'
      },
      {
        id: 7,
        senderId: 1,
        text: "Of course! How about this Thursday after Jummah? I can share the prospectus with you then.",
        timestamp: '2m ago',
        status: 'delivered'
      },
      {
        id: 8,
        senderId: 1,
        text: 'Also, the project has been reviewed by three Shariah advisors including Sheikh Abdullah.',
        timestamp: '1m ago',
        status: 'delivered'
      }
    ]
  },
  {
    id: 2,
    name: 'Yusuf Ibrahim',
    initials: 'YI',
    avatarColor: 'var(--color-sapphire-500)',
    lastMessage: 'JazakAllah khair for the referral!',
    timestamp: '1h ago',
    unreadCount: 0,
    trustScore: 756,
    isOnline: false,
    messages: [
      {
        id: 1,
        senderId: 1,
        text: 'As-salamu alaykum brother!',
        timestamp: '9:00 AM',
        status: 'read'
      },
      {
        id: 2,
        senderId: 2,
        text: 'Wa alaykum as-salam! How are you?',
        timestamp: '9:15 AM',
        status: 'read'
      }
    ]
  },
  {
    id: 3,
    name: 'Aisha Patel',
    initials: 'AP',
    avatarColor: 'var(--color-amethyst-500)',
    lastMessage: 'The event is scheduled for next Friday',
    timestamp: '3h ago',
    unreadCount: 1,
    trustScore: 891,
    isOnline: true,
    messages: [
      {
        id: 1,
        senderId: 1,
        text: 'As-salamu alaykum Aisha!',
        timestamp: 'Yesterday',
        status: 'read'
      }
    ]
  },
  {
    id: 4,
    name: 'Omar Hassan',
    initials: 'OH',
    avatarColor: 'var(--color-gold-500)',
    lastMessage: 'Let me check my schedule and get back to you',
    timestamp: 'Yesterday',
    unreadCount: 0,
    trustScore: 723,
    isOnline: false,
    messages: []
  },
  {
    id: 5,
    name: 'Zainab Khan',
    initials: 'ZK',
    avatarColor: 'var(--color-ruby-500)',
    lastMessage: 'InshaAllah, we can discuss this further',
    timestamp: '2 days ago',
    unreadCount: 0,
    trustScore: 845,
    isOnline: true,
    messages: []
  }
];
