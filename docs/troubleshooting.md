# Troubleshooting

Common issues and solutions for the File Hosting MCP Server.

## Installation Issues

### "Cannot find module '@modelcontextprotocol/sdk'"

**Cause:** Dependencies not installed.

**Solution:**

```bash
npm install
```

### "npm install" fails with permission errors

**Cause:** Insufficient permissions to install packages.

**Solutions:**

**Windows (run as Administrator):**

```powershell
# Right-click PowerShell → Run as Administrator
npm install
```

**Linux/macOS:**

```bash
# Option 1: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Option 2: Use sudo (not recommended)
sudo npm install
```

### TypeScript compilation errors

**Cause:** TypeScript version mismatch or missing types.

**Solution:**

```bash
# Clean and reinstall
rm -rf node_modules dist
npm install
npm run build
```

---

## Startup Issues

### "Cannot find module './dist/index.js'"

**Cause:** Project not built.

**Solution:**

```bash
npm run build
```

### Server starts but immediately exits

**Cause:** The server uses stdio transport and needs an MCP client.

**Expected behavior:** The server is designed to be launched by an MCP client, not run standalone. When run directly, it will wait for input on stdin.

**To test manually:**

```bash
# This will start and wait for MCP protocol messages
node dist/index.js
```

### "Error: Cannot create storage directory"

**Cause:** Permission denied or invalid path.

**Solutions:**

1. Check the `STORAGE_DIR` path is valid
2. Ensure write permissions exist
3. Create the directory manually:

```bash
mkdir -p /path/to/storage
```

---

## MCP Client Issues

### Server not appearing in MCP client

**Cause:** Configuration error in MCP client settings.

**Solutions:**

1. **Verify the configuration path:**

   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. **Check JSON syntax:**

```json
{
  "mcpServers": {
    "filehosting": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "STORAGE_DIR": "/absolute/path/to/storage"
      }
    }
  }
}
```

3. **Restart the MCP client** after configuration changes.

### "spawn node ENOENT" error

**Cause:** Node.js not in PATH or not installed.

**Solutions:**

1. **Verify Node.js is installed:**

```bash
node --version
```

2. **Use absolute path to node:**

```json
{
  "command": "C:/Program Files/nodejs/node.exe",
  "args": ["C:/path/to/dist/index.js"]
}
```

### Tools not appearing

**Cause:** Server failed to start or connect.

**Solutions:**

1. Check MCP client logs for errors
2. Test the server manually
3. Verify the path to `dist/index.js` is correct

---

## File Operation Issues

### "File not found" when file exists

**Cause:** Filename mismatch or wrong storage directory.

**Solutions:**

1. **Check exact filename (case-sensitive on Linux/macOS):**

```json
{ "name": "list_files", "arguments": {} }
```

2. **Verify STORAGE_DIR:**

```bash
echo $STORAGE_DIR  # Linux/macOS
echo %STORAGE_DIR% # Windows CMD
$env:STORAGE_DIR   # Windows PowerShell
```

### "Permission denied" errors

**Cause:** Insufficient filesystem permissions.

**Solutions:**

**Linux/macOS:**

```bash
# Check ownership
ls -la /path/to/storage

# Fix permissions
chmod 755 /path/to/storage
chown $USER:$USER /path/to/storage
```

**Windows:**

1. Right-click storage folder → Properties
2. Security tab → Edit
3. Add your user with Full Control

### File content appears corrupted

**Cause:** Wrong encoding used for binary files.

**Solutions:**

**For binary files (images, PDFs, etc.):**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "image.png",
    "content": "<base64-content>",
    "encoding": "base64"
  }
}
```

```json
{
  "name": "download_file",
  "arguments": {
    "filename": "image.png",
    "encoding": "base64"
  }
}
```

### Large file upload fails

**Cause:** Memory limitations or timeout.

**Solutions:**

1. Split large files into smaller chunks
2. Increase Node.js memory:

```bash
node --max-old-space-size=4096 dist/index.js
```

---

## Common Error Messages

### "Unknown tool: <name>"

**Cause:** Requesting a tool that doesn't exist.

**Available tools:**

- `upload_file`
- `download_file`
- `list_files`
- `delete_file`
- `get_file_info`
- `create_directory`

### "Error: ENOENT: no such file or directory"

**Cause:** Storage directory doesn't exist.

**Solution:**

```bash
mkdir -p /path/to/storage
```

Or set a valid `STORAGE_DIR` that exists.

### "Error: EACCES: permission denied"

**Cause:** Cannot read/write to the specified path.

**Solution:** Fix permissions (see "Permission denied" section above).

### "Error: ENOSPC: no space left on device"

**Cause:** Disk is full.

**Solution:**

1. Free up disk space
2. Move storage to a larger drive
3. Delete unnecessary files

---

## Debugging

### Enable verbose logging

Add console logging to troubleshoot:

```typescript
// In src/index.ts, add at the top of tool handlers:
console.error(`[DEBUG] Tool called: ${name}`, JSON.stringify(args));
```

Rebuild and check stderr output.

### Check MCP client logs

**Claude Desktop:**

- Windows: Check `%APPDATA%\Claude\logs`
- macOS: Check `~/Library/Logs/Claude`

### Test server manually

```bash
# Start server
STORAGE_DIR=./test-storage node dist/index.js

# In another terminal, send a test request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Verify file system

```bash
# Check storage directory
ls -la /path/to/storage

# Check disk space
df -h /path/to/storage

# Check permissions
stat /path/to/storage
```

---

## Getting Help

If you're still having issues:

1. **Check the documentation** - Review all docs in the `/docs` folder
2. **Search for similar issues** - Someone may have encountered the same problem
3. **Gather information:**

   - Node.js version: `node --version`
   - Operating system
   - Error messages (full text)
   - Configuration used
   - Steps to reproduce

4. **Simplify the problem:**
   - Try with default settings
   - Test with a simple file
   - Run the server manually

---

## FAQ

**Q: Can I use a network drive for storage?**
A: Yes, but ensure it's mounted and accessible to the Node.js process. Performance may vary.

**Q: Can I run multiple instances?**
A: Yes, but use different storage directories to avoid conflicts.

**Q: How do I back up my files?**
A: Simply copy the storage directory. All files are stored as-is.

**Q: Is there a file size limit?**
A: No hard limit, but files are loaded into memory. Very large files may cause issues.

**Q: Can I store files in subdirectories?**
A: The current implementation stores all files in the root of STORAGE_DIR. You can create directories with `create_directory`, but uploading directly to subdirectories requires modifying the code.
