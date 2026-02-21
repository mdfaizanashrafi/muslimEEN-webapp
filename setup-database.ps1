# MuslimEEN Database Setup Script
# Run this in PowerShell as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MuslimEEN Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if psql is available
$psqlPath = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $psqlPath) {
    # Try common PostgreSQL installation paths
    $possiblePaths = @(
        "C:\Program Files\PostgreSQL\18\bin\psql.exe",
        "C:\Program Files\PostgreSQL\17\bin\psql.exe",
        "C:\Program Files\PostgreSQL\16\bin\psql.exe",
        "C:\Program Files\PostgreSQL\15\bin\psql.exe",
        "C:\Program Files\PostgreSQL\14\bin\psql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $psqlPath = $path
            $env:Path += ";$(Split-Path $path)"
            break
        }
    }
}

if (-not $psqlPath) {
    Write-Host "ERROR: PostgreSQL not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Found PostgreSQL at: $psqlPath" -ForegroundColor Green

# Get PostgreSQL password
$pgPassword = Read-Host "Enter PostgreSQL password for user 'postgres'" -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))
$env:PGPASSWORD = $pgPasswordPlain

# Create database
Write-Host "`nStep 1: Creating database..." -ForegroundColor Yellow
try {
    $result = & $psqlPath -U postgres -c "CREATE DATABASE muslimeen;" 2>&1
    if ($result -match "already exists") {
        Write-Host "Database already exists (OK)" -ForegroundColor Green
    } else {
        Write-Host "Database created successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "Error creating database: $_" -ForegroundColor Red
    exit 1
}

# Run migration
Write-Host "`nStep 2: Running migrations..." -ForegroundColor Yellow
$scriptPath = Join-Path $PSScriptRoot "backend\database\migrations\001_initial_schema.sql"
if (-not (Test-Path $scriptPath)) {
    $scriptPath = "C:\Users\itzbl\Desktop\MuslimEEN\Project MEEN\muslimeen\backend\database\migrations\001_initial_schema.sql"
}

try {
    & $psqlPath -U postgres -d muslimeen -f "$scriptPath" 2>&1 | Out-Null
    Write-Host "Migrations completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Error running migrations: $_" -ForegroundColor Red
    exit 1
}

# Clear password from environment
$env:PGPASSWORD = ""

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Database Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor White
Write-Host "1. Update backend/.env with your password" -ForegroundColor Yellow
Write-Host "2. Restart the backend server" -ForegroundColor Yellow
Write-Host "`nTest the API:" -ForegroundColor White
Write-Host "curl http://localhost:3001/health" -ForegroundColor Cyan
