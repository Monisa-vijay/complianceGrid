# ComplianceGrid - Start Servers Script
Write-Host "=== ComplianceGrid Server Startup ===" -ForegroundColor Cyan

# Find the project directory
$projectRoot = $null
$possiblePaths = @(
    "$PWD\evidence-collection",
    "$env:USERPROFILE\evidence-collection",
    ".\evidence-collection"
)

foreach ($path in $possiblePaths) {
    if (Test-Path "$path\backend\manage.py" -and Test-Path "$path\frontend\package.json") {
        $projectRoot = $path
        break
    }
}

if (-not $projectRoot) {
    Write-Host "ERROR: Could not find evidence-collection project directory!" -ForegroundColor Red
    Write-Host "Please navigate to the project root directory first." -ForegroundColor Yellow
    exit 1
}

Write-Host "Found project at: $projectRoot" -ForegroundColor Green

# Start Backend
Write-Host "`nStarting Django Backend..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:projectRoot
    Set-Location backend
    if (Test-Path "venv\Scripts\Activate.ps1") {
        & .\venv\Scripts\Activate.ps1
    }
    python manage.py runserver
}

# Start Frontend  
Write-Host "Starting React Frontend..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:projectRoot
    Set-Location frontend
    if (-not (Test-Path "node_modules")) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        npm install
    }
    npm start
}

Write-Host "`nServers are starting..." -ForegroundColor Cyan
Write-Host "Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "`nCheck the job outputs for status" -ForegroundColor Gray

# Wait a bit and check
Start-Sleep -Seconds 3
Receive-Job -Job $backendJob, $frontendJob -ErrorAction SilentlyContinue
