#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs/promises";
import * as path from "path";

// Configuration
const STORAGE_DIR = process.env.STORAGE_DIR || "./BRANDYFICATION";
const IMAGES_DIR = path.join(STORAGE_DIR, "IMAGES");
const VIDEOS_DIR = path.join(STORAGE_DIR, "VIDEOS");

// Supported file extensions
const IMAGE_EXTENSIONS = [
  ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".svg", 
  ".ico", ".tiff", ".tif", ".avif", ".heic", ".heif", ".raw",
  ".psd", ".ai", ".eps", ".pcx", ".tga", ".exr", ".hdr"
];

const VIDEO_EXTENSIONS = [".mp4", ".gif"];

// Ensure storage directories exist
async function ensureStorageDir(): Promise<void> {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  await fs.mkdir(VIDEOS_DIR, { recursive: true });
}

// Determine target folder based on file extension
function getTargetFolder(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) {
    return IMAGES_DIR;
  }
  if (VIDEO_EXTENSIONS.includes(ext)) {
    return VIDEOS_DIR;
  }
  return STORAGE_DIR;
}

// Helper to get safe file path (prevent directory traversal)
function getSafePath(filename: string, folder?: string): string {
  const safeName = path.basename(filename);
  const targetFolder = folder || getTargetFolder(filename);
  return path.join(targetFolder, safeName);
}

// Create the MCP server
const server = new Server(
  {
    name: "filehosting-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "upload_image",
        description: "Upload an image file to BRANDYFICATION/IMAGES. Supports: PNG, JPG, JPEG, GIF, BMP, WEBP, SVG, ICO, TIFF, AVIF, HEIC, RAW, PSD, AI, EPS, PCX, TGA, EXR, HDR",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the image file (with extension)",
            },
            content: {
              type: "string",
              description: "Base64 encoded image content",
            },
          },
          required: ["filename", "content"],
        },
      },
      {
        name: "upload_video",
        description: "Upload a video file to BRANDYFICATION/VIDEOS. Supports: MP4, GIF",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the video file (with extension)",
            },
            content: {
              type: "string",
              description: "Base64 encoded video content",
            },
          },
          required: ["filename", "content"],
        },
      },
      {
        name: "upload_file",
        description: "Upload a file to BRANDYFICATION. Auto-routes to IMAGES or VIDEOS subfolder based on extension.",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to upload",
            },
            content: {
              type: "string",
              description: "Content of the file (base64 for binary, plain text otherwise)",
            },
            encoding: {
              type: "string",
              enum: ["base64", "utf8"],
              description: "Encoding of the content (default: utf8)",
            },
          },
          required: ["filename", "content"],
        },
      },
      {
        name: "download_file",
        description: "Download/read a file from BRANDYFICATION storage",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to download",
            },
            folder: {
              type: "string",
              enum: ["IMAGES", "VIDEOS", "root"],
              description: "Folder to download from (auto-detected if not specified)",
            },
            encoding: {
              type: "string",
              enum: ["base64", "utf8"],
              description: "Encoding for the response (default: base64 for images/videos)",
            },
          },
          required: ["filename"],
        },
      },
      {
        name: "list_files",
        description: "List all files in BRANDYFICATION storage (all folders)",
        inputSchema: {
          type: "object",
          properties: {
            folder: {
              type: "string",
              enum: ["IMAGES", "VIDEOS", "root", "all"],
              description: "Which folder to list (default: all)",
            },
          },
        },
      },
      {
        name: "list_images",
        description: "List all images in BRANDYFICATION/IMAGES",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "list_videos",
        description: "List all videos in BRANDYFICATION/VIDEOS",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "delete_file",
        description: "Delete a file from BRANDYFICATION storage",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to delete",
            },
            folder: {
              type: "string",
              enum: ["IMAGES", "VIDEOS", "root"],
              description: "Folder containing the file (auto-detected if not specified)",
            },
          },
          required: ["filename"],
        },
      },
      {
        name: "get_file_info",
        description: "Get information about a file (size, MIME type, modified date, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            filename: {
              type: "string",
              description: "Name of the file to get info for",
            },
            folder: {
              type: "string",
              enum: ["IMAGES", "VIDEOS", "root"],
              description: "Folder containing the file (auto-detected if not specified)",
            },
          },
          required: ["filename"],
        },
      },
      {
        name: "create_directory",
        description: "Create a subdirectory in BRANDYFICATION",
        inputSchema: {
          type: "object",
          properties: {
            dirname: {
              type: "string",
              description: "Name of the directory to create",
            },
          },
          required: ["dirname"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  await ensureStorageDir();

  switch (name) {
    case "upload_image": {
      const { filename, content } = args as {
        filename: string;
        content: string;
      };

      const ext = path.extname(filename).toLowerCase();
      if (!IMAGE_EXTENSIONS.includes(ext)) {
        return {
          content: [{ type: "text", text: `Error: "${ext}" is not a supported image format. Supported: ${IMAGE_EXTENSIONS.join(", ")}` }],
          isError: true,
        };
      }

      const filePath = getSafePath(filename, IMAGES_DIR);
      const buffer = Buffer.from(content, "base64");
      await fs.writeFile(filePath, buffer);

      return {
        content: [{ type: "text", text: `Image "${filename}" uploaded to BRANDYFICATION/IMAGES/` }],
      };
    }

    case "upload_video": {
      const { filename, content } = args as {
        filename: string;
        content: string;
      };

      const ext = path.extname(filename).toLowerCase();
      if (!VIDEO_EXTENSIONS.includes(ext)) {
        return {
          content: [{ type: "text", text: `Error: "${ext}" is not a supported video format. Supported: ${VIDEO_EXTENSIONS.join(", ")}` }],
          isError: true,
        };
      }

      const filePath = getSafePath(filename, VIDEOS_DIR);
      const buffer = Buffer.from(content, "base64");
      await fs.writeFile(filePath, buffer);

      return {
        content: [{ type: "text", text: `Video "${filename}" uploaded to BRANDYFICATION/VIDEOS/` }],
      };
    }

    case "upload_file": {
      const { filename, content, encoding = "utf8" } = args as {
        filename: string;
        content: string;
        encoding?: "base64" | "utf8";
      };

      const filePath = getSafePath(filename);
      const targetFolder = getTargetFolder(filename);
      const folderName = targetFolder === IMAGES_DIR ? "IMAGES" : targetFolder === VIDEOS_DIR ? "VIDEOS" : "root";
      
      if (encoding === "base64") {
        const buffer = Buffer.from(content, "base64");
        await fs.writeFile(filePath, buffer);
      } else {
        await fs.writeFile(filePath, content, "utf8");
      }

      return {
        content: [{ type: "text", text: `File "${filename}" uploaded to BRANDYFICATION/${folderName}/` }],
      };
    }

    case "download_file": {
      const { filename, folder, encoding } = args as {
        filename: string;
        folder?: "IMAGES" | "VIDEOS" | "root";
        encoding?: "base64" | "utf8";
      };

      let filePath: string;
      if (folder === "IMAGES") {
        filePath = path.join(IMAGES_DIR, path.basename(filename));
      } else if (folder === "VIDEOS") {
        filePath = path.join(VIDEOS_DIR, path.basename(filename));
      } else if (folder === "root") {
        filePath = path.join(STORAGE_DIR, path.basename(filename));
      } else {
        // Auto-detect based on extension
        filePath = getSafePath(filename);
      }

      // Determine default encoding based on file type
      const ext = path.extname(filename).toLowerCase();
      const isBinary = IMAGE_EXTENSIONS.includes(ext) || VIDEO_EXTENSIONS.includes(ext);
      const finalEncoding = encoding || (isBinary ? "base64" : "utf8");

      try {
        const content = await fs.readFile(filePath);
        const responseContent = finalEncoding === "base64"
          ? content.toString("base64")
          : content.toString("utf8");

        return {
          content: [{ type: "text", text: responseContent }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: File "${filename}" not found` }],
          isError: true,
        };
      }
    }

    case "list_files": {
      const { folder = "all" } = args as { folder?: "IMAGES" | "VIDEOS" | "root" | "all" };

      try {
        const result: { folder: string; files: { name: string; type: string }[] }[] = [];

        if (folder === "all" || folder === "root") {
          const rootFiles = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
          result.push({
            folder: "BRANDYFICATION",
            files: rootFiles.filter(f => f.isFile()).map(f => ({ name: f.name, type: "file" })),
          });
        }

        if (folder === "all" || folder === "IMAGES") {
          const imageFiles = await fs.readdir(IMAGES_DIR, { withFileTypes: true });
          result.push({
            folder: "BRANDYFICATION/IMAGES",
            files: imageFiles.filter(f => f.isFile()).map(f => ({ name: f.name, type: getMimeType(f.name) })),
          });
        }

        if (folder === "all" || folder === "VIDEOS") {
          const videoFiles = await fs.readdir(VIDEOS_DIR, { withFileTypes: true });
          result.push({
            folder: "BRANDYFICATION/VIDEOS",
            files: videoFiles.filter(f => f.isFile()).map(f => ({ name: f.name, type: getMimeType(f.name) })),
          });
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: "Storage directory is empty or does not exist" }],
        };
      }
    }

    case "list_images": {
      try {
        const files = await fs.readdir(IMAGES_DIR, { withFileTypes: true });
        const imageList = files.filter(f => f.isFile()).map(f => ({
          name: f.name,
          mimeType: getMimeType(f.name),
          path: `BRANDYFICATION/IMAGES/${f.name}`,
        }));

        return {
          content: [{ type: "text", text: JSON.stringify({ folder: "BRANDYFICATION/IMAGES", images: imageList }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ folder: "BRANDYFICATION/IMAGES", images: [] }, null, 2) }],
        };
      }
    }

    case "list_videos": {
      try {
        const files = await fs.readdir(VIDEOS_DIR, { withFileTypes: true });
        const videoList = files.filter(f => f.isFile()).map(f => ({
          name: f.name,
          mimeType: getMimeType(f.name),
          path: `BRANDYFICATION/VIDEOS/${f.name}`,
        }));

        return {
          content: [{ type: "text", text: JSON.stringify({ folder: "BRANDYFICATION/VIDEOS", videos: videoList }, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: JSON.stringify({ folder: "BRANDYFICATION/VIDEOS", videos: [] }, null, 2) }],
        };
      }
    }

    case "delete_file": {
      const { filename, folder } = args as { filename: string; folder?: "IMAGES" | "VIDEOS" | "root" };
      
      let filePath: string;
      if (folder === "IMAGES") {
        filePath = path.join(IMAGES_DIR, path.basename(filename));
      } else if (folder === "VIDEOS") {
        filePath = path.join(VIDEOS_DIR, path.basename(filename));
      } else if (folder === "root") {
        filePath = path.join(STORAGE_DIR, path.basename(filename));
      } else {
        filePath = getSafePath(filename);
      }

      try {
        await fs.unlink(filePath);
        return {
          content: [{ type: "text", text: `File "${filename}" deleted successfully` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: Could not delete "${filename}". File may not exist.` }],
          isError: true,
        };
      }
    }

    case "get_file_info": {
      const { filename, folder } = args as { filename: string; folder?: "IMAGES" | "VIDEOS" | "root" };
      
      let filePath: string;
      if (folder === "IMAGES") {
        filePath = path.join(IMAGES_DIR, path.basename(filename));
      } else if (folder === "VIDEOS") {
        filePath = path.join(VIDEOS_DIR, path.basename(filename));
      } else if (folder === "root") {
        filePath = path.join(STORAGE_DIR, path.basename(filename));
      } else {
        filePath = getSafePath(filename);
      }

      try {
        const stats = await fs.stat(filePath);
        const info = {
          name: filename,
          size: stats.size,
          sizeHuman: formatBytes(stats.size),
          mimeType: getMimeType(filename),
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          isDirectory: stats.isDirectory(),
        };

        return {
          content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: Could not get info for "${filename}". File may not exist.` }],
          isError: true,
        };
      }
    }

    case "create_directory": {
      const { dirname } = args as { dirname: string };
      const dirPath = path.join(STORAGE_DIR, path.basename(dirname));

      try {
        await fs.mkdir(dirPath, { recursive: true });
        return {
          content: [{ type: "text", text: `Directory "${dirname}" created successfully in BRANDYFICATION/` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Error: Could not create directory "${dirname}"` }],
          isError: true,
        };
      }
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown tool: ${name}` }],
        isError: true,
      };
  }
});


// List resources (files as resources) - includes all folders
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  await ensureStorageDir();

  try {
    const resources: { uri: string; name: string; mimeType: string }[] = [];

    // Root files
    const rootFiles = await fs.readdir(STORAGE_DIR, { withFileTypes: true });
    for (const f of rootFiles.filter(f => f.isFile())) {
      resources.push({
        uri: `file://${path.resolve(STORAGE_DIR, f.name)}`,
        name: f.name,
        mimeType: getMimeType(f.name),
      });
    }

    // Image files
    const imageFiles = await fs.readdir(IMAGES_DIR, { withFileTypes: true });
    for (const f of imageFiles.filter(f => f.isFile())) {
      resources.push({
        uri: `file://${path.resolve(IMAGES_DIR, f.name)}`,
        name: `IMAGES/${f.name}`,
        mimeType: getMimeType(f.name),
      });
    }

    // Video files
    const videoFiles = await fs.readdir(VIDEOS_DIR, { withFileTypes: true });
    for (const f of videoFiles.filter(f => f.isFile())) {
      resources.push({
        uri: `file://${path.resolve(VIDEOS_DIR, f.name)}`,
        name: `VIDEOS/${f.name}`,
        mimeType: getMimeType(f.name),
      });
    }

    return { resources };
  } catch {
    return { resources: [] };
  }
});

// Read resource
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const filePath = uri.replace("file://", "");

  try {
    const content = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);
    const isText = mimeType.startsWith("text/") || mimeType === "application/json";

    return {
      contents: [
        {
          uri,
          mimeType,
          text: isText ? content.toString("utf8") : undefined,
          blob: !isText ? content.toString("base64") : undefined,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Could not read resource: ${uri}`);
  }
});

// Helper function to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Helper function to get MIME type - comprehensive image and video support
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Text/Document
    ".txt": "text/plain",
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".json": "application/json",
    ".xml": "application/xml",
    ".md": "text/markdown",
    ".pdf": "application/pdf",
    
    // Images - comprehensive support
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
    ".avif": "image/avif",
    ".heic": "image/heic",
    ".heif": "image/heif",
    ".raw": "image/raw",
    ".psd": "image/vnd.adobe.photoshop",
    ".ai": "application/illustrator",
    ".eps": "application/postscript",
    ".pcx": "image/x-pcx",
    ".tga": "image/x-tga",
    ".exr": "image/x-exr",
    ".hdr": "image/vnd.radiance",
    
    // Videos - MP4 and GIF support
    ".mp4": "video/mp4",
    // Note: .gif is in images but can also be animated
    
    // Audio
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    
    // Archives
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Start the server
async function main(): Promise<void> {
  await ensureStorageDir();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("BRANDYFICATION File Hosting MCP Server running on stdio");
  console.error(`Storage: ${path.resolve(STORAGE_DIR)}`);
  console.error(`  ├── IMAGES: ${path.resolve(IMAGES_DIR)}`);
  console.error(`  └── VIDEOS: ${path.resolve(VIDEOS_DIR)}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
