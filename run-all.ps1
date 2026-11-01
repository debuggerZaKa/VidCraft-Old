<#
.SYNOPSIS
    VidCraft - Launch All Services (MongoDB, Redis, AI Service, Backend, Frontend)
#>

$root = $PSScriptRoot
if (-not $root) { $root = Get-Location }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       Starting VidCraft Services       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. MongoDB (Port 27017)
$mongo = Get-Service -Name MongoDB -ErrorAction SilentlyContinue
if ($mongo) {
    if ($mongo.Status -ne 'Running') {
        Write-Host "[1/4] Starting MongoDB service..." -ForegroundColor Yellow
        Start-Service MongoDB
    } else {
        Write-Host "[1/4] MongoDB is running (port 27017)." -ForegroundColor Green
    }
} else {
    Write-Host "[1/4] MongoDB service not found directly; assuming native/docker listener on port 27017." -ForegroundColor Yellow
}

# 2. Redis (Port 6379)
$redisPortOpen = (Get-NetTCPConnection -LocalPort 6379 -State Listen -ErrorAction SilentlyContinue)
if (-not $redisPortOpen) {
    Write-Host "[2/4] Starting Redis Server on port 6379..." -ForegroundColor Yellow
    Start-Process "redis-server" -WindowStyle Minimized
    Start-Sleep -Seconds 2
} else {
    Write-Host "[2/4] Redis is running (port 6379)." -ForegroundColor Green
}

# 3. AI Service (FastAPI / port 8000)
$aiPortOpen = (Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue)
if (-not $aiPortOpen) {
    Write-Host "[3/4] Starting AI Service on port 8000..." -ForegroundColor Yellow
    $aiVenv = Join-Path $root "ai-service\.venv\Scripts\python.exe"
    Start-Process -FilePath $aiVenv -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" -WorkingDirectory (Join-Path $root "ai-service") -WindowStyle Minimized
    Start-Sleep -Seconds 3
} else {
    Write-Host "[3/4] AI Service is running (port 8000)." -ForegroundColor Green
}

# 4. Backend (Express / port 5000)
$backendPortOpen = (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue)
if (-not $backendPortOpen) {
    Write-Host "[4/4] Starting Backend Server on port 5000..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm --prefix backend start" -WorkingDirectory $root -WindowStyle Minimized
    Start-Sleep -Seconds 2
} else {
    Write-Host "[4/4] Backend is running (port 5000)." -ForegroundColor Green
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All background services active!" -ForegroundColor Green
Write-Host "Starting Frontend (Vite) on http://localhost:5173 ..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

npm --prefix frontend run dev
