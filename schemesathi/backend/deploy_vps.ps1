$ErrorActionPreference = "Stop"

$Ip = "117.252.16.130"
Write-Host "Deploying to VPS at $Ip" -ForegroundColor Cyan

# 1. Ask for Username
$User = Read-Host "Enter VPS Username (usually 'root' or 'ubuntu')"
if ([string]::IsNullOrWhiteSpace($User)) {
    $User = "root"
}

# 2. Clean up old artifacts
if (Test-Path "scheme_deploy.tar.gz") { Remove-Item "scheme_deploy.tar.gz" }

# 3. Create Archive (Using tar for better compatibility with Linux)
Write-Host "Packaging files..." -ForegroundColor Yellow
# Exclude venv, __pycache__, logs, git
tar --exclude="venv" --exclude="__pycache__" --exclude="*.log" --exclude=".git" --exclude=".pytest_cache" -czf scheme_deploy.tar.gz main.py requirements.txt .env serviceAccountKey.json firebase_config.py models.py crud.py schemas.py services routers schemesathi.service setup_remote.sh schemes_sample.csv frontend.py upload_data.py

# 4. Upload
Write-Host "Uploading to $Ip..." -ForegroundColor Yellow
Write-Host "You will be asked for the VPS Password for SCP:"
scp scheme_deploy.tar.gz "$($User)@$($Ip):/tmp/scheme_deploy.tar.gz"

# 5. Execute Remote Setup
Write-Host "Running setup on server..." -ForegroundColor Yellow
Write-Host "You will be asked for the VPS Password for SSH:"

# We use a single line command to avoid CRLF issues in the command string itself, and run sed to fix the script file
$RemoteCommand = "mkdir -p /tmp/deploy_schemesathi && tar -xzf /tmp/scheme_deploy.tar.gz -C /tmp/deploy_schemesathi && cd /tmp/deploy_schemesathi && sed -i 's/\r$//' setup_remote.sh && chmod +x setup_remote.sh && sudo ./setup_remote.sh && rm -rf /tmp/deploy_schemesathi /tmp/scheme_deploy.tar.gz"

ssh "$($User)@$($Ip)" $RemoteCommand

Write-Host "Deployment Script Completed." -ForegroundColor Green
