# pgAdmin4 Setup Guide for MuslimEEN Database

This guide will help you connect pgAdmin4 to the MuslimEEN PostgreSQL database.

## Prerequisites

- pgAdmin4 installed
- PostgreSQL server running
- MuslimEEN database created

## Database Connection Details

From your `.env` file:

| Setting | Value |
|---------|-------|
| **Host** | `localhost` |
| **Port** | `5432` |
| **Database** | `muslimeen` |
| **Username** | `postgres` |
| **Password** | `@Qwe@123` |

## Step-by-Step Connection Setup

### Step 1: Open pgAdmin4

1. Launch pgAdmin4 application
2. It will open in your browser (usually at `http://127.0.0.1:5050`)
3. Enter your pgAdmin master password if prompted

### Step 2: Create New Server Connection

1. In the left sidebar, right-click on **Servers**
2. Select **Register** → **Server...**

### Step 3: Configure General Tab

In the **General** tab:
- **Name**: `MuslimEEN Local` (or any name you prefer)

### Step 4: Configure Connection Tab

In the **Connection** tab, enter:

```
Host name/address: localhost
Port: 5432
Maintenance database: postgres
Username: postgres
Password: @Qwe@123
```

Check the box:
- [x] **Save password** (optional but recommended for development)

### Step 5: Test Connection

1. Click the **Save** button
2. pgAdmin will attempt to connect
3. If successful, you'll see the server appear in the left sidebar

### Step 6: Access MuslimEEN Database

1. Expand **Servers** → **MuslimEEN Local** → **Databases**
2. Find and click on the **`muslimeen`** database
3. Expand **Schemas** → **public** → **Tables**
4. You'll see all the MuslimEEN tables

---

## Troubleshooting

### Connection Refused

**Error**: `connection refused`

**Solutions**:
1. Ensure PostgreSQL service is running:
   ```powershell
   # Check if PostgreSQL is running
   Get-Service -Name *postgres*
   
   # Start PostgreSQL service
   Start-Service -Name "postgresql-x64-15"  # or your version
   ```

2. Check if PostgreSQL is listening on port 5432:
   ```powershell
   netstat -an | findstr 5432
   ```

### Authentication Failed

**Error**: `password authentication failed`

**Solutions**:
1. Verify the password in `backend/.env` file
2. Check if you're using the correct username (`postgres`)
3. Try resetting the PostgreSQL password if needed

### Database Doesn't Exist

**Error**: `database "muslimeen" does not exist`

**Solution**: Create the database:
```sql
-- In psql or pgAdmin query tool
CREATE DATABASE muslimeen;
```

Or use the setup script:
```powershell
cd backend
psql -U postgres -c "CREATE DATABASE muslimeen;"
psql -U postgres -d muslimeen -f database/migrations/001_initial_schema.sql
```

---

## Useful pgAdmin Queries

### View All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### View User Count
```sql
SELECT COUNT(*) FROM users;
```

### View Recent Users
```sql
SELECT id, email, first_name, last_name, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
```

### View Pending Invitations
```sql
SELECT * FROM invitations 
WHERE status = 'pending';
```

### View Trust Score Distribution
```sql
SELECT 
  CASE 
    WHEN trust_score >= 700 THEN 'High (700+)'
    WHEN trust_score >= 200 THEN 'Medium (200-699)'
    ELSE 'Low (0-199)'
  END as tier,
  COUNT(*) as user_count
FROM users
GROUP BY tier
ORDER BY tier;
```

---

## Database Schema Overview

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts and profiles |
| `invitations` | Invitation codes and tracking |
| `connections` | User connection graph |
| `notifications` | User notifications |
| `trust_scores` | Trust score history |
| `verifications` | Verification records |

### Marketplace Tables

| Table | Description |
|-------|-------------|
| `marketplace_listings` | Marketplace items |
| `marketplace_investments` | Investment records |

### Islamic Finance Tables

| Table | Description |
|-------|-------------|
| `sadaqah_campaigns` | Charity campaigns |
| `sadaqah_donations` | Donation records |
| `qard_hasan_loans` | Benevolent loan records |
| `waqf` | Waqf contributions |
| `zakat_calculations` | Zakat calculation history |

---

## Quick Reference: Common Tasks

### Backup Database
```bash
pg_dump -U postgres -d muslimeen > muslimeen_backup.sql
```

### Restore Database
```bash
psql -U postgres -d muslimeen < muslimeen_backup.sql
```

### Reset Database (⚠️ Destructive)
```sql
-- Drop and recreate
DROP DATABASE IF EXISTS muslimeen;
CREATE DATABASE muslimeen;
-- Then run migrations
```

---

## Connection Summary

```
┌─────────────────────────────────────┐
│         pgAdmin4 Connection         │
├─────────────────────────────────────┤
│  Name: MuslimEEN Local              │
│  Host: localhost                    │
│  Port: 5432                         │
│  Database: muslimeen                │
│  Username: postgres                 │
│  Password: @Qwe@123                 │
└─────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Connect pgAdmin4 using the settings above
2. ✅ Verify all tables exist
3. ✅ Run some test queries
4. ✅ Explore the database schema

For database migration issues, see `DATABASE_SETUP.md` or `DATABASE_QUICKSTART.md`.
