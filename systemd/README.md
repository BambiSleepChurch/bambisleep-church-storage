# Systemd Services for BRANDYFICATION

This directory contains systemd service files for running BRANDYFICATION as a system service on Linux.

## Services

| Service                        | Description            | Port  |
| ------------------------------ | ---------------------- | ----- |
| `brandyfication-mcp.service`   | MCP file hosting server | stdio |
| `brandyfication-agent.service` | Web frontend agent     | 3000  |

## Quick Install

```bash
sudo ./install.sh
```

## Manual Installation

### 1. Create User

```bash
sudo useradd --system --no-create-home --shell /bin/false brandyfication
```

### 2. Create Directories

```bash
sudo mkdir -p /opt/brandyfication
sudo mkdir -p /var/lib/brandyfication/storage/IMAGES
sudo mkdir -p /var/lib/brandyfication/storage/VIDEOS
```

### 3. Copy Files

```bash
sudo cp -r ../* /opt/brandyfication/
sudo chown -R brandyfication:brandyfication /opt/brandyfication
sudo chown -R brandyfication:brandyfication /var/lib/brandyfication
```

### 4. Install Dependencies

```bash
cd /opt/brandyfication && sudo npm ci --only=production
cd /opt/brandyfication/agent && sudo npm ci --only=production
```

### 5. Install Services

```bash
sudo cp brandyfication-mcp.service /etc/systemd/system/
sudo cp brandyfication-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
```

### 6. Enable & Start

```bash
sudo systemctl enable brandyfication-agent
sudo systemctl start brandyfication-agent
```

## Commands

### Start Services

```bash
sudo systemctl start brandyfication-agent
```

### Stop Services

```bash
sudo systemctl stop brandyfication-agent
```

### Check Status

```bash
sudo systemctl status brandyfication-agent
```

### View Logs

```bash
# Follow logs
sudo journalctl -u brandyfication-agent -f

# Last 100 lines
sudo journalctl -u brandyfication-agent -n 100

# Since boot
sudo journalctl -u brandyfication-agent -b
```

### Restart

```bash
sudo systemctl restart brandyfication-agent
```

## Configuration

### Change Port

Edit the service file:

```bash
sudo systemctl edit brandyfication-agent
```

Add:

```ini
[Service]
Environment=PORT=8080
```

Then restart:

```bash
sudo systemctl restart brandyfication-agent
```

### Change Storage Location

Edit the service file:

```bash
sudo systemctl edit brandyfication-agent
```

Add:

```ini
[Service]
Environment=STORAGE_DIR=/custom/path/storage
ReadWritePaths=/custom/path
```

## Uninstall

```bash
sudo ./uninstall.sh
```

Or manually:

```bash
sudo systemctl stop brandyfication-agent
sudo systemctl disable brandyfication-agent
sudo rm /etc/systemd/system/brandyfication-*.service
sudo systemctl daemon-reload
sudo rm -rf /opt/brandyfication
# Optionally remove data:
sudo rm -rf /var/lib/brandyfication
sudo userdel brandyfication
```

## Security

The service files include security hardening:

- `NoNewPrivileges=true` - Prevent privilege escalation
- `ProtectSystem=strict` - Read-only filesystem except allowed paths
- `ProtectHome=true` - No access to /home
- `PrivateTmp=true` - Private /tmp directory
- `ReadWritePaths=/var/lib/brandyfication` - Only allowed write path

## Troubleshooting

### Service won't start

Check logs:
```bash
sudo journalctl -u brandyfication-agent -n 50 --no-pager
```

### Permission denied

Fix ownership:
```bash
sudo chown -R brandyfication:brandyfication /var/lib/brandyfication
```

### Port already in use

Check what's using port 3000:
```bash
sudo lsof -i :3000
```

Change the port in service configuration.
