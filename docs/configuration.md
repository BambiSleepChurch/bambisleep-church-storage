# Configuration

This guide covers all configuration options for the File Hosting MCP Server.

## Environment Variables

### STORAGE_DIR

The directory where all uploaded files are stored.

| Property     | Value                                       |
| ------------ | ------------------------------------------- |
| **Variable** | `STORAGE_DIR`                               |
| **Type**     | String (file path)                          |
| **Default**  | `./storage` (relative to working directory) |
| **Required** | No                                          |

#### Setting STORAGE_DIR

**Windows PowerShell:**

```powershell
$env:STORAGE_DIR = "C:\Users\username\filehost-storage"
npm start
```

**Windows Command Prompt:**

```cmd
set STORAGE_DIR=C:\Users\username\filehost-storage
npm start
```

**macOS / Linux:**

```bash
export STORAGE_DIR=/home/username/filehost-storage
npm start
```

**In MCP client configuration:**

```json
{
  "mcpServers": {
    "filehosting": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "STORAGE_DIR": "/path/to/storage"
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
    "filehosting": {
      "command": "node",
      "args": ["C:/projects/filehosting-mcp-server/dist/index.js"],
      "env": {
        "STORAGE_DIR": "C:/filehost-storage"
      }
    }
  }
}
```

#### Configuration Options

| Option    | Type     | Description                     |
| --------- | -------- | ------------------------------- |
| `command` | string   | The executable to run (`node`)  |
| `args`    | string[] | Arguments passed to the command |
| `env`     | object   | Environment variables to set    |
| `cwd`     | string   | Working directory (optional)    |

### VS Code MCP

Add to your VS Code `settings.json` or workspace configuration:

```json
{
  "mcp.servers": {
    "filehosting": {
      "command": "node",
      "args": ["${workspaceFolder}/dist/index.js"],
      "env": {
        "STORAGE_DIR": "${workspaceFolder}/storage"
      }
    }
  }
}
```

---

## Storage Configuration

### Directory Structure

The storage directory is flat by default, but you can create subdirectories:

```
storage/
├── documents/
│   ├── report.pdf
│   └── notes.txt
├── images/
│   ├── logo.png
│   └── banner.jpg
└── config.json
```

### Permissions

Ensure the storage directory has appropriate permissions:

**Linux/macOS:**

```bash
mkdir -p /path/to/storage
chmod 755 /path/to/storage
```

**Windows:**
The directory should be accessible to the user running the Node.js process.

### Disk Space

Monitor available disk space, especially if storing large files:

```bash
# Linux/macOS
df -h /path/to/storage

# Windows PowerShell
Get-PSDrive -Name C
```

---

## Advanced Configuration

### Running as a System Service

#### Windows (using NSSM)

1. Download [NSSM](https://nssm.cc/)
2. Install the service:

```cmd
nssm install filehosting-mcp "C:\Program Files\nodejs\node.exe" "C:\path\to\dist\index.js"
nssm set filehosting-mcp AppEnvironmentExtra STORAGE_DIR=C:\filehost-storage
nssm start filehosting-mcp
```

#### Linux (using systemd)

Create `/etc/systemd/system/filehosting-mcp.service`:

```ini
[Unit]
Description=File Hosting MCP Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/filehosting-mcp-server
Environment=STORAGE_DIR=/var/lib/filehosting
ExecStart=/usr/bin/node /opt/filehosting-mcp-server/dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable filehosting-mcp
sudo systemctl start filehosting-mcp
```

### Using with Docker

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

ENV STORAGE_DIR=/data

VOLUME ["/data"]

CMD ["node", "dist/index.js"]
```

Build and run:

```bash
docker build -t filehosting-mcp .
docker run -v /host/storage:/data filehosting-mcp
```

---

## Configuration Checklist

Before deploying, verify:

- [ ] `STORAGE_DIR` points to a valid, writable directory
- [ ] The Node.js version is 18.0.0 or higher
- [ ] The project has been built (`npm run build`)
- [ ] MCP client configuration uses the correct path to `dist/index.js`
- [ ] Environment variables are set in the MCP client config
- [ ] Storage directory has sufficient disk space
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
2. Verify write permissions
3. On Linux/macOS, check file ownership

### Environment Variables Not Working

1. Set variables in the `env` object of the MCP config
2. Restart the MCP client after changes
3. Use absolute paths, not relative paths

### Server Not Starting

1. Test manually: `STORAGE_DIR=/path/to/storage node dist/index.js`
2. Check for TypeScript compilation errors
3. Verify all dependencies are installed
