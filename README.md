# MuslimEEN - Muslim Economic Empowerment Network

> **LinkedIn for the Muslim Community**  
> An invitation-only professional networking platform with Shariah-compliant financial tools.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

---

## 🌙 Purpose & Mission

MuslimEEN addresses a critical gap in the professional landscape: **Muslim economic disenfranchisement** in mainstream networking platforms. While platforms like LinkedIn connect professionals globally, they often fail to serve the unique economic needs of the Muslim community—particularly around Islamic finance, trust-based verification, and ethical business practices.

### The Problem We Solve

1. **Economic Marginalization**: Muslim professionals and entrepreneurs lack a dedicated platform to connect within their ethical framework
2. **Riba-Based Finance**: Existing platforms ignore Shariah-compliant financial needs (Zakat, Qard Hasan, Sadaqah, Waqf)
3. **Trust Deficit**: No verification system that respects Islamic ethics while ensuring authenticity
4. **Community Fragmentation**: Difficulty finding Muslim-owned businesses, halal services, and ethically-aligned opportunities

### Our Vision

Build the world's largest trust-based economic network for Muslims—empowering individuals and businesses to thrive economically while adhering to Islamic principles.

---

## 🛡️ Platform Immutables (Our Core Values)

These principles are non-negotiable and form the foundation of MuslimEEN:

| Principle | Commitment |
|-----------|------------|
| **No Advertising** | We will never sell user data or display ads |
| **Open Source Forever** | AGPL-3.0 licensed—complete transparency |
| **Data Portability** | Your data belongs to you |
| **Non-Discrimination** | No discrimination by sect, ethnicity, or origin |
| **Riba-Free Operations** | No interest-based finance in any form |
| **Complete Transparency** | Open governance, open finances, open code |
| **No User Fees** | Free for all users; revenue from B2B institutional services directed to Waqf surplus |

---

## ✨ Key Features

### 🤝 Professional Networking
- **Trust-Based Profiles**: 0-1000 trust score system based on verification
- **Connections**: Build your professional network within the Muslim community
- **Direct Messaging**: Secure communication between members
- **Notifications**: Real-time updates on your network activity

### 🏪 Marketplace (Four Verticals)

| Vertical | Purpose | Target Audience |
|----------|---------|-----------------|
| **EARN** | Job opportunities, freelance gigs, income generation | Job seekers, freelancers, employers |
| **BUILD** | Investment opportunities, partnerships, joint ventures | Entrepreneurs, investors, builders |
| **LIVE** | Housing, rentals, halal services, lifestyle | Families, service providers, consumers |
| **PROTECT** | Insurance alternatives, legal services, compliance | Businesses, professionals, families |

### 💰 Islamic Finance Tools

- **Zakat Calculator**: Calculate your annual Zakat obligation with precision
- **Qard Hasan**: Interest-free benevolent loans between community members
- **Sadaqah Campaigns**: Create and contribute to charitable causes
- **Waqf Management**: Endowment fund creation and tracking

### ✅ Verification System

Three-tier trust verification:

1. **Biometric Verification** - Identity verification through secure biometric authentication
2. **Two-Witness Verification** - Traditional Islamic witness-based vouching
3. **Business Verification** - Entity verification for commercial accounts

### 🎫 Invitation-Only Access

To maintain community quality and prevent spam, membership requires:
- Invitation code from existing verified member
- Or institutional partner referral
- Verified identity before full platform access

---

## 🏗️ Technology Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Custom CSS** - Islamic geometric design system
- **Inter + Noto Naskh Arabic** - Bilingual typography

### Backend
- **Node.js + Express** - API server
- **TypeScript** - Full-stack type safety
- **PostgreSQL 14+** - Primary database
- **JWT** - Stateless authentication
- **Helmet + CORS + Rate Limiting** - Security layers

### DevOps
- **Static Export** - Frontend deployable to any CDN
- **Docker-Ready** - Containerization support
- **GitHub Actions** - CI/CD pipelines

---

## 📁 Project Structure

```
muslimeen/
├── frontend/                 # Next.js 14 application
│   ├── app/                 # App Router pages
│   │   ├── (marketing)/     # Landing pages
│   │   ├── (auth)/          # Authentication flows
│   │   ├── dashboard/       # User dashboard
│   │   ├── profile/         # User profiles
│   │   ├── marketplace/     # [vertical] dynamic routes
│   │   └── islamic-finance/ # Zakat, Qard Hasan, Sadaqah, Waqf
│   ├── components/          # React components
│   ├── lib/                 # Utilities & API client
│   └── globals.css          # Design system (~1000 lines)
│
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── server.ts        # Entry point
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Legacy controllers
│   │   ├── modules/         # Modular architecture (8 modules)
│   │   ├── middleware/      # Auth, validation, rate limiting
│   │   └── models/          # Database models
│   └── database/migrations/ # SQL migrations
│
└── scripts/                  # Deployment & migration scripts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- PostgreSQL 14+
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/muslimeen/muslimeen.git
cd muslimeen
```

### 2. Database Setup

```bash
# Create database (as postgres user)
psql -U postgres -c "CREATE DATABASE muslimeen;"

# Run migrations
psql -U postgres -d muslimeen -f backend/database/migrations/001_initial_schema.sql
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your database credentials

# Development server
npm run dev
```

Backend will be available at `http://localhost:3001`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Development server
npm run dev
```

Frontend will be available at `http://localhost:8080`

---

## 🚀 Deploy to Production

Deploy MuslimEEN for free using Vercel + Render + Neon + Upstash:

### Quick Deploy (15 minutes)

| Service | Purpose | Cost |
|---------|---------|------|
| [Vercel](https://vercel.com) | Frontend hosting | Free |
| [Render](https://render.com) | Backend API | Free |
| [Neon](https://neon.tech) | PostgreSQL database | Free |
| [Upstash](https://upstash.com) | Redis cache | Free |

**Step-by-step guides:**
- 📋 [`DEPLOY-CHECKLIST.md`](DEPLOY-CHECKLIST.md) - Print and check off items
- 📖 [`DEPLOY-STEP-BY-STEP.md`](DEPLOY-STEP-BY-STEP.md) - Detailed instructions with screenshots
- 🔧 [`DEPLOY-QUICKREF.md`](DEPLOY-QUICKREF.md) - Quick reference for commands

### Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │──────▶   Render    │──────▶    Neon     │
│  (Frontend) │      │  (Backend)  │      │ (Database)  │
└─────────────┘      └──────┬──────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │   Upstash   │
                     │   (Redis)   │
                     └─────────────┘
```

---

## 🧪 Development

### Available Scripts

**Backend:**
```bash
npm run dev          # Development with hot reload
npm run build        # Compile TypeScript
npm start            # Production server
npm run migrate      # Run database migrations
```

**Frontend:**
```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint check
```

### Architecture

The backend uses a **hybrid architecture** supporting both legacy and modular implementations:

- **Legacy Controllers**: Original monolithic controllers
- **Modular Architecture**: Domain-driven modules (IAM, Profile, Trust, Network, Marketplace, Islamic Finance, Invitations, Notifications)
- **Feature Flags**: Toggle between implementations via environment variables

Toggle modules in `backend/.env`:
```env
USE_MODULAR_IAM=false
USE_MODULAR_PROFILE=false
USE_MODULAR_TRUST=false
# ... etc
```

---

## 🔒 Security

- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - Request throttling
- **JWT** - Stateless authentication
- **bcrypt** - Password hashing (12 rounds)
- **Input Validation** - Joi schema validation
- **XSS Protection** - Escaped HTML, CSP headers
- **SQL Injection Prevention** - Parameterized queries

---

## 🤝 Contributing

We welcome contributions from the community! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code of Conduct

- Be respectful and inclusive
- Follow Islamic ethics in all interactions
- Prioritize community benefit over personal gain
- Maintain confidentiality of sensitive data

---

## 📜 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- ✅ Free to use, modify, and distribute
- ✅ Must share source code with users
- ✅ Derivative works must be open source
- ✅ Network use counts as distribution

See [LICENSE](LICENSE) for full details.

---

## 🙏 Acknowledgments

- **Muslim Community** - For inspiring this platform
- **Open Source Contributors** - For building the tools we use
- **Islamic Finance Scholars** - For guidance on Shariah compliance
- **Beta Testers** - For early feedback and patience

---

## 📞 Contact & Support

- **Website**: https://muslimeen.org
- **Email**: contact@muslimeen.org
- **GitHub Issues**: For bug reports and feature requests
- **Discord Community**: [Join our server](https://discord.gg/muslimeen)

---

## 🌟 Join the Mission

MuslimEEN is more than a platform—it's a movement to empower the global Muslim ummah economically. Whether you're a developer, designer, entrepreneur, or community leader, there's a place for you in this mission.

**Together, we build. Together, we prosper.**

---

<p align="center">
  <strong>Made with ❤️ for the Muslim Ummah</strong><br>
  <em>"The believers are but a single brotherhood" — Quran 49:10</em>
</p>
