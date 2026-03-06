# MuslimEEN Database Setup Script for Windows
# This script sets up the local PostgreSQL database

param(
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "postgres",
    [string]$DatabaseName = "muslimeen",
    [string]$AppUser = "muslimeen",
    [string]$AppPassword = "muslimeen123"
)

Write-Host "==============================================" -ForegroundColor Green
Write-Host "  MuslimEEN Database Setup" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL (psql) not found in PATH" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed and added to PATH" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

Write-Host "✓ PostgreSQL found: $($psqlPath.Source)" -ForegroundColor Green
Write-Host ""

# Create SQL script
$sqlScript = @"
-- MuslimEEN Database Setup
-- Generated: $(Get-Date)

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE $DatabaseName'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DatabaseName')\gexec

-- Connect to database
\c $DatabaseName

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create application user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$AppUser') THEN
        CREATE USER $AppUser WITH PASSWORD '$AppPassword';
    END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DatabaseName TO $AppUser;
GRANT ALL ON SCHEMA public TO $AppUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $AppUser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $AppUser;

-- Success message
SELECT 'Database setup completed successfully!' as status;
"@

Write-Host "Step 1: Creating database and user..." -ForegroundColor Cyan
Write-Host ""

try {
    # Set PGPASSWORD environment variable for authentication
    $env:PGPASSWORD = $PostgresPassword
    
    # Execute SQL script
    $sqlScript | psql -U $PostgresUser -h localhost -p 5432 -v ON_ERROR_STOP=1 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create database"
    }
    
    Write-Host "✓ Database and user created successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Failed to create database" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Common solutions:" -ForegroundColor Yellow
    Write-Host "  1. Check if PostgreSQL service is running" -ForegroundColor Yellow
    Write-Host "  2. Verify the postgres password is correct" -ForegroundColor Yellow
    Write-Host "  3. Ensure port 5432 is not blocked" -ForegroundColor Yellow
    exit 1
}

# Run migrations
Write-Host "Step 2: Running database migrations..." -ForegroundColor Cyan
Write-Host ""

$migrationFile = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\backend\database\migrations\001_initial_schema.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

try {
    psql -U $PostgresUser -d $DatabaseName -h localhost -p 5432 -f "$migrationFile" -v ON_ERROR_STOP=1 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        throw "Migration failed"
    }
    
    Write-Host "✓ Migrations completed successfully!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Migration failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Verify setup
Write-Host "Step 3: Verifying database setup..." -ForegroundColor Cyan
Write-Host ""

$verifyScript = @"
SELECT 'Tables created:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
"@

try {
    $result = $verifyScript | psql -U $PostgresUser -d $DatabaseName -h localhost -p 5432 2>&1
    Write-Host $result
    Write-Host ""
    Write-Host "✓ Database verification completed!" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not verify tables" -ForegroundColor Yellow
}

# Update .env file
Write-Host "Step 4: Updating environment configuration..." -ForegroundColor Cyan
Write-Host ""

$envFile = "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\backend\.env"
$envContent = @"
# MuslimEEN Backend Environment Configuration
# Local Development - Auto-generated on $(Get-Date)

# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DatabaseName
DB_USER=$AppUser
DB_PASSWORD=$AppPassword

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only-$(Get-Random)
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=dev-csrf-secret-$(Get-Random)

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=admin@muslimeen.org
"@

try {
    Set-Content -Path $envFile -Value $envContent
    Write-Host "✓ Environment file created: $envFile" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "WARNING: Could not update .env file" -ForegroundColor Yellow
    Write-Host "Please update it manually with these settings:" -ForegroundColor Yellow
    Write-Host $envContent -ForegroundColor Cyan
}

# Clear password from environment
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

Write-Host "==============================================" -ForegroundColor Green
Write-Host "  Database Setup Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Cyan
Write-Host "  Database: $DatabaseName" -ForegroundColor White
Write-Host "  Username: $AppUser" -ForegroundColor White
Write-Host "  Password: $AppPassword" -ForegroundColor White
Write-Host "  Host: localhost:5432" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start the backend server:" -ForegroundColor White
Write-Host "     cd backend" -ForegroundColor Yellow
Write-Host "     npm run dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Test the connection:" -ForegroundColor White
Write-Host "     curl http://localhost:3001/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Seed test data (optional):" -ForegroundColor White
Write-Host "     npm run seed" -ForegroundColor Yellow
Write-Host ""
