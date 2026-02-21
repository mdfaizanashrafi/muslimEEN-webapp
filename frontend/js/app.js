/**
 * MuslimEEN - Muslim Economic Empowerment Network
 * Main Application JavaScript
 * 
 * Lightweight vanilla JS implementation for maximum performance
 * No external frameworks - under 50KB gzipped
 */

(function() {
  'use strict';

  // ==========================================================================
  // Configuration & Constants
  // ==========================================================================
  
  const CONFIG = {
    API_BASE_URL: '/api/v1',
    STORAGE_KEY: 'muslimeen_session',
    THEME_KEY: 'muslimeen_theme',
    SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
    NOTIFICATION_POLL_INTERVAL: 30000, // 30 seconds
    TRUST_SCORE_MAX: 1000,
    TRUST_SCORE_MIN: 0,
    VERIFICATION_TIERS: {
      BASIC: 'basic',
      FULL: 'full',
      BUSINESS: 'business'
    },
    USER_ROLES: {
      MUSLIM_VERIFIED: 'muslim_verified',
      MUSLIM_UNVERIFIED: 'muslim_unverified',
      NON_MUSLIM: 'non_muslim',
      BUSINESS_PROVIDER: 'business_provider'
    }
  };

  // ==========================================================================
  // State Management
  // ==========================================================================
  
  const State = {
    user: null,
    isAuthenticated: false,
    notifications: [],
    connections: [],
    messages: [],
    currentPage: 'login',
    sidebarOpen: false,
    theme: 'light',
    
    // Mock data for development
    mockData: {
      user: {
        id: 'usr_001',
        email: 'ahmed@example.com',
        firstName: 'Ahmed',
        lastName: 'Hassan',
        fullName: 'Ahmed Hassan',
        role: 'muslim_verified',
        verificationTier: 'full',
        trustScore: 785,
        trustScoreHistory: [
          { date: '2024-01-01', score: 700 },
          { date: '2024-02-01', score: 720 },
          { date: '2024-03-01', score: 750 },
          { date: '2024-04-01', score: 770 },
          { date: '2024-05-01', score: 785 }
        ],
        bio: 'Software Engineer | Islamic Finance Enthusiast | Building ethical tech solutions',
        location: 'London, UK',
        industry: 'Technology',
        skills: ['JavaScript', 'Islamic Finance', 'Project Management', 'Community Building'],
        endorsements: 47,
        connections: 234,
        profileViews: 128,
        isWitnessEligible: true,
        badges: ['biometric', 'two_witness', 'institutional'],
        workHistory: [
          {
            id: 'wh_001',
            company: 'HalalTech Solutions',
            title: 'Senior Software Engineer',
            startDate: '2022-03-01',
            endDate: null,
            current: true,
            description: 'Leading development of Shariah-compliant fintech solutions'
          },
          {
            id: 'wh_002',
            company: 'Global Devs Inc',
            title: 'Full Stack Developer',
            startDate: '2019-06-01',
            endDate: '2022-02-28',
            current: false,
            description: 'Built scalable web applications for enterprise clients'
          }
        ],
        education: [
          {
            id: 'edu_001',
            institution: 'University of Manchester',
            degree: 'MSc Computer Science',
            startDate: '2017-09-01',
            endDate: '2019-05-01'
          }
        ],
        createdAt: '2023-01-15T10:30:00Z',
        lastLogin: '2024-05-20T08:45:00Z'
      },
      
      notifications: [
        {
          id: 'notif_001',
          type: 'connection_request',
          title: 'New Connection Request',
          message: 'Fatima Al-Rashid wants to connect with you',
          read: false,
          createdAt: '2024-05-20T09:00:00Z',
          actor: {
            id: 'usr_002',
            name: 'Fatima Al-Rashid',
            trustScore: 820
          }
        },
        {
          id: 'notif_002',
          type: 'endorsement',
          title: 'New Endorsement',
          message: 'Omar Khan endorsed you for Islamic Finance',
          read: false,
          createdAt: '2024-05-19T14:30:00Z',
          actor: {
            id: 'usr_003',
            name: 'Omar Khan',
            trustScore: 910
          }
        },
        {
          id: 'notif_003',
          type: 'trust_score',
          title: 'Trust Score Increased',
          message: 'Your trust score increased by 15 points',
          read: true,
          createdAt: '2024-05-18T10:00:00Z'
        }
      ],
      
      connections: [
        {
          id: 'usr_004',
          name: 'Yusuf Ibrahim',
          title: 'Islamic Finance Consultant',
          trustScore: 890,
          mutualConnections: 12,
          verified: true,
          badges: ['biometric', 'business']
        },
        {
          id: 'usr_005',
          name: 'Aisha Patel',
          title: 'Halal Food Business Owner',
          trustScore: 765,
          mutualConnections: 8,
          verified: true,
          badges: ['two_witness', 'institutional']
        },
        {
          id: 'usr_006',
          name: 'Muhammad Ali',
          title: 'Real Estate Developer',
          trustScore: 920,
          mutualConnections: 23,
          verified: true,
          badges: ['biometric', 'business', 'institutional']
        }
      ],
      
      feed: [
        {
          id: 'feed_001',
          type: 'job_posting',
          author: {
            id: 'usr_007',
            name: 'Islamic Bank of Britain',
            trustScore: 950,
            verified: true
          },
          title: 'Senior Islamic Finance Analyst',
          content: 'We are seeking an experienced Islamic Finance Analyst to join our Shariah compliance team...',
          location: 'London, UK',
          salary: '£60,000 - £80,000',
          postedAt: '2024-05-20T08:00:00Z',
          likes: 24,
          comments: 8
        },
        {
          id: 'feed_002',
          type: 'venture_opportunity',
          author: {
            id: 'usr_008',
            name: 'GreenWaqf Initiative',
            trustScore: 780,
            verified: true
          },
          title: 'Sustainable Agriculture Waqf Project',
          content: 'Seeking investors for a 50-acre sustainable farming project. Expected returns: 6-8% annually...',
          fundingGoal: 500000,
          fundingRaised: 320000,
          postedAt: '2024-05-19T16:00:00Z',
          likes: 56,
          comments: 23
        },
        {
          id: 'feed_003',
          type: 'connection_update',
          author: {
            id: 'usr_002',
            name: 'Fatima Al-Rashid',
            trustScore: 820,
            verified: true
          },
          content: 'Fatima Al-Rashid and 3 others connected with Yusuf Ibrahim',
          postedAt: '2024-05-19T12:00:00Z',
          likes: 12,
          comments: 0
        }
      ],
      
      marketplace: {
        earn: [
          {
            id: 'svc_001',
            provider: {
              id: 'usr_009',
              name: 'Dr. Amina Hassan',
              trustScore: 945,
              verified: true
            },
            category: 'Professional Services',
            subcategory: 'Medical',
            title: 'Halal Cosmetic Surgery Consultation',
            description: 'Board-certified surgeon specializing in reconstructive procedures...',
            rate: '£200 consultation',
            location: 'Manchester, UK',
            endorsements: 34
          },
          {
            id: 'svc_002',
            provider: {
              id: 'usr_010',
              name: 'Ibrahim Law Associates',
              trustScore: 890,
              verified: true
            },
            category: 'Professional Services',
            subcategory: 'Legal',
            title: 'Islamic Inheritance Planning',
            description: 'Expert guidance on Shariah-compliant estate planning...',
            rate: '£150/hour',
            location: 'London, UK',
            endorsements: 28
          }
        ],
        build: [
          {
            id: 'vnt_001',
            founder: {
              id: 'usr_011',
              name: 'Kareem Abdullah',
              trustScore: 760,
              verified: true
            },
            name: 'TakafulTech',
            description: 'Digital platform connecting Muslims with Shariah-compliant insurance providers',
            stage: 'Seed',
            seeking: 250000,
            raised: 180000,
            location: 'Birmingham, UK',
            industry: 'InsurTech'
          }
        ],
        live: [
          {
            id: 'lve_001',
            provider: {
              id: 'usr_012',
              name: 'GreenHalal Homes',
              trustScore: 810,
              verified: true
            },
            category: 'Housing',
            title: 'Eco-Friendly Halal Housing Development',
            description: 'Sustainable living community with prayer facilities and halal amenities',
            location: 'Leeds, UK',
            price: '£250,000 - £450,000',
            units: 24
          }
        ],
        protect: [
          {
            id: 'prt_001',
            provider: {
              id: 'usr_013',
              name: 'SecureUmmah',
              trustScore: 880,
              verified: true
            },
            category: 'Security',
            title: 'Community Security Services',
            description: '24/7 security monitoring for Islamic institutions and businesses',
            coverage: 'Nationwide UK',
            monthlyRate: '£500+'
          }
        ]
      },
      
      islamicFinance: {
        sadaqah: [
          {
            id: 'sdq_001',
            name: 'Emergency Relief Fund',
            organization: 'Muslim Aid UK',
            description: 'Providing emergency assistance to families affected by crisis',
            goal: 100000,
            raised: 67000,
            donors: 234,
            daysLeft: 15
          }
        ],
        waqf: [
          {
            id: 'wqf_001',
            name: 'Community Center Waqf',
            location: 'East London',
            description: 'Permanent endowment supporting a community center and masjid',
            value: 2500000,
            annualIncome: 75000,
            beneficiaries: 1200
          }
        ],
        qardHasan: [
          {
            id: 'qh_001',
            borrower: {
              id: 'usr_014',
              name: 'Small Business Owner',
              trustScore: 720,
              verified: true
            },
            amount: 5000,
            purpose: 'Equipment purchase for halal catering business',
            term: 12,
            repaid: 2500,
            lenders: 3
          }
        ]
      }
    }
  };

  // ==========================================================================
  // DOM Utilities
  // ==========================================================================
  
  const DOM = {
    $(selector, context = document) {
      return context.querySelector(selector);
    },
    
    $$(selector, context = document) {
      return Array.from(context.querySelectorAll(selector));
    },
    
    create(tag, attrs = {}, children = []) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
          el.className = value;
        } else if (key === 'dataset') {
          Object.assign(el.dataset, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
          el.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
          el.setAttribute(key, value);
        }
      });
      children.forEach(child => {
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else if (child) {
          el.appendChild(child);
        }
      });
      return el;
    },
    
    on(element, event, handler, options = {}) {
      element.addEventListener(event, handler, options);
      return () => element.removeEventListener(event, handler, options);
    },
    
    toggleClass(element, className, force) {
      if (force !== undefined) {
        element.classList.toggle(className, force);
      } else {
        element.classList.toggle(className);
      }
    },
    
    show(element) {
      element.classList.remove('hidden');
      element.style.display = '';
    },
    
    hide(element) {
      element.classList.add('hidden');
    }
  };

  // ==========================================================================
  // Storage Utilities
  // ==========================================================================
  
  const Storage = {
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (e) {
        console.error('Storage get error:', e);
        return defaultValue;
      }
    },
    
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Storage set error:', e);
        return false;
      }
    },
    
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('Storage remove error:', e);
        return false;
      }
    },
    
    clear() {
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.error('Storage clear error:', e);
        return false;
      }
    }
  };

  // ==========================================================================
  // API Client (Mock for frontend development)
  // ==========================================================================
  
  const API = {
    async request(endpoint, options = {}) {
      const url = `${CONFIG.API_BASE_URL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      };
      
      // Add auth token if available
      const session = Storage.get(CONFIG.STORAGE_KEY);
      if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
      }
      
      // For development, return mock data
      if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
        return API.mockRequest(endpoint, config);
      }
      
      try {
        const response = await fetch(url, config);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    },
    
    async mockRequest(endpoint, config) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const method = config.method || 'GET';
      const body = config.body ? JSON.parse(config.body) : null;
      
      // Auth endpoints
      if (endpoint === '/auth/validate-invitation') {
        return {
          valid: body?.invitationCode?.length === 12,
          message: body?.invitationCode?.length === 12 ? 'Invitation valid' : 'Invalid invitation code'
        };
      }
      
      if (endpoint === '/auth/login') {
        if (body?.email && body?.password) {
          return {
            success: true,
            token: 'mock_jwt_token_' + Date.now(),
            user: State.mockData.user
          };
        }
        return { success: false, message: 'Invalid credentials' };
      }
      
      if (endpoint === '/auth/logout') {
        return { success: true };
      }
      
      // User endpoints
      if (endpoint === '/user/profile') {
        if (method === 'GET') {
          return { user: State.mockData.user };
        }
        if (method === 'PUT') {
          State.mockData.user = { ...State.mockData.user, ...body };
          return { user: State.mockData.user };
        }
      }
      
      if (endpoint === '/user/notifications') {
        return { notifications: State.mockData.notifications };
      }
      
      if (endpoint === '/user/connections') {
        return { connections: State.mockData.connections };
      }
      
      if (endpoint === '/user/trust-score') {
        return {
          score: State.mockData.user.trustScore,
          history: State.mockData.user.trustScoreHistory,
          factors: [
            { name: 'Profile Completeness', impact: 50, positive: true },
            { name: 'Connection Quality', impact: 30, positive: true },
            { name: 'Community Contributions', impact: 25, positive: true },
            { name: 'Verification Level', impact: 100, positive: true }
          ]
        };
      }
      
      // Feed endpoint
      if (endpoint === '/feed') {
        return { items: State.mockData.feed };
      }
      
      // Marketplace endpoints
      if (endpoint.startsWith('/marketplace/')) {
        const vertical = endpoint.split('/')[2];
        return { items: State.mockData.marketplace[vertical] || [] };
      }
      
      // Islamic Finance endpoints
      if (endpoint.startsWith('/islamic-finance/')) {
        const tool = endpoint.split('/')[2];
        return { items: State.mockData.islamicFinance[tool] || [] };
      }
      
      // Messaging endpoints
      if (endpoint === '/messages') {
        return { messages: State.mockData.messages };
      }
      
      return { error: 'Endpoint not implemented in mock' };
    },
    
    // Convenience methods
    get(endpoint) {
      return this.request(endpoint, { method: 'GET' });
    },
    
    post(endpoint, data) {
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    
    put(endpoint, data) {
      return this.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    
    delete(endpoint) {
      return this.request(endpoint, { method: 'DELETE' });
    }
  };

  // ==========================================================================
  // Authentication Module
  // ==========================================================================
  
  const Auth = {
    async validateInvitation(code) {
      try {
        const response = await API.post('/auth/validate-invitation', {
          invitationCode: code
        });
        return response;
      } catch (error) {
        return { valid: false, message: error.message };
      }
    },
    
    async login(email, password, invitationCode = null) {
      try {
        const response = await API.post('/auth/login', {
          email,
          password,
          invitationCode
        });
        
        if (response.success) {
          State.user = response.user;
          State.isAuthenticated = true;
          Storage.set(CONFIG.STORAGE_KEY, {
            token: response.token,
            user: response.user,
            expiresAt: Date.now() + CONFIG.SESSION_DURATION
          });
          return { success: true };
        }
        
        return { success: false, message: response.message };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
    
    async logout() {
      try {
        await API.post('/auth/logout', {});
      } catch (e) {
        // Ignore logout errors
      }
      
      State.user = null;
      State.isAuthenticated = false;
      Storage.remove(CONFIG.STORAGE_KEY);
      return { success: true };
    },
    
    checkSession() {
      const session = Storage.get(CONFIG.STORAGE_KEY);
      if (session && session.expiresAt > Date.now()) {
        State.user = session.user;
        State.isAuthenticated = true;
        return true;
      }
      
      // Clear expired session
      if (session) {
        Storage.remove(CONFIG.STORAGE_KEY);
      }
      return false;
    },
    
    isLoggedIn() {
      return State.isAuthenticated;
    },
    
    getUser() {
      return State.user;
    },
    
    hasRole(role) {
      return State.user?.role === role;
    },
    
    isVerified() {
      return State.user?.verificationTier !== CONFIG.VERIFICATION_TIERS.BASIC;
    },
    
    canAccessIslamicFinance() {
      return State.user?.role === CONFIG.USER_ROLES.MUSLIM_VERIFIED;
    },
    
    canWitness() {
      return State.user?.isWitnessEligible && State.user?.trustScore >= 200;
    }
  };

  // ==========================================================================
  // UI Components
  // ==========================================================================
  
  const Components = {
    // Trust Score Display
    trustScore(score, showHistory = false) {
      const level = score >= 700 ? 'high' : score >= 200 ? 'medium' : 'low';
      const percentage = Math.min(100, (score / CONFIG.TRUST_SCORE_MAX) * 100);
      
      const container = DOM.create('div', { className: 'trust-score-container' }, [
        DOM.create('div', { className: 'trust-score-header' }, [
          DOM.create('span', { className: `trust-score-value ${level}` }, [`${score}`]),
          DOM.create('span', { className: 'text-sm text-secondary' }, ['/1000'])
        ]),
        DOM.create('div', { className: 'trust-score-bar' }, [
          DOM.create('div', { 
            className: `trust-score-fill ${level}`,
            style: `width: ${percentage}%`
          })
        ]),
        showHistory ? this.trustScoreHistory(State.mockData.user.trustScoreHistory) : null
      ]);
      
      return container;
    },
    
    // Trust Score History Chart (Simple SVG)
    trustScoreHistory(history) {
      if (!history || history.length === 0) return null;
      
      const width = 300;
      const height = 80;
      const padding = 10;
      
      const maxScore = Math.max(...history.map(h => h.score));
      const minScore = Math.min(...history.map(h => h.score));
      const range = maxScore - minScore || 1;
      
      const points = history.map((item, index) => {
        const x = padding + (index / (history.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((item.score - minScore) / range) * (height - 2 * padding);
        return `${x},${y}`;
      }).join(' ');
      
      const svg = DOM.create('svg', {
        width: '100%',
        height: height,
        viewBox: `0 0 ${width} ${height}`,
        className: 'mt-4'
      }, [
        DOM.create('polyline', {
          fill: 'none',
          stroke: 'var(--color-emerald-500)',
          'stroke-width': '2',
          points
        })
      ]);
      
      return svg;
    },
    
    // Verification Badge
    verificationBadge(type, verified = true) {
      const badges = {
        biometric: { icon: '✓', label: 'Biometric Verified' },
        two_witness: { icon: '✓', label: 'Two-Witness Verified' },
        business: { icon: '✓', label: 'Business Verified' },
        institutional: { icon: '✓', label: 'Institutional Fast-Track' }
      };
      
      const badge = badges[type];
      if (!badge) return null;
      
      return DOM.create('span', {
        className: `verification-badge ${verified ? 'verified' : 'unverified'}`
      }, [
        verified ? badge.icon : '○',
        ` ${badge.label}`
      ]);
    },
    
    // Connection Card
    connectionCard(connection) {
      return DOM.create('div', { className: 'connection-card' }, [
        DOM.create('div', { className: 'avatar avatar-lg' }, [
          connection.name.split(' ').map(n => n[0]).join('')
        ]),
        DOM.create('div', { className: 'connection-info' }, [
          DOM.create('div', { className: 'connection-name' }, [connection.name]),
          DOM.create('div', { className: 'connection-meta' }, [
            connection.title,
            connection.mutualConnections ? ` • ${connection.mutualConnections} mutual` : ''
          ]),
          DOM.create('div', { className: 'verification-badges mt-2' },
            connection.badges?.map(b => this.verificationBadge(b)) || []
          )
        ]),
        DOM.create('div', { className: 'trust-score-container' }, [
          DOM.create('div', { className: 'trust-score-header' }, [
            DOM.create('span', { 
              className: `trust-score-value ${connection.trustScore >= 700 ? 'high' : connection.trustScore >= 200 ? 'medium' : 'low'}` 
            }, [`${connection.trustScore}`])
          ]),
          DOM.create('div', { className: 'trust-score-bar' }, [
            DOM.create('div', {
              className: `trust-score-fill ${connection.trustScore >= 700 ? 'high' : connection.trustScore >= 200 ? 'medium' : 'low'}`,
              style: `width: ${(connection.trustScore / 1000) * 100}%`
            })
          ])
        ])
      ]);
    },
    
    // Feed Item
    feedItem(item) {
      const typeLabels = {
        job_posting: '💼 Job Opportunity',
        venture_opportunity: '🚀 Investment Opportunity',
        connection_update: '👥 Network Update',
        endorsement: '⭐ New Endorsement'
      };
      
      return DOM.create('div', { className: 'card mb-4' }, [
        DOM.create('div', { className: 'card-header' }, [
          DOM.create('div', { className: 'flex items-center gap-3' }, [
            DOM.create('div', { className: 'avatar' }, [
              item.author.name.split(' ').map(n => n[0]).join('')
            ]),
            DOM.create('div', {}, [
              DOM.create('div', { className: 'font-semibold' }, [item.author.name]),
              DOM.create('div', { className: 'text-sm text-secondary' }, [
                typeLabels[item.type] || item.type,
                ' • ',
                this.timeAgo(item.postedAt)
              ])
            ]),
            DOM.create('div', { className: 'ml-auto' }, [
              DOM.create('span', {
                className: `badge badge-trust-${item.author.trustScore >= 700 ? 'high' : item.author.trustScore >= 200 ? 'medium' : 'low'}`
              }, [`${item.author.trustScore} TRUST`])
            ])
          ])
        ]),
        DOM.create('div', { className: 'card-body' }, [
          item.title ? DOM.create('h4', { className: 'mb-2' }, [item.title]) : null,
          DOM.create('p', { className: 'text-secondary' }, [item.content]),
          item.location ? DOM.create('div', { className: 'text-sm text-secondary mt-2' }, [
            '📍 ', item.location
          ]) : null,
          item.salary ? DOM.create('div', { className: 'text-sm text-secondary' }, [
            '💰 ', item.salary
          ]) : null,
          item.fundingGoal ? DOM.create('div', { className: 'mt-4' }, [
            DOM.create('div', { className: 'flex justify-between text-sm mb-1' }, [
              DOM.create('span', {}, ['Raised: £' + item.fundingRaised.toLocaleString()]),
              DOM.create('span', {}, ['Goal: £' + item.fundingGoal.toLocaleString()])
            ]),
            DOM.create('div', { className: 'progress' }, [
              DOM.create('div', {
                className: 'progress-bar',
                style: `width: ${(item.fundingRaised / item.fundingGoal) * 100}%`
              })
            ])
          ]) : null
        ]),
        DOM.create('div', { className: 'card-footer' }, [
          DOM.create('div', { className: 'flex gap-4' }, [
            DOM.create('button', { className: 'btn btn-ghost btn-sm' }, [
              '👍 ', item.likes || 0
            ]),
            DOM.create('button', { className: 'btn btn-ghost btn-sm' }, [
              '💬 ', item.comments || 0
            ]),
            DOM.create('button', { className: 'btn btn-ghost btn-sm' }, [
              '↗️ Share'
            ])
          ])
        ])
      ]);
    },
    
    // Notification Item
    notificationItem(notification) {
      const typeIcons = {
        connection_request: '👤',
        endorsement: '⭐',
        trust_score: '📈',
        message: '💬',
        verification: '✓'
      };
      
      return DOM.create('div', {
        className: `dropdown-item ${notification.read ? '' : 'bg-emerald-50'}`,
        dataset: { id: notification.id }
      }, [
        DOM.create('span', { className: 'text-lg' }, [typeIcons[notification.type] || '🔔']),
        DOM.create('div', { className: 'flex-1' }, [
          DOM.create('div', { className: 'font-medium' }, [notification.title]),
          DOM.create('div', { className: 'text-sm text-secondary' }, [notification.message]),
          DOM.create('div', { className: 'text-xs text-tertiary mt-1' }, [
            this.timeAgo(notification.createdAt)
          ])
        ])
      ]);
    },
    
    // Countdown Timer
    countdown(targetDate) {
      const container = DOM.create('div', { className: 'countdown' });
      
      const update = () => {
        const now = new Date().getTime();
        const target = new Date(targetDate).getTime();
        const diff = target - now;
        
        if (diff <= 0) {
          container.innerHTML = '<span class="countdown-value">Expired</span>';
          return;
        }
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        container.innerHTML = `
          <span class="countdown-value">${days}d</span>
          <span class="countdown-label">:</span>
          <span class="countdown-value">${hours}h</span>
          <span class="countdown-label">:</span>
          <span class="countdown-value">${minutes}m</span>
          <span class="countdown-label">remaining</span>
        `;
      };
      
      update();
      setInterval(update, 60000); // Update every minute
      
      return container;
    },
    
    // Helper: Time ago
    timeAgo(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now - date) / 1000);
      
      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
      };
      
      for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
          return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
      }
      
      return 'Just now';
    }
  };

  // ==========================================================================
  // Page Controllers
  // ==========================================================================
  
  const Pages = {
    // Login Page
    async login() {
      const form = DOM.$('#login-form');
      const invitationSection = DOM.$('#invitation-section');
      const invitationInput = DOM.$('#invitation-code');
      const validateBtn = DOM.$('#validate-invitation');
      const requestInviteBtn = DOM.$('#request-invitation');
      const biometricBtn = DOM.$('#biometric-login');
      
      // Invitation validation
      if (validateBtn) {
        validateBtn.addEventListener('click', async () => {
          const code = invitationInput.value.trim();
          
          if (code.length !== 12) {
            this.showError(invitationInput, 'Invitation code must be 12 characters');
            return;
          }
          
          validateBtn.disabled = true;
          validateBtn.textContent = 'Validating...';
          
          const result = await Auth.validateInvitation(code);
          
          if (result.valid) {
            invitationSection.classList.add('validated');
            invitationInput.disabled = true;
            validateBtn.textContent = '✓ Valid';
            validateBtn.classList.add('btn-success');
            this.showSuccess('Invitation validated! You can now log in.');
          } else {
            validateBtn.disabled = false;
            validateBtn.textContent = 'Validate';
            this.showError(invitationInput, result.message || 'Invalid invitation code');
          }
        });
      }
      
      // Login form submission
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = DOM.$('#email').value.trim();
          const password = DOM.$('#password').value;
          const invitationCode = invitationInput?.value.trim();
          
          if (!email || !password) {
            this.showError(null, 'Please enter both email and password');
            return;
          }
          
          const submitBtn = form.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
          submitBtn.textContent = 'Signing in...';
          
          const result = await Auth.login(email, password, invitationCode);
          
          if (result.success) {
            window.location.href = 'dashboard.html';
          } else {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In';
            this.showError(null, result.message || 'Login failed');
          }
        });
      }
      
      // Biometric login (mock)
      if (biometricBtn) {
        biometricBtn.addEventListener('click', () => {
          if ('credentials' in navigator) {
            navigator.credentials.get({
              publicKey: {
                challenge: new Uint8Array(32),
                allowCredentials: [],
                userVerification: 'required'
              }
            }).then(() => {
              this.showSuccess('Biometric authentication successful!');
              // Proceed with login
            }).catch(() => {
              this.showError(null, 'Biometric authentication failed');
            });
          } else {
            this.showError(null, 'Biometric authentication not supported on this device');
          }
        });
      }
      
      // Request invitation modal
      if (requestInviteBtn) {
        requestInviteBtn.addEventListener('click', () => {
          this.showModal('request-invitation-modal');
        });
      }
    },
    
    // Dashboard Page
    async dashboard() {
      // Load user data
      const user = Auth.getUser();
      if (!user) {
        window.location.href = 'index.html';
        return;
      }
      
      // Update UI with user data
      const userNameEl = DOM.$('#user-name');
      const userTrustEl = DOM.$('#user-trust-score');
      
      if (userNameEl) userNameEl.textContent = user.fullName;
      if (userTrustEl) {
        userTrustEl.innerHTML = '';
        userTrustEl.appendChild(Components.trustScore(user.trustScore));
      }
      
      // Load feed
      await this.loadFeed();
      
      // Load notifications
      await this.loadNotifications();
      
      // Setup navigation
      this.setupNavigation();
    },
    
    // Profile Page
    async profile() {
      const user = Auth.getUser();
      if (!user) return;
      
      // Populate profile data
      const profileName = DOM.$('#profile-name');
      const profileBio = DOM.$('#profile-bio');
      const profileLocation = DOM.$('#profile-location');
      const profileTrust = DOM.$('#profile-trust-score');
      const profileConnections = DOM.$('#profile-connections');
      const profileEndorsements = DOM.$('#profile-endorsements');
      
      if (profileName) profileName.textContent = user.fullName;
      if (profileBio) profileBio.textContent = user.bio;
      if (profileLocation) profileLocation.textContent = user.location;
      if (profileTrust) {
        profileTrust.innerHTML = '';
        profileTrust.appendChild(Components.trustScore(user.trustScore, true));
      }
      if (profileConnections) profileConnections.textContent = user.connections;
      if (profileEndorsements) profileEndorsements.textContent = user.endorsements;
      
      // Render badges
      const badgesContainer = DOM.$('#profile-badges');
      if (badgesContainer && user.badges) {
        badgesContainer.innerHTML = '';
        user.badges.forEach(badge => {
          badgesContainer.appendChild(Components.verificationBadge(badge));
        });
      }
      
      // Render work history
      const workContainer = DOM.$('#work-history');
      if (workContainer && user.workHistory) {
        workContainer.innerHTML = '';
        user.workHistory.forEach(job => {
          workContainer.appendChild(DOM.create('div', { className: 'timeline-item' }, [
            DOM.create('div', { className: 'timeline-content' }, [
              DOM.create('h5', {}, [job.title]),
              DOM.create('p', { className: 'text-secondary' }, [job.company]),
              DOM.create('p', { className: 'text-sm text-tertiary' }, [
                this.formatDate(job.startDate), ' - ', 
                job.current ? 'Present' : this.formatDate(job.endDate)
              ]),
              job.description ? DOM.create('p', { className: 'mt-2' }, [job.description]) : null
            ])
          ]));
        });
      }
      
      // Render skills
      const skillsContainer = DOM.$('#profile-skills');
      if (skillsContainer && user.skills) {
        skillsContainer.innerHTML = '';
        user.skills.forEach(skill => {
          skillsContainer.appendChild(DOM.create('span', {
            className: 'badge badge-verified'
          }, [skill]));
        });
      }
      
      // Edit profile button
      const editBtn = DOM.$('#edit-profile');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          this.showModal('edit-profile-modal');
        });
      }
    },
    
    // Verification Dashboard
    async verification() {
      const user = Auth.getUser();
      if (!user) return;
      
      // Load trust score details
      const trustData = await API.get('/user/trust-score');
      
      const trustContainer = DOM.$('#verification-trust-score');
      if (trustContainer) {
        trustContainer.innerHTML = '';
        trustContainer.appendChild(Components.trustScore(trustData.score, true));
      }
      
      // Render trust factors
      const factorsContainer = DOM.$('#trust-factors');
      if (factorsContainer && trustData.factors) {
        factorsContainer.innerHTML = '';
        trustData.factors.forEach(factor => {
          factorsContainer.appendChild(DOM.create('div', { className: 'flex justify-between items-center py-2' }, [
            DOM.create('span', {}, [factor.name]),
            DOM.create('span', { 
              className: factor.positive ? 'text-emerald-600' : 'text-ruby-600' 
            }, [
              factor.positive ? '+' : '', factor.impact
            ])
          ]));
        });
      }
      
      // Verification progress
      const progressContainer = DOM.$('#verification-progress');
      if (progressContainer) {
        const steps = [
          { name: 'Email Verification', completed: true },
          { name: 'Biometric Verification', completed: user.badges?.includes('biometric') },
          { name: 'Two-Witness Verification', completed: user.badges?.includes('two_witness') },
          { name: 'Business Verification', completed: user.badges?.includes('business') }
        ];
        
        progressContainer.innerHTML = '';
        steps.forEach((step, index) => {
          progressContainer.appendChild(DOM.create('div', { 
            className: `flex items-center gap-3 py-3 ${step.completed ? 'text-emerald-600' : 'text-slate-400'}`
          }, [
            DOM.create('span', { className: 'text-lg' }, [
              step.completed ? '✓' : `${index + 1}.`
            ]),
            DOM.create('span', {}, [step.name]),
            step.completed ? DOM.create('span', { className: 'ml-auto text-sm' }, ['Completed']) : null
          ]));
        });
      }
    },
    
    // Marketplace Page
    async marketplace(vertical) {
      const container = DOM.$('#marketplace-items');
      if (!container) return;
      
      container.innerHTML = '<div class="text-center py-8"><div class="animate-spin" style="width: 40px; height: 40px; border: 3px solid var(--border-light); border-top-color: var(--color-primary); border-radius: 50%;"></div></div>';
      
      try {
        const data = await API.get(`/marketplace/${vertical}`);
        
        container.innerHTML = '';
        
        if (data.items.length === 0) {
          container.innerHTML = '<div class="text-center py-8 text-secondary">No items found</div>';
          return;
        }
        
        data.items.forEach(item => {
          container.appendChild(this.createMarketplaceCard(item, vertical));
        });
      } catch (error) {
        container.innerHTML = `<div class="alert alert-error">Error loading marketplace: ${error.message}</div>`;
      }
    },
    
    createMarketplaceCard(item, vertical) {
      const provider = item.provider || item.founder || item.borrower;
      
      return DOM.create('div', { className: 'card' }, [
        DOM.create('div', { className: 'card-header' }, [
          DOM.create('div', { className: 'flex items-center gap-3' }, [
            DOM.create('div', { className: 'avatar' }, [
              provider.name.split(' ').map(n => n[0]).join('')
            ]),
            DOM.create('div', {}, [
              DOM.create('div', { className: 'font-semibold' }, [provider.name]),
              DOM.create('div', { className: 'text-sm text-secondary' }, [
                item.category || item.industry || item.category
              ])
            ]),
            DOM.create('div', { className: 'ml-auto' }, [
              DOM.create('span', {
                className: `badge badge-trust-${provider.trustScore >= 700 ? 'high' : provider.trustScore >= 200 ? 'medium' : 'low'}`
              }, [`${provider.trustScore}`])
            ])
          ])
        ]),
        DOM.create('div', { className: 'card-body' }, [
          DOM.create('h4', {}, [item.title || item.name]),
          DOM.create('p', { className: 'text-secondary mt-2' }, [item.description]),
          item.rate ? DOM.create('div', { className: 'text-sm mt-2' }, [
            DOM.create('strong', {}, ['Rate: ']), item.rate
          ]) : null,
          item.location ? DOM.create('div', { className: 'text-sm text-secondary mt-1' }, [
            '📍 ', item.location
          ]) : null,
          item.seeking ? DOM.create('div', { className: 'mt-4' }, [
            DOM.create('div', { className: 'flex justify-between text-sm mb-1' }, [
              DOM.create('span', {}, ['Raised: £' + (item.raised || 0).toLocaleString()]),
              DOM.create('span', {}, ['Seeking: £' + item.seeking.toLocaleString()])
            ]),
            DOM.create('div', { className: 'progress' }, [
              DOM.create('div', {
                className: 'progress-bar',
                style: `width: ${Math.min(100, ((item.raised || 0) / item.seeking) * 100)}%`
              })
            ])
          ]) : null
        ]),
        DOM.create('div', { className: 'card-footer' }, [
          DOM.create('div', { className: 'flex gap-2' }, [
            DOM.create('button', { className: 'btn btn-primary btn-sm' }, ['Connect']),
            DOM.create('button', { className: 'btn btn-outline btn-sm' }, ['View Profile'])
          ])
        ])
      ]);
    },
    
    // Islamic Finance Page
    async islamicFinance(tool) {
      // Check access
      if (!Auth.canAccessIslamicFinance()) {
        const container = DOM.$('#islamic-finance-content');
        if (container) {
          container.innerHTML = `
            <div class="alert alert-warning">
              <strong>Access Restricted</strong>
              <p>Islamic Finance tools are only available to verified Muslim members. 
              Please complete your verification to access these features.</p>
            </div>
          `;
        }
        return;
      }
      
      const container = DOM.$(`#${tool}-content`);
      if (!container) return;
      
      try {
        const data = await API.get(`/islamic-finance/${tool}`);
        
        container.innerHTML = '';
        
        if (data.items.length === 0) {
          container.innerHTML = '<div class="text-center py-8 text-secondary">No items found</div>';
          return;
        }
        
        data.items.forEach(item => {
          container.appendChild(this.createIslamicFinanceCard(item, tool));
        });
      } catch (error) {
        container.innerHTML = `<div class="alert alert-error">Error loading data: ${error.message}</div>`;
      }
    },
    
    createIslamicFinanceCard(item, tool) {
      const cards = {
        sadaqah: DOM.create('div', { className: 'card' }, [
          DOM.create('div', { className: 'card-body' }, [
            DOM.create('h4', {}, [item.name]),
            DOM.create('p', { className: 'text-secondary text-sm' }, [item.organization]),
            DOM.create('p', { className: 'mt-2' }, [item.description]),
            DOM.create('div', { className: 'mt-4' }, [
              DOM.create('div', { className: 'flex justify-between text-sm mb-1' }, [
                DOM.create('span', {}, ['Raised: £' + item.raised.toLocaleString()]),
                DOM.create('span', {}, ['Goal: £' + item.goal.toLocaleString()])
              ]),
              DOM.create('div', { className: 'progress' }, [
                DOM.create('div', {
                  className: 'progress-bar',
                  style: `width: ${(item.raised / item.goal) * 100}%`
                })
              ]),
              DOM.create('div', { className: 'flex justify-between text-sm mt-2 text-secondary' }, [
                DOM.create('span', {}, [`${item.donors} donors`]),
                DOM.create('span', {}, [`${item.daysLeft} days left`])
              ])
            ])
          ]),
          DOM.create('div', { className: 'card-footer' }, [
            DOM.create('button', { className: 'btn btn-primary w-full' }, ['Donate Now'])
          ])
        ]),
        
        waqf: DOM.create('div', { className: 'card' }, [
          DOM.create('div', { className: 'card-body' }, [
            DOM.create('h4', {}, [item.name]),
            DOM.create('p', { className: 'text-secondary text-sm' }, [item.location]),
            DOM.create('p', { className: 'mt-2' }, [item.description]),
            DOM.create('div', { className: 'grid grid-cols-3 gap-4 mt-4' }, [
              DOM.create('div', { className: 'text-center' }, [
                DOM.create('div', { className: 'font-bold text-lg' }, ['£' + (item.value / 1000000).toFixed(1) + 'M']),
                DOM.create('div', { className: 'text-xs text-secondary' }, ['Waqf Value'])
              ]),
              DOM.create('div', { className: 'text-center' }, [
                DOM.create('div', { className: 'font-bold text-lg' }, ['£' + (item.annualIncome / 1000).toFixed(0) + 'K']),
                DOM.create('div', { className: 'text-xs text-secondary' }, ['Annual Income'])
              ]),
              DOM.create('div', { className: 'text-center' }, [
                DOM.create('div', { className: 'font-bold text-lg' }, [item.beneficiaries.toLocaleString()]),
                DOM.create('div', { className: 'text-xs text-secondary' }, ['Beneficiaries'])
              ])
            ])
          ]),
          DOM.create('div', { className: 'card-footer' }, [
            DOM.create('button', { className: 'btn btn-outline w-full' }, ['View Governance'])
          ])
        ]),
        
        qardHasan: DOM.create('div', { className: 'card' }, [
          DOM.create('div', { className: 'card-header' }, [
            DOM.create('div', { className: 'flex items-center gap-3' }, [
              DOM.create('div', { className: 'avatar' }, [
                item.borrower.name.split(' ').map(n => n[0]).join('')
              ]),
              DOM.create('div', {}, [
                DOM.create('div', { className: 'font-semibold' }, [item.borrower.name]),
                DOM.create('div', { className: 'text-sm text-secondary' }, [
                  'Trust Score: ', item.borrower.trustScore
                ])
              ])
            ])
          ]),
          DOM.create('div', { className: 'card-body' }, [
            DOM.create('p', {}, [item.purpose]),
            DOM.create('div', { className: 'grid grid-cols-2 gap-4 mt-4' }, [
              DOM.create('div', {}, [
                DOM.create('div', { className: 'text-sm text-secondary' }, ['Amount Needed']),
                DOM.create('div', { className: 'font-bold' }, ['£' + item.amount.toLocaleString()])
              ]),
              DOM.create('div', {}, [
                DOM.create('div', { className: 'text-sm text-secondary' }, ['Term']),
                DOM.create('div', { className: 'font-bold' }, [item.term + ' months'])
              ])
            ]),
            DOM.create('div', { className: 'mt-4' }, [
              DOM.create('div', { className: 'flex justify-between text-sm mb-1' }, [
                DOM.create('span', {}, ['Repaid: £' + item.repaid.toLocaleString()]),
                DOM.create('span', {}, ['Remaining: £' + (item.amount - item.repaid).toLocaleString()])
              ]),
              DOM.create('div', { className: 'progress' }, [
                DOM.create('div', {
                  className: 'progress-bar',
                  style: `width: ${(item.repaid / item.amount) * 100}%`
                })
              ])
            ])
          ]),
          DOM.create('div', { className: 'card-footer' }, [
            DOM.create('button', { className: 'btn btn-primary w-full' }, [
              'Join as Lender (', item.lenders, ' lenders already)'
            ])
          ])
        ])
      };
      
      return cards[tool] || DOM.create('div', {}, ['Unknown tool type']);
    },
    
    // Connections Page
    async connections() {
      const container = DOM.$('#connections-list');
      if (!container) return;
      
      try {
        const data = await API.get('/user/connections');
        
        container.innerHTML = '';
        
        if (data.connections.length === 0) {
          container.innerHTML = '<div class="text-center py-8 text-secondary">No connections yet</div>';
          return;
        }
        
        data.connections.forEach(connection => {
          container.appendChild(Components.connectionCard(connection));
        });
      } catch (error) {
        container.innerHTML = `<div class="alert alert-error">Error loading connections: ${error.message}</div>`;
      }
    },
    
    // Messages Page
    async messages() {
      const container = DOM.$('#messages-list');
      if (!container) return;
      
      // Mock messages for now
      const mockMessages = [
        {
          id: 'msg_001',
          sender: { name: 'Fatima Al-Rashid', trustScore: 820 },
          preview: 'As-salamu alaykum Ahmed, I wanted to discuss...',
          unread: true,
          timestamp: '2024-05-20T09:30:00Z'
        },
        {
          id: 'msg_002',
          sender: { name: 'Yusuf Ibrahim', trustScore: 890 },
          preview: 'Thank you for connecting! I saw your profile...',
          unread: false,
          timestamp: '2024-05-19T16:00:00Z'
        }
      ];
      
      container.innerHTML = '';
      
      mockMessages.forEach(msg => {
        container.appendChild(DOM.create('div', {
          className: `connection-card ${msg.unread ? 'border-l-4 border-emerald-500' : ''}`
        }, [
          DOM.create('div', { className: 'avatar' }, [
            msg.sender.name.split(' ').map(n => n[0]).join('')
          ]),
          DOM.create('div', { className: 'connection-info' }, [
            DOM.create('div', { className: 'flex justify-between' }, [
              DOM.create('span', { className: 'connection-name' }, [msg.sender.name]),
              DOM.create('span', { className: 'text-xs text-tertiary' }, [
                Components.timeAgo(msg.timestamp)
              ])
            ]),
            DOM.create('div', { className: 'connection-meta truncate' }, [msg.preview]),
            msg.unread ? DOM.create('span', { className: 'badge badge-verified mt-2' }, ['New']) : null
          ])
        ]));
      });
    },
    
    // Helper methods
    async loadFeed() {
      const container = DOM.$('#feed-container');
      if (!container) return;
      
      try {
        const data = await API.get('/feed');
        
        container.innerHTML = '';
        
        if (data.items.length === 0) {
          container.innerHTML = '<div class="text-center py-8 text-secondary">No activity yet</div>';
          return;
        }
        
        data.items.forEach(item => {
          container.appendChild(Components.feedItem(item));
        });
      } catch (error) {
        container.innerHTML = `<div class="alert alert-error">Error loading feed: ${error.message}</div>`;
      }
    },
    
    async loadNotifications() {
      const container = DOM.$('#notifications-dropdown');
      const badge = DOM.$('#notification-badge');
      if (!container) return;
      
      try {
        const data = await API.get('/user/notifications');
        
        const unreadCount = data.notifications.filter(n => !n.read).length;
        
        if (badge) {
          badge.textContent = unreadCount;
          badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
        
        container.innerHTML = '';
        
        if (data.notifications.length === 0) {
          container.innerHTML = '<div class="dropdown-item text-secondary">No notifications</div>';
          return;
        }
        
        data.notifications.forEach(notification => {
          container.appendChild(Components.notificationItem(notification));
        });
        
        container.appendChild(DOM.create('div', { className: 'dropdown-divider' }));
        container.appendChild(DOM.create('a', {
          className: 'dropdown-item text-center text-primary',
          href: 'notifications.html'
        }, ['View All Notifications']));
      } catch (error) {
        container.innerHTML = '<div class="dropdown-item text-secondary">Error loading notifications</div>';
      }
    },
    
    setupNavigation() {
      // Mobile menu toggle
      const menuToggle = DOM.$('#menu-toggle');
      const sidebar = DOM.$('#sidebar');
      const sidebarOverlay = DOM.$('#sidebar-overlay');
      
      if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
          sidebar.classList.toggle('open');
          sidebarOverlay?.classList.toggle('open');
        });
        
        sidebarOverlay?.addEventListener('click', () => {
          sidebar.classList.remove('open');
          sidebarOverlay.classList.remove('open');
        });
      }
      
      // Notification toggle
      const notifToggle = DOM.$('#notification-toggle');
      const notifDropdown = DOM.$('#notifications-dropdown');
      
      if (notifToggle && notifDropdown) {
        notifToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          notifToggle.closest('.dropdown').classList.toggle('open');
        });
        
        document.addEventListener('click', () => {
          notifToggle.closest('.dropdown')?.classList.remove('open');
        });
      }
      
      // User menu toggle
      const userMenuToggle = DOM.$('#user-menu-toggle');
      const userDropdown = DOM.$('#user-dropdown');
      
      if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          userMenuToggle.closest('.dropdown').classList.toggle('open');
        });
        
        document.addEventListener('click', () => {
          userMenuToggle.closest('.dropdown')?.classList.remove('open');
        });
      }
      
      // Logout
      const logoutBtn = DOM.$('#logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await Auth.logout();
          window.location.href = 'index.html';
        });
      }
    },
    
    showError(element, message) {
      // Remove existing error
      const existingError = element?.parentElement?.querySelector('.form-error');
      if (existingError) existingError.remove();
      
      if (element) {
        const error = DOM.create('div', { className: 'form-error' }, [message]);
        element.parentElement.appendChild(error);
        element.classList.add('border-ruby-500');
      } else {
        // Show global error
        const alert = DOM.create('div', { className: 'alert alert-error mb-4' }, [message]);
        const container = DOM.$('#alert-container') || document.body;
        container.insertBefore(alert, container.firstChild);
        
        setTimeout(() => alert.remove(), 5000);
      }
    },
    
    showSuccess(message) {
      const alert = DOM.create('div', { className: 'alert alert-success mb-4' }, [message]);
      const container = DOM.$('#alert-container') || document.body;
      container.insertBefore(alert, container.firstChild);
      
      setTimeout(() => alert.remove(), 5000);
    },
    
    showModal(id) {
      const modal = DOM.$(`#${id}`);
      if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
      }
    },
    
    hideModal(id) {
      const modal = DOM.$(`#${id}`);
      if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short'
      });
    }
  };

  // ==========================================================================
  // Initialization
  // ==========================================================================
  
  function init() {
    // Check for existing session
    Auth.checkSession();
    
    // Determine current page and initialize
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '') || 'index';
    
    // Initialize page-specific functionality
    switch (page) {
      case 'index':
      case 'login':
        Pages.login();
        break;
      case 'dashboard':
        Pages.dashboard();
        break;
      case 'profile':
        Pages.profile();
        break;
      case 'verification':
        Pages.verification();
        break;
      case 'connections':
        Pages.connections();
        break;
      case 'messages':
        Pages.messages();
        break;
      case 'marketplace-earn':
        Pages.marketplace('earn');
        break;
      case 'marketplace-build':
        Pages.marketplace('build');
        break;
      case 'marketplace-live':
        Pages.marketplace('live');
        break;
      case 'marketplace-protect':
        Pages.marketplace('protect');
        break;
      case 'islamic-finance':
        // Handle sub-pages
        const tool = new URLSearchParams(window.location.search).get('tool') || 'sadaqah';
        Pages.islamicFinance(tool);
        break;
    }
    
    // Setup global event listeners
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close modals
        DOM.$$('.modal').forEach(modal => {
          modal.classList.add('hidden');
        });
      }
    });
    
    // Close modal buttons
    DOM.$$('.modal-close, [data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal');
        if (modal) {
          modal.classList.add('hidden');
        }
      });
    });
    
    console.log('MuslimEEN initialized');
  }
  
  // Start the application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Expose API for debugging (remove in production)
  window.MuslimEEN = {
    State,
    Auth,
    API,
    Components,
    Pages,
    CONFIG
  };

})();
