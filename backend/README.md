# MuslimEEN Backend

## Setup Instructions

### 1. Install PostgreSQL

**Windows:**
```powershell
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Or on Windows, use psql from PostgreSQL installation
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE muslimeen;

-- Create user (optional)
CREATE USER muslimeen WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE muslimeen TO muslimeen;

-- Exit
\q
```

### 3. Run Migrations

```bash
cd backend

# Run the schema file
psql -U postgres -d muslimeen -f database/migrations/001_initial_schema.sql
```

### 4. Configure Environment

```bash
# Edit .env file with your database credentials
notepad .env  # Windows
nano .env     # Linux/macOS
```

Update:
```
DB_NAME=muslimeen
DB_USER=postgres  # or 'muslimeen' if you created the user
DB_PASSWORD=your_password
```

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Server will start on http://localhost:3000

## API Endpoints

See `BACKEND_README_2.md` for complete API documentation.

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration
```

## Troubleshooting

### Error: role "muslimeen" does not exist
Create the PostgreSQL user or use the default `postgres` user in your `.env` file.

### Error: database "muslimeen" does not exist
Run the migration SQL file to create the database schema.

### Port 3000 already in use
Change the PORT in `.env` file or kill the process using port 3000.

## Production Deployment

1. Set strong JWT_SECRET
2. Use environment variables for all secrets
3. Enable HTTPS
4. Configure proper CORS origins
5. Set up database connection pooling
6. Enable logging

## Security Notes

- Never commit `.env` file with real credentials
- Use strong JWT_SECRET (32+ characters)
- Enable HTTPS in production
- Keep dependencies updated
