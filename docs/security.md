# Security

This document outlines the security features, considerations, and best practices for the File Hosting MCP Server.

## Security Features

### Path Traversal Prevention

The server prevents directory traversal attacks by sanitizing all filenames:

```typescript
function getSafePath(filename: string): string {
  const safeName = path.basename(filename);
  return path.join(STORAGE_DIR, safeName);
}
```

This ensures that:

- `../../../etc/passwd` becomes `passwd` (in storage dir)
- `/absolute/path/file.txt` becomes `file.txt` (in storage dir)
- `subdir/file.txt` becomes `file.txt` (in storage dir)

**Example attacks that are blocked:**
| Input | Result |
|-------|--------|
| `../secret.txt` | `storage/secret.txt` |
| `../../etc/passwd` | `storage/passwd` |
| `/etc/shadow` | `storage/shadow` |
| `C:\Windows\System32\config` | `storage/config` |

### Isolated Storage

All files are stored within a single configurable directory (`STORAGE_DIR`). The server cannot:

- Read files outside this directory
- Write files outside this directory
- Execute files
- Access system resources

### No Remote Access

The server communicates via stdio (standard input/output), meaning:

- No network ports are opened
- No HTTP/WebSocket servers are exposed
- Communication is only through the MCP client

---

## Security Considerations

### File Content

The server does **not** validate or sanitize file contents. Users can:

- Upload any file type
- Upload files with any content
- Upload executable files

**Recommendations:**

1. Do not execute uploaded files
2. Be cautious when downloading and opening files
3. Consider implementing content-type restrictions for your use case

### File Size

There are no built-in file size limits. Large files can:

- Consume excessive memory (files are loaded into memory)
- Fill up disk space
- Impact performance

**Recommendations:**

1. Monitor disk space usage
2. Implement quotas at the filesystem level if needed
3. Be mindful when uploading large files

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

- The storage directory may be accessible to other users on the system
- Files may appear in backups
- Files persist until explicitly deleted

**Recommendations:**

1. Do not store highly sensitive data without additional encryption
2. Secure the storage directory with appropriate permissions
3. Regularly audit stored files

---

## Best Practices

### Storage Directory Permissions

**Linux/macOS:**

```bash
# Create dedicated directory
sudo mkdir -p /var/lib/filehosting
sudo chown $USER:$USER /var/lib/filehosting
chmod 700 /var/lib/filehosting
```

**Windows:**

1. Create a dedicated folder
2. Right-click → Properties → Security
3. Remove unnecessary users
4. Grant full control only to the service account

### Running with Least Privilege

Run the server with a dedicated user account that has:

- Read/write access to the storage directory only
- No sudo/admin privileges
- No access to sensitive system files

**Linux example:**

```bash
# Create dedicated user
sudo useradd -r -s /bin/false filehosting

# Set ownership
sudo chown filehosting:filehosting /var/lib/filehosting

# Run as dedicated user
sudo -u filehosting node dist/index.js
```

### Logging and Monitoring

Consider implementing:

1. **Access logging** - Track who uploads/downloads what files
2. **Disk space monitoring** - Alert when storage is running low
3. **File change monitoring** - Detect unexpected modifications

### Backup Strategy

Implement regular backups:

```bash
# Simple backup script
#!/bin/bash
BACKUP_DIR="/backups/filehosting"
STORAGE_DIR="/var/lib/filehosting"
DATE=$(date +%Y%m%d_%H%M%S)

tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" "$STORAGE_DIR"

# Keep only last 7 days
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +7 -delete
```

### Network Isolation

If running in a containerized environment:

```yaml
# docker-compose.yml
services:
  filehosting:
    image: filehosting-mcp
    network_mode: none # No network access
    volumes:
      - ./storage:/data
```

---

## Security Checklist

### Before Deployment

- [ ] Storage directory has restricted permissions
- [ ] Server runs with least-privilege user account
- [ ] No sensitive system paths are accessible
- [ ] Backup strategy is in place

### Ongoing

- [ ] Monitor disk space usage
- [ ] Review stored files periodically
- [ ] Keep Node.js and dependencies updated
- [ ] Check for security advisories

### If Compromised

1. Stop the server immediately
2. Preserve logs for analysis
3. Review all uploaded files
4. Check for unauthorized access to the storage directory
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

- Public-facing file hosting
- Multi-tenant environments
- Storing sensitive/regulated data (PII, PHI, etc.)
- High-availability requirements

For production use cases, consider adding:

- Authentication and authorization
- Encryption at rest
- Rate limiting
- Audit logging
- Content scanning
