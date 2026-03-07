# MuslimEEN System Overview

> High-level architecture diagram showing the complete system structure and data flow.

## System Architecture Diagram

```mermaid
flowchart TB
    subgraph External["🌐 External Layer"]
        User["👤 User<br/>Browser/Mobile"]
        CDN["☁️ CDN<br/>CloudFlare/Vercel"]
    end

    subgraph Frontend["⚛️ Frontend Layer (Next.js 14)"]
        AppRouter["📱 App Router<br/>Server Components"]
        Components["🧩 React Components<br/>Client Components"]
        APIClient["🔌 API Client<br/>lib/api.ts"]
        Styles["🎨 Design System<br/>globals.css"]
    end

    subgraph Backend["🚀 Backend Layer (Express/Node.js)"]
        subgraph APIGateway["🛡️ API Gateway"]
            Security["🔒 Security Middleware<br/>Helmet, CORS, Rate Limit"]
            Auth["🔐 Auth Middleware<br/>JWT Validation"]
            Validation["✅ Validation<br/>Joi Schema"]
        end

        subgraph LegacyControllers["📦 Legacy Controllers"]
            AuthCtrl["Auth Controller"]
            UserCtrl["User Controller"]
            MarketCtrl["Marketplace Controller"]
            FinanceCtrl["Islamic Finance Controller"]
        end

        subgraph ModularServices["🔧 Modular Services (SRP)"]
            AuthSvc["Auth Service"]
            TrustSvc["Trust Score Service"]
            InviteSvc["Invitation Service"]
            NotifSvc["Notification Service"]
        end

        subgraph Modules["📁 New Module Architecture"]
            IAM["🔑 IAM Module<br/>Identity & Access"]
            Profile["👤 Profile Module"]
            Trust["🛡️ Trust Module<br/>Verification & Scoring"]
            Network["🌐 Network Module<br/>Connections"]
            Marketplace["🏪 Marketplace Module"]
            IslamicFinance["☪️ Islamic Finance Module"]
            Invitations["📨 Invitations Module"]
            Notifications["🔔 Notifications Module"]
        end
    end

    subgraph DataLayer["💾 Data Layer"]
        PostgreSQL["🐘 PostgreSQL 14+<br/>Primary Database"]
        Logger["📊 Winston Logger"]
        EventBus["📡 Event Bus<br/>Domain Events"]
    end

    %% Connections
    User -->|"HTTPS Request"| CDN
    CDN -->|"Static Assets"| Frontend
    
    AppRouter --> Components
    Components --> APIClient
    APIClient -->|"REST API /api/*"| Security
    
    Security --> Auth
    Auth --> Validation
    
    Validation --> LegacyControllers
    Validation --> Modules
    
    LegacyControllers --> ModularServices
    Modules --> PostgreSQL
    ModularServices --> PostgreSQL
    
    Modules --> EventBus
    EventBus --> Notifications
    EventBus --> Logger
    
    AuthCtrl --> AuthSvc
    UserCtrl --> TrustSvc
    MarketCtrl --> PostgreSQL
    FinanceCtrl --> PostgreSQL
    
    IAM --> PostgreSQL
    Profile --> PostgreSQL
    Trust --> PostgreSQL
    Network --> PostgreSQL
    Marketplace --> PostgreSQL
    IslamicFinance --> PostgreSQL
    Invitations --> PostgreSQL
    Notifications --> PostgreSQL
    
    Backend --> Logger

    %% Styling
    style External fill:#e1f5fe
    style Frontend fill:#f3e5f5
    style Backend fill:#e8f5e9
    style DataLayer fill:#fff3e0
    style Modules fill:#c8e6c9
    style ModularServices fill:#dcedc8
```

## Architecture Components

### 1. Frontend (Next.js 14)
| Component | Technology | Purpose |
|-----------|------------|---------|
| App Router | Next.js 14 App Router | Server-side rendering, routing |
| Components | React 18 | UI components with CSS variables |
| API Client | TypeScript/fetch | REST API communication |
| Styles | CSS Variables | Islamic geometric design system |

### 2. Backend (Express/Node.js)
| Component | Technology | Purpose |
|-----------|------------|---------|
| API Gateway | Express middleware | Security, auth, validation |
| Legacy Controllers | TypeScript | HTTP request handlers (being migrated) |
| Modular Services | TypeScript | Business logic (SRP compliant) |
| New Modules | TypeScript | Feature-based module architecture |

### 3. Database (PostgreSQL 14+)
| Feature | Description |
|---------|-------------|
| UUID Primary Keys | `uuid-ossp` extension |
| Relations | Foreign key constraints with CASCADE |
| Indexes | Performance-optimized indexes |
| Triggers | `updated_at` auto-timestamp |

### 4. Security Layer
| Component | Implementation |
|-----------|----------------|
| Authentication | JWT with 24h expiry |
| CSRF Protection | Double-submit cookie pattern |
| Rate Limiting | Per-endpoint limits |
| CORS | Whitelist-based origins |
| Helmet | Security headers |

## Data Flow

1. **User Request** → CDN (static) or API (dynamic)
2. **Frontend** → API Client with JWT + CSRF token
3. **Backend** → Security middleware → Auth middleware → Validation
4. **Controller** → Service → Repository
5. **Database** → PostgreSQL with relations
6. **Response** → JSON with user data
7. **Events** → EventBus → Notifications/Logging

## Deployment Architecture

```mermaid
flowchart LR
    subgraph Production["🚀 Production Environment"]
        Vercel["▲ Vercel<br/>Frontend Hosting"]
        Render["🌵 Render<br/>Backend Hosting"]
        NeonDB["⚡ Neon PostgreSQL<br/>Serverless DB"]
    end
    
    User["👤 User"] --> Cloudflare["☁️ Cloudflare CDN"]
    Cloudflare --> Vercel
    Vercel -->|"API Calls"| Render
    Render --> NeonDB
```

## Technology Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js | 14.2.5 |
| Frontend | React | 18.3.1 |
| Frontend | TypeScript | 5.5.2 |
| Backend | Node.js | >= 18.0.0 |
| Backend | Express | 4.18.2 |
| Backend | TypeScript | 5.3.3 |
| Database | PostgreSQL | 14+ |
| Auth | JWT | jsonwebtoken |
| Validation | Joi | - |
| Logging | Winston | - |
