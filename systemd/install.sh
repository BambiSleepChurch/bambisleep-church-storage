#!/bin/bash
#
# BRANDYFICATION Installation Script
# Run as root or with sudo
#

set -e

# Configuration
INSTALL_DIR="/opt/brandyfication"
DATA_DIR="/var/lib/brandyfication"
STORAGE_DIR="$DATA_DIR/storage"
USER="brandyfication"
GROUP="brandyfication"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       BRANDYFICATION Installation Script                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (sudo ./install.sh)"
  exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js 18+ first."
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js 18+ is required. Current version: $(node -v)"
  exit 1
fi

echo "[1/7] Creating user and group..."
if ! id "$USER" &>/dev/null; then
  useradd --system --no-create-home --shell /bin/false "$USER"
  echo "  Created user: $USER"
else
  echo "  User $USER already exists"
fi

echo "[2/7] Creating directories..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR"
mkdir -p "$STORAGE_DIR/IMAGES"
mkdir -p "$STORAGE_DIR/VIDEOS"
echo "  Created: $INSTALL_DIR"
echo "  Created: $STORAGE_DIR"

echo "[3/7] Copying files..."
cp -r . "$INSTALL_DIR/"
echo "  Copied to: $INSTALL_DIR"

echo "[4/7] Installing dependencies..."
cd "$INSTALL_DIR"
npm ci --only=production
cd "$INSTALL_DIR/agent"
npm ci --only=production
echo "  Dependencies installed"

echo "[5/7] Setting permissions..."
chown -R "$USER:$GROUP" "$INSTALL_DIR"
chown -R "$USER:$GROUP" "$DATA_DIR"
chmod 755 "$INSTALL_DIR"
chmod 755 "$DATA_DIR"
chmod 755 "$STORAGE_DIR"
echo "  Permissions set"

echo "[6/7] Installing systemd services..."
cp "$INSTALL_DIR/systemd/brandyfication-mcp.service" /etc/systemd/system/
cp "$INSTALL_DIR/systemd/brandyfication-agent.service" /etc/systemd/system/
systemctl daemon-reload
echo "  Services installed"

echo "[7/7] Enabling services..."
systemctl enable brandyfication-mcp.service
systemctl enable brandyfication-agent.service
echo "  Services enabled"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                 Installation Complete!                    ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Install Dir:  $INSTALL_DIR"
echo "║  Storage Dir:  $STORAGE_DIR"
echo "║  User:         $USER"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Commands:                                                ║"
echo "║    Start:   sudo systemctl start brandyfication-agent    ║"
echo "║    Stop:    sudo systemctl stop brandyfication-agent     ║"
echo "║    Status:  sudo systemctl status brandyfication-agent   ║"
echo "║    Logs:    sudo journalctl -u brandyfication-agent -f   ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║  Frontend:  http://localhost:3000                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Start the service with:"
echo "  sudo systemctl start brandyfication-agent"
