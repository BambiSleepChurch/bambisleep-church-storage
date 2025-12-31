# Security

This document outlines the security features, considerations, and best practices for the BRANDYFICATION MCP Server.

## Security Features

### Path Traversal Prevention

The server prevents directory traversal attacks by sanitizing all filenames:

```typescript
function getSafePath(filename: string, folder?: string): string {
  const safeName = path.basename(filename);
  const targetFolder = folder || getTargetFolder(filename);
  return path.join(targetFolder, safeName);
}
```

This ensures that:

- `../../../etc/passwd` becomes `passwd` (in BRANDYFICATION)
- `/absolute/path/file.txt` becomes `file.txt` (in BRANDYFICATION)
- `../../image.png` becomes `image.png` (in BRANDYFICATION/IMAGES)

**Example attacks that are blocked:**

| Input                        | Result                             |
| ---------------------------- | ---------------------------------- |
| `../secret.png`              | `BRANDYFICATION/IMAGES/secret.png` |
| `../../etc/passwd`           | `BRANDYFICATION/passwd`            |
| `/etc/shadow`                | `BRANDYFICATION/shadow`            |
| `C:\Windows\System32\config` | `BRANDYFICATION/config`            |

### Isolated Storage

All files are stored within the BRANDYFICATION directory structure. The server cannot:

- Read files outside BRANDYFICATION
- Write files outside BRANDYFICATION
- Execute files
- Access system resources

### Folder Isolation

The automatic routing system ensures:

- Images are always stored in `BRANDYFICATION/IMAGES/`
- Videos are always stored in `BRANDYFICATION/VIDEOS/`
- Other files are stored in `BRANDYFICATION/`

### No Remote Access

The server communicates via stdio (standard input/output), meaning:

- No network ports are opened
- No HTTP/WebSocket servers are exposed
- Communication is only through the MCP client

---

## Security Considerations

### File Content

The server validates file extensions but does **not** validate file contents. Users can:

- Upload any content with a valid extension
- Upload potentially malicious files with image/video extensions

**Recommendations:**

1. Do not execute uploaded files
2. Be cautious when opening files from untrusted sources
3. Consider implementing content validation for your use case
4. Use antivirus scanning on the storage directory

### File Size

There are no built-in file size limits. Large images/videos can:

- Consume excessive memory (files are loaded into memory for base64 encoding)
- Fill up disk space quickly
- Impact performance

**Recommendations:**

1. Monitor disk space usage
2. Implement quotas at the filesystem level if needed
3. Be mindful when uploading large video files
4. Consider chunked uploads for very large files

### Concurrent Access

The server does not implement file locking. Concurrent writes to the same file may result in:

- Data corruption
- Lost updates
- Inconsistent state

**Recommendations:**

1. Avoid concurrent writes to the same file
2. Use unique filenames for simultaneous uploads
3. Implement application-level coordination if needed

### Sensitive Data

Files are stored as-is without encryption. Consider:

- The BRANDYFICATION directory may be accessible to other users on the system
- Images and videos may appear in backups
- Files persist until explicitly deleted
- Metadata (filenames, dates) may reveal sensitive information

**Recommendations:**

1. Do not store sensitive images/videos without additional encryption
2. Secure the BRANDYFICATION directory with appropriate permissions
3. Regularly audit stored files
4. Be mindful of metadata in uploaded files (EXIF data, etc.)

---

## Best Practices

### Storage Directory Permissions

**Linux/macOS:**

```bash
# Create dedicated directory
sudo mkdir -p /var/lib/BRANDYFICATION
sudo chown $USER:$USER /var/lib/BRANDYFICATION
chmod 700 /var/lib/BRANDYFICATION

# Create subdirectories
mkdir -p /var/lib/BRANDYFICATION/IMAGES
mkdir -p /var/lib/BRANDYFICATION/VIDEOS
```

**Windows:**

1. Create a dedicated folder for BRANDYFICATION
2. Right-click → Properties → Security
3. Remove unnecessary users
4. Grant full control only to the service account

### Running with Least Privilege

Run the server with a dedicated user account that has:

- Read/write access to the BRANDYFICATION directory only
- No sudo/admin privileges
- No access to sensitive system files

**Linux example:**

```bash
# Create dedicated user
sudo useradd -r -s /bin/false brandyfication

# Set ownership
sudo chown -R brandyfication:brandyfication /var/lib/BRANDYFICATION

# Run as dedicated user
sudo -u brandyfication node dist/index.js
```

### Logging and Monitoring

Consider implementing:

1. **Access logging** - Track who uploads/downloads what images/videos
2. **Disk space monitoring** - Alert when storage is running low
3. **File change monitoring** - Detect unexpected modifications
4. **Upload rate limiting** - Prevent abuse

### Backup Strategy

Implement regular backups for your BRANDYFICATION storage:

```bash
#!/bin/bash
BACKUP_DIR="/backups/brandyfication"
STORAGE_DIR="/var/lib/BRANDYFICATION"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$STORAGE_DIR"

# Keep only last 7 days
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
```

### Network Isolation

If running in a containerized environment:

```yaml
# docker-compose.yml
services:
  brandyfication:
    image: brandyfication-mcp
    network_mode: none # No network access
    volumes:
      - ./BRANDYFICATION:/data/BRANDYFICATION
```

---

## Security Checklist

### Before Deployment

- [ ] BRANDYFICATION directory has restricted permissions
- [ ] Server runs with least-privilege user account
- [ ] No sensitive system paths are accessible
- [ ] Backup strategy is in place
- [ ] IMAGES and VIDEOS subdirectories are properly secured

### Ongoing

- [ ] Monitor disk space usage (images/videos can be large)
- [ ] Review stored files periodically
- [ ] Keep Node.js and dependencies updated
- [ ] Check for security advisories
- [ ] Audit uploaded file types

### If Compromised

1. Stop the server immediately
2. Preserve logs for analysis
3. Review all uploaded images/videos
4. Check for unauthorized access to the BRANDYFICATION directory
5. Rotate any credentials that may have been exposed
6. Restore from known-good backup if necessary

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **Do not** disclose it publicly
2. Document the issue with steps to reproduce
3. Report through appropriate channels
4. Allow time for a fix before disclosure

---

## Limitations

This server is designed for simplicity and local use. It is **not** suitable for:

- Public-facing image/video hosting
- Multi-tenant environments
- Storing sensitive/regulated data (PII, PHI, etc.)
- High-availability requirements

For production use cases, consider adding:

- Authentication and authorization
- Encryption at rest
- Rate limiting
- Audit logging
- Content scanning
- CDN integration for media delivery
