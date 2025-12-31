#!/usr/bin/env node
/**
 * BRANDYFICATION HTTP Server
 * 
 * Express HTTP server for video streaming and file hosting.
 * Works alongside the MCP server to provide web-based access to BRANDYFICATION storage.
 * 
 * Features:
 * - Video streaming with HLS support
 * - Image gallery serving
 * - RTMP ingest (OBS streaming)
 * - RTSP stream management
 * - Download queue management
 * - React frontend
 */

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.HTTP_PORT || 6969;

// Storage paths
const STORAGE_DIR = process.env.STORAGE_DIR || path.join(__dirname, "..", "BRANDYFICATION");
const IMAGES_DIR = path.join(STORAGE_DIR, "IMAGES");
const VIDEOS_DIR = path.join(STORAGE_DIR, "VIDEOS");
const STREAMS_DIR = path.join(STORAGE_DIR, "streams");

// Video extensions
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".ogg", ".gif"];
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff", ".avif"];

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD QUEUE SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

const MAX_CONCURRENT_DOWNLOADS = 5;

interface DownloadSession {
  filename: string;
  startTime: Date;
  ip: string;
}

interface QueuedDownload {
  sessionId: string;
  filename: string;
  ip: string;
  queuedAt: Date;
}

const downloadQueue = {
  active: new Map<string, DownloadSession>(),
  waiting: [] as QueuedDownload[],

  addToQueue(sessionId: string, filename: string, ip: string): { status: string; position: number } {
    if (this.active.size < MAX_CONCURRENT_DOWNLOADS) {
      this.active.set(sessionId, {
        filename,
        startTime: new Date(),
        ip,
      });
      return { status: "active", position: 0 };
    } else {
      const queueItem: QueuedDownload = { sessionId, filename, ip, queuedAt: new Date() };
      this.waiting.push(queueItem);
      return { status: "queued", position: this.waiting.length };
    }
  },

  removeFromActive(sessionId: string): void {
    this.active.delete(sessionId);
    this.processQueue();
  },

  processQueue(): void {
    while (this.active.size < MAX_CONCURRENT_DOWNLOADS && this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      this.active.set(next.sessionId, {
        filename: next.filename,
        startTime: new Date(),
        ip: next.ip,
      });
    }
  },

  getStatus() {
    return {
      active: Array.from(this.active.entries()).map(([sessionId, data]) => ({
        sessionId: sessionId.substring(0, 8) + "...",
        filename: data.filename,
        duration: Math.floor((Date.now() - data.startTime.getTime()) / 1000),
        ip: data.ip,
      })),
      waiting: this.waiting.map((item, index) => ({
        position: index + 1,
        sessionId: item.sessionId.substring(0, 8) + "...",
        filename: item.filename,
        waitTime: Math.floor((Date.now() - item.queuedAt.getTime()) / 1000),
      })),
      stats: {
        activeCount: this.active.size,
        waitingCount: this.waiting.length,
        maxConcurrent: MAX_CONCURRENT_DOWNLOADS,
      },
    };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWING QUEUE SYSTEM (TICKET-BASED)
// ═══════════════════════════════════════════════════════════════════════════════

const CONCURRENT_VIEWERS = 3;
const BASE_WAIT_TIME = 2;
const PER_USER_DELAY = 1;
const MIN_WAIT_TIME = 1;

interface ActiveViewer {
  ip: string;
  joinedAt: Date;
  expiresAt: Date;
}

interface WaitingTicket {
  ticketId: string;
  ip: string;
  queuedAt: Date;
  position: number;
  estimatedWait: number;
}

const viewingQueue = {
  active: new Map<string, ActiveViewer>(),
  waiting: [] as WaitingTicket[],
  ticketCounter: 1000,

  generateTicket(ip: string) {
    const ticketId = `TICKET-${this.ticketCounter++}-${Date.now()}`;
    const position = this.waiting.length + 1;
    const estimatedWait = Math.max(MIN_WAIT_TIME, BASE_WAIT_TIME + this.waiting.length * PER_USER_DELAY);

    if (this.active.size < CONCURRENT_VIEWERS) {
      this.active.set(ticketId, {
        ip,
        joinedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min session
      });
      return { status: "granted", ticketId, position: 0, waitTime: 0 };
    } else {
      const ticket: WaitingTicket = { ticketId, ip, queuedAt: new Date(), position, estimatedWait };
      this.waiting.push(ticket);
      return { status: "queued", ticketId, position, waitTime: estimatedWait };
    }
  },

  checkTicket(ticketId: string) {
    if (this.active.has(ticketId)) {
      const viewer = this.active.get(ticketId)!;
      const remaining = Math.floor((viewer.expiresAt.getTime() - Date.now()) / 1000);
      return { status: "active", ticketId, remainingTime: remaining };
    }

    const waitingIndex = this.waiting.findIndex((t) => t.ticketId === ticketId);
    if (waitingIndex !== -1) {
      const position = waitingIndex + 1;
      const estimatedWait = Math.max(MIN_WAIT_TIME, BASE_WAIT_TIME + waitingIndex * PER_USER_DELAY);
      return { status: "queued", ticketId, position, waitTime: estimatedWait };
    }

    return { status: "expired", ticketId };
  },

  processQueue(): void {
    const now = new Date();
    for (const [ticketId, viewer] of this.active.entries()) {
      if (viewer.expiresAt < now) {
        this.active.delete(ticketId);
        console.log(`⏱️ Viewer expired: ${ticketId}`);
      }
    }

    while (this.active.size < CONCURRENT_VIEWERS && this.waiting.length > 0) {
      const next = this.waiting.shift()!;
      this.active.set(next.ticketId, {
        ip: next.ip,
        joinedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      });
      console.log(`✅ Viewer granted access: ${next.ticketId}`);
    }
  },

  getQueueStatus() {
    return {
      active: this.active.size,
      waiting: this.waiting.length,
      maxConcurrent: CONCURRENT_VIEWERS,
      waitingTickets: this.waiting.map((t, i) => ({
        position: i + 1,
        ticketId: t.ticketId.substring(0, 15) + "...",
        estimatedWait: Math.max(MIN_WAIT_TIME, BASE_WAIT_TIME + i * PER_USER_DELAY),
      })),
    };
  },
};

// Process queue every 5 seconds
setInterval(() => viewingQueue.processQueue(), 5000);

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function getVideoFiles(): { filename: string; location: string }[] {
  const videos: { filename: string; location: string }[] = [];

  try {
    // Scan root BRANDYFICATION folder
    if (fs.existsSync(STORAGE_DIR)) {
      const rootFiles = fs.readdirSync(STORAGE_DIR);
      rootFiles.forEach((file) => {
        const filePath = path.join(STORAGE_DIR, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile() && VIDEO_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext))) {
          videos.push({ filename: file, location: "root" });
        }
      });
    }

    // Scan VIDEOS subfolder
    if (fs.existsSync(VIDEOS_DIR)) {
      const videoFiles = fs.readdirSync(VIDEOS_DIR);
      videoFiles.forEach((file) => {
        if (VIDEO_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext))) {
          videos.push({ filename: file, location: "VIDEOS" });
        }
      });
    }
  } catch (error) {
    console.error("Error reading video directories:", error);
  }

  return videos;
}

function getImageFiles(): string[] {
  try {
    if (!fs.existsSync(IMAGES_DIR)) {
      return [];
    }
    const files = fs.readdirSync(IMAGES_DIR);
    return files.filter((file) => IMAGE_EXTENSIONS.some((ext) => file.toLowerCase().endsWith(ext)));
  } catch (error) {
    console.error("Error reading Images directory:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════════════════

app.use(cors());
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "..", "public")));

// Serve media from BRANDYFICATION subfolders
app.use("/streams", express.static(STREAMS_DIR));
app.use("/images", express.static(IMAGES_DIR));
app.use("/videos-dir", express.static(VIDEOS_DIR));

// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// List videos
app.get("/api/videos", (req: Request, res: Response) => {
  try {
    const videos = getVideoFiles();
    const videosWithSize = videos.map((videoInfo) => {
      try {
        const filePath = videoInfo.location === "root"
          ? path.join(STORAGE_DIR, videoInfo.filename)
          : path.join(VIDEOS_DIR, videoInfo.filename);
        const stats = fs.statSync(filePath);
        return {
          filename: videoInfo.filename,
          location: videoInfo.location,
          size: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
        };
      } catch {
        return {
          filename: videoInfo.filename,
          location: videoInfo.location,
          size: 0,
          sizeMB: "0.00",
        };
      }
    });

    res.json({ videos: videosWithSize, count: videosWithSize.length });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// List images
app.get("/api/images", (req: Request, res: Response) => {
  try {
    const images = getImageFiles();
    const imagesWithSize = images.map((filename) => {
      try {
        const filePath = path.join(IMAGES_DIR, filename);
        const stats = fs.statSync(filePath);
        return {
          filename,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          url: `/images/${filename}`,
        };
      } catch {
        return {
          filename,
          size: 0,
          sizeKB: "0.00",
          url: `/images/${filename}`,
        };
      }
    });

    res.json({ images: imagesWithSize, count: imagesWithSize.length });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Failed to fetch images" });
  }
});

// Queue endpoints
app.post("/api/queue/join", (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || "unknown";
    const result = viewingQueue.generateTicket(clientIp);
    console.log(`🎫 New ticket issued: ${result.ticketId} - Status: ${result.status}`);
    res.json(result);
  } catch (error) {
    console.error("Error joining queue:", error);
    res.status(500).json({ error: "Failed to join queue" });
  }
});

app.get("/api/queue/check/:ticketId", (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const result = viewingQueue.checkTicket(ticketId);
    res.json(result);
  } catch (error) {
    console.error("Error checking ticket:", error);
    res.status(500).json({ error: "Failed to check ticket" });
  }
});

app.get("/api/queue/status", (req: Request, res: Response) => {
  try {
    const status = viewingQueue.getQueueStatus();
    res.json(status);
  } catch (error) {
    console.error("Error fetching queue status:", error);
    res.status(500).json({ error: "Failed to fetch queue status" });
  }
});

// Download status
app.get("/api/download-status", (req: Request, res: Response) => {
  try {
    const status = downloadQueue.getStatus();
    res.json(status);
  } catch (error) {
    console.error("Error fetching download status:", error);
    res.status(500).json({ error: "Failed to fetch download status" });
  }
});

// Video streaming with ticket validation
app.get("/videos/:filename", (req: Request, res: Response) => {
  const { filename } = req.params;

  // Check ticket
  const ticketId = req.query.ticket as string;
  if (!ticketId) {
    return res.status(403).json({ error: "Access denied", message: "Valid ticket required" });
  }

  const ticketStatus = viewingQueue.checkTicket(ticketId);
  if (ticketStatus.status !== "active") {
    return res.status(403).json({
      error: "Access denied",
      message: ticketStatus.status === "queued"
        ? `Please wait in queue. Position: ${(ticketStatus as any).position}`
        : "Ticket expired or invalid",
    });
  }

  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return res.status(400).json({ error: "Invalid filename" });
  }

  // Find video file
  let videoPath = path.join(STORAGE_DIR, filename);
  if (!fs.existsSync(videoPath)) {
    videoPath = path.join(VIDEOS_DIR, filename);
  }
  
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not found" });
  }

  // Generate session ID
  const sessionId = `${req.ip}-${filename}-${Date.now()}`;
  const clientIp = req.ip || req.socket.remoteAddress || "unknown";

  // Add to queue
  const queueStatus = downloadQueue.addToQueue(sessionId, filename, clientIp);

  if (queueStatus.status === "queued") {
    return res.status(503).json({
      error: "Download queue full",
      message: `You are in queue position ${queueStatus.position}`,
      position: queueStatus.position,
      queueStatus: downloadQueue.getStatus(),
    });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Cleanup on finish
  const cleanupDownload = () => {
    downloadQueue.removeFromActive(sessionId);
    console.log(`📤 Download completed/closed: ${filename}`);
  };

  res.on("finish", cleanupDownload);
  res.on("close", cleanupDownload);
  res.on("error", cleanupDownload);

  console.log(`📥 Download started: ${filename} - Active: ${downloadQueue.active.size}/${MAX_CONCURRENT_DOWNLOADS}`);

  if (range) {
    // Range request for seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Full file
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Cache-Control": "public, max-age=3600",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Serve React app for all other routes
app.get("*", (req: Request, res: Response) => {
  const indexPath = path.join(__dirname, "..", "public", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Frontend not found. Run from project root." });
  }
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SERVER STARTUP
// ═══════════════════════════════════════════════════════════════════════════════

export function startHttpServer(): void {
  // Ensure directories exist
  [STORAGE_DIR, IMAGES_DIR, VIDEOS_DIR, STREAMS_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  app.listen(PORT, () => {
    console.log(`🌸 BRANDYFICATION HTTP Server running on http://localhost:${PORT}`);
    console.log(`📁 Storage: ${STORAGE_DIR}`);
    console.log(`  ├── IMAGES: ${IMAGES_DIR}`);
    console.log(`  └── VIDEOS: ${VIDEOS_DIR}`);
    
    const videos = getVideoFiles();
    console.log(`📺 Available videos (${videos.length}):`);
    videos.forEach((v) => {
      console.log(`   📹 ${v.location === "root" ? "" : v.location + "/"}${v.filename}`);
    });
  });
}

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down HTTP server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Received SIGTERM...");
  process.exit(0);
});

// Start server if run directly
const isMainModule = process.argv[1]?.includes("http-server");
if (isMainModule) {
  startHttpServer();
}

export default app;
