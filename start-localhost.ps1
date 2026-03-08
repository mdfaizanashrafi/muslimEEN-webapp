#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start MuslimEEN on localhost for testing
.DESCRIPTION
    Starts both backend and frontend servers
#>

$ErrorActionPreference = "Stop"

Write-Host "======================================" -ForegroundColor Green
Write-Host "  Starting MuslimEEN on localhost    " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Check if PostgreSQL is running
try {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    if ($pgService.Status -eq "Running") {
        Write-Host "✓ PostgreSQL is running" -ForegroundColor Green
    } else {
        Write-Host "⚠️  PostgreSQL service found but not running" -ForegroundColor Yellow
        Write-Host "   Starting PostgreSQL..." -ForegroundColor Yellow
        Start-Service -Name $pgService.Name
    }
} catch {
    Write-Host "⚠️  Could not check PostgreSQL status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

# Start Backend
$backend = Start-Process -FilePath "node" -ArgumentList "dist/server.js" -WorkingDirectory "E:\projects\muslimEEN-webapp\backend" -PassThru -WindowStyle Hidden

Write-Host "Backend PID: $($backend.Id)" -ForegroundColor Gray
Write-Host "Waiting for backend to start..." -ForegroundColor Gray

# Wait and check
$backendReady = $false
for ($i = 0; $i -lt 10; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2
        if ($response.status -eq "healthy") {
            $backendReady = $true
            break
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""

if ($backendReady) {
    Write-Host "✓ Backend is running on http://localhost:3001" -ForegroundColor Green
} else {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

Write-Host ""
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Write-Host "--------------------------------------" -ForegroundColor Cyan

# Check if frontend dependencies exist
if (-not (Test-Path "E:\projects\muslimEEN-webapp\frontend\node_modules")) {
    Write-Host "⚠️  Frontend dependencies not found!" -ForegroundColor Red
    Write-Host "   Run: cd frontend && npm install" -ForegroundColor Yellow
    Stop-Process -Id $backend.Id -Force
    exit 1
}

# Start Frontend
$frontend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "E:\projects\muslimEEN-webapp\frontend" -PassThru -WindowStyle Hidden

Write-Host "Frontend PID: $($frontend.Id)" -ForegroundColor Gray
Write-Host "Waiting for frontend to start..." -ForegroundColor Gray

# Wait and check
$frontendReady = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 2
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:8080" -Method GET -TimeoutSec 2
        $frontendReady = $true
        break
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

Write-Host ""

if ($frontendReady) {
    Write-Host "✓ Frontend is running on http://localhost:8080" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  🌙 MuslimEEN is now running!       " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API:    http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend App:   http://localhost:8080" -ForegroundColor Cyan
Write-Host "API Docs:       http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "Health Check:   http://localhost:3001/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if processes are still running
        if ($backend.HasExited) {
            Write-Host "❌ Backend server stopped unexpectedly!" -ForegroundColor Red
            break
        }
        if ($frontend.HasExited) {
            Write-Host "⚠️  Frontend server stopped" -ForegroundColor Yellow
            break
        }
    }
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "Shutting down servers..." -ForegroundColor Yellow
    
    if (-not $backend.HasExited) {
        Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Backend stopped" -ForegroundColor Green
    }
    
    if (-not $frontend.HasExited) {
        Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✓ Frontend stopped" -ForegroundColor Green
    }
    
    Write-Host "Goodbye! 👋" -ForegroundColor Green
}
