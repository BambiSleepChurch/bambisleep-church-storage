# Examples

Real-world usage examples and common patterns for the BRANDYFICATION MCP Server.

## Image Operations

### Upload an Image

**User request:**

> "Upload this logo as logo.png"

**Tool call:**

```json
{
  "name": "upload_image",
  "arguments": {
    "filename": "logo.png",
    "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }
}
```

**Response:**

```
Image "logo.png" uploaded to BRANDYFICATION/IMAGES/
```

---

### Upload Different Image Formats

**PNG (screenshots, graphics with transparency):**

```json
{
  "name": "upload_image",
  "arguments": {
    "filename": "screenshot.png",
    "content": "<base64-content>"
  }
}
```

**JPEG (photographs):**

```json
{
  "name": "upload_image",
  "arguments": {
    "filename": "photo.jpg",
    "content": "<base64-content>"
  }
}
```

**SVG (vector graphics):**

```json
{
  "name": "upload_image",
  "arguments": {
    "filename": "icon.svg",
    "content": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjwvc3ZnPg=="
  }
}
```

**WebP (modern web images):**

```json
{
  "name": "upload_image",
  "arguments": {
    "filename": "hero.webp",
    "content": "<base64-content>"
  }
}
```

---

### List All Images

**User request:**

> "Show me all images I have stored"

**Tool call:**

```json
{
  "name": "list_images",
  "arguments": {}
}
```

**Response:**

```json
{
  "folder": "BRANDYFICATION/IMAGES",
  "images": [
    {
      "name": "logo.png",
      "mimeType": "image/png",
      "path": "BRANDYFICATION/IMAGES/logo.png"
    },
    {
      "name": "banner.jpg",
      "mimeType": "image/jpeg",
      "path": "BRANDYFICATION/IMAGES/banner.jpg"
    },
    {
      "name": "icon.svg",
      "mimeType": "image/svg+xml",
      "path": "BRANDYFICATION/IMAGES/icon.svg"
    }
  ]
}
```

---

### Download an Image

**User request:**

> "Download the logo image"

**Tool call:**

```json
{
  "name": "download_file",
  "arguments": {
    "filename": "logo.png",
    "folder": "IMAGES"
  }
}
```

**Response:**

```
iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==
```

---

### Get Image Information

**User request:**

> "How big is the banner image?"

**Tool call:**

```json
{
  "name": "get_file_info",
  "arguments": {
    "filename": "banner.jpg",
    "folder": "IMAGES"
  }
}
```

**Response:**

```json
{
  "name": "banner.jpg",
  "size": 245760,
  "sizeHuman": "240 KB",
  "mimeType": "image/jpeg",
  "created": "2025-01-15T10:30:00.000Z",
  "modified": "2025-01-15T10:30:00.000Z",
  "isDirectory": false
}
```

---

## Video Operations

### Upload a Video

**User request:**

> "Upload this intro video"

**Tool call:**

```json
{
  "name": "upload_video",
  "arguments": {
    "filename": "intro.mp4",
    "content": "<base64-encoded-video>"
  }
}
```

**Response:**

```
Video "intro.mp4" uploaded to BRANDYFICATION/VIDEOS/
```

---

### Upload an Animated GIF as Video

**User request:**

> "Save this animation as a video"

**Tool call:**

```json
{
  "name": "upload_video",
  "arguments": {
    "filename": "animation.gif",
    "content": "<base64-content>"
  }
}
```

**Response:**

```
Video "animation.gif" uploaded to BRANDYFICATION/VIDEOS/
```

---

### List All Videos

**User request:**

> "What videos do I have?"

**Tool call:**

```json
{
  "name": "list_videos",
  "arguments": {}
}
```

**Response:**

```json
{
  "folder": "BRANDYFICATION/VIDEOS",
  "videos": [
    {
      "name": "intro.mp4",
      "mimeType": "video/mp4",
      "path": "BRANDYFICATION/VIDEOS/intro.mp4"
    },
    {
      "name": "animation.gif",
      "mimeType": "image/gif",
      "path": "BRANDYFICATION/VIDEOS/animation.gif"
    }
  ]
}
```

---

## General File Operations

### Upload a Text File

**User request:**

> "Save my notes as notes.txt"

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "notes.txt",
    "content": "# My Notes\n\n- Item 1\n- Item 2\n- Item 3",
    "encoding": "utf8"
  }
}
```

**Response:**

```
File "notes.txt" uploaded to BRANDYFICATION/root/
```

---

### Upload JSON Configuration

**User request:**

> "Store this configuration"

**Tool call:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "config.json",
    "content": "{\n  \"theme\": \"dark\",\n  \"language\": \"en\"\n}",
    "encoding": "utf8"
  }
}
```

---

### Auto-Routing with upload_file

The `upload_file` tool automatically routes files to the correct folder:

**Image auto-routed:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "photo.png",
    "content": "<base64>",
    "encoding": "base64"
  }
}
```

Result: `BRANDYFICATION/IMAGES/photo.png`

**Video auto-routed:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "clip.mp4",
    "content": "<base64>",
    "encoding": "base64"
  }
}
```

Result: `BRANDYFICATION/VIDEOS/clip.mp4`

**Other files stay at root:**

```json
{
  "name": "upload_file",
  "arguments": {
    "filename": "data.csv",
    "content": "name,value\nfoo,123",
    "encoding": "utf8"
  }
}
```

Result: `BRANDYFICATION/data.csv`

---

### List All Files

**User request:**

> "Show me everything in storage"

**Tool call:**

```json
{
  "name": "list_files",
  "arguments": {
    "folder": "all"
  }
}
```

**Response:**

```json
[
  {
    "folder": "BRANDYFICATION",
    "files": [
      { "name": "notes.txt", "type": "file" },
      { "name": "config.json", "type": "file" }
    ]
  },
  {
    "folder": "BRANDYFICATION/IMAGES",
    "files": [
      { "name": "logo.png", "type": "image/png" },
      { "name": "banner.jpg", "type": "image/jpeg" }
    ]
  },
  {
    "folder": "BRANDYFICATION/VIDEOS",
    "files": [{ "name": "intro.mp4", "type": "video/mp4" }]
  }
]
```

---

### Delete a File

**User request:**

> "Delete the old logo"

**Tool call:**

```json
{
  "name": "delete_file",
  "arguments": {
    "filename": "old-logo.png",
    "folder": "IMAGES"
  }
}
```

**Response:**

```
File "old-logo.png" deleted successfully
```

---

### Create a Custom Directory

**User request:**

> "Create an archive folder"

**Tool call:**

```json
{
  "name": "create_directory",
  "arguments": {
    "dirname": "archive"
  }
}
```

**Response:**

```
Directory "archive" created successfully in BRANDYFICATION/
```

---

## Common Workflows

### Image Gallery Workflow

1. **Upload images:**

```json
{ "name": "upload_image", "arguments": { "filename": "photo-001.jpg", "content": "<base64>" } }
{ "name": "upload_image", "arguments": { "filename": "photo-002.jpg", "content": "<base64>" } }
{ "name": "upload_image", "arguments": { "filename": "photo-003.jpg", "content": "<base64>" } }
```

2. **List all images:**

```json
{ "name": "list_images", "arguments": {} }
```

3. **Get info on a specific image:**

```json
{
  "name": "get_file_info",
  "arguments": { "filename": "photo-001.jpg", "folder": "IMAGES" }
}
```

---

### Project Assets Workflow

Store project assets with organization:

```text
BRANDYFICATION/
├── IMAGES/
│   ├── logo.png
│   ├── icon-16.png
│   ├── icon-32.png
│   └── banner.jpg
├── VIDEOS/
│   └── demo.mp4
├── project-config.json
└── README.md
```

---

### Media Library Organization

```text
BRANDYFICATION/
├── IMAGES/
│   ├── avatars/          (custom directory)
│   ├── thumbnails/       (custom directory)
│   ├── hero.jpg
│   └── background.png
├── VIDEOS/
│   ├── tutorials/        (custom directory)
│   ├── intro.mp4
│   └── outro.mp4
└── manifest.json
```

---

## Error Handling Examples

### Invalid Image Format

**Tool call:**

```json
{
  "name": "upload_image",
  "arguments": {
    "filename": "document.pdf",
    "content": "<base64>"
  }
}
```

**Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: \".pdf\" is not a supported image format. Supported: .png, .jpg, .jpeg, .gif, .bmp, .webp, .svg, .ico, .tiff, .tif, .avif, .heic, .heif, .raw, .psd, .ai, .eps, .pcx, .tga, .exr, .hdr"
    }
  ],
  "isError": true
}
```

### File Not Found

**Tool call:**

```json
{
  "name": "download_file",
  "arguments": {
    "filename": "nonexistent.png",
    "folder": "IMAGES"
  }
}
```

**Response:**

```json
{
  "content": [
    { "type": "text", "text": "Error: File \"nonexistent.png\" not found" }
  ],
  "isError": true
}
```

---

## Tips and Tricks

1. **Use `upload_image` for images** - It validates format and always routes to IMAGES/
2. **Use `upload_video` for videos** - It validates format and always routes to VIDEOS/
3. **Use `upload_file` for auto-routing** - It automatically detects type and routes accordingly
4. **Use `list_images`/`list_videos`** for focused listings
5. **Use `list_files` with `folder: "all"`** for a complete overview
6. **Check file info before downloading** - Verify size and type
7. **Use descriptive filenames** - Include dates, versions, or project names
