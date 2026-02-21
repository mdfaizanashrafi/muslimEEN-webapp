# MuslimEEN - Muslim Economic Empowerment Network

## Overview

MuslimEEN is an invitation-only professional networking platform designed specifically for the Muslim community's economic participation. It functions as a LinkedIn-equivalent with Islamic principles at its core, featuring trust-based verification, Shariah-compliant financial tools, and community-driven governance.

## Core Platform Immutables

- **No advertising or user data sales**
- **Open source forever** with guaranteed data portability
- **Non-discrimination** by sect or ethnicity
- **No interest-based finance** (riba-free operations)
- **Complete transparency** in governance, finances, and code
- **No user fees**; revenue only from B2B institutional services directed to Waqf surplus

## Access Model

MuslimEEN operates as a **closed, invitation-only network**:

- No public signup page
- Access exclusively through invitation links from verified members or institutional partners
- Login credentials activated only after valid invitation code verification
- Institutional fast-track invitations for partner organizations (mosques, Islamic universities, professional associations)
- Invitation tracking with reputation linkage (successful vouching = +10 points; failed vouching = -50 points if invitee banned)

## Technology Stack

### Frontend
- **HTML5** - Semantic markup with accessibility focus
- **CSS3** - Custom design system with CSS variables
- **Vanilla JavaScript** - Lightweight, framework-free implementation
- **No external frameworks** (React, Vue, Angular avoided for performance)
- **Total bundle size**: Under 150KB combined CSS + JS
- **Load time**: Under 2 seconds on 4G

### Design System
- Islamic geometric patterns (CSS-generated, no images)
- Jewel-tone color palette (emerald, sapphire, gold, ruby, amethyst)
- Arabic calligraphy integration for section headers
- Mobile-first responsive design (320px minimum)
- WCAG 2.1 AA accessibility compliance

## Project Structure

```
muslimeen/
├── frontend/              # All frontend files
│   ├── index.html
│   ├── dashboard.html
│   ├── profile.html
│   ├── verification.html
│   ├── connections.html
│   ├── messages.html
│   ├── marketplace-*.html
│   ├── islamic-finance.html
│   ├── css/
│   │   └── design-system.css
│   └── js/
│       └── app.js
├            # Security-hardened frontend
├── backend/               # Complete backend implementation
│   ├── src/
│   │   ├── server.js               # Express server
│   │   ├── config/database.js      # PostgreSQL connection
│   │   ├── controllers/            # 6 controllers
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── marketplaceController.js
│   │   │   ├── islamicFinanceController.js
│   │   │   ├── verificationController.js
│   │   │   └── invitationController.js
│   │   ├── models/                 # 7 models
│   │   │   ├── User.js
│   │   │   ├── TrustScore.js
│   │   │   ├── Invitation.js
│   │   │   ├── Connection.js
│   │   │   ├── Marketplace.js
│   │   │   ├── IslamicFinance.js
│   │   │   └── Notification.js
│   │   ├── routes/index.js         # 40+ API endpoints
│   │   ├── middleware/
│   │   │   ├── auth.js             # JWT authentication
│   │   │   ├── rateLimiter.js      # Rate limiting
│   │   │   ├── validation.js       # Joi validation
│   │   │   └── errorHandler.js     # Error handling
│   │   └── utils/logger.js         # Winston logging
│   ├── database/migrations/
│   │   └── 001_initial_schema.sql  # 16 tables
│   ├── tests/                      # Test structure
│   ├── package.json
│   └── .env.example
├── BACKEND_README_2.md    # Complete implementation report
└── SECURITY.md            # Security documentation
├── README.md              # Project docs (kept at root)
├── API_CONTRACT.md
├── BACKEND_README.md
├── AGENTS.md
├── ACCESSIBILITY_AUDIT.md
└── DEPLOYMENT.md
```

## Pages Overview

### 1. Login Page (index.html)
- Invitation code validation
- Email/password authentication
- Biometric login option (WebAuthn)
- "Request Invitation" modal with three access paths
- Platform immutables display

### 2. Dashboard (dashboard.html)
- Personalized welcome with trust score
- Four Pillars navigation (EARN, BUILD, LIVE, PROTECT)
- Activity feed with job postings and venture opportunities
- Network stats and suggested connections
- Islamic Finance quick links

### 3. Profile Page (profile.html)
- LinkedIn-style profile layout
- Verification badges display
- Trust score visualization with history
- Work history and education timeline
- Skills and endorsements
- Profile completeness indicator

### 4. Verification Status (verification.html)
- Current verification tier display
- Verification progress steps
- Trust score factors breakdown
- Witness eligibility status
- Upgrade options (Business, Institutional)

### 5. Network/Connections (connections.html)
- Connections list with trust scores
- Pending requests management
- Suggested connections based on profile
- Search and filter functionality

### 6. Messages (messages.html)
- Conversation list
- Real-time chat interface
- Message history
- Unread indicators

### 7. Marketplace Pages
Four vertical marketplaces:
- **EARN**: Jobs, freelancers, professional services
- **BUILD**: Ventures, partnerships, investment
- **LIVE**: Housing, food, travel, wellness
- **PROTECT**: Health, security, insurance, legal

### 8. Islamic Finance (islamic-finance.html)
- Sadaqah campaigns with donation tracking
- Waqf discovery and governance
- Zakat calculator
- Qard Hasan matching
- Takaful insurance information

## Key Features

### Trust Score System (0-1000)
- Color-coded ranges: Green (700+), Yellow (200-699), Red (<200)
- Historical trend visualization
- Factor breakdown (profile completeness, connections, contributions, verification)
- Impact on platform privileges

### Verification System
| Badge | Description |
|-------|-------------|
| ✓ Biometric Verified | Identity verified through biometric authentication |
| ✓ Two-Witness Verified | Vouched for by two verified community members |
| ✓ Business Verified | Business entity verification completed |
| ✓ Institutional Fast-Track | Verified through partner institution |

### User Roles
1. **Muslim Verified**: Full access to all features
2. **Muslim Unverified/Provisional**: Limited features (30-day provisional period)
3. **Non-Muslim**: Consumer mode only (no Islamic finance, no governance)
4. **Business Service Providers**: Enhanced visibility, client review system

## Design System

### Color Palette
```css
--color-emerald-600: #059669  /* Primary */
--color-sapphire-600: #2563eb /* Secondary */
--color-gold-500: #f59e0b     /* Accent */
--color-ruby-500: #ef4444     /* Error/Danger */
--color-amethyst-600: #9333ea /* Tertiary */
```

### Typography
- **Primary**: Inter (Latin script)
- **Arabic**: Noto Naskh Arabic
- **Monospace**: JetBrains Mono (for trust scores)

### Islamic Geometric Patterns
- 8-point star patterns
- Geometric tessellations
- Islamic grid patterns
- Diamond and hexagon patterns
- All CSS-generated (no external images)

## API Integration Points

The frontend is structured to accept the following backend endpoints:

### Authentication
- `POST /api/auth/validate-invitation` - Validate invitation code
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout user

### User Data
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/notifications` - Get notifications
- `GET /api/user/connections` - Get connections list
- `GET /api/user/trust-score` - Get trust score details

### Marketplace
- `GET /api/marketplace/{vertical}` - Get marketplace items
- `POST /api/marketplace/{vertical}` - Post new listing

### Islamic Finance
- `GET /api/islamic-finance/{tool}` - Get Islamic finance data

See `API_CONTRACT.md` for complete API specification.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Accessibility

- Semantic HTML5 markup
- ARIA labels where needed
- Keyboard navigation support
- Focus indicators
- Color contrast WCAG 2.1 AA compliant
- Screen reader compatible

## Performance Targets

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- Total Bundle Size: < 150KB
- Lighthouse Score: 90+

## Security Considerations

- Invitation-only access prevents spam
- Trust score system discourages bad actors
- Biometric authentication support (WebAuthn)
- Zero-knowledge proof for biometric data
- On-device biometric processing (never stored)

## License

AGPL-3.0 - Open source forever as per platform immutables.

## Contributing

This is an open-source project. Contributions are welcome following our code of conduct and contribution guidelines.

## Contact

For questions about the platform or to request an invitation, visit our community portal.

---

**Built with ❤️ for the Muslim Ummah**
