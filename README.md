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
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **CSS3** - Custom design system with CSS variables
- **Static Export** - Pre-rendered HTML for fast loading

### Backend
- **Node.js + Express** - API server with modular architecture
- **TypeScript** - Type-safe development
- **PostgreSQL** - Database
- **JWT** - Authentication

### Design System
- Islamic geometric patterns (CSS-generated, no images)
- Jewel-tone color palette (emerald, sapphire, gold, ruby, amethyst)
- Arabic calligraphy integration for section headers
- Mobile-first responsive design (320px minimum)
- WCAG 2.1 AA accessibility compliance

## Project Structure

```
muslimeen/
├── frontend/                # Next.js frontend application
│   ├── app/                 # App Router pages
│   │   ├── (auth)/          # Auth group (login page)
│   │   ├── dashboard/       # Dashboard page
│   │   ├── profile/         # Profile page
│   │   ├── connections/     # Network/connections page
│   │   ├── messages/        # Messages page
│   │   ├── verification/    # Verification status page
│   │   ├── marketplace/     # Marketplace verticals
│   │   │   └── [vertical]/  # Dynamic route for earn/build/live/protect
│   │   └── islamic-finance/ # Islamic finance tools
│   ├── styles/              # Page-specific CSS
│   ├── lib/                 # API client
│   ├── types/               # TypeScript type definitions
│   ├── package.json
│   └── next.config.js
│
├── backend/                 # Express backend API (Modular Architecture)
│   ├── src/
│   │   ├── app.ts           # Express app configuration
│   │   ├── server.ts        # Server bootstrap
│   │   ├── routes.ts        # Route aggregator
│   │   │
│   │   ├── config/          # Configuration
│   │   │   ├── env.ts       # Environment validation
│   │   │   ├── database.ts  # Database connection
│   │   │   └── constants.ts # App constants
│   │   │
│   │   ├── modules/         # Domain-based modules
│   │   │   ├── auth/        # Authentication
│   │   │   ├── user/        # User management
│   │   │   ├── marketplace/ # Marketplace
│   │   │   ├── verification/# Verification
│   │   │   ├── invitation/  # Invitations
│   │   │   ├── islamicFinance/ # Islamic finance
│   │   │   ├── messages/    # Messages
│   │   │   ├── feed/        # Activity feed
│   │   │   └── admin/       # Admin functions
│   │   │
│   │   ├── middleware/      # Express middleware
│   │   └── shared/          # Shared utilities
│   │
│   ├── database/migrations/ # SQL migrations
│   └── package.json
│
├── ARCHITECTURE_MIGRATION_REPORT.md  # Migration documentation
├── SECURITY.md              # Security documentation
├── DEPLOYMENT.md            # Deployment guide
├── API_CONTRACT.md          # API documentation
└── README.md                # This file
```

## Architecture Overview

MuslimEEN follows a modular full-stack architecture:

### Frontend
- **Next.js** (React + TypeScript)
- **App Router** for routing
- **Design-system preserved** (byte-for-byte CSS migration)

### Backend
- **Express** with modular domain architecture
- **Service layer** for business logic
- **PostgreSQL** database
- **JWT** authentication
- **Enterprise middleware** structure

See `ARCHITECTURE_MIGRATION_REPORT.md` for detailed migration information.

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd backend
npm install
npm run dev        # Runs on http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # Runs on http://localhost:8080
npm run build      # Build for production (outputs to dist/)
```

## Pages Overview

### 1. Login Page (/)
- Invitation code validation
- Email/password authentication
- Biometric login option (WebAuthn)
- "Request Invitation" modal with three access paths
- Platform immutables display

### 2. Dashboard (/dashboard)
- Personalized welcome with trust score
- Four Pillars navigation (EARN, BUILD, LIVE, PROTECT)
- Activity feed with job postings and venture opportunities
- Network stats and suggested connections
- Islamic Finance quick links

### 3. Profile Page (/profile)
- LinkedIn-style profile layout
- Verification badges display
- Trust score visualization with history
- Work history and education timeline
- Skills and endorsements
- Profile completeness indicator

### 4. Verification Status (/verification)
- Current verification tier display
- Verification progress steps
- Trust score factors breakdown
- Witness eligibility status
- Upgrade options (Business, Institutional)

### 5. Network/Connections (/connections)
- Connections list with trust scores
- Pending requests management
- Suggested connections based on profile
- Search and filter functionality

### 6. Messages (/messages)
- Conversation list
- Real-time chat interface
- Message history
- Unread indicators

### 7. Marketplace Pages (/marketplace/[vertical])
Four vertical marketplaces:
- **EARN** (/marketplace/earn): Jobs, freelancers, professional services
- **BUILD** (/marketplace/build): Ventures, partnerships, investment
- **LIVE** (/marketplace/live): Housing, food, travel, wellness
- **PROTECT** (/marketplace/protect): Health, security, insurance, legal

### 8. Islamic Finance (/islamic-finance)
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

## API Integration

See `API_CONTRACT.md` for complete API specification.

### Authentication
- `POST /api/auth/validate-invitation` - Validate invitation code
- `POST /api/auth/login` - Login with credentials
- `POST /api/auth/logout` - Logout user

### User Data
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/connections` - Get connections list

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

## Security Considerations

- Invitation-only access prevents spam
- Trust score system discourages bad actors
- Biometric authentication support (WebAuthn)
- Zero-knowledge proof for biometric data
- On-device biometric processing (never stored)

## Documentation

| File | Description |
|------|-------------|
| `README.md` | This file - overview and quick start |
| `RUN_GUIDE.md` | Detailed run instructions |
| `API_CONTRACT.md` | Complete API documentation |
| `ARCHITECTURE_MIGRATION_REPORT.md` | Architecture migration details |
| `SECURITY.md` | Security guidelines |
| `DEPLOYMENT.md` | Deployment guide |
| `DATABASE_SETUP.md` | Database setup instructions |

## License

AGPL-3.0 - Open source forever as per platform immutables.

## Contributing

This is an open-source project. Contributions are welcome following our code of conduct and contribution guidelines.

## Contact

For questions about the platform or to request an invitation, visit our community portal.

---

**Built with ❤️ for the Muslim Ummah**
