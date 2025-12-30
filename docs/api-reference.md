# API Reference

Complete documentation for all File Hosting MCP Server tools and resources.

## Overview

The File Hosting MCP Server exposes functionality through two MCP primitives:

- **Tools**: Actions that can be performed (upload, download, delete, etc.)
- **Resources**: Files exposed as readable resources with MIME types

---

## Tools

### upload_file

Upload a file to the storage directory.

#### Parameters

| Parameter  | Type   | Required | Description                                     |
| ---------- | ------ | -------- | ----------------------------------------------- |
| `filename` | string | ✅ Yes   | Name of the file to create                      |
| `content`  | string | ✅ Yes   | Content of the file                             |
| `encoding` | string | ❌ No    | Encoding type: `"utf8"` (default) or `"base64"` |

#### Examples

**Upload a text file:**

```json
{
  "filename": "notes.txt",
  "content": "These are my notes.\nLine 2.",
  "encoding": "utf8"
}
```

**Upload a binary file (e.g., image):**

```json
{
  "filename": "image.png",
  "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "encoding": "base64"
}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "File \"notes.txt\" uploaded successfully to ./storage/notes.txt"
    }
  ]
}
```

#### Error Cases

- File system write errors
- Invalid encoding specified

---

### download_file

Download (read) a file from storage.

#### Parameters

| Parameter  | Type   | Required | Description                                         |
| ---------- | ------ | -------- | --------------------------------------------------- |
| `filename` | string | ✅ Yes   | Name of the file to download                        |
| `encoding` | string | ❌ No    | Response encoding: `"utf8"` (default) or `"base64"` |

#### Examples

**Download as text:**

```json
{
  "filename": "notes.txt",
  "encoding": "utf8"
}
```

**Download as base64 (for binary files):**

```json
{
  "filename": "image.png",
  "encoding": "base64"
}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "These are my notes.\nLine 2."
    }
  ]
}
```

#### Error Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: File \"nonexistent.txt\" not found"
    }
  ],
  "isError": true
}
```

---

### list_files

List all files and directories in the storage root.

#### Parameters

None required.

#### Example

```json
{}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "[\n  {\n    \"name\": \"notes.txt\",\n    \"type\": \"file\"\n  },\n  {\n    \"name\": \"images\",\n    \"type\": \"directory\"\n  }\n]"
    }
  ]
}
```

#### Response Format

The response is a JSON array of objects:

```typescript
interface FileEntry {
  name: string; // File or directory name
  type: "file" | "directory";
}
```

---

### delete_file

Permanently delete a file from storage.

#### Parameters

| Parameter  | Type   | Required | Description                |
| ---------- | ------ | -------- | -------------------------- |
| `filename` | string | ✅ Yes   | Name of the file to delete |

#### Example

```json
{
  "filename": "old-notes.txt"
}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "File \"old-notes.txt\" deleted successfully"
    }
  ]
}
```

#### Error Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Could not delete \"nonexistent.txt\". File may not exist."
    }
  ],
  "isError": true
}
```

---

### get_file_info

Get metadata about a file.

#### Parameters

| Parameter  | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `filename` | string | ✅ Yes   | Name of the file to inspect |

#### Example

```json
{
  "filename": "document.pdf"
}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"name\": \"document.pdf\",\n  \"size\": 1048576,\n  \"sizeHuman\": \"1 MB\",\n  \"created\": \"2025-01-15T10:30:00.000Z\",\n  \"modified\": \"2025-01-15T14:22:00.000Z\",\n  \"isDirectory\": false\n}"
    }
  ]
}
```

#### Response Format

```typescript
interface FileInfo {
  name: string; // File name
  size: number; // Size in bytes
  sizeHuman: string; // Human-readable size (e.g., "1.5 MB")
  created: string; // ISO 8601 creation timestamp
  modified: string; // ISO 8601 modification timestamp
  isDirectory: boolean;
}
```

---

### create_directory

Create a subdirectory in storage.

#### Parameters

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| `dirname` | string | ✅ Yes   | Name of the directory to create |

#### Example

```json
{
  "dirname": "images"
}
```

#### Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Directory \"images\" created successfully"
    }
  ]
}
```

#### Notes

- Creates the directory if it doesn't exist
- Does not error if directory already exists
- Only creates directories in the storage root (no nested paths for security)

---

## Resources

Files in storage are also exposed as MCP resources, allowing direct access through the resources API.

### Listing Resources

The server responds to `resources/list` requests with all files in storage:

```json
{
  "resources": [
    {
      "uri": "file:///path/to/storage/notes.txt",
      "name": "notes.txt",
      "mimeType": "text/plain"
    },
    {
      "uri": "file:///path/to/storage/data.json",
      "name": "data.json",
      "mimeType": "application/json"
    }
  ]
}
```

### Reading Resources

Resources can be read via `resources/read` requests:

**Request:**

```json
{
  "uri": "file:///path/to/storage/notes.txt"
}
```

**Response (text file):**

```json
{
  "contents": [
    {
      "uri": "file:///path/to/storage/notes.txt",
      "mimeType": "text/plain",
      "text": "File contents here..."
    }
  ]
}
```

**Response (binary file):**

```json
{
  "contents": [
    {
      "uri": "file:///path/to/storage/image.png",
      "mimeType": "image/png",
      "blob": "base64encodedcontent..."
    }
  ]
}
```

### Supported MIME Types

| Extension       | MIME Type                  |
| --------------- | -------------------------- |
| `.txt`          | `text/plain`               |
| `.html`         | `text/html`                |
| `.css`          | `text/css`                 |
| `.js`           | `text/javascript`          |
| `.json`         | `application/json`         |
| `.xml`          | `application/xml`          |
| `.pdf`          | `application/pdf`          |
| `.png`          | `image/png`                |
| `.jpg`, `.jpeg` | `image/jpeg`               |
| `.gif`          | `image/gif`                |
| `.svg`          | `image/svg+xml`            |
| `.mp3`          | `audio/mpeg`               |
| `.mp4`          | `video/mp4`                |
| `.zip`          | `application/zip`          |
| `.md`           | `text/markdown`            |
| (other)         | `application/octet-stream` |

---

## Error Handling

All tools return errors in a consistent format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Description of what went wrong"
    }
  ],
  "isError": true
}
```

### Common Error Codes

| Error             | Description                               |
| ----------------- | ----------------------------------------- |
| File not found    | The specified file does not exist         |
| Permission denied | Cannot read/write to storage directory    |
| Invalid encoding  | Encoding must be "utf8" or "base64"       |
| Unknown tool      | The requested tool name is not recognized |

---

## Rate Limits & Constraints

- **File size**: Limited by available memory (files are loaded entirely into memory)
- **Filename**: Must be a valid filesystem name; path traversal attempts are blocked
- **Concurrent access**: No built-in locking; avoid concurrent writes to the same file
