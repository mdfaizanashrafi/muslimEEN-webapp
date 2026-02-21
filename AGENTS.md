# MuslimEEN - Agent Documentation

## Project Overview

**MuslimEEN** (Muslim Economic Empowerment Network) is an invitation-only professional networking platform designed specifically for the Muslim community's economic participation. It functions as a LinkedIn-equivalent with Islamic principles at its core, featuring trust-based verification, Shariah-compliant financial tools, and community-driven governance.

### Platform Immutables

- No advertising or user data sales
- Open source forever (AGPL-3.0) with guaranteed data portability
- Non-discrimination by sect or ethnicity
- No interest-based finance (riba-free operations)
- Complete transparency in governance, finances, and code
- No user fees; revenue only from B2B institutional services directed to Waqf surplus

## Technology Stack

### Frontend
- **HTML5** - Semantic markup with accessibility focus
- **CSS3** - Custom design system with CSS variables (single file: `css/design-system.css`)
- **Vanilla JavaScript** - Lightweight, framework-free implementation (single file: `js/app.js`)
- **No external frontend frameworks** (React, Vue, Angular intentionally avoided for performance)
- **Google Fonts**: Inter (primary), Noto Naskh Arabic (Arabic text)

### Performance Targets
- Total bundle size: Under 150KB combined CSS + JS
- Load time: Under 2 seconds on 4G
- First Contentful Paint: < 1.5s
- Lighthouse Score: 90+

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Project Structure

```
muslimeen/
├── index.html                  # Login page (invitation-only entry)
├── dashboard.html              # Main dashboard after login
├── profile.html                # User profile page
├── verification.html           # Verification status dashboard
├── connections.html            # Network management
├── messages.html               # Messaging interface
├── marketplace-earn.html       # EARN marketplace (jobs, freelancers)
├── marketplace-build.html      # BUILD marketplace (ventures, investment)
├── marketplace-live.html       # LIVE marketplace (housing, food, travel)
├── marketplace-protect.html    # PROTECT marketplace (health, security, insurance)
├── islamic-finance.html        # Islamic finance tools
├── css/
│   └── design-system.css       # Complete design system (~1500 lines)
├── js/
│   └── app.js                  # Main application logic (~1800 lines)
├── README.md                   # Human-readable project overview
├── API_CONTRACT.md             # Complete REST API specification
├── BACKEND_README.md           # Backend integration guide
├── DEPLOYMENT.md               # Deployment instructions
├── ACCESSIBILITY_AUDIT.md      # WCAG 2.1 AA compliance audit
└── AGENTS.md                   # This file
```

## Design System

### Color Palette (CSS Custom Properties)

```css
/* Primary Jewel Tones */
--color-emerald-600: #059669   /* Primary - Islamic green */
--color-sapphire-600: #2563eb  /* Secondary */
--color-gold-500: #f59e0b      /* Accent */
--color-ruby-500: #ef4444      /* Error/Danger */
--color-amethyst-600: #9333ea  /* Tertiary */

/* Trust Score Colors */
--trust-high: var(--color-emerald-500);    /* 700+ */
--trust-medium: var(--color-gold-500);     /* 200-699 */
--trust-low: var(--color-ruby-500);        /* <200 */
```

### Islamic Geometric Patterns

All patterns are CSS-generated (no images):
- `.pattern-star-8` - 8-point star pattern
- `.pattern-tessellation` - Geometric tessellation
- `.pattern-grid-islamic` - Islamic grid pattern
- `.pattern-diamond` - Diamond pattern
- `.pattern-hexagon` - Hexagon pattern

### Typography

- **Primary**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Arabic**: 'Noto Naskh Arabic', 'Scheherazade New', serif
- **Monospace**: 'JetBrains Mono', 'Fira Code', monospace (for trust scores)

### Key CSS Classes

```css
/* Layout */
.container, .container-narrow, .container-wide
.grid, .grid-cols-1 through .grid-cols-12
.flex, .flex-col, .items-center, .justify-between, .gap-*

/* Components */
.btn, .btn-primary, .btn-secondary, .btn-outline, .btn-ghost
.card, .card-header, .card-body, .card-footer
.form-input, .form-label, .form-group
.badge, .badge-verified, .badge-trust-high/medium/low
.avatar, .avatar-lg, .avatar-sm

/* Utilities */
.text-primary, .text-secondary, .text-tertiary
.m-*, .mt-*, .mb-*, .p-*, .px-*, .py-*
.hidden, .sr-only
```

## JavaScript Architecture

### Module Pattern

The entire application is wrapped in an IIFE (Immediately Invoked Function Expression):

```javascript
(function() {
  'use strict';
  // All code here
})();
```

### Core Modules

1. **CONFIG** - Constants and configuration
2. **State** - Application state management (mock data for development)
3. **DOM** - DOM manipulation utilities
4. **Storage** - localStorage wrapper
5. **API** - HTTP client with mock implementation for development
6. **Auth** - Authentication module
7. **Components** - Reusable UI component builders
8. **Pages** - Page-specific controllers

### Key JavaScript Patterns

```javascript
// DOM selection utilities
DOM.$('.selector')           // querySelector
DOM.$$('.selector')          // querySelectorAll (returns Array)
DOM.create('div', { className: 'class' }, children)

// API calls (with automatic mock fallback for local development)
API.get('/endpoint')
API.post('/endpoint', data)
API.put('/endpoint', data)
API.delete('/endpoint')

// Authentication checks
Auth.isLoggedIn()
Auth.hasRole('muslim_verified')
Auth.canAccessIslamicFinance()
Auth.canWitness()
```

## API Integration

### Base URL
```
https://api.muslimeen.org/v1
```

### Authentication
All API requests (except authentication endpoints) require:
```
Authorization: Bearer {jwt_token}
```

### Response Format
```json
{
  "success": true|false,
  "data": {},
  "message": "Optional message",
  "error": {
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/validate-invitation` | POST | Validate invitation code |
| `/auth/login` | POST | Login with credentials |
| `/auth/logout` | POST | Logout user |
| `/user/profile` | GET/PUT | Get/update user profile |
| `/user/trust-score` | GET | Get trust score details |
| `/user/connections` | GET | Get connections list |
| `/user/notifications` | GET | Get notifications |
| `/feed` | GET | Get activity feed |
| `/marketplace/{vertical}` | GET | Get marketplace items |
| `/islamic-finance/{tool}` | GET | Get Islamic finance data |

See `API_CONTRACT.md` for complete API specification.

## Key Features

### Trust Score System (0-1000)

- **High (700+)**: Green badge - Full platform privileges
- **Medium (200-699)**: Yellow badge - Standard access
- **Low (<200)**: Red badge - Limited features

Factors affecting trust score:
- Profile completeness (max 100 points)
- Connection quality (max 50 points)
- Community contributions (max 50 points)
- Verification level (Basic: 50, Full: 100, Business: 150)
- Endorsements (1 point each, max 100)
- Successful invites (+10 each)
- Failed invites (-50 each, if invitee banned)

### Verification Badges

| Badge | Description |
|-------|-------------|
| ✓ Biometric Verified | Identity verified through biometric authentication |
| ✓ Two-Witness Verified | Vouched for by two verified community members |
| ✓ Business Verified | Business entity verification completed |
| ✓ Institutional Fast-Track | Verified through partner institution |

### User Roles

1. **muslim_verified**: Full access to all features
2. **muslim_unverified**: Limited features (30-day provisional period)
3. **non_muslim**: Consumer mode only (no Islamic finance, no governance)
4. **business_provider**: Enhanced visibility, client review system

## Development Guidelines

### Code Style

- Use semantic HTML5 elements
- CSS classes follow BEM-like naming (lowercase with hyphens)
- JavaScript: camelCase for variables/functions, PascalCase for modules
- Use CSS custom properties for all colors, spacing, and typography
- Mobile-first responsive design (320px minimum)

### Accessibility Requirements

- WCAG 2.1 AA compliance (see `ACCESSIBILITY_AUDIT.md`)
- All interactive elements must be keyboard accessible
- Focus indicators must be visible
- Use ARIA labels where appropriate
- Color contrast ratios: 4.5:1 for normal text, 3:1 for UI components
- Screen reader testing with NVDA, JAWS, VoiceOver, TalkBack

### Performance Guidelines

- No external JavaScript frameworks
- Minimize HTTP requests (single CSS file, single JS file)
- Lazy load non-critical content
- Use CSS animations over JavaScript when possible
- Optimize images (WebP format preferred)

## Build and Deployment

### No Build Process

This is a static site with no build step required. Simply serve the files directly.

### Deployment Options

1. **Nginx** - See `DEPLOYMENT.md` for configuration
2. **Apache** - See `DEPLOYMENT.md` for .htaccess
3. **Cloudflare Pages** - Recommended (no build command needed)
4. **Netlify** - See `DEPLOYMENT.md` for netlify.toml
5. **AWS S3 + CloudFront**
6. **GitHub Pages**

### Required Server Configuration

- HTTPS with valid SSL certificate (required for WebAuthn biometric authentication)
- Gzip/Brotli compression enabled
- Security headers:
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
- SPA routing: Serve index.html for all routes

### Environment Variables

Create `.env` for different environments:

```bash
API_BASE_URL=https://api.muslimeen.org/v1
ENVIRONMENT=production|staging|development
```

## Testing

### Manual Testing Checklist

- [ ] All pages load correctly
- [ ] Navigation works on mobile and desktop
- [ ] Forms submit properly with validation
- [ ] Responsive design on 320px, 768px, 1024px, 1280px+
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Screen reader compatibility
- [ ] Trust score visualization correct
- [ ] Invitation validation works
- [ ] Login/logout flow complete

### Lighthouse Targets

- Performance: 90+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## Security Considerations

- Invitation-only access prevents spam accounts
- Trust score system discourages bad actors
- WebAuthn API for biometric authentication (zero-knowledge proof)
- JWT tokens with 24-hour expiration
- Automatic logout on token expiration
- Rate limiting on API endpoints
- CORS configured for allowed origins only

## Backend Integration Notes

The frontend expects a REST API backend implementing the contract in `API_CONTRACT.md`. For local development, the app includes a mock API implementation that activates automatically when:
- Protocol is `file:` (opened directly in browser)
- Hostname is `localhost`

## Key Files to Understand

1. **css/design-system.css** - All styling, CSS custom properties, components
2. **js/app.js** - All JavaScript logic, organized by modules
3. **API_CONTRACT.md** - Complete API specification for backend integration
4. **BACKEND_README.md** - Backend developer integration guide
5. **index.html** - Entry point, login page structure
6. **dashboard.html** - Main authenticated user interface

## Common Development Tasks

### Adding a New Page

1. Create HTML file based on existing page structure
2. Include design-system.css and app.js
3. Add page initialization case in `Pages` object (app.js)
4. Add navigation link in header/sidebar

### Adding a New Component

1. Add CSS classes to `design-system.css`
2. Add component builder function to `Components` object (app.js)
3. Use DOM.create() for programmatic generation

### Modifying API Integration

1. Update endpoint in `API.request()` or `API.mockRequest()`
2. Ensure response format matches API_CONTRACT.md specification
3. Update TypeScript-style interfaces in BACKEND_README.md

## Troubleshooting

### Common Issues

**API calls failing locally**: Ensure you're accessing via localhost or file:// protocol to trigger mock API mode.

**Styles not applying**: Check that design-system.css is properly linked and not cached (Ctrl+F5).

**JavaScript errors**: Check browser console, ensure DOM is loaded before scripts run.

**404 on page refresh**: Configure server for SPA routing (serve index.html for all routes).

## Resources

- **API Documentation**: See `API_CONTRACT.md`
- **Backend Guide**: See `BACKEND_README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Accessibility Audit**: See `ACCESSIBILITY_AUDIT.md`
- **License**: AGPL-3.0

---

**Last Updated**: February 2026
**Version**: 1.0
