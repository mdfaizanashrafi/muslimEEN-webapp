# MuslimEEN Architecture Diagrams

> Comprehensive architecture documentation using Mermaid syntax. These diagrams can be rendered in Markdown viewers that support Mermaid (GitHub, GitLab, VS Code, etc.).

## Available Diagrams

### 1. [System Overview](./system-overview.md)
High-level system architecture showing:
- Frontend (Next.js 14 with App Router)
- Backend API (Express/Node.js)
- Database (PostgreSQL 14+)
- Security layers and middleware
- Modular architecture components
- Data flow between components
- Deployment architecture

**Key Technologies:**
- Next.js 14.2.5 (React 18.3.1)
- Express 4.18.2
- PostgreSQL 14+
- JWT Authentication
- Winston Logging

---

### 2. [Database Schema](./database-schema.md)
Entity Relationship Diagram showing all database tables:

**Core Tables:**
- `users` - User accounts with trust scores (0-1000)
- `work_history` - Professional experience
- `education` - Academic background
- `trust_score_history` - Trust score audit trail

**Invitation System:**
- `invitations` - Invitation codes (30-day expiry)
- `invitation_outcomes` - Trust impact tracking

**Network:**
- `connections` - Professional connections
- `verification_witnesses` - Two-witness verification

**Marketplace:**
- `marketplace_items` - Four verticals (EARN/BUILD/LIVE/PROTECT)

**Islamic Finance:**
- `sadaqah_campaigns` - Charity campaigns
- `donations` - Donation records
- `waqf` - Endowment assets
- `qard_hasan_loans` - Interest-free loans
- `qard_hasan_lenders` - Loan contributors

**Communication:**
- `notifications` - User notifications
- `messages` - Direct messaging

**Security:**
- `refresh_tokens` - Token rotation

---

### 3. [Authentication Flow](./authentication-flow.md)
Sequence diagrams for:

1. **Login Flow** - Email/password authentication with JWT
2. **Registration Flow** - Invitation-based registration
3. **Authenticated Request Flow** - Protected endpoint access
4. **Token Refresh Flow** - Future implementation

**Security Features:**
- JWT tokens (HS256, 24h expiry)
- CSRF protection (double-submit cookie)
- Rate limiting (5 req/min for auth)
- bcrypt password hashing (12 rounds)
- Helmet security headers

---

### 4. [Module Structure](./module-structure.md)
Modular architecture diagrams:

**Topics Covered:**
- Legacy vs Modular comparison
- Standard module pattern (Controller → Service → Repository)
- Feature flags for gradual migration
- Module dependencies
- Event bus integration
- Migration timeline

**Modules:**
- 🔑 IAM (Identity & Access Management)
- 👤 Profile (User Profile Management)
- 🛡️ Trust (Trust Score & Verification)
- 🌐 Network (Connections & Networking)
- 🏪 Marketplace (EARN/BUILD/LIVE/PROTECT)
- ☪️ Islamic Finance (Sadaqah, Waqf, Qard Hasan)
- 📨 Invitations (Invitation System)
- 🔔 Notifications (Notification System)

---

## Quick Reference

### Viewing Diagrams

#### Option 1: GitHub/GitLab
Simply open the `.md` files - Mermaid diagrams render automatically.

#### Option 2: VS Code
Install the **Markdown Preview Mermaid Support** extension:
```
Ctrl+Shift+X → Search "Markdown Preview Mermaid" → Install
```
Then open preview: `Ctrl+Shift+V`

#### Option 3: Mermaid Live Editor
Copy diagram code to: https://mermaid.live

#### Option 4: CLI
```bash
# Install mermaid-cli
npm install -g @mermaid-js/mermaid-cli

# Generate PNG from diagram
mmdc -i system-overview.md -o system-overview.png
```

---

## Architecture Principles

### 1. Single Responsibility Principle (SRP)
Each module has one reason to change:
- **Controllers** handle HTTP only
- **Services** contain business logic
- **Repositories** handle database access

### 2. Feature Flags for Migration
Gradual migration from legacy to modular:
```typescript
// Enable module in .env
USE_MODULAR_IAM=true
USE_MODULAR_PROFILE=true
```

### 3. Event-Driven Architecture
Modules communicate via domain events:
```typescript
eventBus.publish(DomainEvents.USER_REGISTERED, {...})
```

### 4. Security First
- All endpoints protected by default
- JWT + CSRF for authentication
- Rate limiting on all endpoints
- Input validation with Joi

---

## File Structure

```
docs/architecture/diagrams/
├── README.md                 # This file - index and guide
├── system-overview.md        # High-level architecture
├── database-schema.md        # ER diagram
├── authentication-flow.md    # Auth sequence diagrams
└── module-structure.md       # Modular architecture
```

---

## Contributing

When updating architecture:
1. Update relevant diagram files
2. Test rendering with Mermaid Live Editor
3. Update this README if adding new diagrams
4. Ensure feature flags reflect current state

---

## Related Documentation

- [API Contract](../../../API_CONTRACT.md) - Complete API specification
- [Backend README](../../../BACKEND_README.md) - Backend integration guide
- [Database Setup](../../../DATABASE_SETUP.md) - PostgreSQL setup
- [AGENTS.md](../../../AGENTS.md) - Agent development guide
- [ARCHITECTURE_MIGRATION_REPORT](../../../ARCHITECTURE_MIGRATION_REPORT.md) - Migration details
- [SRP_REFACTORING_SUMMARY](../../../SRP_REFACTORING_SUMMARY.md) - SRP implementation

---

## Last Updated

March 2026
