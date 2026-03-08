# Admin Setup Guide

This guide helps you create your admin account on the MuslimEEN platform.

## Prerequisites

1. Database is set up and migrations have run
2. Backend dependencies are installed (`npm install`)
3. `.env` file is configured with database credentials

## Quick Setup (Recommended)

### Using Environment Variables (Windows)

```bash
cd backend

set ADMIN_EMAIL=your@email.com
set ADMIN_PASSWORD=YourSecurePassword123
set ADMIN_FIRST_NAME=Your
set ADMIN_LAST_NAME=Name

npm run create-admin
```

### Using Environment Variables (Mac/Linux)

```bash
cd backend

export ADMIN_EMAIL=your@email.com
export ADMIN_PASSWORD=YourSecurePassword123
export ADMIN_FIRST_NAME=Your
export ADMIN_LAST_NAME=Name

npm run create-admin
```

### Interactive Mode (No Environment Variables)

```bash
cd backend
npm run create-admin

# You'll be prompted for:
# - Email address
# - Password (min 8 characters)
# - First name
# - Last name
```

---

## Alternative: SQL Seed File

If you prefer using SQL directly:

### Default Admin (admin@muslimeen.org)

```bash
psql -U postgres -d muslimeen -f database/seeds/001_create_admin.sql
```

### Custom Admin

```bash
psql -U postgres -d muslimeen -v ADMIN_EMAIL="your@email.com" -v ADMIN_FIRST_NAME="Your" -v ADMIN_LAST_NAME="Name" -f database/seeds/001_create_admin.sql
```

---

## Alternative: JavaScript Seeder

```bash
cd backend

# With environment variables
set SEED_ADMIN_EMAIL=your@email.com
set SEED_ADMIN_PASSWORD=YourSecurePassword123
set SEED_ADMIN_FIRST_NAME=Your
set SEED_ADMIN_LAST_NAME=Name

npm run seed
```

---

## Admin Privileges

Your admin account will have:

| Feature | Access |
|---------|--------|
| Role | `admin` |
| Trust Score | 1000 (maximum) |
| Verification Tier | Advanced |
| Invite Limit | Unlimited |
| Admin Dashboard | Full access |
| User Management | Full access |
| Invite Analytics | Full access |

---

## Creating Invite Tokens

Once logged in as admin, you can create invite tokens:

### Via Web Interface
1. Go to your profile
2. Click "Invite" button
3. Generate invite links to share

### Via API

```bash
# Create a general invite
curl -X POST http://localhost:3000/api/invites \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create invite for specific email
curl -X POST http://localhost:3000/api/admin/invites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "friend@example.com"}'
```

---

## Viewing Analytics

```bash
# Platform-wide analytics
curl http://localhost:3000/api/admin/invites/analytics \
  -H "Authorization: Bearer YOUR_TOKEN"

# Per-user analytics
curl http://localhost:3000/api/admin/invites/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### "Database connection failed"
Check your `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muslimeen
DB_USER=postgres
DB_PASSWORD=yourpassword
```

### "Admin already exists"
The script detected an existing admin. Choose "yes" to create another admin.

### "Cannot find module 'pg'"
Run `npm install` first to install dependencies.

---

## Security Notes

- Change the default password immediately after first login
- Don't commit `.env` files with real credentials to git
- Use strong passwords (12+ characters recommended)
- Keep your invite tokens secure - they grant platform access

---

## Next Steps

1. ✅ Run `npm run create-admin` to create your account
2. 🌐 Log in at: http://localhost:8080/login
3. 👤 Complete your profile
4. 🎁 Create invite tokens for your first users
5. 📤 Share invite links to grow the network
