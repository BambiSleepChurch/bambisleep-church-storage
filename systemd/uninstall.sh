#!/bin/bash
#
# BRANDYFICATION Uninstallation Script
# Run as root or with sudo
#

set -e

INSTALL_DIR="/opt/brandyfication"
DATA_DIR="/var/lib/brandyfication"
USER="brandyfication"

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       BRANDYFICATION Uninstallation Script                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ "$EUID" -ne 0 ]; then
  echo "Error: Please run as root (sudo ./uninstall.sh)"
  exit 1
fi

read -p "This will remove BRANDYFICATION. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo "[1/5] Stopping services..."
systemctl stop brandyfication-agent.service 2>/dev/null || true
systemctl stop brandyfication-mcp.service 2>/dev/null || true
echo "  Services stopped"

echo "[2/5] Disabling services..."
systemctl disable brandyfication-agent.service 2>/dev/null || true
systemctl disable brandyfication-mcp.service 2>/dev/null || true
echo "  Services disabled"

echo "[3/5] Removing service files..."
rm -f /etc/systemd/system/brandyfication-mcp.service
rm -f /etc/systemd/system/brandyfication-agent.service
systemctl daemon-reload
echo "  Service files removed"

echo "[4/5] Removing installation directory..."
rm -rf "$INSTALL_DIR"
echo "  Removed: $INSTALL_DIR"

read -p "Remove data directory ($DATA_DIR)? This will delete all stored files! (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  rm -rf "$DATA_DIR"
  echo "  Removed: $DATA_DIR"
else
  echo "  Kept: $DATA_DIR"
fi

echo "[5/5] Removing user..."
if id "$USER" &>/dev/null; then
  userdel "$USER" 2>/dev/null || true
  echo "  Removed user: $USER"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Uninstallation Complete!                     ║"
echo "╚════════════════════════════════════════════════════════════╝"
