# Configuration

This guide covers all configuration options for the BRANDYFICATION MCP Server.

## Environment Variables

### STORAGE_DIR

The root directory for BRANDYFICATION storage. The server automatically creates `IMAGES` and `VIDEOS` subdirectories.

| Property     | Value |
|--------------|-------|
| **Variable** | `STORAGE_DIR` |
| **Type**     | String (file path) |
| **Default**  | `./BRANDYFICATION` (relative to working directory) |
| **Required** | No |

#### Directory Structure

When the server starts, it ensures this structure exists:

```text
BRANDYFICATION/          (STORAGE_DIR)
├── IMAGES/              Created automatically
└── VIDEOS/              Created automatically
```

#### Setting STORAGE_DIR

**Windows PowerShell:**

```powershell
$env:STORAGE_DIR = "C:\Users\username\BRANDYFICATION"
npm start
```

**Windows Command Prompt:**

```cmd
set STORAGE_DIR=C:\Users\username\BRANDYFICATION
npm start
```

**macOS / Linux:**

```bash
export STORAGE_DIR=/home/username/BRANDYFICATION
npm start
```

**In MCP client configuration:**

```json
{
  "mcpServers": {
    "brandyfication": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "STORAGE_DIR": "/path/to/BRANDYFICATION"
      }
    }
  }
}
```

#### Recommendations

1. **Use absolute paths** in production to avoid confusion
2. **Choose a dedicated directory** outside the project folder
3. **Ensure the directory is writable** by the Node.js process
4. **Back up the storage directory** regularly if storing important files

---

## MCP Client Configuration

### Claude Desktop

Configuration file locations:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/claude/claude_desktop_config.json`

#### Full Configuration Example

```json
{
  "mcpServers": {
    "brandyfication": {
      "command": "node",
      "args": ["C:/projects/bambisleep-church-storage/dist/index.js"],
      "env": {
        "STORAGE_DIR": "C:/BRANDYFICATION"
      }
    }
  }
}
```

#### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `command` | string | The executable to run (`node`) |
| `args` | string[] | Arguments passed to the command |
| `env` | object | Environment variables to set |
| `cwd` | string | Working directory (optional) |

### VS Code MCP

Add to your VS Code `settings.json` or workspace configuration:

```json
{
  "mcp.servers": {
    "brandyfication": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "STORAGE_DIR": "${workspaceFolder}/BRANDYFICATION"
      }
    }
  }
}
```

---

## Storage Configuration

### Folder Structure

BRANDYFICATION automatically organizes files:

```text
BRANDYFICATION/
├── IMAGES/                  # Auto-routed for image files
│   ├── logo.png
│   ├── banner.jpg
│   └── icon.svg
├── VIDEOS/                  # Auto-routed for video files
│   ├── intro.mp4
│   └── animation.gif
├── documents/               # Custom directories
├── config.json              # Other files at root
└── notes.txt
```

### File Routing Rules

| File Type | Extensions | Destination |
|-----------|------------|-------------|
| Images | .png, .jpg, .jpeg, .gif, .bmp, .webp, .svg, .ico, .tiff, .avif, .heic, .heif, .raw, .psd, .ai, .eps, .pcx, .tga, .exr, .hdr | `BRANDYFICATION/IMAGES/` |
| Videos | .mp4, .gif | `BRANDYFICATION/VIDEOS/` |
| Other | All other extensions | `BRANDYFICATION/` (root) |

> **Note:** GIF files can be routed to either IMAGES or VIDEOS depending on the tool used (`upload_image` vs `upload_video`).

### Permissions

Ensure the storage directory has appropriate permissions:

**Linux/macOS:**

```bash
mkdir -p /path/to/BRANDYFICATION
chmod 755 /path/to/BRANDYFICATION
```

**Windows:**
The directory should be accessible to the user running the Node.js process.

### Disk Space

Monitor available disk space, especially if storing large images/videos:

```bash
# Linux/macOS
df -h /path/to/BRANDYFICATION

# Windows PowerShell
Get-PSDrive -Name C
```

---

## Advanced Configuration

### Running as a System Service

#### Linux (using systemd)

Use the provided service files in the `systemd/` folder:

```bash
cd systemd
sudo ./install.sh
```

Or manually create `/etc/systemd/system/brandyfication-mcp.service`:

```ini
[Unit]
Description=BRANDYFICATION MCP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/bambisleep-church-storage
Environment=STORAGE_DIR=/var/lib/BRANDYFICATION
ExecStart=/usr/bin/node /opt/bambisleep-church-storage/dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable brandyfication-mcp
sudo systemctl start brandyfication-mcp
```

#### Windows (using NSSM)

1. Download [NSSM](https://nssm.cc/)
2. Install the service:

```cmd
nssm install brandyfication-mcp "C:\Program Files\nodejs\node.exe" "C:\path\to\dist\index.js"
nssm set brandyfication-mcp AppEnvironmentExtra STORAGE_DIR=C:\BRANDYFICATION
nssm start brandyfication-mcp
```

### Using with Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV STORAGE_DIR=/data/BRANDYFICATION

VOLUME ["/data"]

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t brandyfication-mcp .
docker run -v /host/storage:/data brandyfication-mcp
```

---

## Configuration Checklist

Before deploying, verify:

- [ ] `STORAGE_DIR` points to a valid, writable directory
- [ ] IMAGES and VIDEOS subdirectories can be created
- [ ] Node.js version is 18.0.0 or higher
- [ ] Project has been built (`npm run build`)
- [ ] MCP client configuration uses correct path to `dist/index.js`
- [ ] Environment variables are set in MCP client config
- [ ] Storage directory has sufficient disk space for images/videos
- [ ] Appropriate file permissions are set

---

## Troubleshooting Configuration

### "Cannot find module" Error

Ensure the path in `args` points to the compiled JavaScript file:

```json
"args": ["/absolute/path/to/dist/index.js"]
```

### "Permission denied" Error

1. Check that the storage directory exists
2. Verify write permissions for STORAGE_DIR
3. Ensure IMAGES and VIDEOS subdirectories can be created
4. On Linux/macOS, check file ownership

### Environment Variables Not Working

1. Set variables in the `env` object of the MCP config
2. Restart the MCP client after changes
3. Use absolute paths, not relative paths

### Server Not Starting

1. Test manually: `STORAGE_DIR=/path/to/BRANDYFICATION node dist/index.js`
2. Check for TypeScript compilation errors
3. Verify all dependencies are installed
