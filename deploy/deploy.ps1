# PowerShell Deployment Script for PPG E-Portfolio
# Laptop -> syifaserver via Tailscale

$SERVER_IP = "100.98.183.112"
$SERVER_USER = "ahmad"
$TARGET_DIR = "/mnt/storage2/eportfolio"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  DEPLOYING PPG E-PORTFOLIO TO SERVER   " -ForegroundColor Cyan
Write-Host "  Domain: ppg.ahmadnursyifa.my.id       " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Local Build Test
Write-Host "`n[1/3] Building Astro static site locally..." -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Local build failed! Please check errors before deploying."
    exit 1
}
Write-Host "Local build succeeded!" -ForegroundColor Green

# 2. Transfer files to server
Write-Host "`n[2/3] Transferring project files to syifaserver ($TARGET_DIR)..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "mkdir -p $TARGET_DIR"

# Transfer via scp
scp -r * "$SERVER_USER@$SERVER_IP`:$TARGET_DIR/"
if ($LASTEXITCODE -ne 0) {
    Write-Error "File transfer failed! Check your Tailscale connection."
    exit 1
}
Write-Host "Files transferred successfully!" -ForegroundColor Green

# 3. Docker Compose Build & Up on server
Write-Host "`n[3/3] Starting Docker container on syifaserver..." -ForegroundColor Yellow
ssh "$SERVER_USER@$SERVER_IP" "cd $TARGET_DIR && docker compose up -d --build && docker compose ps"

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " DEPLOYMENT FINISHED!                   " -ForegroundColor Green
Write-Host " Live at: https://ppg.ahmadnursyifa.my.id" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
