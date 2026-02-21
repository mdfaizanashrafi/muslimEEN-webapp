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

Option A - Using Python (recommended):
```bash
cd frontend
python -m http.server 8080
```

Option B - Using VS Code Live Server:
- Install "Live Server" extension
- Right-click on index.html → "Open with Live Server"

Option C - Using Node.js:
```bash
npx http-server frontend -p 8080
```

Frontend will be at: **http://localhost:8080**

## Step 3: Test the Integration

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

2. Or use mock mode (file:// protocol) for UI testing without backend.

## Troubleshooting

### Port 3001 in use
```bash
# Kill process on port 3001
npx kill-port 3001
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
- Make sure frontend is on port 8080 (or 5500 for Live Server)
- CORS is pre-configured for these ports

## API Endpoints Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/login | POST | User login |
| /api/auth/register | POST | User registration |
| /api/auth/validate-invitation | POST | Validate invitation |
| /api/user/profile | GET | Get profile |
| /api/user/trust-score | GET | Get trust score |
| /api/marketplace/earn | GET | EARN marketplace |
| /api/islamic-finance/sadaqah | GET | Sadaqah campaigns |

## Development Tips

1. **Backend logs**: Check console for request logs
2. **Frontend debugging**: Open browser DevTools → Console
3. **API testing**: Use curl or Postman
4. **Database**: Use pgAdmin or psql for direct queries

## Security Notes

- JWT tokens are stored in localStorage (development only)
- CSRF protection is enabled
- Rate limiting is active
- Always use HTTPS in production
