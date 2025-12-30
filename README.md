# BRANDYFICATION File Hosting MCP Server

A Model Context Protocol (MCP) server for file hosting with organized IMAGES and VIDEOS folders.

## Features

- **Organized Storage** - Auto-routes files to IMAGES or VIDEOS folders
- **Comprehensive Image Support** - PNG, JPG, GIF, BMP, WEBP, SVG, ICO, TIFF, AVIF, HEIC, RAW, PSD, AI, EPS, PCX, TGA, EXR, HDR
- **Video Support** - MP4 and GIF files
- **Upload/Download files** - Store and retrieve files with proper encoding
- **List files** - View files by folder (IMAGES, VIDEOS, or all)
- **Delete files** - Remove files from storage
- **Get file info** - View file metadata (size, MIME type, dates)

## Storage Structure

```text
BRANDYFICATION/
├── IMAGES/     # All image files
├── VIDEOS/     # MP4 and GIF video files
└── (other)     # Non-media files
```

## Installation

```bash
npm install
npm run build
```

## Usage

### Running the server

```bash
npm start
```

Or with a custom storage directory:

```bash
STORAGE_DIR=/path/to/BRANDYFICATION npm start
```

### MCP Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "brandyfication": {
      "command": "node",
      "args": ["path/to/dist/index.js"],
      "env": {
        "STORAGE_DIR": "/path/to/BRANDYFICATION"
      }
    }
  }
}
```

## Available Tools

### `upload_image`

Upload an image to BRANDYFICATION/IMAGES.

**Parameters:**

- `filename` (required): Name of the image file with extension
- `content` (required): Base64 encoded image content

### `upload_video`

Upload a video to BRANDYFICATION/VIDEOS.

**Parameters:**

- `filename` (required): Name of the video file (.mp4 or .gif)
- `content` (required): Base64 encoded video content

### `upload_file`

Upload any file (auto-routes to appropriate folder).

**Parameters:**

- `filename` (required): Name of the file
- `content` (required): File content
- `encoding` (optional): "utf8" (default) or "base64"

### `download_file`

Download a file from storage.

**Parameters:**

- `filename` (required): Name of the file
- `folder` (optional): "IMAGES", "VIDEOS", or "root"
- `encoding` (optional): "utf8" or "base64" (auto-detected)

### `list_files`

List files in storage.

**Parameters:**

- `folder` (optional): "IMAGES", "VIDEOS", "root", or "all" (default)

### `list_images`

List all images in BRANDYFICATION/IMAGES.

### `list_videos`

List all videos in BRANDYFICATION/VIDEOS.

### `delete_file`

Delete a file from storage.

**Parameters:**

- `filename` (required): Name of the file
- `folder` (optional): "IMAGES", "VIDEOS", or "root"

### `get_file_info`

Get metadata about a file.

**Parameters:**

- `filename` (required): Name of the file
- `folder` (optional): "IMAGES", "VIDEOS", or "root"

### `create_directory`

Create a subdirectory in BRANDYFICATION.

**Parameters:**

- `dirname` (required): Name of the directory

## Supported Formats

### Images (BRANDYFICATION/IMAGES)

| Format       | Extensions                                       |
| ------------ | ------------------------------------------------ |
| Common       | .png, .jpg, .jpeg, .gif, .bmp, .webp, .svg, .ico |
| Advanced     | .tiff, .tif, .avif, .heic, .heif, .raw           |
| Professional | .psd, .ai, .eps, .pcx, .tga, .exr, .hdr          |

### Videos (BRANDYFICATION/VIDEOS)

| Format | Extension |
| ------ | --------- |
| MP4    | .mp4      |
| GIF    | .gif      |

## Resources

Files are exposed as MCP resources with proper MIME types from all folders (root, IMAGES, VIDEOS).

## Security

- Directory traversal attacks are prevented by sanitizing filenames
- All files are stored within the BRANDYFICATION directory structure

## License

MIT
