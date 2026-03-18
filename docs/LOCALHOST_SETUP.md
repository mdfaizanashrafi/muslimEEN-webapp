# Localhost Setup Guide

## Quick Start (Automated)

### Option 1: PowerShell Script (Recommended)

```powershell
# From project root directory
.\start-localhost.ps1
```

This will start both backend and frontend servers automatically.

### Option 2: Manual Start

#### Terminal 1 - Backend
```powershell
cd backend
npm run dev
```
Backend will start on http://localhost:3001

#### Terminal 2 - Frontend
```powershell
cd frontend
npm run dev
```
Frontend will start on http://localhost:8080

---

## Prerequisites

### 1. Node.js
```powershell
node -v  # Should be v18 or higher
```

### 2. PostgreSQL Database
Make sure PostgreSQL is running locally with:
- Host: localhost
- Port: 5432
- Database: muslimeen
- User: postgres
- Password: @Qwe@123 (or as configured in backend/.env)

### 3. Environment Files
Ensure these files exist:
- `backend/.env` (for backend config)
- `frontend/.env.local` (for frontend config)

---

## URLs After Startup

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:8080 | Next.js app |
| Backend API | http://localhost:3001 | Express API |
| Health Check | http://localhost:3001/api/health | API health |
| API Docs | http://localhost:3001/api | API endpoints list |

---

## Testing the Application

### 1. Basic Smoke Test
Open http://localhost:8080 in browser
- Should show landing page or login

### 2. API Health Check
```powershell
curl http://localhost:3001/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### 3. Test Auth Flow
1. Go to http://localhost:8080/login
2. Try logging in (or register if you have an invite code)
3. Should redirect to dashboard on success

### 4. Test Toast Notifications
Open browser console and run:
```javascript
showToast('Test message', 'success');
```
Should show a toast in top-right corner.

### 5. Test Error Boundary
Add this to any component temporarily:
```javascript
throw new Error('Test error');
```
Should show error boundary UI instead of blank screen.

---

## Troubleshooting

### Port Already in Use
```powershell
# Kill process on port 3001 (backend)
npx kill-port 3001

# Kill process on port 8080 (frontend)
npx kill-port 8080
```

### Database Connection Error
1. Ensure PostgreSQL is running
2. Check credentials in `backend/.env`
3. Run migrations if needed:
```powershell
cd backend
npm run migrate
```

### Node Modules Issues
```powershell
# Clean and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install

cd ../backend
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```powershell
# Type check
cd frontend && npm run type-check
cd ../backend && npm run type-check
```

---

## Running E2E Tests

### Prerequisites
```powershell
npx playwright install
```

### Run Tests
```powershell
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test
npx playwright test e2e/auth.spec.ts
```

---

## Development Workflow

### 1. Start Dev Servers
```powershell
.\start-localhost.ps1
```

### 2. Make Changes
- Frontend hot-reloads automatically
- Backend nodemon restarts on changes

### 3. Test Changes
- Manual testing in browser
- Run E2E tests: `npm run test:e2e`

### 4. Before Commit
```powershell
# Lint and format
npm run lint
npm run format

# Type check
npm run type-check

# Run tests
npm run test
```

---

## Monitoring

### Console Logs
Watch for:
- `[BACKEND]` - API server logs
- `[FRONTEND]` - Next.js logs
- `[Sentry]` - Error tracking logs

### Browser DevTools
- Network tab - API calls
- Console - JavaScript errors
- Application tab - localStorage, cookies

---

## Quick Reference

### Start Commands
```powershell
# Start everything
.\start-localhost.ps1

# Start only backend
.\start-localhost.ps1 -SkipFrontend

# Start only frontend
.\start-localhost.ps1 -SkipBackend
```

### NPM Scripts
```powershell
# Root level
npm run dev:all      # Start both
npm run dev          # Start frontend only
npm run dev:backend  # Start backend only

# Testing
npm run test:e2e     # Run E2E tests
npm run test:unit    # Run unit tests
```

---

## Support

If localhost doesn't work:
1. Check all prerequisites above
2. Review error messages in terminal
3. Check `docs/TROUBLESHOOTING.md`
4. Ask in development chat
