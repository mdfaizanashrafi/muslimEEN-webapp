#Requires -Version 5.1
<#
.SYNOPSIS
    MuslimEEN Database Connection Helper for pgAdmin4
.DESCRIPTION
    This script helps verify PostgreSQL connection and provides pgAdmin4 setup instructions.
.NOTES
    File Name      : setup-pgadmin-connection.ps1
    Author         : MuslimEEN Team
    Prerequisite   : PostgreSQL installed and running
#>

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✅ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ️  $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "❌ $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "⚠️  $message"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "     MuslimEEN Database Connection Setup for pgAdmin4" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Check if .env file exists
$envPath = Join-Path $PSScriptRoot "backend/.env"
if (-not (Test-Path $envPath)) {
    Write-Error "Environment file not found at: $envPath"
    Write-Info "Please ensure you're running this from the project root"
    exit 1
}

# Parse .env file
Write-Info "Loading database configuration from .env file..."
$envContent = Get-Content $envPath -Raw

# Extract database configuration
$dbConfig = @{}
if ($envContent -match 'DB_HOST=(.+)') { $dbConfig.Host = $Matches[1].Trim() }
if ($envContent -match 'DB_PORT=(.+)') { $dbConfig.Port = $Matches[1].Trim() }
if ($envContent -match 'DB_NAME=(.+)') { $dbConfig.Name = $Matches[1].Trim() }
if ($envContent -match 'DB_USER=(.+)') { $dbConfig.User = $Matches[1].Trim() }
if ($envContent -match 'DB_PASSWORD=(.+)') { $dbConfig.Password = $Matches[1].Trim() }

# Default values if not found
if (-not $dbConfig.Host) { $dbConfig.Host = "localhost" }
if (-not $dbConfig.Port) { $dbConfig.Port = "5432" }
if (-not $dbConfig.Name) { $dbConfig.Name = "muslimeen" }
if (-not $dbConfig.User) { $dbConfig.User = "postgres" }

Write-Success "Configuration loaded successfully"
Write-Host ""
Write-Host "Database Configuration:" -ForegroundColor Yellow
Write-Host "  Host:     $($dbConfig.Host)"
Write-Host "  Port:     $($dbConfig.Port)"
Write-Host "  Database: $($dbConfig.Name)"
Write-Host "  Username: $($dbConfig.User)"
Write-Host "  Password: $($dbConfig.Password.Substring(0, 2))****" -ForegroundColor DarkGray
Write-Host ""

# Check PostgreSQL service
Write-Info "Checking PostgreSQL service..."
try {
    $pgService = Get-Service -Name "*postgres*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        if ($pgService.Status -eq "Running") {
            Write-Success "PostgreSQL service is running ($($pgService.Name))"
        } else {
            Write-Warning "PostgreSQL service is not running"
            Write-Info "Starting PostgreSQL service..."
            Start-Service $pgService.Name
            Write-Success "PostgreSQL service started"
        }
    } else {
        Write-Warning "PostgreSQL service not found"
        Write-Info "Make sure PostgreSQL is installed and running"
    }
} catch {
    Write-Error "Could not check PostgreSQL service: $_"
}

Write-Host ""

# Check if database exists
Write-Info "Checking if database '$($dbConfig.Name)' exists..."
try {
    $env:PGPASSWORD = $dbConfig.Password
    $result = psql -U $dbConfig.User -h $dbConfig.Host -p $dbConfig.Port -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$($dbConfig.Name)';" 2>$null
    
    if ($result -match "1") {
        Write-Success "Database '$($dbConfig.Name)' exists"
        
        # Check tables
        Write-Info "Checking tables..."
        $tables = psql -U $dbConfig.User -h $dbConfig.Host -p $dbConfig.Port -d $dbConfig.Name -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null
        Write-Success "Found $($tables.Trim()) tables in database"
    } else {
        Write-Warning "Database '$($dbConfig.Name)' does not exist"
        Write-Info "Run: psql -U postgres -c \"CREATE DATABASE $($dbConfig.Name);\""
    }
} catch {
    Write-Error "Could not connect to PostgreSQL"
    Write-Info "Error: $_"
    Write-Host ""
    Write-Info "Troubleshooting:"
    Write-Host "  1. Ensure PostgreSQL is installed and running"
    Write-Host "  2. Check that the password is correct"
    Write-Host "  3. Verify pg_hba.conf allows local connections"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "     pgAdmin4 Connection Instructions" -ForegroundColor Blue
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

Write-Host "Step 1: Open pgAdmin4" -ForegroundColor Yellow
Write-Host "  - Launch pgAdmin4 application"
Write-Host "  - It will open in your browser at http://127.0.0.1:5050"
Write-Host ""

Write-Host "Step 2: Create New Server Connection" -ForegroundColor Yellow
Write-Host "  - Right-click on 'Servers' in the left sidebar"
Write-Host "  - Select Register → Server..."
Write-Host ""

Write-Host "Step 3: Configure Connection" -ForegroundColor Yellow
Write-Host "  General Tab:"
Write-Host "    Name: MuslimEEN Local"
Write-Host ""
Write-Host "  Connection Tab:"
Write-Host "    Host name/address: $($dbConfig.Host)"
Write-Host "    Port:              $($dbConfig.Port)"
Write-Host "    Maintenance database: postgres"
Write-Host "    Username:          $($dbConfig.User)"
Write-Host "    Password:          $($dbConfig.Password)"
Write-Host ""

Write-Host "Step 4: Save Connection" -ForegroundColor Yellow
Write-Host "  - Click 'Save'"
Write-Host "  - The server will appear in the left sidebar"
Write-Host "  - Expand Servers → MuslimEEN Local → Databases → $($dbConfig.Name)"
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Create pgAdmin4 shortcut if on Windows
$pgAdminPath = "${env:ProgramFiles}\pgAdmin 4\runtime\pgAdmin4.exe"
if (-not (Test-Path $pgAdminPath)) {
    $pgAdminPath = "${env:ProgramFiles(x86)}\pgAdmin 4\runtime\pgAdmin4.exe"
}

if (Test-Path $pgAdminPath) {
    Write-Success "pgAdmin4 found at: $pgAdminPath"
    $launch = Read-Host "Would you like to launch pgAdmin4 now? (y/n)"
    if ($launch -eq 'y' -or $launch -eq 'Y') {
        Start-Process $pgAdminPath
        Write-Success "pgAdmin4 launched!"
    }
} else {
    Write-Warning "pgAdmin4 executable not found in standard locations"
    Write-Info "Please launch pgAdmin4 manually"
}

Write-Host ""
Write-Info "For detailed instructions, see: backend/DATABASE_PGADMIN_SETUP.md"
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host ""

# Keep window open
Write-Host "Press any key to exit..." -ForegroundColor DarkGray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
