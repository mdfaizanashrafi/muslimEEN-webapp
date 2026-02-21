# MuslimEEN - Quick Start Guide

## Prerequisites
- Node.js 18+
- PostgreSQL 14+

## Step 1: Start the Backend

```bash
cd backend

# Install dependencies (if not done)
npm install

# Set up PostgreSQL database
psql -U postgres -c "CREATE DATABASE muslimeen;"
psql -U postgres -d muslimeen -f database/migrations/001_initial_schema.sql

# Start server
npm run dev
```

Backend will be running at: **http://localhost:3001**

## Step 2: Start the Frontend

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Frontend will be at: **http://localhost:8080**

## Step 3: Build for Production

```bash
cd frontend
npm run build
```

This generates static files in `frontend/dist/` that can be served by any web server.

## Step 4: Test the Integration

Open browser and navigate to:
- **http://localhost:8080** - Login page
- **http://localhost:3001/health** - Backend health check

## Test Credentials (After Registration)

Since you need an invitation to register, you can:

1. Create invitation via API:
```bash
curl -X POST http://localhost:3001/api/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"inviteeEmail": "test@test.com"}'
```

2. Or use the test invitation code: `MUSLIMEEN201`

## Available Pages

| Page | URL |
|------|-----|
| Login | http://localhost:8080/ |
| Dashboard | http://localhost:8080/dashboard |
| Profile | http://localhost:8080/profile |
| Network | http://localhost:8080/connections |
| Messages | http://localhost:8080/messages |
| Verification | http://localhost:8080/verification |
| Marketplace | http://localhost:8080/marketplace/earn |
| Islamic Finance | http://localhost:8080/islamic-finance |

## Troubleshooting

### Port 3001 in use
```bash
# Kill process on port 3001
npx kill-port 3001
```

### Port 8080 in use
```bash
# The frontend will automatically use next available port
# Or manually specify: npm run dev -- --port 3000
```

### Database connection error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# Update .env with correct credentials
DB_USER=postgres
DB_PASSWORD=your_password
```

### CORS errors
- Make sure backend is on port 3001
- Make sure frontend is on port 8080
- CORS is pre-configured for these ports in backend/src/server.js

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login | POST | User login |
| /api/auth/register | POST | User registration |
| /api/auth/validate-invitation | POST | Validate invitation |
| /api/user/profile | GET | Get profile |
| /api/user/trust-score | GET | Get trust score |
| /api/marketplace/listings | GET | Marketplace listings |
| /api/islamic-finance/sadaqah | GET | Sadaqah campaigns |

See `API_CONTRACT.md` for complete API documentation.

## Development Tips

1. **Backend logs**: Check console for request logs
2. **Frontend debugging**: Open browser DevTools → Console
3. **Hot reload**: Next.js automatically reloads on file changes
4. **API testing**: Use curl or Postman
5. **Database**: Use pgAdmin or psql for direct queries

## Frontend Development

The frontend is built with Next.js 14 using:
- **App Router** for routing
- **TypeScript** for type safety
- **Static Export** for deployment
- **CSS Modules** for styling

### File Structure
```
frontend/
├── app/              # Next.js App Router pages
├── styles/           # Page-specific CSS
├── lib/              # API client
└── types/            # TypeScript types
```

### Build Output
Static files are generated in `frontend/dist/`:
- HTML files for each route
- Optimized CSS and JavaScript
- Static assets

## Security Notes

- JWT tokens are stored in localStorage (development only)
- CSRF protection is enabled
- Rate limiting is active
- Always use HTTPS in production
