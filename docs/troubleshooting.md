# Troubleshooting

Common issues and solutions for the BRANDYFICATION MCP Server.

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

**Expected output:**

```
BRANDYFICATION File Hosting MCP Server running on stdio
Storage: /path/to/BRANDYFICATION
  ├── IMAGES: /path/to/BRANDYFICATION/IMAGES
  └── VIDEOS: /path/to/BRANDYFICATION/VIDEOS
```

### "Error: Cannot create storage directory"

**Cause:** Permission denied or invalid path.

**Solutions:**

1. Check the `STORAGE_DIR` path is valid
2. Ensure write permissions exist
3. Create the directory manually:

```bash
mkdir -p /path/to/BRANDYFICATION
mkdir -p /path/to/BRANDYFICATION/IMAGES
mkdir -p /path/to/BRANDYFICATION/VIDEOS
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
    "brandyfication": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "STORAGE_DIR": "/absolute/path/to/BRANDYFICATION"
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
4. Ensure all 10 tools are listed: upload_image, upload_video, upload_file, download_file, list_files, list_images, list_videos, delete_file, get_file_info, create_directory

---

## Image/Video Operation Issues

### "Not a supported image format"

**Cause:** Trying to use `upload_image` with a non-image file extension.

**Supported image formats:**
PNG, JPG, JPEG, GIF, BMP, WEBP, SVG, ICO, TIFF, AVIF, HEIC, HEIF, RAW, PSD, AI, EPS, PCX, TGA, EXR, HDR

**Solution:** Use the correct file extension or use `upload_file` instead.

### "Not a supported video format"

**Cause:** Trying to use `upload_video` with a non-video file extension.

**Supported video formats:** MP4, GIF

**Solution:** Convert video to MP4 format or use `upload_file`.

### Image uploaded to wrong folder

**Cause:** Using `upload_file` with automatic routing.

**Solution:** Use `upload_image` to guarantee the file goes to BRANDYFICATION/IMAGES/.

### File not found when file exists

**Cause:** Looking in wrong folder or filename mismatch.

**Solutions:**

1. **Check all folders:**

```json
{ "name": "list_files", "arguments": { "folder": "all" } }
```

2. **Specify the correct folder:**

```json
{ "name": "download_file", "arguments": { "filename": "logo.png", "folder": "IMAGES" } }
```

3. **Check exact filename (case-sensitive on Linux/macOS):**

```json
{ "name": "list_images", "arguments": {} }
```

### "Permission denied" errors

**Cause:** Insufficient filesystem permissions.

**Solutions:**

**Linux/macOS:**

```bash
# Check ownership
ls -la /path/to/BRANDYFICATION

# Fix permissions
chmod 755 /path/to/BRANDYFICATION
chown $USER:$USER /path/to/BRANDYFICATION
chmod 755 /path/to/BRANDYFICATION/IMAGES
chmod 755 /path/to/BRANDYFICATION/VIDEOS
```

**Windows:**

1. Right-click BRANDYFICATION folder → Properties
2. Security tab → Edit
3. Add your user with Full Control

### Large image/video upload fails

**Cause:** Memory limitations or timeout.

**Solutions:**

1. Split large files into smaller chunks
2. Increase Node.js memory:

```bash
node --max-old-space-size=4096 dist/index.js
```

3. Consider video compression before upload

---

## Common Error Messages

### "Unknown tool: `<name>`"

**Cause:** Requesting a tool that doesn't exist.

**Available tools (10 total):**

- `upload_image` - Upload images to BRANDYFICATION/IMAGES
- `upload_video` - Upload videos to BRANDYFICATION/VIDEOS
- `upload_file` - Upload any file (auto-routes)
- `download_file` - Download files from storage
- `list_files` - List files in any/all folders
- `list_images` - List images only
- `list_videos` - List videos only
- `delete_file` - Delete files
- `get_file_info` - Get file metadata
- `create_directory` - Create custom directories

### "Error: ENOENT: no such file or directory"

**Cause:** BRANDYFICATION directory or subdirectories don't exist.

**Solution:**

```bash
mkdir -p /path/to/BRANDYFICATION/IMAGES
mkdir -p /path/to/BRANDYFICATION/VIDEOS
```

Or set a valid `STORAGE_DIR` that exists - the server will create IMAGES and VIDEOS automatically.

### "Error: EACCES: permission denied"

**Cause:** Cannot read/write to the specified path.

**Solution:** Fix permissions (see "Permission denied" section above).

### "Error: ENOSPC: no space left on device"

**Cause:** Disk is full (common with image/video storage).

**Solution:**

1. Free up disk space
2. Move BRANDYFICATION to a larger drive
3. Delete unnecessary images/videos:

```json
{ "name": "list_images", "arguments": {} }
{ "name": "delete_file", "arguments": { "filename": "old-image.png", "folder": "IMAGES" } }
```

---

## Debugging

### Enable verbose logging

Add console logging to troubleshoot. Check stderr output:

```bash
STORAGE_DIR=./test-BRANDYFICATION node dist/index.js 2>&1
```

### Check MCP client logs

**Claude Desktop:**

- Windows: Check `%APPDATA%\Claude\logs`
- macOS: Check `~/Library/Logs/Claude`

### Test server manually

```bash
# Start server
STORAGE_DIR=./test-BRANDYFICATION node dist/index.js

# In another terminal, send a test request
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

### Verify file system

```bash
# Check BRANDYFICATION directory structure
ls -la /path/to/BRANDYFICATION
ls -la /path/to/BRANDYFICATION/IMAGES
ls -la /path/to/BRANDYFICATION/VIDEOS

# Check disk space
df -h /path/to/BRANDYFICATION

# Check permissions
stat /path/to/BRANDYFICATION
```

---

## Getting Help

If you're still having issues:

1. **Check the documentation** - Review all docs in the `/docs` folder
2. **Search for similar issues** - Check GitHub issues
3. **Gather information:**

   - Node.js version: `node --version`
   - Operating system
   - Error messages (full text)
   - Configuration used
   - Steps to reproduce

4. **Simplify the problem:**
   - Try with default settings
   - Test with a small image
   - Run the server manually

---

## FAQ

**Q: Can I use a network drive for BRANDYFICATION storage?**
A: Yes, but ensure it's mounted and accessible. Performance may vary for large images/videos.

**Q: Can I run multiple instances?**
A: Yes, but use different STORAGE_DIR paths to avoid conflicts.

**Q: How do I back up my images/videos?**
A: Simply copy the entire BRANDYFICATION directory. All files are stored as-is.

**Q: Is there a file size limit?**
A: No hard limit, but files are loaded into memory. Very large videos may cause issues.

**Q: Can I store files in subdirectories of IMAGES or VIDEOS?**
A: The tools store files directly in IMAGES/ or VIDEOS/. Use `create_directory` for custom organization at the BRANDYFICATION root level.

**Q: Why do GIF files go to IMAGES by default?**
A: GIF is primarily an image format. Use `upload_video` explicitly if you want animated GIFs in the VIDEOS folder.

**Q: How do I move a file from IMAGES to VIDEOS?**
A: Download the file, delete it from the source, then upload to the destination:
1. `download_file` (folder: "IMAGES")
2. `delete_file` (folder: "IMAGES")
3. `upload_video` (to put in VIDEOS)
