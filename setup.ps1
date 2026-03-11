# MuslimEEN - One-Command Setup Script for Windows
# Usage: .\setup.ps1
# Supports: Windows 10/11 with PowerShell 5.1+

#Requires -Version 5.1

[CmdletBinding()]
param(
    [switch]$SkipDb,
    [string]$DbName = "muslimeen",
    [string]$DbUser = "muslimeen",
    [string]$DbPassword = "",
    [string]$PostgresUser = "postgres",
    [string]$PostgresPassword = "",
    [switch]$Help
)

# Show help
if ($Help) {
    @"
MuslimEEN Setup Script for Windows

Usage: .\setup.ps1 [OPTIONS]

Options:
  -SkipDb                    Skip database setup
  -DbName NAME               Set database name (default: muslimeen)
  -DbUser USER               Set database user (default: muslimeen)
  -DbPassword PASS           Set database password
  -PostgresUser USER         PostgreSQL admin user (default: postgres)
  -PostgresPassword PASS     PostgreSQL admin password
  -Help                      Show this help message

Examples:
  .\setup.ps1                    # Full setup
  .\setup.ps1 -SkipDb            # Setup without database
  .\setup.ps1 -DbName mydb       # Use custom database name
"@ | Write-Host
    exit 0
}

# Error action preference
$ErrorActionPreference = "Stop"

# Logging functions
function Write-Info { param([string]$Message) Write-Host "I $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "OK $Message" -ForegroundColor Green }
function Write-Warning { param([string]$Message) Write-Host "! $Message" -ForegroundColor Yellow }
function Write-Error { param([string]$Message) Write-Host "X $Message" -ForegroundColor Red }
function Write-Step { param([string]$Message) Write-Host "`n> $Message" -ForegroundColor Cyan }

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $ScriptDir) { $ScriptDir = Get-Location }

# Global flags
$script:SkipDbSetup = $SkipDb

# Display MuslimEEN Logo
function Show-Banner {
    Write-Host ""
    Write-Host "    M U S L I M E E N" -ForegroundColor Cyan
    Write-Host "    Muslim Economic Empowerment Network" -ForegroundColor Magenta
    Write-Host "    Professional Networking for the Muslim Community" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Development Environment Setup" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
}

# Check if command exists
function Test-CommandExists {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check Node.js version
function Test-NodeVersion {
    try {
        $version = node -v
        $major = [int]($version -replace 'v', '').Split('.')[0]
        return $major -ge 18
    } catch {
        return $false
    }
}

# Check prerequisites
function Test-Prerequisites {
    Write-Step "Checking Prerequisites"
    
    $missing = @()
    
    # Check Node.js
    if (Test-CommandExists "node") {
        $nodeVersion = node -v
        if (Test-NodeVersion) {
            Write-Success "Node.js $nodeVersion installed"
        } else {
            Write-Error "Node.js version must be >= 18.0.0 (found $nodeVersion)"
            $missing += "Node.js >= 18"
        }
    } else {
        Write-Error "Node.js not found"
        $missing += "Node.js >= 18"
    }
    
    # Check npm
    if (Test-CommandExists "npm") {
        $npmVersion = npm -v
        Write-Success "npm $npmVersion installed"
    } else {
        Write-Error "npm not found"
        $missing += "npm"
    }
    
    # Check PostgreSQL
    if (Test-CommandExists "psql") {
        $pgVersion = psql --version
        Write-Success "$pgVersion installed"
    } else {
        Write-Warning "PostgreSQL not found - database setup will be skipped"
        $script:SkipDbSetup = $true
    }
    
    # Check if PostgreSQL is running
    if (-not $script:SkipDbSetup) {
        try {
            $tcpConnection = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
            if ($tcpConnection.TcpTestSucceeded) {
                Write-Success "PostgreSQL is running on localhost:5432"
            } else {
                Write-Warning "PostgreSQL is not running on localhost:5432"
                Write-Info "Please start PostgreSQL service and try again"
                Write-Info "You can also use: -SkipDb to skip database setup"
                $script:SkipDbSetup = $true
            }
        } catch {
            Write-Warning "Could not check PostgreSQL status"
            $script:SkipDbSetup = $true
        }
    }
    
    # Display missing dependencies
    if ($missing.Count -gt 0) {
        Write-Host ""
        Write-Error "Missing required dependencies:"
        foreach ($dep in $missing) {
            Write-Host "  * $dep"
        }
        Write-Host ""
        Write-Info "Please install the missing dependencies and try again:"
        Write-Host ""
        Write-Host "  Windows:"
        Write-Host "    Download Node.js from: https://nodejs.org/en/download/"
        Write-Host "    Download PostgreSQL from: https://www.postgresql.org/download/windows/"
        Write-Host ""
        Write-Host "  Or use Chocolatey:"
        Write-Host "    choco install nodejs-lts"
        Write-Host "    choco install postgresql"
        Write-Host ""
        exit 1
    }
    
    if ($script:SkipDbSetup) {
        Write-Host ""
        Write-Warning "Database setup will be skipped. You can run it later with:"
        Write-Host "  .\setup-database.ps1"
        Write-Host ""
    }
}

# Prompt for input with default value
function Read-Input {
    param(
        [string]$PromptText,
        [string]$Default = "",
        [switch]$AsSecureString
    )
    
    if ($Default) {
        $fullPrompt = ("$PromptText" + " [$Default]: ")
    } else {
        $fullPrompt = "$PromptText`: "
    }
    
    if ($AsSecureString) {
        $secureString = Read-Host -Prompt $fullPrompt -AsSecureString
        $value = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureString)
        )
    } else {
        $value = Read-Host -Prompt $fullPrompt
    }
    
    if ([string]::IsNullOrWhiteSpace($value) -and $Default) {
        $value = $Default
    }
    
    return $value
}

# Setup environment files
function Initialize-Environment {
    Write-Step "Setting Up Environment"
    
    # Backend .env
    $backendEnv = Join-Path $ScriptDir "backend\.env"
    $backendEnvExample = Join-Path $ScriptDir "backend\.env.example"
    
    if (Test-Path $backendEnv) {
        Write-Info "Backend .env file already exists"
        $overwrite = Read-Host "  Overwrite? (y/N)"
        if ($overwrite -notmatch '^[Yy]$') {
            Write-Info "Skipping backend .env setup"
        } else {
            New-BackendEnv
        }
    } else {
        New-BackendEnv
    }
    
    # Frontend .env (optional)
    $frontendEnv = Join-Path $ScriptDir "frontend\.env.local"
    if (-not (Test-Path $frontendEnv)) {
        Write-Info "Creating frontend .env.local file"
        @'
# MuslimEEN Frontend Environment
NEXT_PUBLIC_API_URL=http://localhost:3001/api
'@ | Set-Content -Path $frontendEnv
        Write-Success "Frontend .env.local created"
    }
}

# Create backend .env file
function New-BackendEnv {
    $backendEnv = Join-Path $ScriptDir "backend\.env"
    
    Write-Info "Configuring backend environment"
    Write-Host ""
    
    # Generate random secrets
    $randomBytes = New-Object byte[] 16
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::Create()
    $rng.GetBytes($randomBytes)
    $jwtSecret = "dev-jwt-secret-" + [System.Convert]::ToBase64String($randomBytes).Substring(0, 32)
    $rng.GetBytes($randomBytes)
    $csrfSecret = "dev-csrf-secret-" + [System.Convert]::ToBase64String($randomBytes).Substring(0, 32)
    
    # Prompt for database settings if not skipping DB setup
    if (-not $script:SkipDbSetup) {
        Write-Host "Database Configuration:" -ForegroundColor Cyan
        $script:DbName = Read-Input "  Database name" $DbName
        $script:DbUser = Read-Input "  Database user" $DbUser
        $dbPass = Read-Input "  Database password" -AsSecureString
        
        if ([string]::IsNullOrWhiteSpace($dbPass)) {
            $script:DbPassword = "muslimeen123"
            Write-Info "Using default password: $($script:DbPassword)"
        } else {
            $script:DbPassword = $dbPass
        }
    } else {
        # Use defaults for DB when skipping
        if ([string]::IsNullOrWhiteSpace($DbPassword)) {
            $script:DbPassword = "muslimeen123"
        } else {
            $script:DbPassword = $DbPassword
        }
    }
    
    # Create .env file
    $envContent = @"
# MuslimEEN Backend Environment Configuration
# Generated: $(Get-Date)

# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$($script:DbName)
DB_USER=$($script:DbUser)
DB_PASSWORD=$($script:DbPassword)

# JWT Configuration
JWT_SECRET=$jwtSecret
JWT_EXPIRES_IN=24h

# Security
BCRYPT_ROUNDS=12
CSRF_SECRET=$csrfSecret

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:8080

# Admin Configuration
ADMIN_EMAIL=admin@muslimeen.space
"@
    
    try {
        Set-Content -Path $backendEnv -Value $envContent
        Write-Success "Backend .env file created"
    } catch {
        Write-Error "Failed to create backend .env file: $_"
    }
}

# Install dependencies
function Install-Dependencies {
    Write-Step "Installing Dependencies"
    
    # Backend dependencies
    Write-Info "Installing backend dependencies..."
    Set-Location (Join-Path $ScriptDir "backend")
    
    try {
        npm install
        Write-Success "Backend dependencies installed"
    } catch {
        Write-Error "Failed to install backend dependencies"
        throw
    }
    
    # Frontend dependencies
    Write-Info "Installing frontend dependencies..."
    Set-Location (Join-Path $ScriptDir "frontend")
    
    try {
        npm install
        Write-Success "Frontend dependencies installed"
    } catch {
        Write-Error "Failed to install frontend dependencies"
        throw
    }
    
    Set-Location $ScriptDir
}

# Setup database
function Initialize-Database {
    if ($script:SkipDbSetup) {
        Write-Step "Database Setup Skipped"
        return
    }
    
    Write-Step "Setting Up Database"
    
    # Get PostgreSQL credentials
    Write-Host "PostgreSQL Admin Credentials:" -ForegroundColor Cyan
    $script:PostgresUser = Read-Input "  PostgreSQL admin user" $PostgresUser
    $pgPass = Read-Input "  PostgreSQL admin password" -AsSecureString
    $script:PostgresPassword = $pgPass
    
    $env:PGPASSWORD = $script:PostgresPassword
    
    # Create database and user
    Write-Info "Creating database and user..."
    
    $sqlScript = @"
-- MuslimEEN Database Setup
SELECT 'CREATE DATABASE $($script:DbName)'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$($script:DbName)')
\gexec
\c $($script:DbName)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
DO `$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$($script:DbUser)') THEN
        CREATE USER $($script:DbUser) WITH PASSWORD '$($script:DbPassword)';
    END IF;
END
`$;
GRANT ALL PRIVILEGES ON DATABASE $($script:DbName) TO $($script:DbUser);
GRANT ALL ON SCHEMA public TO $($script:DbUser);
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $($script:DbUser);
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $($script:DbUser);
"@
    
    try {
        $sqlScript | psql -U $script:PostgresUser -h localhost -p 5432 -v ON_ERROR_STOP=1 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database and user created"
        } else {
            Write-Warning "Database setup may have already been completed"
        }
    } catch {
        Write-Warning "Database setup encountered an issue: $_"
    }
    
    # Run migrations
    Write-Info "Running database migrations..."
    
    $migrationFile = Join-Path $ScriptDir "backend\database\migrations\001_initial_schema.sql"
    
    if (Test-Path $migrationFile) {
        try {
            psql -U $script:PostgresUser -d $script:DbName -h localhost -p 5432 -f "$migrationFile" -v ON_ERROR_STOP=1 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Migrations completed"
            } else {
                Write-Warning "Migrations may have already been applied"
            }
        } catch {
            Write-Warning "Migration issue: $_"
        }
    } else {
        Write-Warning "Migration file not found: $migrationFile"
    }
    
    # Verify tables
    Write-Info "Verifying database setup..."
    try {
        $verifyScript = "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
        $tables = $verifyScript | psql -U $script:PostgresUser -d $script:DbName -h localhost -p 5432 -t 2>&1
        
        if ($tables) {
            Write-Success "Database tables created:"
            $tables | Where-Object { $_.Trim() } | ForEach-Object {
                Write-Host "    * $($_)"
            }
        }
    } catch {
        Write-Warning "Could not verify tables"
    }
    
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

# Build project
function Build-Project {
    Write-Step "Building Project"
    
    # Build backend
    Write-Info "Building backend..."
    Set-Location (Join-Path $ScriptDir "backend")
    
    try {
        npm run build
        Write-Success "Backend built successfully"
    } catch {
        Write-Error "Backend build failed"
        throw
    }
    
    # Build frontend (optional - can be slow)
    Write-Host ""
    $buildFrontend = Read-Host "Build frontend? (recommended for production, y/N)"
    if ($buildFrontend -match '^[Yy]$') {
        Write-Info "Building frontend..."
        Set-Location (Join-Path $ScriptDir "frontend")
        
        try {
            npm run build
            Write-Success "Frontend built successfully"
        } catch {
            Write-Warning "Frontend build completed with warnings"
        }
    } else {
        Write-Info "Skipping frontend build (can be done later with: cd frontend && npm run build)"
    }
    
    Set-Location $ScriptDir
}

# Display final instructions
function Show-Completion {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  MuslimEEN Setup Complete!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "  1. Start the development servers:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "     Terminal 1 (Backend):" 
    Write-Host "     cd backend; npm run dev" -ForegroundColor Green
    Write-Host ""
    Write-Host "     Terminal 2 (Frontend):" 
    Write-Host "     cd frontend; npm run dev" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "  2. Access the application:" -ForegroundColor Yellow
    Write-Host "     Frontend: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "     Backend API: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "     Health Check: http://localhost:3001/health" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "  3. Available npm commands:" -ForegroundColor Yellow
    Write-Host "     Backend:  npm run dev | npm run build | npm run test" -ForegroundColor Cyan
    Write-Host "     Frontend: npm run dev | npm run build | npm run lint" -ForegroundColor Cyan
    Write-Host ""
    
    if (-not $script:SkipDbSetup) {
        Write-Host "  4. Database Management:" -ForegroundColor Yellow
        Write-Host "     Run migrations: cd backend; npm run migrate" -ForegroundColor Cyan
        Write-Host "     Seed test data: cd backend; npm run seed" -ForegroundColor Cyan
        Write-Host ""
    }
    
    Write-Host "  5. Documentation:" -ForegroundColor Yellow
    Write-Host "     Setup Guide:    .\LOCAL_SETUP_GUIDE.md" -ForegroundColor Cyan
    Write-Host "     API Contract:   .\API_CONTRACT.md" -ForegroundColor Cyan
    Write-Host "     Backend Guide:  .\BACKEND_README.md" -ForegroundColor Cyan
    Write-Host ""
    
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  Welcome to MuslimEEN!" -ForegroundColor Magenta
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host ""
}

# Main function
function Main {
    Show-Banner
    Test-Prerequisites
    Initialize-Environment
    Install-Dependencies
    Initialize-Database
    Build-Project
    Show-Completion
}

# Run main function
Main
