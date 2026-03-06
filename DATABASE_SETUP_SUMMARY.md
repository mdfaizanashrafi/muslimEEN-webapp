# MuslimEEN Database Setup - Complete Summary

## ✅ What's Been Prepared

### 1. Environment Configuration
- **File:** `backend/.env`
- **Contains:** Database connection settings, JWT secrets, server config
- **Status:** ✅ Ready

### 2. Setup Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `init-database.js` | `backend/scripts/` | **RECOMMENDED** - Node.js setup script (cross-platform) |
| `setup-database.ps1` | Project root | PowerShell script for Windows |
| `test-connection.js` | `backend/scripts/` | Tests database connection |
| `seed-invitation.js` | `backend/scripts/` | Seeds test invitation |
| `seed-user.js` | `backend/scripts/` | Seeds test user |

### 3. Documentation

| Document | Purpose |
|----------|---------|
| `DATABASE_QUICKSTART.md` | One-page quick reference |
| `LOCAL_SETUP_GUIDE.md` | Complete step-by-step guide |
| `DATABASE_SETUP.md` | Original PostgreSQL guide |

---

## 🚀 Quick Start (3 Steps)

### Step 1: Run Setup Script

Choose ONE of these methods:

**Option A: Node.js (Recommended)**
```bash
cd e:\projects\muslimEEN-webapp\backend
node scripts/init-database.js
```

**Option B: PowerShell**
```powershell
cd e:\projects\muslimEEN-webapp
.\setup-database.ps1
```

**What it does:**
- Creates `muslimeen` database
- Creates `muslimeen` user with password
- Runs all migrations (creates 16 tables)
- Enables UUID extension
- Updates `.env` file

---

### Step 2: Verify Connection

```bash
cd e:\projects\muslimEEN-webapp\backend
node scripts/test-connection.js
```

**Expected output:**
```
✓ Connected to PostgreSQL
✓ Database: muslimeen
✓ Found 16 tables
✓ UUID extension enabled
```

---

### Step 3: Start Backend

```bash
cd e:\projects\muslimEEN-webapp\backend
npm run dev
```

**Test it works:**
- Open: http://localhost:3001/health
- Expected: `{"status":"healthy","version":"1.0.0"}`

---

## 📊 Database Schema

The migration creates these tables:

### Core Tables
- `users` - User accounts and profiles
- `work_history` - User work experience
- `education` - User education history
- `refresh_tokens` - JWT refresh tokens

### Networking Tables
- `connections` - User connections/network
- `invitations` - Invitation system
- `invitation_outcomes` - Invitation tracking for trust score
- `verification_witnesses` - Witness verification

### Content Tables
- `marketplace_items` - Marketplace listings
- `sadaqah_campaigns` - Charity campaigns
- `donations` - Donation records
- `waqf` - Endowment listings
- `qard_hasan_loans` - Benevolent loans
- `qard_hasan_lenders` - Loan lenders

### System Tables
- `notifications` - User notifications
- `messages` - User messages
- `trust_score_history` - Trust score audit trail

---

## 🔐 Default Credentials

**⚠️ Development Only - Change for Production!**

| Setting | Value |
|---------|-------|
| Database Name | `muslimeen` |
| Username | `muslimeen` |
| Password | `muslimeen123` |
| Host | `localhost` |
| Port | `5432` |

---

## 🛠️ Common Tasks

### Reset Database (⚠️ Deletes all data!)

```sql
-- In psql
DROP DATABASE IF EXISTS muslimeen;
-- Then re-run setup script
```

### View Tables

```sql
-- In psql
\c muslimeen  -- Connect to database
\dt           -- List tables
\d users      -- Describe users table
```

### Check Connection from psql

```powershell
psql -U muslimeen -d muslimeen -c "SELECT NOW()"
```

### Start/Stop PostgreSQL Service

```powershell
# Start
net start postgresql-x64-15

# Stop
net stop postgresql-x64-15

# Restart
net stop postgresql-x64-15 && net start postgresql-x64-15
```

---

## 🐛 Troubleshooting

### "PostgreSQL not found"

Download and install:
https://www.postgresql.org/download/windows/

Remember the password you set during installation!

### "password authentication failed"

1. Check `.env` file has correct password
2. Try default password: `postgres`
3. Reset in pgAdmin if needed

### "database muslimeen does not exist"

Run the setup script again:
```bash
node scripts/init-database.js
```

### "Port 5432 in use"

```powershell
# Find process using port
netstat -ano | findstr :5432

# Or change PostgreSQL port in:
# C:\Program Files\PostgreSQL\15\data\postgresql.conf
```

### Tables not created

```powershell
# Run migrations manually
psql -U postgres -d muslimeen -f backend/database/migrations/001_initial_schema.sql
```

---

## 📁 File Structure

```
muslimEEN-webapp/
├── backend/
│   ├── .env                      ← Database credentials
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js       ← Connection pool config
│   │   └── ...
│   ├── scripts/
│   │   ├── init-database.js      ← Setup script (Node.js)
│   │   ├── test-connection.js    ← Connection tester
│   │   ├── seed-invitation.js    ← Test data
│   │   └── seed-user.js          ← Test data
│   └── database/
│       └── migrations/
│           └── 001_initial_schema.sql
├── setup-database.ps1            ← Setup script (PowerShell)
├── DATABASE_QUICKSTART.md        ← Quick reference
├── LOCAL_SETUP_GUIDE.md          ← Detailed guide
└── DATABASE_SETUP_SUMMARY.md     ← This file
```

---

## ✅ Checklist

Before starting development:

- [ ] PostgreSQL installed and running
- [ ] Ran `init-database.js` or `setup-database.ps1`
- [ ] Ran `test-connection.js` successfully
- [ ] Backend server starts without errors
- [ ] Health check endpoint returns OK
- [ ] `.env` file has correct credentials

---

## 🎯 Next Steps

1. ✅ **Database Setup** (you are here)
2. ⏭️ **Start Backend:** `cd backend && npm run dev`
3. ⏭️ **Start Frontend:** `cd frontend && npm run dev`
4. ⏭️ **Access App:** http://localhost:8080

---

## 🆘 Need Help?

1. Check `LOCAL_SETUP_GUIDE.md` for detailed troubleshooting
2. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\15\data\log`
3. Run test script: `node scripts/test-connection.js`
4. Verify `.env` file settings

---

**Status:** ✅ Ready to connect to PostgreSQL!
