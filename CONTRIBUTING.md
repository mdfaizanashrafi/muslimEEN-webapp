# 🤝 Contributing to MuslimEEN

> *"The believers are but a single brotherhood"* — Quran 49:10

First off, **thank you** for considering contributing to MuslimEEN! 🌟 Your time, skills, and dedication help empower the global Muslim ummah economically. Whether you're fixing a bug, adding a feature, or improving documentation, every contribution matters.

---

## 📜 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Workflow](#-development-workflow)
- [Code Standards](#-code-standards)
- [Testing Guidelines](#-testing-guidelines)
- [Documentation](#-documentation)
- [Pull Request Process](#-pull-request-process)
- [Getting Help](#-getting-help)
- [Recognition](#-recognition)

---

## 🌙 Code of Conduct

### Our Ethical Foundation

As a platform serving the Muslim community, we hold ourselves to the highest ethical standards rooted in Islamic principles:

| Principle | Application in Our Work |
|-----------|------------------------|
| **Honesty (Sidq)** | Write truthful commit messages. Acknowledge when you don't know something. |
| **Excellence (Ihsan)** | Strive for the highest code quality. "Allah loves that when anyone of you does a job, he does it perfectly." |
| **Respect (Adab)** | Be kind in code reviews. No belittling comments. Constructive feedback only. |
| **Trust (Amanah)** | Handle user data responsibly. Security is not optional. |
| **Community Benefit (Maslaha)** | Prioritize features that help the ummah over personal preferences. |

### Expected Behavior

- ✅ Use welcoming and inclusive language
- ✅ Accept constructive criticism gracefully
- ✅ Focus on what's best for the community
- ✅ Show empathy towards others
- ✅ Maintain confidentiality of any sensitive data you encounter

### Unacceptable Behavior

- ❌ Discrimination of any kind (sect, ethnicity, gender, etc.)
- ❌ Trolling, insulting/derogatory comments, or personal attacks
- ❌ Public or private harassment
- ❌ Publishing others' private information without permission
- ❌ Introducing riba-based (interest) financial logic in any form

**Violations** can be reported confidentially to: conduct@muslimeen.org

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- [ ] **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- [ ] **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- [ ] **Git** ([Download](https://git-scm.com/downloads))
- [ ] A code editor (VS Code recommended)

### One-Command Setup 🎯

We provide an automated setup script to get you running in minutes:

```bash
# Clone the repository
git clone https://github.com/muslimeen/muslimeen.git
cd muslimeen

# Run the setup script (creates database, installs deps, sets up env)
./setup.sh

# Or on Windows
./setup.ps1
```

<details>
<summary><b>🔧 Manual Setup (if script fails)</b></summary>

```bash
# 1. Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE muslimeen;"

# 2. Run migrations
psql -U postgres -d muslimeen -f backend/database/migrations/001_initial_schema.sql

# 3. Setup Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run dev  # Starts on http://localhost:3001

# 4. Setup Frontend (new terminal)
cd frontend
npm install
npm run dev  # Starts on http://localhost:8080
```

</details>

### Verify Your Setup ✅

After setup, run the verification command:

```bash
# Run all tests
npm test

# Expected output: All tests passing ✓
```

**Troubleshooting:**
- Port conflicts? Check [RUN_GUIDE.md](./RUN_GUIDE.md)
- Database issues? Check [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- Still stuck? [Ask for help](#-getting-help)

---

## 🌿 Development Workflow

### Branch Naming Conventions

All branches should follow this pattern:

```
<type>/<short-description>
```

| Type | Purpose | Example |
|------|---------|---------|
| `feature/` | New features | `feature/zakat-calculator-enhancement` |
| `bugfix/` | Bug fixes | `bugfix/login-redirect-loop` |
| `docs/` | Documentation only | `docs/api-authentication` |
| `refactor/` | Code restructuring | `refactor/split-auth-controller` |
| `test/` | Adding/updating tests | `test/marketplace-unit-tests` |
| `hotfix/` | Critical production fixes | `hotfix/security-vulnerability` |

**Tips:**
- Use lowercase with hyphens
- Keep descriptions under 50 characters
- Reference issue numbers when applicable: `feature/123-trust-score-algorithm`

### Commit Message Format

We follow **Conventional Commits** for clear history, enforced by **commitlint**:

```
<type>(<scope>): <subject>

<body> (optional)

<footer> (optional)
```

**Types:**

| Type | Use When | Example |
|------|----------|---------|
| `feat` | New feature | `feat(islamic-finance): add Zakat calculator` |
| `fix` | Bug fix | `fix(auth): resolve JWT expiration issue` |
| `docs` | Documentation | `docs(readme): update setup instructions` |
| `style` | Code style (formatting) | `style(components): fix indentation` |
| `refactor` | Code restructuring | `refactor(api): extract validation middleware` |
| `test` | Adding tests | `test(services): add unit tests for TrustScoreService` |
| `chore` | Maintenance | `chore(deps): update TypeScript to 5.5` |
| `perf` | Performance | `perf(queries): optimize marketplace search` |
| `ci` | CI/CD changes | `ci(github): add automated testing workflow` |
| `build` | Build system | `build(webpack): upgrade to version 5` |
| `revert` | Revert changes | `revert(auth): remove broken OAuth implementation` |

**Scopes:**

| Scope | Description |
|-------|-------------|
| `auth` | Authentication & authorization |
| `user` | User management |
| `profile` | User profiles |
| `connection` | Network connections |
| `marketplace` | Marketplace features |
| `finance` | Islamic finance tools |
| `trust` | Trust scores & verification |
| `notification` | Notifications |
| `api` | API endpoints |
| `db` | Database changes |
| `deps` | Dependencies |
| `config` | Configuration |

**Examples:**

```bash
# Simple commit
feat(marketplace): add filtering by vertical type

# Detailed commit
feat(verification): implement biometric verification flow

- Add face-api.js integration
- Store biometric hashes securely
- Add verification status to user profile

Closes #456

# Breaking change
feat(api)!: redesign marketplace endpoints

BREAKING CHANGE: Response format changed from snake_case to camelCase
```

**Commit Message Enforcement:**

We use commitlint to validate commit messages. The configuration is in `.commitlintrc.json`:

- Header max length: 72 characters
- Subject must not end with a period
- Type and scope must be from the allowed list

**Git Commit Template:**

A commit template is configured in `.gitmessage`. When you run `git commit` without the `-m` flag, your editor will show:

```
# <type>(<scope>): <subject>
#
# [Explain what changed and why in the body]
#
# [Reference any issues: Fixes #123, Related to #456]
```

**Manual Validation:**

```bash
# Backend
npx commitlint --edit

# Frontend
npx commitlint --edit
```

### Pull Request Template

When creating a PR, please fill out this template:

```markdown
## 📝 Summary
<!-- Brief description of changes -->

## 🔍 Type of Change
- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📚 Documentation update
- [ ] ♻️ Refactoring
- [ ] 🧪 Tests
- [ ] 🔒 Security fix

## 🧪 Testing
<!-- How have you tested these changes? -->
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## 📋 Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] JSDoc comments added
- [ ] No new warnings
- [ ] Documentation updated (if needed)

## 🔗 Related Issues
Fixes #(issue number)

## 📸 Screenshots (if UI changes)
<!-- Add before/after screenshots -->
```

---

## 💻 Code Standards

### TypeScript Strict Mode

We use **strict TypeScript** configuration. No `any` types without justification!

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  trustScore: number;
}

function getUserById(id: string): Promise<User | null> {
  // Implementation
}

// ❌ Bad
function getUserById(id: any): any {
  // Implementation
}
```

**Rules:**
- Enable strict mode in `tsconfig.json`
- Explicit return types on exported functions
- No implicit `any` — always define types
- Use interfaces over type aliases for objects

### JSDoc Documentation

All exported functions, classes, and interfaces must have JSDoc comments:

```typescript
/**
 * Calculates Zakat obligation based on user's assets
 * 
 * @param assets - Array of asset values in USD
 * @param goldPrice - Current gold price per gram
 * @param nisabDays - Days held above nisab threshold (default: 1 lunar year)
 * @returns Calculated Zakat amount or null if below nisab
 * @throws {ValidationError} If assets array is empty
 * 
 * @example
 * ```typescript
 * const zakat = calculateZakat([10000, 5000], 75.50);
 * console.log(zakat); // 375.00
 * ```
 */
export function calculateZakat(
  assets: number[],
  goldPrice: number,
  nisabDays: number = 354
): number | null {
  // Implementation
}
```

### Test Coverage Requirements

| Metric | Minimum | Target |
|--------|---------|--------|
| Statements | 80% | 90% |
| Branches | 75% | 85% |
| Functions | 80% | 90% |
| Lines | 80% | 90% |

```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Code Formatting with Prettier

We use Prettier for consistent formatting:

```bash
# Check formatting
npx prettier --check "src/**/*.{ts,tsx,js,jsx}"

# Fix formatting
npx prettier --write "src/**/*.{ts,tsx,js,jsx}"
```

**Prettier Configuration:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

**VS Code Users:** Enable "Format On Save" for automatic formatting.

### ESLint Rules

Our ESLint configuration enforces quality:

```bash
# Check all files
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

**Key Rules:**
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/no-unused-vars`: error (except `_` prefix)
- `no-console`: warn (use logger instead)
- `prefer-const`: error

---

## 🧪 Testing Guidelines

### Test Directory Structure

```
backend/
├── tests/
│   ├── unit/              # Unit tests (isolated functions)
│   │   ├── services/      # Service method tests
│   │   └── utils/         # Utility function tests
│   ├── integration/       # API endpoint tests
│   │   └── migration/
│   │       └── api-endpoints.test.ts
│   ├── modules/           # Module parity tests
│   │   ├── iam.parity.test.ts
│   │   └── marketplace.parity.test.ts
│   ├── mocks/             # Mock data and stubs
│   ├── utils/             # Test utilities
│   ├── setup.ts           # Jest configuration
│   └── README.md          # Test documentation
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- TrustScoreService.test.ts

# Run with coverage
npm test -- --coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run migration tests
node tests/run-migration-tests.js --all

# Watch mode (during development)
npm test -- --watch
```

### Test Naming Conventions

```typescript
// ✅ Good - descriptive and specific
describe('TrustScoreService', () => {
  describe('calculateScore', () => {
    it('should return 500 for user with biometric verification', async () => {
      // test
    });

    it('should throw ValidationError when userId is empty', async () => {
      // test
    });
  });
});

// ❌ Bad - vague descriptions
describe('TrustScoreService', () => {
  it('works', () => {});
  it('handles error', () => {});
});
```

### Unit Test Example

```typescript
import { TrustScoreService } from '../../../src/services/TrustScoreService';
import { mockUser } from '../../mocks/user.mock';

describe('TrustScoreService', () => {
  let service: TrustScoreService;

  beforeEach(() => {
    service = new TrustScoreService();
  });

  describe('calculateBaseScore', () => {
    it('should award 200 points for profile completion', () => {
      const user = mockUser({ profileComplete: true });
      const score = service.calculateBaseScore(user);
      expect(score).toBe(200);
    });

    it('should award 0 points for incomplete profile', () => {
      const user = mockUser({ profileComplete: false });
      const score = service.calculateBaseScore(user);
      expect(score).toBe(0);
    });
  });
});
```

### Integration Test Example

```typescript
import request from 'supertest';
import app from '../../src/server';

describe('POST /api/auth/login', () => {
  it('should authenticate valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'ValidPassword123!'
      })
      .expect(200);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', 'test@example.com');
  });

  it('should reject invalid credentials', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
      .expect(401);
  });
});
```

---

## 📚 Documentation

### When to Update README

Update the README when you:

- [ ] Add a new feature that changes user workflow
- [ ] Modify the setup/installation process
- [ ] Change environment variable requirements
- [ ] Add new scripts or commands
- [ ] Update technology stack

### When to Create ADRs

Create an Architecture Decision Record (ADR) when:

- [ ] Introducing a new technology or dependency
- [ ] Making significant architectural changes
- [ ] Changing database schema patterns
- [ ] Modifying authentication/authorization approaches
- [ ] Deciding between competing solutions

**ADR Template Location:** `docs/adr/0000-template.md`

### API Documentation Updates

Update `API_CONTRACT.md` when:

- [ ] Adding new endpoints
- [ ] Changing request/response formats
- [ ] Modifying authentication requirements
- [ ] Adding error codes

**Format:**

```markdown
### POST /api/new-endpoint

**Description:** Brief description

**Authentication:** Required

**Request Body:**
```json
{
  "field": "type"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {}
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
```

### Code Comments

Use comments to explain **why**, not **what**:

```typescript
// ❌ Bad - explains obvious code
// Increment counter by 1
counter++;

// ✅ Good - explains business logic
// Trust score bonus for Ramadan participation
// per product requirement: ECON-123
counter += 50;
```

---

## 🔀 Pull Request Process

### Pre-PR Checklist

Before submitting your PR:

- [ ] **Code Quality**
  - [ ] All tests pass locally (`npm test`)
  - [ ] Coverage meets minimum requirements (80%)
  - [ ] No ESLint errors (`npm run lint`)
  - [ ] Code formatted with Prettier
  - [ ] JSDoc comments added for new functions

- [ ] **Functionality**
  - [ ] Feature works as described
  - [ ] Edge cases handled
  - [ ] Error handling implemented
  - [ ] No console.log statements (use logger)

- [ ] **Documentation**
  - [ ] README updated (if needed)
  - [ ] API_CONTRACT updated (if needed)
  - [ ] ADR created for architectural changes

- [ ] **Git**
  - [ ] Branch is up-to-date with `main`
  - [ ] Commits follow conventional format
  - [ ] No merge conflicts
  - [ ] Commit messages are descriptive

### Submitting Your PR

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create PR on GitHub:**
   - Use the PR template
   - Link related issues (`Fixes #123`)
   - Add appropriate labels
   - Request reviewers

3. **CI Checks Must Pass:**
   - ✅ All tests passing
   - ✅ Coverage above threshold
   - ✅ Build successful
   - ✅ No security vulnerabilities
   - ✅ Linting clean

### Review Requirements

Every PR requires:

- [ ] **Code Review:** At least 1 approving review from a maintainer
- [ ] **Automated Checks:** All CI checks passing
- [ ] **Manual Testing:** For UI changes, reviewer should test locally

**Review Timeline:**
- Initial review within 48 hours
- Follow-up reviews within 24 hours

**Addressing Feedback:**

```bash
# Make requested changes
git add .
git commit -m "refactor(auth): address PR feedback

- Extract validation to separate function
- Add error handling for edge case
- Update JSDoc comments"

# Push updates (no need to create new PR)
git push origin feature/your-feature-name
```

### After Merge

Once your PR is merged:

- 🎉 Celebrate! You've contributed to empowering the ummah!
- 🗑️ Delete your feature branch
- 📖 Update your local main branch

---

## 🆘 Getting Help

### Community Channels

| Channel | Purpose | Link |
|---------|---------|------|
| Discord | Real-time chat, quick questions | [Join Server](https://discord.gg/muslimeen) |
| GitHub Discussions | Design discussions, ideas | [Discussions Tab](https://github.com/muslimeen/muslimeen/discussions) |
| GitHub Issues | Bug reports, feature requests | [Issues Tab](https://github.com/muslimeen/muslimeen/issues) |
| Email | Private/sensitive matters | dev@muslimeen.org |

### How to Ask Questions

**Good Questions Get Good Answers:**

1. **Search first** — Check existing issues/Discussions
2. **Provide context** — What are you trying to achieve?
3. **Show your work** — What have you tried?
4. **Include errors** — Full error messages, stack traces
5. **Environment info** — OS, Node version, database version

**Example:**

```markdown
**Problem:** Getting "ECONNREFUSED" when running `npm run dev`

**Environment:**
- OS: Windows 11
- Node: 18.17.0
- PostgreSQL: 15.2

**Steps Taken:**
1. Ran `./setup.ps1` successfully
2. Database created and migrations applied
3. Checked that PostgreSQL service is running

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**What I've Tried:**
- Verified `.env` has correct credentials
- Restarted PostgreSQL service
- Checked port availability
```

### Good First Issues

New to the project? Look for issues labeled:

- `good first issue` — Beginner-friendly tasks
- `help wanted` — Community assistance needed
- `documentation` — Docs improvements
- `bug` — Fixes needed

**Find them:** [Good First Issues](https://github.com/muslimeen/muslimeen/labels/good%20first%20issue)

### Mentorship

Need one-on-one guidance? We're here to help!

- **Pair Programming:** Schedule a session with a maintainer
- **Code Review Guidance:** Request extra feedback on your PR
- **Architecture Questions:** Book a 30-min architecture discussion

Contact: mentorship@muslimeen.org

---

## 🏆 Recognition

### How Contributors Are Recognized

We believe in celebrating every contribution:

| Contribution Type | Recognition |
|-------------------|-------------|
| **First PR** | Welcome shoutout + Contributor badge |
| **Bug Fix** | Bug Hunter badge |
| **Feature** | Feature Creator mention in release notes |
| **Documentation** | Docs Hero badge |
| **Security** | Security Champion badge |
| **10+ PRs** | Core Contributor status |
| **50+ PRs** | Maintainer invitation |

### Hall of Fame

Our [Hall of Fame](./HALL_OF_FAME.md) recognizes outstanding contributors:

- 🌟 **Contributors of the Month**
- 🏅 **Top Contributors (All Time)**
- 💎 **Special Recognition** (bug hunters, doc heroes, etc.)

### Release Notes

Every release includes a **Contributors** section thanking everyone who contributed:

```markdown
## Contributors

Thanks to these amazing people for making this release possible:

- @username1 — Feature: Zakat calculator
- @username2 — Bug fix: Auth redirect
- @username3 — Docs: API examples

💙 Jazakum Allahu Khairan! (May Allah reward you with goodness)
```

### Swag Program

Active contributors receive MuslimEEN swag:

- **5+ merged PRs:** Stickers + Digital badge
- **15+ merged PRs:** T-shirt
- **30+ merged PRs:** Hoodie + Special thanks in video

---

## 📖 Additional Resources

- [Architecture Guide](./ARCHITECTURE_DIAGRAM.md)
- [API Contract](./API_CONTRACT.md)
- [Security Guidelines](./SECURITY.md)
- [Accessibility Audit](./ACCESSIBILITY_AUDIT.md)
- [Deployment Guide](./DEPLOYMENT.md)

---

## 💬 Final Words

> *"The most beloved of people to Allah are those who are most beneficial to the people."* — Hadith

Your contribution, no matter how small, is part of a larger mission to economically empower Muslims worldwide. Every line of code, every bug fix, every documentation improvement helps someone in our ummah.

**Thank you for being part of this journey.** 🌙

---

<p align="center">
  <strong>Made with ❤️ for the Muslim Ummah</strong><br>
  <em>"And cooperate in righteousness and piety" — Quran 5:2</em>
</p>

---

**Last Updated:** March 2026
