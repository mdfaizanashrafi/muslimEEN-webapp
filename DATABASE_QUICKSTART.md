# MuslimEEN Database Quick Start

## 🚀 One-Command Setup

### Option 1: Node.js Script (Recommended - Cross Platform)

```bash
cd backend
node scripts/init-database.js
```

### Option 2: PowerShell Script (Windows)

```powershell
.\setup-database.ps1
```

### Option 3: Manual Setup

See [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md) for detailed steps.

---

## ✅ Verify Setup

After running setup, verify with:

```bash
cd backend
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

## 🖥️ Start the Server

```bash
cd backend
npm run dev
```

Test in browser:
- http://localhost:3001/health

---

## 🔧 Common Commands

| Task | Command |
|------|---------|
| **Setup DB** | `node scripts/init-database.js` |
| **Test Connection** | `node scripts/test-connection.js` |
| **Start Server** | `npm run dev` |
| **View Logs** | Check `backend/logs/` folder |

---

## 🔑 Default Credentials (Development Only)

| Setting | Value |
|---------|-------|
| Database | `muslimeen` |
| Username | `muslimeen` |
| Password | `muslimeen123` |
| Host | `localhost` |
| Port | `5432` |

**⚠️ Change these for production!**

---

## 🐛 Troubleshooting

### PostgreSQL Not Running?

```powershell
# Start PostgreSQL
net start postgresql-x64-15
```

### Wrong Password?

```powershell
# Set password temporarily
$env:PG_PASSWORD = "yourpassword"
node scripts/init-database.js
```

### Tables Missing?

```powershell
# Re-run migrations
psql -U postgres -d muslimeen -f backend/database/migrations/001_initial_schema.sql
```

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `backend/.env` | Database credentials |
| `setup-database.ps1` | PowerShell setup script |
| `backend/scripts/init-database.js` | Node.js setup script |
| `backend/scripts/test-connection.js` | Connection tester |
| `LOCAL_SETUP_GUIDE.md` | Detailed guide |

---

## 🎯 Next Steps

1. ✅ Setup database (run script)
2. ✅ Test connection (`test-connection.js`)
3. ✅ Start backend (`npm run dev`)
4. ⏭️ Start frontend (`cd frontend && npm run dev`)
5. ⏭️ Open http://localhost:8080
