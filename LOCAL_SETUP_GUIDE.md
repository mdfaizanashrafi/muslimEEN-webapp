# MuslimEEN Local PostgreSQL Setup Guide

Complete guide to setting up the MuslimEEN backend with local PostgreSQL.

## Prerequisites

- [ ] PostgreSQL 14+ installed
- [ ] Node.js 18+ installed
- [ ] Backend dependencies installed (`npm install`)

---

## Quick Start (Automated)

### Option 1: PowerShell Script (Recommended)

1. **Open PowerShell as Administrator**

2. **Run the setup script:**
```powershell
cd e:\projects\muslimEEN-webapp
.\setup-database.ps1
```

3. **Enter your PostgreSQL postgres password** when prompted (default is often `postgres`)

4. **The script will:**
   - Create the `muslimeen` database
   - Create the `muslimeen` user
   - Run all migrations
   - Update your `.env` file

---

## Manual Setup

If the script doesn't work, follow these manual steps:

### Step 1: Create Database

Open **SQL Shell (psql)** or **pgAdmin** and run:

```sql
-- Create database
CREATE DATABASE muslimeen;

-- Verify
\l
```

### Step 2: Create User (Optional but Recommended)

```sql
-- Create dedicated application user
CREATE USER muslimeen WITH PASSWORD 'muslimeen123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE muslimeen TO muslimeen;

-- Connect to database and grant schema privileges
\c muslimeen
GRANT ALL ON SCHEMA public TO muslimeen;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO muslimeen;
```

### Step 3: Run Migrations

**Using psql (Command Line):**
```powershell
cd e:\projects\muslimEEN-webapp\backend
psql -U postgres -d muslimeen -f database\migrations\001_initial_schema.sql
```

**Using pgAdmin (GUI):**
1. Open pgAdmin 4
2. Connect to your PostgreSQL server
3. Right-click on `muslimeen` database → Query Tool
4. Open File → `backend\database\migrations\001_initial_schema.sql`
5. Press F5 or click Execute

### Step 4: Configure Environment

Edit `backend\.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muslimeen
DB_USER=muslimeen        # or 'postgres' if using default
DB_PASSWORD=muslimeen123 # your password
```

---

## Verify Setup

### Test 1: Check Connection

```powershell
cd e:\projects\muslimEEN-webapp\backend
node scripts\test-connection.js
```

Expected output:
```
==============================================
  MuslimEEN Database Connection Test
==============================================

Test 1: Testing basic connectivity...
✓ Connected to PostgreSQL
  Server Time: 2026-03-07Txx:xx:xx.xxxZ

Test 2: Checking database...
✓ Database: muslimeen

Test 3: Checking tables...
✓ Found 16 tables:
  - connections
  - donations
  - education
  - invitation_outcomes
  - invitations
  - marketplace_items
  - messages
  - notifications
  - qard_hasan_lenders
  - qard_hasan_loans
  - refresh_tokens
  - sadaqah_campaigns
  - trust_score_history
  - users
  - verification_witnesses
  - waqf
  - work_history

Test 4: Checking UUID extension...
✓ UUID extension enabled

==============================================
  All tests passed!
==============================================
```

### Test 2: Start Backend Server

```powershell
cd e:\projects\muslimEEN-webapp\backend
npm run dev
```

Expected output:
```
> muslimeen-backend@1.0.0 dev
> nodemon src/server.js

[nodemon] starting `node src/server.js`
info: Database connected
info: MuslimEEN API server running on port 3001
info: Environment: development
```

### Test 3: Health Check

Open browser or use curl:
```powershell
curl http://localhost:3001/health
```

Expected:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-07Txx:xx:xx.xxxZ",
  "version": "1.0.0",
  "environment": "development"
}
```

### Test 4: API Test

```powershell
curl -X POST http://localhost:3001/api/auth/validate-invitation `
  -H "Content-Type: application/json" `
  -d '{"invitationCode":"TEST12345678"}'
```

Expected:
```json
{
  "success": false,
  "message": "Invalid invitation code"
}
```

This is correct! It means the database is connected but the invitation doesn't exist yet.

---

## Troubleshooting

### Issue: "psql is not recognized"

**Solution:** Add PostgreSQL to your PATH

1. Find your PostgreSQL installation (usually `C:\Program Files\PostgreSQL\15\bin`)
2. Add it to your system PATH:
   - Search "Environment Variables" in Windows
   - Edit "Path" variable
   - Add PostgreSQL bin folder
3. Restart PowerShell

### Issue: "password authentication failed for user postgres"

**Solutions:**

1. **Try default password:** `postgres`
2. **Reset password in pgAdmin:**
   - Open pgAdmin
   - Right-click on PostgreSQL server → Properties
   - Go to Connection tab
   - Change password
3. **Edit pg_hba.conf** to use trust authentication (development only):
   - File location: `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
   - Change `md5` to `trust` for localhost entries
   - Restart PostgreSQL service

### Issue: "database muslimeen does not exist"

**Solution:**
```sql
CREATE DATABASE muslimeen;
```

### Issue: "role muslimeen does not exist"

**Solution:**
```sql
CREATE USER muslimeen WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE muslimeen TO muslimeen;
```

### Issue: "Port 5432 is already in use"

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :5432

# Or change PostgreSQL port in postgresql.conf
```

### Issue: "Cannot find module '../src/config/database'"

**Solution:**
```powershell
cd e:\projects\muslimEEN-webapp\backend
npm install
```

### Issue: Tables not created

**Solution:**
```powershell
# Run migrations manually
psql -U postgres -d muslimeen -f backend\database\migrations\001_initial_schema.sql

# Or in psql
\c muslimeen
\i backend/database/migrations/001_initial_schema.sql
```

---

## PostgreSQL Service Management

### Check if PostgreSQL is Running

```powershell
# Method 1: Services
codeGet-Service | Where-Object { $_.Name -like "*postgres*" }

# Method 2: Task Manager
# Look for postgres.exe processes
```

### Start PostgreSQL Service

```powershell
# Start the service
Start-Service -Name "postgresql-x64-15"  # Name may vary

# Or
net start postgresql-x64-15
```

### Stop PostgreSQL Service

```powershell
Stop-Service -Name "postgresql-x64-15"
# Or
net stop postgresql-x64-15
```

### Restart PostgreSQL Service

```powershell
Restart-Service -Name "postgresql-x64-15"
```

---

## Useful PostgreSQL Commands

### Connect to Database

```powershell
# As postgres user
psql -U postgres -d muslimeen

# As muslimeen user
psql -U muslimeen -d muslimeen
```

### Common psql Commands

```sql
-- List all databases
\l

-- Connect to database
\c muslimeen

-- List all tables
\dt

-- Describe table structure
\d users

-- Show current user
SELECT current_user;

-- Show current database
SELECT current_database();

-- Exit psql
\q
```

### Reset Database (Caution: Deletes all data!)

```sql
-- Drop and recreate
DROP DATABASE IF EXISTS muslimeen;
CREATE DATABASE muslimeen;
\c muslimeen
-- Then run migrations again
```

---

## Seed Test Data (Optional)

After setup, you can seed test data:

```powershell
cd e:\projects\muslimEEN-webapp\backend
npm run seed
```

Or manually insert test data:

```sql
-- Create test invitation
INSERT INTO invitations (code, inviter_id, invitee_email, status, expires_at)
VALUES ('TEST12345678', NULL, 'test@example.com', 'pending', NOW() + INTERVAL '30 days');
```

---

## Next Steps

Once database is connected:

1. **Start Backend:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Start Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Access Application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

---

## Support

If you continue to have issues:

1. Check PostgreSQL logs: `C:\Program Files\PostgreSQL\15\data\log`
2. Verify Windows Firewall allows port 5432
3. Check if antivirus is blocking PostgreSQL
4. Try reinstalling PostgreSQL with default settings
