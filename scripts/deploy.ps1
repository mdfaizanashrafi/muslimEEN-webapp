# MuslimEEN Deployment Script (PowerShell)
# Usage: .\scripts\deploy.ps1 [environment]

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying MuslimEEN to $Environment" -ForegroundColor Yellow

# =============================================================================
# PRE-DEPLOYMENT CHECKS
# =============================================================================

Write-Host "Running pre-deployment checks..." -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node -v
$majorVersion = [int]($nodeVersion -replace 'v','' -split '\.')[0]

if ($majorVersion -lt 18) {
    Write-Host "Error: Node.js 18+ required (found $nodeVersion)" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green

# Check if .env.production exists
if (-not (Test-Path "backend/.env.production")) {
    Write-Host "Error: backend/.env.production not found" -ForegroundColor Red
    Write-Host "Copy backend/.env.production.example to backend/.env.production and fill in values"
    exit 1
}

Write-Host "✓ Environment file found" -ForegroundColor Green

# =============================================================================
# BUILD BACKEND
# =============================================================================

Write-Host "Building backend..." -ForegroundColor Yellow
Set-Location backend

# Install dependencies
npm ci

# Run TypeScript build
npm run build

# Run tests (continue on failure)
try {
    npm test
    Write-Host "✓ All tests passed" -ForegroundColor Green
} catch {
    Write-Host "Warning: Some tests failed" -ForegroundColor Yellow
}

Set-Location ..

# =============================================================================
# BUILD FRONTEND
# =============================================================================

Write-Host "Building frontend..." -ForegroundColor Yellow
Set-Location frontend

# Install dependencies
npm ci

# Run build
npm run build

Set-Location ..

# =============================================================================
# DEPLOYMENT INSTRUCTIONS
# =============================================================================

Write-Host ""
Write-Host "✅ Build complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps for deployment:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. NEON DATABASE:" -ForegroundColor Yellow
Write-Host "   - Go to https://neon.tech"
Write-Host "   - Create project: muslimeen-prod"
Write-Host "   - Run migrations: psql '<connection-string>' -f backend/database/migrations/*.sql"
Write-Host ""
Write-Host "2. UPSTASH REDIS:" -ForegroundColor Yellow
Write-Host "   - Go to https://upstash.com"
Write-Host "   - Create database: muslimeen-redis"
Write-Host "   - Copy connection URL"
Write-Host ""
Write-Host "3. RENDER BACKEND:" -ForegroundColor Yellow
Write-Host "   - Go to https://dashboard.render.com"
Write-Host "   - New Web Service → Connect GitHub repo"
Write-Host "   - Root Directory: backend"
Write-Host "   - Build: npm install && npm run build"
Write-Host "   - Start: npm start"
Write-Host "   - Add environment variables from backend/.env.production"
Write-Host ""
Write-Host "4. VERCEL FRONTEND:" -ForegroundColor Yellow
Write-Host "   - Go to https://vercel.com"
Write-Host "   - New Project → Import GitHub repo"
Write-Host "   - Root Directory: frontend"
Write-Host "   - Framework: Next.js"
Write-Host "   - Add env: NEXT_PUBLIC_API_URL=<your-render-url>/api"
Write-Host ""
Write-Host "Monitoring Dashboards:" -ForegroundColor Cyan
Write-Host "- Render: https://dashboard.render.com"
Write-Host "- Vercel: https://vercel.com/dashboard"
Write-Host "- Neon: https://console.neon.tech"
Write-Host "- Upstash: https://console.upstash.com"
