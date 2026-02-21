# PostgreSQL Setup Guide for MuslimEEN

## Step 1: Create Database

Open **pgAdmin** (installed with PostgreSQL) or use **SQL Shell (psql)** and run:

```sql
-- Create database
CREATE DATABASE muslimeen;

-- Verify creation
\l
```

## Step 2: Run Migrations

### Option A: Using psql (Command Line)

Open Command Prompt or PowerShell and run:

```bash
cd "C:\Users\itzbl\Desktop\MuslimEEN\Project MEEN\muslimeen\backend"
psql -U postgres -d muslimeen -f database\migrations\001_initial_schema.sql
```

When prompted, enter your PostgreSQL password (set during installation).

### Option B: Using pgAdmin (GUI)

1. Open **pgAdmin 4** (from Start Menu)
2. Connect to your PostgreSQL server
3. Double-click on **"muslimeen"** database
4. Click on **"Query Tool"** (toolbar icon or right-click menu)
5. Open File → **"001_initial_schema.sql"**
6. Press **F5** or click **"Execute/Refresh"** button

Path to file:
```
C:\Users\itzbl\Desktop\MuslimEEN\Project MEEN\muslimeen\backend\database\migrations\001_initial_schema.sql
```

## Step 3: Create Database User (Optional but Recommended)

```sql
-- Create dedicated user for MuslimEEN
CREATE USER muslimeen WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE muslimeen TO muslimeen;

-- Grant privileges on future tables
\c muslimeen
GRANT ALL ON SCHEMA public TO muslimeen;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO muslimeen;
```

## Step 4: Update Backend Environment

Edit `backend/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muslimeen
DB_USER=postgres          # or 'muslimeen' if you created the user
DB_PASSWORD=your_password # your PostgreSQL password
```

## Step 5: Restart Backend Server

```bash
cd backend
npx kill-port 3001
npm run dev
```

## Step 6: Verify Setup

Test the API:
```bash
curl http://localhost:3001/health
```

You should see:
```json
{"status":"healthy","version":"1.0.0"}
```

## Troubleshooting

### Error: "role 'postgres' does not exist"
Use your Windows username or the user you created during PostgreSQL installation.

### Error: "password authentication failed"
- Check the password in `.env` file
- Try resetting PostgreSQL password through pgAdmin

### Error: "database 'muslimeen' does not exist"
Make sure you created the database in Step 1.

### Check Tables Were Created

In pgAdmin Query Tool or psql:
```sql
\c muslimeen  -- Connect to database
\dt           -- List all tables
```

You should see 16 tables including:
- users
- invitations
- connections
- marketplace_items
- sadaqah_campaigns
- waqf
- qard_hasan_loans
- notifications
- messages

## Quick Test After Setup

Once database is set up, test the invitation validation:

```bash
curl -X POST http://localhost:3001/api/auth/validate-invitation \
  -H "Content-Type: application/json" \
  -d '{"invitationCode":"MUSLIMEEN201"}'
```

Expected response:
```json
{"success":false,"message":"Invalid invitation code"}
```

This is correct - it means the database is working but the code doesn't exist yet.
