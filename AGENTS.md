# MuslimEEN - Agent Development Guide

> **Muslim Economic Empowerment Network**  
> An invitation-only professional networking platform for the Muslim community with Shariah-compliant financial tools.

---

## Project Overview

MuslimEEN is a full-stack LinkedIn-equivalent professional networking platform built specifically for the Muslim community's economic participation. The platform combines professional networking with Islamic finance tools in a trust-based ecosystem.

### Core Platform Immutables

- No advertising or user data sales
- Open source forever (AGPL-3.0) with data portability
- Non-discrimination by sect or ethnicity
- No interest-based finance (riba-free operations)
- Complete transparency in governance, finances, and code
- No user fees; revenue only from B2B institutional services directed to Waqf surplus

### Key Features

- **Trust-based verification system** with 0-1000 trust scores
- **Shariah-compliant financial tools**: Zakat calculator, Qard Hasan, Sadaqah, Waqf
- **Four marketplace verticals**: EARN, BUILD, LIVE, PROTECT
- **Invitation-only access** to prevent spam and maintain community quality
- **Islamic geometric design system** with jewel-tone color palette

---

## Technology Stack

### Frontend

| Technology | Version/Details |
|------------|-----------------|
| Next.js | 14.2.5 (App Router) |
| React | 18.3.1 |
| TypeScript | 5.5.2 |
| CSS | Custom design system with CSS variables (globals.css) |
| Fonts | Inter (primary), Noto Naskh Arabic (Arabic) |

**Key Frontend Features**:
- Next.js App Router for routing
- Static export capability (`output: 'export'` configurable)
- CSS-based Islamic geometric patterns (no images)
- Responsive design with mobile-first approach
- WCAG 2.1 AA accessibility compliance

### Backend

| Technology | Version/Details |
|------------|-----------------|
| Node.js | >= 18.0.0 |
| Express | 4.18.2 |
| TypeScript | 5.3.3 |
| Database | PostgreSQL 14+ |
| Auth | JWT (jsonwebtoken) |
| Validation | Joi |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Winston |

### Database

- **PostgreSQL 14+** with UUID extension
- **Migrations**: SQL files in `backend/database/migrations/`
- **Key Tables**: users, invitations, connections, marketplace_items, notifications, messages, sadaqah_campaigns, waqf, qard_hasan_loans

---

## Project Structure

```
muslimeen/
├── frontend/                    # Next.js 14 frontend
│   ├── app/                    # App Router pages
│   │   ├── (marketing)/        # Marketing pages (landing)
│   │   ├── (auth)/             # Auth group layout
│   │   ├── login/              # Login page
│   │   ├── dashboard/          # Main dashboard
│   │   ├── profile/            # User profile
│   │   ├── verification/       # Verification status
│   │   ├── connections/        # Network/connections
│   │   ├── messages/           # Messaging interface
│   │   ├── marketplace/        # Marketplace with [vertical] dynamic route
│   │   └── islamic-finance/    # Islamic finance tools
│   ├── components/             # React components
│   ├── lib/                    # Utilities and API client
│   │   └── api.ts              # API client with TypeScript types
│   ├── styles/                 # Page-specific CSS
│   ├── types/                  # TypeScript type definitions
│   ├── public/                 # Static assets
│   ├── globals.css             # Global design system (~1000 lines)
│   ├── next.config.js          # Next.js configuration
│   └── package.json
│
├── backend/                     # Node.js/Express API
│   ├── src/
│   │   ├── server.ts           # Main entry point
│   │   ├── routes/
│   │   │   └── index.ts        # API route definitions
│   │   ├── controllers/        # Route controllers (TypeScript)
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── marketplaceController.ts
│   │   │   ├── islamicFinanceController.ts
│   │   │   ├── verificationController.ts
│   │   │   └── invitationController.ts
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.ts         # JWT authentication
│   │   │   ├── validation.ts   # Request validation
│   │   │   ├── rateLimiter.ts  # Rate limiting
│   │   │   └── errorHandler.ts # Error handling
│   │   ├── models/             # Database models (JS/TS mix)
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript type definitions
│   │   └── utils/
│   │       └── logger.js       # Winston logger
│   ├── database/
│   │   └── migrations/
│   │       └── 001_initial_schema.sql
│   ├── .env.example            # Environment template
│   ├── .eslintrc.json          # ESLint configuration
│   ├── tsconfig.json           # TypeScript configuration
│   └── package.json
│
├── API_CONTRACT.md             # Complete API specification
├── BACKEND_README.md           # Backend integration guide
├── DATABASE_SETUP.md           # PostgreSQL setup instructions
├── DEPLOYMENT.md               # Deployment configurations
├── ACCESSIBILITY_AUDIT.md      # WCAG 2.1 AA compliance report
├── SECURITY.md                 # Security guidelines
├── RUN_GUIDE.md                # Quick start guide
└── AGENTS.md                   # This file
```

---

## Build and Development Commands

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Development server (port 8080)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

### Backend

```bash
cd backend

# Install dependencies
npm install

# Development server with hot reload (port 3001)
npm run dev

# Build TypeScript to dist/
npm run build

# Start production server
npm start

# Type checking (no emit)
npm run type-check

# Lint
npm run lint

# Database migrations
npm run migrate

# Seed database
npm run seed
```

### Database Setup

```bash
# Create database
psql -U postgres -c "CREATE DATABASE muslimeen;"

# Run migrations
psql -U postgres -d muslimeen -f backend/database/migrations/001_initial_schema.sql

# Or use migration script
npm run migrate
```

---

## Environment Configuration

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muslimeen
DB_USER=muslimeen
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=your-csrf-secret-key

# Logging
LOG_LEVEL=info
```

### Frontend

Frontend uses `NEXT_PUBLIC_API_URL` for API base URL (set in environment or defaults to `http://localhost:3001/api`).

---

## Code Style Guidelines

### TypeScript/JavaScript

- Use `const` and `let` (no `var`)
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring where appropriate
- Explicit function return types recommended
- Strict TypeScript enabled (`strict: true`)

### Backend ESLint Rules

- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: error (with `_` prefix ignore)
- `no-console`: warn
- `prefer-const`: error

### CSS

- Use CSS custom properties (variables) for all theme values
- Follow utility-first approach with semantic naming
- Mobile-first responsive design
- Avoid `!important` except in print styles

### File Naming

- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities: camelCase (e.g., `apiClient.ts`)
- Styles: lowercase with hyphens (e.g., `dashboard.css`)
- Routes: Next.js App Router conventions

---

## Testing Strategy

### Current Status

The project has **Jest** configured for testing but minimal test coverage currently exists.

### Available Test Commands

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

### Testing Guidelines

1. **Unit Tests**: Test individual functions, especially:
   - Trust score calculation logic
   - Invitation validation
   - User role permissions
   - Zakat calculation formulas

2. **Integration Tests**: Test complete flows:
   - Authentication flow
   - Marketplace CRUD operations
   - Islamic finance calculations

3. **Manual Testing Checklist**:
   - All pages load without console errors
   - Navigation works between all pages
   - Forms submit correctly
   - Responsive design on mobile/tablet/desktop
   - Accessibility audit passes (Lighthouse)

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

---

## API Architecture

### Base URL

```
Development: http://localhost:3001/api
Production: https://api.muslimeen.org/v1
```

### Authentication

- JWT-based authentication with Bearer token
- Token expires in 24 hours
- CSRF token required for state-changing requests
- Rate limiting on auth endpoints (5 requests/minute)

### Response Format

```json
{
  "success": true,
  "data": {},
  "message": "Optional message",
  "error": null
}
```

### Key Endpoints

| Category | Endpoints |
|----------|-----------|
| Auth | `/auth/login`, `/auth/register`, `/auth/validate-invitation`, `/auth/logout` |
| User | `/user/profile`, `/user/trust-score`, `/user/connections`, `/user/notifications` |
| Marketplace | `/marketplace/:vertical` (earn, build, live, protect) |
| Islamic Finance | `/islamic-finance/sadaqah`, `/islamic-finance/zakat/calculate`, `/islamic-finance/qard-hasan`, `/islamic-finance/waqf` |
| Verification | `/verification/biometric/*`, `/verification/witness/*`, `/verification/business/*` |

See `API_CONTRACT.md` for complete documentation.

---

## Security Considerations

### Implemented

- ✅ Helmet.js for security headers
- ✅ CORS configuration for allowed origins
- ✅ Rate limiting on all endpoints
- ✅ Input validation with Joi
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ XSS protection (escaped HTML, CSP headers)
- ✅ SQL injection prevention (parameterized queries)

### Required for Production

- Store JWT in `httpOnly`, `Secure`, `SameSite=Strict` cookies
- Implement proper CSRF double-submit cookie pattern
- Enable HTTPS enforcement
- Add security headers (see SECURITY.md)
- Regular security audits and dependency updates

### Security Headers

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://api.muslimeen.org;
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## Design System

### Color Palette (CSS Variables)

```css
--color-emerald-600: #059669   /* Primary - emerald green */
--color-sapphire-600: #2563eb /* Secondary - sapphire blue */
--color-gold-500: #f59e0b     /* Accent - gold */
--color-ruby-500: #ef4444     /* Error/Danger - ruby red */
--color-amethyst-600: #9333ea /* Tertiary - amethyst purple */
```

### Trust Score Colors

- **High (700-1000)**: Emerald green (`--trust-high`)
- **Medium (200-699)**: Gold (`--trust-medium`)
- **Low (0-199)**: Ruby red (`--trust-low`)

### Component Classes

| Component | Class | Variants |
|-----------|-------|----------|
| Button | `.btn` | `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-sm`, `.btn-lg` |
| Card | `.card` | `.card-header`, `.card-body`, `.card-footer` |
| Form Input | `.form-input` | `.form-select`, `.form-textarea` |
| Badge | `.badge` | `.badge-verified`, `.badge-trust-high`, `.badge-trust-medium`, `.badge-trust-low` |

---

## User Roles and Permissions

| Role | Access Level |
|------|-------------|
| `muslim_verified` | Full access to all features |
| `muslim_unverified` | Limited features (30-day provisional period) |
| `non_muslim` | Consumer mode only (no Islamic finance, no governance) |
| `business_provider` | Enhanced visibility, client review system |
| `admin` | Administrative access |

### Verification Badges

- `biometric` - Identity verified through biometric authentication
- `two_witness` - Vouched for by two verified community members
- `business` - Business entity verification completed
- `institutional` - Verified through partner institution

---

## Deployment

### Frontend Deployment

Deploy the `frontend/` directory to any static hosting service:

1. **Build**: `npm run build` (outputs to `dist/` when `output: 'export'` enabled)
2. **Hosting Options**:
   - Cloudflare Pages (recommended)
   - Netlify
   - Vercel
   - AWS S3 + CloudFront
   - Nginx or Apache

### Backend Deployment

1. **Build**: `npm run build` (compiles TypeScript to `dist/`)
2. **Start**: `npm start` (runs compiled JS from `dist/`)
3. **Requirements**:
   - Node.js >= 18
   - PostgreSQL 14+
   - Environment variables configured

### Database Migration on Deploy

```bash
# Production migration
npm run migrate
```

---

## Performance Budget

- Total CSS + JS bundle: < 150KB (frontend)
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s
- API response time: < 200ms

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001 (backend)
npx kill-port 3001

# Frontend will auto-select next available port
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# Verify .env credentials
# Check database exists: \l in psql
```

### CORS Errors

- Ensure backend is on port 3001
- Ensure frontend is on port 8080
- Check CORS origins in `backend/src/server.ts`

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/app/layout.tsx` | Root layout with fonts and metadata |
| `frontend/app/globals.css` | Complete design system (~1000 lines) |
| `frontend/lib/api.ts` | API client with TypeScript types |
| `backend/src/server.ts` | Express server configuration |
| `backend/src/routes/index.ts` | API route definitions |
| `backend/src/types/index.ts` | TypeScript type definitions |
| `backend/database/migrations/001_initial_schema.sql` | Database schema |
| `API_CONTRACT.md` | Complete API specification |

---

## License

AGPL-3.0 - Open source forever as per platform immutables.

---

**Last Updated**: February 2026
