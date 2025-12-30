# Getting Started

This guide will help you install, configure, and start using the File Hosting MCP Server.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.0.0 or higher
- **npm** v8.0.0 or higher
- An MCP-compatible client (e.g., Claude Desktop, VS Code with MCP extension)

## Installation

### Step 1: Clone or Download

If you haven't already, obtain the server files:

```bash
# If using git
git clone <repository-url>
cd filehosting-mcp-server

# Or download and extract the ZIP file
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

```
File Hosting MCP Server running on stdio
Storage directory: /path/to/storage
```

Press `Ctrl+C` to stop the server.

## Configuration

### Environment Variables

| Variable      | Description                      | Default     |
| ------------- | -------------------------------- | ----------- |
| `STORAGE_DIR` | Directory where files are stored | `./storage` |

### Setting the Storage Directory

**On Windows (PowerShell):**

```powershell
$env:STORAGE_DIR = "C:\myfiles\storage"
npm start
```

**On Windows (CMD):**

```cmd
set STORAGE_DIR=C:\myfiles\storage
npm start
```

**On macOS/Linux:**

```bash
STORAGE_DIR=/home/user/storage npm start
```

## MCP Client Configuration

### Claude Desktop

1. Open Claude Desktop settings
2. Navigate to the MCP servers configuration
3. Add the following configuration:

```json
{
  "mcpServers": {
    "filehosting": {
      "command": "node",
      "args": ["C:/path/to/filehosting-mcp-server/dist/index.js"],
      "env": {
        "STORAGE_DIR": "C:/path/to/storage"
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

## Your First File Upload

Once configured, you can use the file hosting tools through your MCP client:

### Upload a Text File

Ask your AI assistant:

> "Upload a file called hello.txt with the content 'Hello, World!'"

The assistant will use the `upload_file` tool:

```json
{
  "filename": "hello.txt",
  "content": "Hello, World!",
  "encoding": "utf8"
}
```

### List Files

Ask:

> "What files are in storage?"

### Download a File

Ask:

> "Download the hello.txt file"

### Delete a File

Ask:

> "Delete the hello.txt file"

## Project Structure

After installation, your project should look like this:

```
filehosting-mcp-server/
├── dist/               # Compiled JavaScript (after build)
│   └── index.js
├── docs/               # Documentation
│   ├── index.html
│   ├── getting-started.md
│   ├── api-reference.md
│   └── ...
├── src/                # TypeScript source
│   └── index.ts
├── storage/            # File storage (created on first use)
├── node_modules/       # Dependencies
├── package.json
├── tsconfig.json
└── README.md
```

## Next Steps

- Read the [API Reference](api-reference.md) for detailed tool documentation
- Check [Configuration](configuration.md) for advanced options
- See [Examples](examples.md) for common usage patterns
- Review [Security](security.md) for best practices

## Troubleshooting

### Server won't start

1. Ensure Node.js is installed: `node --version`
2. Ensure dependencies are installed: `npm install`
3. Ensure the project is built: `npm run build`

### Files not appearing

1. Check the `STORAGE_DIR` environment variable
2. Ensure the storage directory exists and is writable
3. Check file permissions

### MCP client can't connect

1. Verify the path to `dist/index.js` is correct
2. Check that the command is `node` (not `npm`)
3. Restart your MCP client after configuration changes

For more help, see [Troubleshooting](troubleshooting.md).
