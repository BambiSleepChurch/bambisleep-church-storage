# API Reference

Complete documentation for all BRANDYFICATION MCP Server tools and resources.

## Overview

The BRANDYFICATION MCP Server provides **10 tools** for managing images, videos, and files:

| Tool | Description |
|------|-------------|
| `upload_image` | Upload images to BRANDYFICATION/IMAGES |
| `upload_video` | Upload videos to BRANDYFICATION/VIDEOS |
| `upload_file` | Upload any file (auto-routes to correct folder) |
| `download_file` | Download/read files from storage |
| `list_files` | List files in any or all folders |
| `list_images` | List all images in BRANDYFICATION/IMAGES |
| `list_videos` | List all videos in BRANDYFICATION/VIDEOS |
| `delete_file` | Delete files from storage |
| `get_file_info` | Get file metadata and MIME type |
| `create_directory` | Create custom subdirectories |

---

## Image Tools

### upload_image

Upload an image file to BRANDYFICATION/IMAGES.

#### Parameters

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `filename` | string | ✅ Yes   | Name of the image file (with extension) |
| `content`  | string | ✅ Yes   | Base64-encoded image content |

#### Supported Formats

PNG, JPG, JPEG, GIF, BMP, WEBP, SVG, ICO, TIFF, AVIF, HEIC, HEIF, RAW, PSD, AI, EPS, PCX, TGA, EXR, HDR

#### Example

```json
{
  "filename": "logo.png",
  "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

#### Response

```json
{
  "content": [{ "type": "text", "text": "Image \"logo.png\" uploaded to BRANDYFICATION/IMAGES/" }]
}
```

#### Error Response (Invalid Format)

```json
{
  "content": [{ "type": "text", "text": "Error: \".doc\" is not a supported image format. Supported: .png, .jpg, .jpeg, .gif, .bmp, .webp, .svg, .ico, .tiff, .tif, .avif, .heic, .heif, .raw, .psd, .ai, .eps, .pcx, .tga, .exr, .hdr" }],
  "isError": true
}
```

---

### list_images

List all images in BRANDYFICATION/IMAGES.

#### Parameters

None required.

#### Example

```json
{}
```

#### Response

```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"folder\": \"BRANDYFICATION/IMAGES\",\n  \"images\": [\n    {\n      \"name\": \"logo.png\",\n      \"mimeType\": \"image/png\",\n      \"path\": \"BRANDYFICATION/IMAGES/logo.png\"\n    },\n    {\n      \"name\": \"banner.jpg\",\n      \"mimeType\": \"image/jpeg\",\n      \"path\": \"BRANDYFICATION/IMAGES/banner.jpg\"\n    }\n  ]\n}"
  }]
}
```

---

## Video Tools

### upload_video

Upload a video file to BRANDYFICATION/VIDEOS.

#### Parameters

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `filename` | string | ✅ Yes   | Name of the video file (with extension) |
| `content`  | string | ✅ Yes   | Base64-encoded video content |

#### Supported Formats

MP4, GIF

#### Example

```json
{
  "filename": "intro.mp4",
  "content": "<base64-encoded-video>"
}
```

#### Response

```json
{
  "content": [{ "type": "text", "text": "Video \"intro.mp4\" uploaded to BRANDYFICATION/VIDEOS/" }]
}
```

---

### list_videos

List all videos in BRANDYFICATION/VIDEOS.

#### Parameters

None required.

#### Example

```json
{}
```

#### Response

```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"folder\": \"BRANDYFICATION/VIDEOS\",\n  \"videos\": [\n    {\n      \"name\": \"intro.mp4\",\n      \"mimeType\": \"video/mp4\",\n      \"path\": \"BRANDYFICATION/VIDEOS/intro.mp4\"\n    }\n  ]\n}"
  }]
}
```

---

## General File Tools

### upload_file

Upload a file to BRANDYFICATION. Automatically routes to IMAGES or VIDEOS subfolder based on file extension.

#### Parameters

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `filename` | string | ✅ Yes   | Name of the file to upload |
| `content`  | string | ✅ Yes   | File content (base64 for binary, plain text otherwise) |
| `encoding` | string | ❌ No    | Encoding: `"base64"` or `"utf8"` (default: utf8) |

#### Example - Image Upload

```json
{
  "filename": "photo.png",
  "content": "<base64-content>",
  "encoding": "base64"
}
```

Result: Saved to `BRANDYFICATION/IMAGES/photo.png`

#### Example - Video Upload

```json
{
  "filename": "clip.mp4",
  "content": "<base64-content>",
  "encoding": "base64"
}
```

Result: Saved to `BRANDYFICATION/VIDEOS/clip.mp4`

#### Example - Text File

```json
{
  "filename": "notes.txt",
  "content": "These are my notes.",
  "encoding": "utf8"
}
```

Result: Saved to `BRANDYFICATION/notes.txt` (root folder)

---

### download_file

Download/read a file from BRANDYFICATION storage.

#### Parameters

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `filename` | string | ✅ Yes   | Name of the file to download |
| `folder`   | string | ❌ No    | Folder to download from: `"IMAGES"`, `"VIDEOS"`, `"root"` (auto-detected if not specified) |
| `encoding` | string | ❌ No    | Response encoding: `"base64"` or `"utf8"` (auto-detected based on file type) |

#### Example - Download Image

```json
{
  "filename": "logo.png",
  "folder": "IMAGES"
}
```

#### Example - Download with Auto-Detection

```json
{
  "filename": "logo.png"
}
```

The server automatically detects the folder based on file extension.

#### Response (Binary File)

```json
{
  "content": [{ "type": "text", "text": "iVBORw0KGgoAAAANSUhEUgAAAAE..." }]
}
```

---

### list_files

List files in any or all BRANDYFICATION folders.

#### Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `folder`  | string | ❌ No    | Which folder: `"IMAGES"`, `"VIDEOS"`, `"root"`, `"all"` (default: all) |

#### Example - List All

```json
{}
```

#### Example - List Images Only

```json
{
  "folder": "IMAGES"
}
```

#### Response

```json
{
  "content": [{
    "type": "text",
    "text": "[\n  {\n    \"folder\": \"BRANDYFICATION\",\n    \"files\": [{ \"name\": \"config.json\", \"type\": \"file\" }]\n  },\n  {\n    \"folder\": \"BRANDYFICATION/IMAGES\",\n    \"files\": [{ \"name\": \"logo.png\", \"type\": \"image/png\" }]\n  },\n  {\n    \"folder\": \"BRANDYFICATION/VIDEOS\",\n    \"files\": [{ \"name\": \"intro.mp4\", \"type\": \"video/mp4\" }]\n  }\n]"
  }]
}
```

---

### delete_file

Delete a file from BRANDYFICATION storage.

#### Parameters

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `filename` | string | ✅ Yes   | Name of the file to delete |
| `folder`   | string | ❌ No    | Folder containing the file: `"IMAGES"`, `"VIDEOS"`, `"root"` (auto-detected if not specified) |

#### Example

```json
{
  "filename": "old-logo.png",
  "folder": "IMAGES"
}
```

#### Response

```json
{
  "content": [{ "type": "text", "text": "File \"old-logo.png\" deleted successfully" }]
}
```

---

### get_file_info

Get metadata about a file including size, MIME type, and dates.

#### Parameters

| Parameter  | Type   | Required | Description |
|------------|--------|----------|-------------|
| `filename` | string | ✅ Yes   | Name of the file to inspect |
| `folder`   | string | ❌ No    | Folder containing the file: `"IMAGES"`, `"VIDEOS"`, `"root"` (auto-detected if not specified) |

#### Example

```json
{
  "filename": "logo.png",
  "folder": "IMAGES"
}
```

#### Response

```json
{
  "content": [{
    "type": "text",
    "text": "{\n  \"name\": \"logo.png\",\n  \"size\": 24576,\n  \"sizeHuman\": \"24 KB\",\n  \"mimeType\": \"image/png\",\n  \"created\": \"2025-01-15T10:30:00.000Z\",\n  \"modified\": \"2025-01-15T14:22:00.000Z\",\n  \"isDirectory\": false\n}"
  }]
}
```

---

### create_directory

Create a custom subdirectory in BRANDYFICATION.

#### Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `dirname` | string | ✅ Yes   | Name of the directory to create |

#### Example

```json
{
  "dirname": "archive"
}
```

#### Response

```json
{
  "content": [{ "type": "text", "text": "Directory \"archive\" created successfully in BRANDYFICATION/" }]
}
```

---

## Resources

Files in BRANDYFICATION storage are also exposed as MCP resources.

### Listing Resources

The server responds to `resources/list` requests with all files:

```json
{
  "resources": [
    {
      "uri": "file:///path/to/BRANDYFICATION/config.json",
      "name": "config.json",
      "mimeType": "application/json"
    },
    {
      "uri": "file:///path/to/BRANDYFICATION/IMAGES/logo.png",
      "name": "IMAGES/logo.png",
      "mimeType": "image/png"
    },
    {
      "uri": "file:///path/to/BRANDYFICATION/VIDEOS/intro.mp4",
      "name": "VIDEOS/intro.mp4",
      "mimeType": "video/mp4"
    }
  ]
}
```

### Supported MIME Types

| Extension | MIME Type |
|-----------|-----------|
| `.png` | `image/png` |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.gif` | `image/gif` |
| `.bmp` | `image/bmp` |
| `.webp` | `image/webp` |
| `.svg` | `image/svg+xml` |
| `.ico` | `image/x-icon` |
| `.tiff`, `.tif` | `image/tiff` |
| `.avif` | `image/avif` |
| `.heic` | `image/heic` |
| `.heif` | `image/heif` |
| `.psd` | `image/vnd.adobe.photoshop` |
| `.mp4` | `video/mp4` |
| `.txt` | `text/plain` |
| `.json` | `application/json` |
| `.md` | `text/markdown` |
| (other) | `application/octet-stream` |

---

## Error Handling

All tools return errors in a consistent format:

```json
{
  "content": [{ "type": "text", "text": "Error: Description of what went wrong" }],
  "isError": true
}
```

### Common Errors

| Error | Description |
|-------|-------------|
| File not found | The specified file does not exist |
| Invalid format | File extension not supported for the operation |
| Permission denied | Cannot read/write to storage directory |
| Unknown tool | The requested tool name is not recognized |
