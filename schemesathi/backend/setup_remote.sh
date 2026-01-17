#!/bin/bash
set -e

echo "Starting deployment setup..."

APP_DIR="/opt/schemesathi"
BACKEND_DIR="$APP_DIR/backend"

# 1. Install Dependencies
echo "Installing system dependencies..."
# Check for apt-get (Debian/Ubuntu)
if command -v apt-get &> /dev/null; then
    apt-get update
    apt-get install -y python3 python3-venv python3-pip
else
    echo "apt-get not found. Assuming dependencies are met or different OS."
fi

# 1.5 Setup Swap (Prevent OOM on small VPS)
echo "Checking Swap..."
if [ ! -f /swapfile ]; then
    echo "Creating 1GB Swapfile..."
    fallocate -l 1G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
else
    echo "Swapfile exists."
fi

# 2. Setup Directory Structure
echo "Creating directories..."
mkdir -p $BACKEND_DIR

# 3. Extract Files (The tarball is expected to be extracted in the temp dir by the caller, 
# but we will move files from the current execution context or expected location)
# Actually, the caller extracts THIS script. We'll assume the files are in the same dir as this script was run from, 
# or passed. Let's assume we are running from the extracted location.
# Better: The upload script essentially dumps everything in /tmp/deploy_schemesathi/
# So we copy from there to /opt.

# 3. Copy Files (including hidden ones like .env)
echo "Copying files from $SOURCE_DIR to $BACKEND_DIR..."
# Enable dotglob to match hidden files with *
shopt -s dotglob
cp -r * $BACKEND_DIR/
shopt -u dotglob

# 4. Create Virtual Environment
echo "Setting up VirtualEnv..."
if [ ! -d "$APP_DIR/venv" ]; then
    python3 -m venv $APP_DIR/venv
fi

# 5. Install Python Requirements
echo "Installing Python requirements..."
$APP_DIR/venv/bin/pip install --upgrade pip
$APP_DIR/venv/bin/pip install -r $BACKEND_DIR/requirements.txt

# 6. Setup Systemd
echo "Configuring Systemd..."
# Fix Windows Line Endings in service file just in case
sed -i 's/\r$//' $BACKEND_DIR/schemesathi.service
cp $BACKEND_DIR/schemesathi.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable schemesathi
systemctl restart schemesathi


# 7. Verification
echo "Verifying service status..."
systemctl status schemesathi --no-pager

echo "Deployment finished! Service running on Port 8001."
