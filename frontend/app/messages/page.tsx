'use client';

import { useState } from 'react';
import { AppLayout } from '../../components/layout';
import { sampleConversations, type Conversation } from '../../data/mocks/messages';
import '../../styles/messages.css';

// Page-specific icons
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

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation>(sampleConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

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
    <AppLayout activeNav="messages">
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
    </AppLayout>
  );
}
