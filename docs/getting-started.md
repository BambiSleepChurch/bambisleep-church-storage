# Getting Started with BRANDYFICATION

This guide will help you install, configure, and start using the BRANDYFICATION MCP File Hosting Server.

## What is BRANDYFICATION?

BRANDYFICATION is an MCP (Model Context Protocol) server designed for storing and managing images and videos. Files are automatically organized into dedicated folders:

- **BRANDYFICATION/IMAGES/** - All image files (20+ formats supported)
- **BRANDYFICATION/VIDEOS/** - Video files (MP4, GIF)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher
- An MCP-compatible client (e.g., Claude Desktop, VS Code with MCP extension)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/BambiSleepChurch/bambisleep-church-storage.git
cd bambisleep-church-storage
```

### Step 2: Install Dependencies

Install the required npm packages:

```bash
npm install
```

This will install:

- `@modelcontextprotocol/sdk` - The MCP SDK for building servers
- TypeScript and type definitions (dev dependencies)

### Step 3: Build the Server

Compile the TypeScript source to JavaScript:

```bash
npm run build
```

This creates the `dist/` directory with the compiled JavaScript files.

### Step 4: Verify Installation

Test that the server starts correctly:

```bash
npm start
```

You should see output similar to:

```text
BRANDYFICATION File Hosting MCP Server running on stdio
Storage: /path/to/BRANDYFICATION
  ├── IMAGES: /path/to/BRANDYFICATION/IMAGES
  └── VIDEOS: /path/to/BRANDYFICATION/VIDEOS
```

Press `Ctrl+C` to stop the server.

## Configuration

### Environment Variables

| Variable      | Description                               | Default            |
| ------------- | ----------------------------------------- | ------------------ |
| `STORAGE_DIR` | Root directory for BRANDYFICATION storage | `./BRANDYFICATION` |

### Setting the Storage Directory

**On Windows (PowerShell):**

```powershell
$env:STORAGE_DIR = "C:\myfiles\BRANDYFICATION"
npm start
```

**On Windows (CMD):**

```cmd
set STORAGE_DIR=C:\myfiles\BRANDYFICATION
npm start
```

**On macOS/Linux:**

```bash
STORAGE_DIR=/home/user/BRANDYFICATION npm start
```

## MCP Client Configuration

### Claude Desktop

1. Open Claude Desktop settings
2. Navigate to the MCP servers configuration
3. Add the following configuration:

```json
{
  "mcpServers": {
    "brandyfication": {
      "command": "node",
      "args": ["C:/path/to/bambisleep-church-storage/dist/index.js"],
      "env": {
        "STORAGE_DIR": "C:/path/to/BRANDYFICATION"
      }
    }
  }
}
```

> **Note:** Use forward slashes `/` in paths even on Windows for JSON configuration files.

### VS Code MCP Extension

Add to your VS Code settings or MCP configuration:

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

## Your First Upload

Once configured, you can use the BRANDYFICATION tools through your MCP client:

### Upload an Image

Ask your AI assistant:

> "Upload this image as logo.png"

The assistant will use the `upload_image` tool:

```json
{
  "filename": "logo.png",
  "content": "<base64-encoded-image>"
}
```

Result: Image saved to `BRANDYFICATION/IMAGES/logo.png`

### Upload a Video

Ask:

> "Upload this video as intro.mp4"

Result: Video saved to `BRANDYFICATION/VIDEOS/intro.mp4`

### List Images

Ask:

> "What images do I have stored?"

### List Videos

Ask:

> "Show me all videos in storage"

### Download a File

Ask:

> "Download the logo.png image"

### Delete a File

Ask:

> "Delete the old-logo.png file from images"

## Project Structure

After installation, your project should look like this:

```text
bambisleep-church-storage/
├── dist/                    # Compiled JavaScript (after build)
│   └── index.js
├── docs/                    # Documentation
│   ├── index.html
│   ├── getting-started.md
│   ├── api-reference.md
│   └── ...
├── src/                     # TypeScript source
│   └── index.ts
├── BRANDYFICATION/          # File storage (created on first use)
│   ├── IMAGES/              # All image files
│   └── VIDEOS/              # All video files
├── systemd/                 # Linux service files
├── node_modules/            # Dependencies
├── package.json
├── tsconfig.json
└── README.md
```

## Supported File Formats

### Images (20+ formats)

PNG, JPG, JPEG, GIF, BMP, WEBP, SVG, ICO, TIFF, AVIF, HEIC, HEIF, RAW, PSD, AI, EPS, PCX, TGA, EXR, HDR

### Videos

MP4, GIF

## Next Steps

- Read the [API Reference](api-reference.md) for detailed documentation of all 10 tools
- Check [Configuration](configuration.md) for advanced options
- See [Examples](examples.md) for common image/video workflows
- Review [Security](security.md) for best practices

## Troubleshooting

### Server won't start

1. Ensure Node.js is installed: `node --version`
2. Ensure dependencies are installed: `npm install`
3. Ensure the project is built: `npm run build`

### Files not appearing in correct folder

1. Check file extension - images go to IMAGES/, videos go to VIDEOS/
2. Verify STORAGE_DIR is set correctly
3. Ensure the storage directories are writable

### MCP client can't connect

1. Verify the path to `dist/index.js` is correct
2. Check that the command is `node` (not `npm`)
3. Restart your MCP client after configuration changes

For more help, see [Troubleshooting](troubleshooting.md).
