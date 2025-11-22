# PowerShell script to help install Visual Studio Build Tools
# Run this script as Administrator

Write-Host "=== StockMaster Installation Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "Some operations may require admin privileges" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Option 1: Install Visual Studio Build Tools manually" -ForegroundColor Green
Write-Host "  1. Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor White
Write-Host "  2. Run installer" -ForegroundColor White
Write-Host "  3. Select 'Desktop development with C++' workload" -ForegroundColor White
Write-Host "  4. Install (requires ~6GB)" -ForegroundColor White
Write-Host "  5. Restart terminal and run: npm install" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Try installing with winget (if available)" -ForegroundColor Green
$wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetAvailable) {
    Write-Host "  winget is available. Run this command:" -ForegroundColor White
    Write-Host "  winget install Microsoft.VisualStudio.2022.BuildTools --override '--quiet --wait --add Microsoft.VisualStudio.Workload.VCTools'" -ForegroundColor Cyan
} else {
    Write-Host "  winget not available on this system" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Option 3: Try installing windows-build-tools" -ForegroundColor Green
Write-Host "  Run: npm install -g windows-build-tools" -ForegroundColor Cyan
Write-Host "  (May take 10-15 minutes)" -ForegroundColor Yellow
Write-Host ""

Write-Host "Option 4: Use alternative database (no build tools needed)" -ForegroundColor Green
Write-Host "  I can modify the project to use a pure JavaScript database" -ForegroundColor White
Write-Host ""

Write-Host "Current status:" -ForegroundColor Cyan
$vsPath = Get-ChildItem "C:\Program Files\Microsoft Visual Studio" -ErrorAction SilentlyContinue
if ($vsPath) {
    Write-Host "  ✓ Visual Studio found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Visual Studio Build Tools not found" -ForegroundColor Red
}

$pythonPath = Get-Command python -ErrorAction SilentlyContinue
if ($pythonPath) {
    Write-Host "  ✓ Python found: $($pythonPath.Source)" -ForegroundColor Green
} else {
    Write-Host "  ✗ Python not found in PATH" -ForegroundColor Red
}

Write-Host ""
Write-Host "After installing build tools, run: npm install" -ForegroundColor Yellow
