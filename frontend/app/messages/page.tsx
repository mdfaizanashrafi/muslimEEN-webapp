'use client';

import { useState } from 'react';
import Link from 'next/link';
import '../../styles/messages.css';

// Icons as components
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const LogoIcon = () => (
  <svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 0L19 12L32 16L19 20L16 32L13 20L0 16L13 12L16 0Z" fill="url(#header-star-messages)"/>
    <defs>
      <linearGradient id="header-star-messages" x1="0" y1="0" x2="32" y2="32">
        <stop offset="0%" stopColor="#059669"/>
        <stop offset="100%" stopColor="#047857"/>
      </linearGradient>
    </defs>
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const ProfileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const NetworkIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const MessagesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const AttachmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const VideoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const MoreIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

const NavLink = ({ href, icon, children, isActive, className = '' }: NavLinkProps) => (
  <Link 
    href={href} 
    className={`nav-link ${isActive ? 'active' : ''} ${className}`}
  >
    {icon && <span className="nav-link-icon">{icon}</span>}
    {children}
  </Link>
);

// Sample conversation data
interface Message {
  id: number;
  senderId: number;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
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

const sampleConversations: Conversation[] = [
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
        text: 'As-salamu alaykum Ahmed! I hope you\'re doing well.',
        timestamp: '10:30 AM',
        status: 'read'
      },
      {
        id: 2,
        senderId: 2,
        text: 'Wa alaykum as-salam Fatima! Alhamdulillah, I\'m well. How about you?',
        timestamp: '10:32 AM',
        status: 'read'
      },
      {
        id: 3,
        senderId: 1,
        text: 'Alhamdulillah, blessed. I wanted to discuss a halal investment opportunity with you. It\'s a real estate development project focused on affordable housing for Muslim families.',
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
        text: 'Absolutely. It\'s based on Musharakah (partnership) model. No riba involved. The minimum investment is $10,000 and projected returns are 8-12% annually.',
        timestamp: '10:45 AM',
        status: 'read'
      },
      {
        id: 6,
        senderId: 2,
        text: 'That sounds like a great opportunity! I\'d love to learn more. Can we schedule a meeting to discuss the details?',
        timestamp: '10:50 AM',
        status: 'read'
      },
      {
        id: 7,
        senderId: 1,
        text: 'Of course! How about this Thursday after Jummah? I can share the prospectus with you then.',
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

export default function MessagesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(sampleConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      // In a real app, this would send the message to the backend
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const filteredConversations = sampleConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTrustScoreClass = (score: number) => {
    if (score >= 800) return 'high';
    if (score >= 600) return 'medium';
    return 'low';
  };

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button 
            type="button" 
            className="header-menu-toggle btn btn-ghost" 
            onClick={toggleSidebar}
            aria-label="Toggle menu"
          >
            <MenuIcon />
          </button>
          
          <Link href="/dashboard" className="header-logo">
            <LogoIcon />
            <span>MuslimEEN</span>
          </Link>
          
          <nav className="header-nav">
            <ul className="nav">
              <li><NavLink href="/dashboard">Home</NavLink></li>
              <li><NavLink href="/profile">Profile</NavLink></li>
              <li><NavLink href="/connections">Network</NavLink></li>
              <li><NavLink href="/messages" isActive>Messages</NavLink></li>
            </ul>
          </nav>
          
          <div className="header-actions">
            <div className={`dropdown ${isDropdownOpen ? 'open' : ''}`}>
              <button 
                type="button" 
                className="btn btn-ghost flex items-center gap-2"
                onClick={toggleDropdown}
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <div className="avatar avatar-sm">AH</div>
                <span className="hidden md:inline">Ahmed Hassan</span>
              </button>
              <div className="dropdown-menu">
                <Link href="/profile" className="dropdown-item">Your Profile</Link>
                <Link href="/verification" className="dropdown-item">Verification Status</Link>
                <Link href="/settings" className="dropdown-item">Settings</Link>
                <div className="dropdown-divider"></div>
                <Link href="/" className="dropdown-item">Sign Out</Link>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      ></div>
      
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          <div className="sidebar-user">
            <div className="avatar avatar-lg mx-auto">AH</div>
            <h3 className="text-center mt-3 font-semibold">Ahmed Hassan</h3>
            <p className="text-center text-sm text-secondary">Software Engineer</p>
            <div className="trust-score-container mt-3">
              <div className="trust-score-header justify-center">
                <span className="trust-score-value high">785</span>
                <span className="text-sm text-secondary">/1000</span>
              </div>
              <div className="trust-score-bar">
                <div className="trust-score-fill high" style={{ width: '78.5%' }}></div>
              </div>
            </div>
          </div>
          
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h4 className="nav-section-title">Main</h4>
              <ul className="nav-list">
                <li>
                  <NavLink href="/dashboard" icon={<DashboardIcon />}>
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/profile" icon={<ProfileIcon />}>
                    Profile
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/connections" icon={<NetworkIcon />}>
                    My Network
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/messages" icon={<MessagesIcon />} isActive>
                    Messages
                  </NavLink>
                </li>
              </ul>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-section-title">Marketplace</h4>
              <ul className="nav-list">
                <li>
                  <NavLink href="/marketplace/earn" className="nav-link-pillar">
                    <span className="nav-icon earn">رزق</span> EARN
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/marketplace/build" className="nav-link-pillar">
                    <span className="nav-icon build">بناء</span> BUILD
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/marketplace/live" className="nav-link-pillar">
                    <span className="nav-icon live">حياة</span> LIVE
                  </NavLink>
                </li>
                <li>
                  <NavLink href="/marketplace/protect" className="nav-link-pillar">
                    <span className="nav-icon protect">حفظ</span> PROTECT
                  </NavLink>
                </li>
              </ul>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-section-title">Islamic Finance</h4>
              <ul className="nav-list">
                <li><NavLink href="/islamic-finance?tool=sadaqah">Sadaqah</NavLink></li>
                <li><NavLink href="/islamic-finance?tool=waqf">Waqf</NavLink></li>
                <li><NavLink href="/islamic-finance?tool=zakat">Zakat Calculator</NavLink></li>
                <li><NavLink href="/islamic-finance?tool=qardhasan">Qard Hasan</NavLink></li>
              </ul>
            </div>
            
            <div className="nav-section">
              <h4 className="nav-section-title">Trust & Safety</h4>
              <ul className="nav-list">
                <li><NavLink href="/verification">Verification Status</NavLink></li>
                <li><NavLink href="/trust-score">Trust Score</NavLink></li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="main with-sidebar">
        <div className="messages-container">
          {/* Conversations Sidebar */}
          <div className="conversations-sidebar">
            <div className="conversations-header">
              <h2>Messages</h2>
              <button className="btn btn-primary btn-sm">
                <PlusIcon />
                New
              </button>
            </div>
            
            <div className="conversations-search">
              <div className="search-input-wrapper">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            
            <div className="conversations-list">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`conversation-item ${selectedConversation.id === conversation.id ? 'active' : ''} ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div 
                    className="conversation-avatar"
                    style={{ backgroundColor: conversation.avatarColor }}
                  >
                    {conversation.initials}
                    {conversation.isOnline && <span className="online-indicator"></span>}
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header-row">
                      <span className="conversation-name">{conversation.name}</span>
                      <span className="conversation-time">{conversation.timestamp}</span>
                    </div>
                    <div className="conversation-preview-row">
                      <span className="conversation-preview">{conversation.lastMessage}</span>
                      {conversation.unreadCount > 0 && (
                        <span className="unread-badge">{conversation.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="chat-area">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-info">
                <div 
                  className="chat-header-avatar"
                  style={{ backgroundColor: selectedConversation.avatarColor }}
                >
                  {selectedConversation.initials}
                  {selectedConversation.isOnline && <span className="online-indicator"></span>}
                </div>
                <div className="chat-header-details">
                  <h3>{selectedConversation.name}</h3>
                  <div className="chat-header-meta">
                    <span className={`trust-badge ${getTrustScoreClass(selectedConversation.trustScore)}`}>
                      Trust: {selectedConversation.trustScore}
                    </span>
                    <span className="status-text">
                      {selectedConversation.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="btn btn-ghost btn-icon" aria-label="Voice call">
                  <PhoneIcon />
                </button>
                <button className="btn btn-ghost btn-icon" aria-label="Video call">
                  <VideoIcon />
                </button>
                <button className="btn btn-ghost btn-icon" aria-label="More options">
                  <MoreIcon />
                </button>
              </div>
            </div>
            
            {/* Messages List */}
            <div className="messages-list">
              {selectedConversation.messages.map((message, index) => {
                const isSent = message.senderId === 2;
                const showAvatar = index === 0 || 
                  selectedConversation.messages[index - 1].senderId !== message.senderId;
                
                return (
                  <div
                    key={message.id}
                    className={`message ${isSent ? 'sent' : 'received'}`}
                  >
                    {!isSent && showAvatar && (
                      <div 
                        className="message-avatar"
                        style={{ backgroundColor: selectedConversation.avatarColor }}
                      >
                        {selectedConversation.initials}
                      </div>
                    )}
                    <div className="message-content">
                      <div className="message-bubble">
                        <p>{message.text}</p>
                      </div>
                      <div className="message-meta">
                        <span className="message-time">{message.timestamp}</span>
                        {isSent && (
                          <span className={`message-status ${message.status}`}>
                            {message.status === 'read' ? '✓✓' : '✓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Message Input */}
            <form className="message-input-area" onSubmit={handleSendMessage}>
              <button 
                type="button" 
                className="btn btn-ghost btn-icon attachment-btn"
                aria-label="Add attachment"
              >
                <AttachmentIcon />
              </button>
              <div className="message-input-wrapper">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="message-input"
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary btn-icon send-btn"
                aria-label="Send message"
                disabled={!messageInput.trim()}
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
