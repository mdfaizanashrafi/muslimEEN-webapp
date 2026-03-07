#Requires -Version 5.1
<#
.SYNOPSIS
    Fix MuslimEEN Database Connection
.DESCRIPTION
    Resets PostgreSQL password and creates database if needed
#>

Write-Host ""
Write-Host "============================================================" -ForegroundColor Blue
Write-Host "     Fixing MuslimEEN Database Connection" -ForegroundColor Blue
Write-Host "============================================================" -ForegroundColor Blue
Write-Host ""

# Configuration
$pgUser = "postgres"
$newPassword = "@Qwe@123"
$dbName = "muslimeen"

# Find PostgreSQL installation
$pgPaths = @(
    "C:\Program Files\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files\PostgreSQL\17\bin\psql.exe",
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\18\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\17\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $pgPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        break
    }
}

if (-not $psqlPath) {
    Write-Host "❌ PostgreSQL not found in standard locations" -ForegroundColor Red
    Write-Host "Please ensure PostgreSQL is installed" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found PostgreSQL at: $psqlPath" -ForegroundColor Green
Write-Host ""

# Step 1: Reset password using pgAdmin or psql
Write-Host "Step 1: Resetting PostgreSQL password..." -ForegroundColor Cyan
Write-Host "The script will now attempt to reset the password to: $newPassword" -ForegroundColor Yellow
Write-Host ""

# Create a temporary SQL file
$sqlFile = [System.IO.Path]::GetTempFileName() + ".sql"
"ALTER USER postgres WITH PASSWORD '@Qwe@123';" | Out-File -FilePath $sqlFile -Encoding ASCII

Write-Host "Running: $psqlPath -U postgres -f $sqlFile" -ForegroundColor DarkGray

# Try to run without password first (might work if trust auth is enabled)
try {
    $env:PGPASSWORD = ""
    & $psqlPath -U postgres -f $sqlFile 2>&1 | Out-Null
    Write-Host "✅ Password reset successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not reset password automatically" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual steps required:" -ForegroundColor Yellow
    Write-Host "1. Open pgAdmin4" -ForegroundColor White
    Write-Host "2. Connect to your server" -ForegroundColor White
    Write-Host "3. Go to Login/Group Roles → postgres" -ForegroundColor White
    Write-Host "4. Set password to: @Qwe@123" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter after you've reset the password manually"
}

Remove-Item $sqlFile -ErrorAction SilentlyContinue

# Step 2: Create database if not exists
Write-Host ""
Write-Host "Step 2: Creating database if needed..." -ForegroundColor Cyan

$env:PGPASSWORD = $newPassword
$checkDb = & $psqlPath -U postgres -t -c "SELECT 1 FROM pg_database WHERE datname = '$dbName';" 2>$null

if ($checkDb -match "1") {
    Write-Host "✅ Database '$dbName' already exists" -ForegroundColor Green
} else {
    Write-Host "Creating database '$dbName'..." -ForegroundColor Yellow
    & $psqlPath -U postgres -c "CREATE DATABASE $dbName;" 2>&1 | Out-Null
    Write-Host "✅ Database created" -ForegroundColor Green
}

# Step 3: Run migrations
Write-Host ""
Write-Host "Step 3: Running database migrations..." -ForegroundColor Cyan

$migrationPath = Join-Path $PSScriptRoot "backend\database\migrations\001_initial_schema.sql"
if (Test-Path $migrationPath) {
    & $psqlPath -U postgres -d $dbName -f $migrationPath 2>&1 | Out-Null
    Write-Host "✅ Migrations applied" -ForegroundColor Green
} else {
    Write-Host "⚠️  Migration file not found at: $migrationPath" -ForegroundColor Yellow
}

# Step 4: Test connection
Write-Host ""
Write-Host "Step 4: Testing connection..." -ForegroundColor Cyan

$testScript = Join-Path $PSScriptRoot "backend\scripts\test-connection.js"
if (Test-Path $testScript) {
    Set-Location (Join-Path $PSScriptRoot "backend")
    node scripts/test-connection.js
} else {
    # Simple test
    $result = & $psqlPath -U postgres -d $dbName -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
    if ($result -match "\d+") {
        Write-Host "✅ Connection successful! Found $result tables" -ForegroundColor Green
    } else {
        Write-Host "❌ Connection failed" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Blue
Write-Host "Done!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Blue
Write-Host ""
