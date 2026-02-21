# MuslimEEN - Agent Development Guide

> **Muslim Economic Empowerment Network**  
> An invitation-only professional networking platform for the Muslim community.

---

## Project Overview

MuslimEEN is a LinkedIn-equivalent professional networking platform built specifically for the Muslim community's economic participation. The platform features:

- **Trust-based verification system** with 0-1000 trust scores
- **Shariah-compliant financial tools** (Zakat calculator, Qard Hasan, Sadaqah, Waqf)
- **Four marketplace verticals**: EARN, BUILD, LIVE, PROTECT
- **Invitation-only access** to prevent spam and maintain community quality
- **Islamic geometric design system** with jewel-tone color palette

### Core Platform Immutables
- No advertising or user data sales
- Open source forever (AGPL-3.0) with data portability
- Non-discrimination by sect or ethnicity
- No interest-based finance (riba-free operations)
- Complete transparency in governance, finances, and code
- No user fees; revenue only from B2B institutional services directed to Waqf surplus

---

## Technology Stack

### Frontend
| Technology | Version/Details |
|------------|-----------------|
| HTML5 | Semantic markup with accessibility focus |
| CSS3 | Custom design system with CSS variables |
| JavaScript | Vanilla JS (no frameworks) |
| Fonts | Inter (primary), Noto Naskh Arabic (Arabic) |

**Key Decision**: No external JavaScript frameworks (React, Vue, Angular) are used. This is intentional for:
- Maximum performance (< 150KB total bundle size)
- Fast load times (< 2 seconds on 4G)
- Reduced complexity and maintenance burden
- Framework-free longevity

### Backend Integration
- RESTful API at `https://api.muslimeen.org/v1`
- JWT-based authentication (24-hour expiry)
- Bearer token in `Authorization` header
- Standard response format:
  ```json
  {
    "success": true,
    "data": {},
    "message": "Optional message",
    "error": null
  }
  ```

---

## Project Structure

```
muslimeen/
├── frontend/                    # All frontend source files
│   ├── index.html              # Login page (entry point)
│   ├── dashboard.html          # Main dashboard
│   ├── profile.html            # User profile
│   ├── verification.html       # Verification status
│   ├── connections.html        # Network/connections
│   ├── messages.html           # Messaging interface
│   ├── marketplace-*.html      # Four marketplace verticals
│   ├── islamic-finance.html    # Islamic finance tools
│   ├── css/
│   │   └── design-system.css   # Complete design system
│   └── js/
│       └── app.js              # Main application (vanilla JS)
│
├── README.md                   # Human-readable project overview
├── API_CONTRACT.md             # Complete API specification
├── BACKEND_README.md           # Backend integration guide
├── DEPLOYMENT.md               # Deployment instructions
├── ACCESSIBILITY_AUDIT.md      # WCAG 2.1 AA compliance report
└── AGENTS.md                   # This file
```

### File Organization Conventions

1. **HTML Pages**: One file per page, named descriptively (e.g., `marketplace-earn.html`)
2. **CSS**: Single comprehensive file containing all styles with CSS custom properties
3. **JavaScript**: Single modular file with IIFE pattern, organized by feature modules
4. **No build step**: Files are served as-is; no bundling or transpilation required

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

### Islamic Geometric Patterns
All patterns are CSS-generated (no images):
- `.pattern-star-8` - 8-point star pattern
- `.pattern-tessellation` - Geometric tessellation
- `.pattern-grid-islamic` - Islamic grid pattern
- `.pattern-diamond` - Diamond pattern
- `.pattern-hexagon` - Hexagon pattern

### Component Classes
| Component | Class | Variants |
|-----------|-------|----------|
| Button | `.btn` | `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-ghost`, `.btn-sm`, `.btn-lg` |
| Card | `.card` | `.card-header`, `.card-body`, `.card-footer` |
| Form Input | `.form-input` | `.form-select`, `.form-textarea` |
| Badge | `.badge` | `.badge-verified`, `.badge-trust-high`, `.badge-trust-medium`, `.badge-trust-low` |
| Avatar | `.avatar` | `.avatar-sm`, `.avatar-lg` |

---

## JavaScript Architecture

### Module Structure (in `app.js`)
```javascript
// Main modules in the IIFE:
CONFIG      // Configuration constants
State       // Application state management
DOM         // DOM manipulation utilities
Storage     // localStorage wrapper
API         // API client with mock implementation
Auth        // Authentication module
Components  // UI component factory
Pages       // Page-specific controllers
```

### Mock Data System
The frontend includes a comprehensive mock data system for development. When running locally (`file://` or `localhost`), API calls return mock data instead of hitting the real API.

**To switch to real API**: Remove or modify the condition in `API.request()`:
```javascript
if (window.location.protocol === 'file:' || window.location.hostname === 'localhost') {
  return API.mockRequest(endpoint, config);
}
```

### Key Configuration Values
```javascript
API_BASE_URL: '/api/v1'
STORAGE_KEY: 'muslimeen_session'
SESSION_DURATION: 24 * 60 * 60 * 1000  // 24 hours
TRUST_SCORE_MAX: 1000
TRUST_SCORE_MIN: 0
```

---

## Page Initialization

Pages are auto-initialized based on the filename:

| Page File | Initialization Function |
|-----------|------------------------|
| `index.html` | `Pages.login()` |
| `dashboard.html` | `Pages.dashboard()` |
| `profile.html` | `Pages.profile()` |
| `verification.html` | `Pages.verification()` |
| `connections.html` | `Pages.connections()` |
| `messages.html` | `Pages.messages()` |
| `marketplace-*.html` | `Pages.marketplace(vertical)` |
| `islamic-finance.html` | `Pages.islamicFinance(tool)` |

---

## API Endpoints Reference

### Authentication
- `POST /auth/validate-invitation` - Validate invitation code
- `POST /auth/login` - Login with credentials
- `POST /auth/logout` - Logout user

### User
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `GET /user/notifications` - Get notifications
- `GET /user/connections` - Get connections list
- `GET /user/trust-score` - Get trust score details

### Marketplace
- `GET /marketplace/{vertical}` - Get marketplace items (vertical: earn, build, live, protect)
- `POST /marketplace/{vertical}` - Create new listing

### Islamic Finance
- `GET /islamic-finance/sadaqah` - Get charity campaigns
- `GET /islamic-finance/waqf` - Get Waqf listings
- `GET /islamic-finance/qardhasan` - Get Qard Hasan loans
- `POST /islamic-finance/zakat/calculate` - Calculate Zakat

See `API_CONTRACT.md` for complete details.

---

## Development Guidelines

### Code Style

1. **JavaScript**: Use ES6+ features but avoid experimental syntax
   - Use `const` and `let` (no `var`)
   - Use arrow functions for callbacks
   - Use template literals for string interpolation
   - Use destructuring where appropriate

2. **CSS**: 
   - Use CSS custom properties (variables) for all theme values
   - Follow BEM-like naming: `.block-element--modifier`
   - Mobile-first responsive design
   - Avoid `!important` (except in print styles)

3. **HTML**:
   - Semantic HTML5 elements (`<header>`, `<main>`, `<nav>`, etc.)
   - ARIA labels where needed for accessibility
   - `lang` attribute on all text elements with different languages

### Accessibility Requirements
- WCAG 2.1 AA compliance (see `ACCESSIBILITY_AUDIT.md`)
- All interactive elements must be keyboard accessible
- Color contrast minimum 4.5:1 for text
- Focus indicators must be visible
- Screen reader announcements for dynamic content

### Performance Budget
- Total CSS + JS bundle: < 150KB
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s

---

## Testing Strategy

### No Automated Test Suite Currently
This project does not currently have automated tests. Testing is manual:

1. **Manual Testing Checklist**:
   - All pages load without console errors
   - Navigation works between all pages
   - Forms submit correctly
   - Responsive design on mobile/tablet/desktop
   - Accessibility audit passes (Lighthouse)

2. **Browser Support**:
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+
   - Mobile Safari (iOS 14+)
   - Chrome Mobile (Android 10+)

### Mock API for Development
The built-in mock API allows frontend development without a running backend. Mock data is defined in `State.mockData` object in `app.js`.

---

## Build and Deployment

### No Build Step Required
This is a static site. No build tools, bundlers, or package managers are needed.

### Local Development
Simply open `frontend/index.html` in a browser, or serve with any static file server:

```bash
# Python 3
python -m http.server 8000 --directory frontend

# Node.js (if http-server is installed)
npx http-server frontend -p 8000

# PHP
php -S localhost:8000 -t frontend
```

### Production Deployment
Deploy the `frontend/` directory to any static hosting service:

- **Cloudflare Pages** (recommended)
- **Netlify**
- **Vercel**
- **AWS S3 + CloudFront**
- **Nginx or Apache**

See `DEPLOYMENT.md` for detailed configurations.

### Security Headers Required
```
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## User Roles and Permissions

| Role | Access Level |
|------|-------------|
| `muslim_verified` | Full access to all features |
| `muslim_unverified` | Limited features (30-day provisional period) |
| `non_muslim` | Consumer mode only (no Islamic finance, no governance) |
| `business_provider` | Enhanced visibility, client review system |

### Verification Badges
- `biometric` - Identity verified through biometric authentication
- `two_witness` - Vouched for by two verified community members
- `business` - Business entity verification completed
- `institutional` - Verified through partner institution

---

## Common Development Tasks

### Adding a New Page
1. Create HTML file in `frontend/` (e.g., `new-feature.html`)
2. Add page initialization in `app.js` `init()` function:
   ```javascript
   case 'new-feature':
     Pages.newFeature();
     break;
   ```
3. Add corresponding controller method in `Pages` object
4. Add navigation link in relevant HTML files

### Adding a New Component
1. Add CSS to `design-system.css` following naming conventions
2. Add JavaScript factory method in `Components` object:
   ```javascript
   newComponent(data) {
     return DOM.create('div', { className: 'new-component' }, [
       // component structure
     ]);
   }
   ```

### Adding an API Endpoint
1. Add mock handler in `API.mockRequest()` method
2. Add convenience method in `API` object if needed
3. Update `API_CONTRACT.md` with endpoint documentation

---

## Environment Configuration

No environment files are currently used. To add environment-specific configuration:

1. Create a `config.js` file (gitignored)
2. Load it before `app.js` in HTML
3. Reference `window.CONFIG` in the application

Example `config.js`:
```javascript
window.ENV = {
  API_BASE_URL: 'https://api-staging.muslimeen.org/v1',
  ENVIRONMENT: 'staging'
};
```

---

## Debugging

The application exposes a global `MuslimEEN` object for debugging:

```javascript
// Access in browser console
MuslimEEN.State      // Current application state
MuslimEEN.Auth       // Authentication methods
MuslimEEN.API        // API client
MuslimEEN.Components // Component factories
MuslimEEN.Pages      // Page controllers
MuslimEEN.CONFIG     // Configuration constants
```

**Note**: Remove this exposure in production by modifying the end of `app.js`.

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `frontend/index.html` | Login page - entry point |
| `frontend/css/design-system.css` | All styles, ~1500 lines |
| `frontend/js/app.js` | All JavaScript, ~1800 lines |
| `API_CONTRACT.md` | Complete API specification |
| `BACKEND_README.md` | Backend integration requirements |
| `DEPLOYMENT.md` | Deployment configurations |
| `ACCESSIBILITY_AUDIT.md` | WCAG compliance documentation |

---

## License

AGPL-3.0 - Open source forever as per platform immutables.

---

**Last Updated**: Based on project state as of February 2026
