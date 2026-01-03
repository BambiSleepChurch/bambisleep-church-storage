/**
 * ES2024 File Host Server for XTTS v2 Coqui & Flux1 Generated Content
 * Provides URL endpoints with descriptive filenames based on generation prompts
 * Supports VastAI hosted instances for TTS and image generation
 *
 * Configuration loaded from: .env > config.json > system defaults
 */

import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import { existsSync, createReadStream, readFileSync } from "node:fs";

// ============================================================================
// LOAD .env FILE
// ============================================================================

const ENV_PATH = path.join(path.resolve(import.meta.dirname), ".env");

const loadEnvFile = () => {
  try {
    if (existsSync(ENV_PATH)) {
      const content = readFileSync(ENV_PATH, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
      console.log(`📋 Loaded environment from ${ENV_PATH}`);
    }
  } catch (error) {
    console.warn(`⚠️ Could not load .env file: ${error.message}`);
  }
};

loadEnvFile();

// ============================================================================
// CONFIGURATION LOADER - Priority: ENV > config.json > system defaults
// ============================================================================

const BASE_DIR = path.resolve(import.meta.dirname, "..");
const CONFIG_PATH = path.join(BASE_DIR, "server", "config.json");

/**
 * Load config from JSON file if exists
 */
const loadConfigFile = () => {
  try {
    if (existsSync(CONFIG_PATH)) {
      const data = readFileSync(CONFIG_PATH, "utf-8");
      console.log(`📋 Loaded config from ${CONFIG_PATH}`);
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn(`⚠️ Could not load config file: ${error.message}`);
  }
  return {};
};

/**
 * Get system information for smart defaults
 */
const getSystemInfo = () => {
  const totalMemMB = Math.floor(os.totalmem() / 1024 / 1024);
  const cpuCount = os.cpus().length;
  const platform = os.platform();
  const hostname = os.hostname();
  const networkInterfaces = os.networkInterfaces();

  // Find first non-internal IPv4 address
  let externalIp = null;
  for (const iface of Object.values(networkInterfaces)) {
    for (const addr of iface ?? []) {
      if (addr.family === "IPv4" && !addr.internal) {
        externalIp = addr.address;
        break;
      }
    }
    if (externalIp) break;
  }

  return {
    totalMemMB,
    cpuCount,
    platform,
    hostname,
    externalIp,
    // Calculate reasonable defaults based on system
    maxUploadSize: Math.min(totalMemMB * 0.25, 2048) * 1024 * 1024, // 25% of RAM, max 2GB
    timeout: cpuCount >= 8 ? 180000 : 120000, // More cores = allow longer timeout
  };
};

/**
 * Find an available port starting from a base port
 */
const findAvailablePort = async (startPort = 3000, maxAttempts = 100) => {
  const net = await import("node:net");

  for (let port = startPort; port < startPort + maxAttempts; port++) {
    const available = await new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close();
        resolve(true);
      });
      server.listen(port, "0.0.0.0");
    });
    if (available) return port;
  }
  throw new Error(
    `No available port found between ${startPort} and ${
      startPort + maxAttempts
    }`
  );
};

/**
 * Get preferred port based on system - uses random high port by default
 */
const getPreferredPort = () => {
  // Check environment/config first
  const envPort = process.env.PORT;
  if (envPort && envPort.trim() !== "") {
    return parseInt(envPort, 10);
  }

  const configPort = fileConfig?.port;
  if (configPort) {
    return typeof configPort === "number"
      ? configPort
      : parseInt(configPort, 10);
  }

  // Auto-assign random high port (49152-65535 is IANA dynamic/private range)
  const minPort = 49152;
  const maxPort = 65535;
  const randomPort =
    minPort + Math.floor(Math.random() * (maxPort - minPort + 1));
  return randomPort;
};

const fileConfig = loadConfigFile();
const systemInfo = getSystemInfo();

/**
 * Get config value with priority: ENV > config.json > default
 */
const getConfig = (envKey, configKey, defaultValue) => {
  if (process.env[envKey] !== undefined) {
    return process.env[envKey];
  }
  if (fileConfig[configKey] !== undefined) {
    return fileConfig[configKey];
  }
  return defaultValue;
};

const getConfigInt = (envKey, configKey, defaultValue) => {
  const val = getConfig(envKey, configKey, defaultValue);
  return typeof val === "number" ? val : parseInt(val, 10);
};

const getConfigBool = (envKey, configKey, defaultValue) => {
  const val = getConfig(envKey, configKey, defaultValue);
  if (typeof val === "boolean") return val;
  return val === "true" || val === "1";
};

const getConfigArray = (envKey, configKey, defaultValue) => {
  const val = getConfig(envKey, configKey, defaultValue);
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim());
  return defaultValue;
};

// ============================================================================
// CONFIGURATION OBJECT
// ============================================================================

const CONFIG = {
  // Server - port will be resolved at startup
  port: null, // Auto-assigned
  preferredPort: getPreferredPort(),
  host: getConfig("HOST", "host", "0.0.0.0"),
  baseDir: getConfig("BASE_DIR", "baseDir", BASE_DIR),
  publicUrl: getConfig("PUBLIC_URL", "publicUrl", null), // Auto-detected if null

  // Limits
  maxUploadSize: getConfigInt(
    "MAX_UPLOAD_SIZE",
    "maxUploadSize",
    systemInfo.maxUploadSize
  ),
  maxFilenameLength: getConfigInt(
    "MAX_FILENAME_LENGTH",
    "maxFilenameLength",
    64
  ),

  // CORS
  allowedOrigins: getConfigArray("ALLOWED_ORIGINS", "allowedOrigins", ["*"]),

  // VastAI endpoints
  vastai: {
    xttsEndpoint: getConfig("VASTAI_XTTS_URL", "vastai.xttsEndpoint", null),
    flux1Endpoint: getConfig("VASTAI_FLUX1_URL", "vastai.flux1Endpoint", null),
    timeout: getConfigInt(
      "VASTAI_TIMEOUT",
      "vastai.timeout",
      systemInfo.timeout
    ),
  },

  // Generation defaults (overridable per-request)
  defaults: {
    xtts: {
      voice: getConfig(
        "XTTS_DEFAULT_VOICE",
        "defaults.xtts.voice",
        "AUDIOS/Bambi-DASIT.mp3"
      ),
      language: getConfig(
        "XTTS_DEFAULT_LANGUAGE",
        "defaults.xtts.language",
        "en"
      ),
      speed: parseFloat(
        getConfig("XTTS_DEFAULT_SPEED", "defaults.xtts.speed", "1.0")
      ),
      outputFormat: getConfig(
        "XTTS_OUTPUT_FORMAT",
        "defaults.xtts.outputFormat",
        "mp3"
      ),
    },
    flux1: {
      width: getConfigInt("FLUX1_DEFAULT_WIDTH", "defaults.flux1.width", 1024),
      height: getConfigInt(
        "FLUX1_DEFAULT_HEIGHT",
        "defaults.flux1.height",
        1024
      ),
      steps: getConfigInt("FLUX1_DEFAULT_STEPS", "defaults.flux1.steps", 4),
    },
  },

  // System info (read-only)
  system: systemInfo,
};

const MIME_TYPES = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".json": "application/json",
  ".txt": "text/plain",
};

const CONTENT_DIRS = {
  audio: getConfig("DIR_AUDIO", "dirs.audio", "AUDIOS"),
  image: getConfig("DIR_IMAGE", "dirs.image", "IMAGES"),
  video: getConfig("DIR_VIDEO", "dirs.video", "VIDEOS"),
};

// In-memory metadata store (persisted to disk)
let fileRegistry = new Map();
const REGISTRY_PATH = path.join(CONFIG.baseDir, "server", "registry.json");

/**
 * Sanitize prompt text into a valid filename
 */
const sanitizeFilename = (prompt, maxLength = CONFIG.maxFilenameLength) => {
  return (
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, maxLength)
      .replace(/^-|-$/g, "") || "unnamed"
  );
};

/**
 * Generate unique file ID
 */
const generateFileId = () => crypto.randomBytes(8).toString("hex");

/**
 * Get timestamp string for filenames
 */
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
};

/**
 * Load registry from disk
 */
const loadRegistry = async () => {
  try {
    if (existsSync(REGISTRY_PATH)) {
      const data = await fs.readFile(REGISTRY_PATH, "utf-8");
      fileRegistry = new Map(Object.entries(JSON.parse(data)));
      console.log(`📁 Loaded ${fileRegistry.size} files from registry`);
    }
  } catch (error) {
    console.warn("⚠️ Could not load registry:", error.message);
  }
};

/**
 * Save registry to disk
 */
const saveRegistry = async () => {
  try {
    await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
    await fs.writeFile(
      REGISTRY_PATH,
      JSON.stringify(Object.fromEntries(fileRegistry), null, 2)
    );
  } catch (error) {
    console.error("❌ Failed to save registry:", error.message);
  }
};

/**
 * Parse multipart form data
 */
const parseMultipart = async (req) => {
  const contentType = req.headers["content-type"] ?? "";
  const boundary = contentType.split("boundary=")[1];

  if (!boundary) {
    throw new Error("Missing boundary in multipart form");
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const parts = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length + 2;

  while (start < buffer.length) {
    const end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;

    const part = buffer.subarray(start, end - 2);
    const headerEnd = part.indexOf("\r\n\r\n");
    const headers = part.subarray(0, headerEnd).toString();
    const content = part.subarray(headerEnd + 4);

    const nameMatch = headers.match(/name="([^"]+)"/);
    const filenameMatch = headers.match(/filename="([^"]+)"/);

    if (nameMatch) {
      const name = nameMatch[1];
      if (filenameMatch) {
        parts[name] = {
          filename: filenameMatch[1],
          data: content,
        };
      } else {
        parts[name] = content.toString();
      }
    }

    start = end + boundaryBuffer.length + 2;
  }

  return parts;
};

/**
 * Parse JSON body
 */
const parseJsonBody = async (req) => {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
};

/**
 * Send JSON response
 */
const sendJson = (res, data, status = 200) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data, null, 2));
};

/**
 * Send error response
 */
const sendError = (res, message, status = 400) => {
  sendJson(res, { error: message, success: false }, status);
};

/**
 * Resolve voice path - can be relative to baseDir or absolute
 */
const resolveVoicePath = (voice) => {
  if (!voice || voice === "default") {
    return CONFIG.defaults.xtts.voice;
  }
  // If it's an absolute path or URL, use as-is
  if (path.isAbsolute(voice) || voice.startsWith("http")) {
    return voice;
  }
  // Relative to baseDir
  return path.join(CONFIG.baseDir, voice);
};

/**
 * VastAI: Generate TTS audio via XTTS v2 Coqui endpoint
 * Always uses Bambi-DASIT.mp3 as voice reference and outputs MP3
 */
const vastaiGenerateXtts = async (
  text,
  voice = CONFIG.defaults.xtts.voice,
  language = CONFIG.defaults.xtts.language,
  speed = CONFIG.defaults.xtts.speed,
  outputFormat = CONFIG.defaults.xtts.outputFormat
) => {
  if (!CONFIG.vastai.xttsEndpoint) {
    throw new Error("VASTAI_XTTS_URL not configured");
  }

  const resolvedVoice = resolveVoicePath(voice);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.vastai.timeout);

  try {
    // Try different XTTS API formats
    let response;

    // Format 1: Standard XTTS API with speaker_wav path
    response = await fetch(`${CONFIG.vastai.xttsEndpoint}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        speaker_wav: resolvedVoice,
        language,
        speed,
        output_format: outputFormat,
      }),
      signal: controller.signal,
    });

    // Format 2: Try /tts_to_audio if first fails
    if (!response.ok && response.status === 404) {
      response = await fetch(`${CONFIG.vastai.xttsEndpoint}/tts_to_audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          speaker_wav: resolvedVoice,
          language,
          speed,
        }),
        signal: controller.signal,
      });
    }

    if (!response.ok) {
      throw new Error(
        `XTTS generation failed: ${response.status} ${response.statusText}`
      );
    }

    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      format: outputFormat,
    };
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * VastAI: Generate image via Flux1 Schnell endpoint (Gradio API)
 */
const vastaiGenerateFlux1 = async (
  prompt,
  seed = null,
  width = CONFIG.defaults.flux1.width,
  height = CONFIG.defaults.flux1.height,
  steps = CONFIG.defaults.flux1.steps
) => {
  if (!CONFIG.vastai.flux1Endpoint) {
    throw new Error("VASTAI_FLUX1_URL not configured");
  }

  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.vastai.timeout);

  try {
    const response = await fetch(`${CONFIG.vastai.flux1Endpoint}/api/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [prompt, actualSeed, true, width, height, steps],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Flux1 generation failed: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    // Handle different Gradio response formats
    if (result.data?.[0]?.startsWith?.("data:image")) {
      const base64 = result.data[0].split(",")[1];
      return { buffer: Buffer.from(base64, "base64"), seed: actualSeed };
    } else if (result.data?.[0]?.path) {
      const imageResponse = await fetch(
        `${CONFIG.vastai.flux1Endpoint}/file=${result.data[0].path}`
      );
      return {
        buffer: Buffer.from(await imageResponse.arrayBuffer()),
        seed: actualSeed,
      };
    } else if (result.data?.[0]?.url) {
      const imageResponse = await fetch(result.data[0].url);
      return {
        buffer: Buffer.from(await imageResponse.arrayBuffer()),
        seed: actualSeed,
      };
    }

    throw new Error("Unexpected Flux1 response format");
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * Handle VastAI XTTS generation request
 * Always uses Bambi-DASIT.mp3 voice and outputs MP3
 */
const handleVastaiXtts = async (req, res) => {
  try {
    const body = await parseJsonBody(req);
    const {
      text,
      prompt,
      voice = CONFIG.defaults.xtts.voice,
      language = CONFIG.defaults.xtts.language,
      speed = CONFIG.defaults.xtts.speed,
      format = CONFIG.defaults.xtts.outputFormat,
    } = body;

    const inputText = text ?? prompt;
    if (!inputText) {
      return sendError(res, "text or prompt is required");
    }

    const outputFormat = format === "wav" ? "wav" : "mp3"; // Default to MP3
    const voiceName = path.basename(voice, path.extname(voice));

    console.log(
      `🎵 VastAI XTTS: "${inputText.slice(
        0,
        50
      )}..." voice=${voiceName} format=${outputFormat}`
    );

    const { buffer: audioBuffer, format: actualFormat } =
      await vastaiGenerateXtts(inputText, voice, language, speed, outputFormat);

    // Save with prompt-based filename (MP3 by default)
    const fileId = generateFileId();
    const safeName = sanitizeFilename(inputText);
    const timestamp = getTimestamp();
    const ext = `.${actualFormat}`;
    const filename = `xtts-${safeName}-${voiceName}-${timestamp}${ext}`;

    const targetDir = path.join(CONFIG.baseDir, CONTENT_DIRS.audio);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, audioBuffer);

    const metadata = {
      id: fileId,
      filename,
      type: "audio",
      source: "vastai-xtts",
      prompt: inputText,
      voice: voiceName,
      voicePath: voice,
      language,
      speed,
      format: actualFormat,
      size: audioBuffer.length,
      createdAt: new Date().toISOString(),
      path: `/${CONTENT_DIRS.audio}/${filename}`,
    };

    fileRegistry.set(fileId, metadata);
    await saveRegistry();

    const baseUrl = `http://${req.headers.host}`;

    sendJson(res, {
      success: true,
      file: {
        id: fileId,
        filename,
        url: `${baseUrl}/files/${fileId}/${filename}`,
        directUrl: `${baseUrl}${metadata.path}`,
        downloadUrl: `${baseUrl}/download/${fileId}`,
        metadata,
      },
    });

    console.log(
      `✅ VastAI XTTS: ${filename} (${(audioBuffer.length / 1024).toFixed(
        1
      )}KB)`
    );
  } catch (error) {
    console.error("❌ VastAI XTTS Error:", error.message);
    sendError(res, error.message, 500);
  }
};

/**
 * Handle VastAI Flux1 generation request
 */
const handleVastaiFlux1 = async (req, res) => {
  try {
    const body = await parseJsonBody(req);
    const {
      prompt,
      seed,
      width = CONFIG.defaults.flux1.width,
      height = CONFIG.defaults.flux1.height,
      steps = CONFIG.defaults.flux1.steps,
    } = body;

    if (!prompt) {
      return sendError(res, "prompt is required");
    }

    console.log(
      `🖼️ VastAI Flux1: "${prompt.slice(0, 50)}..." ${width}x${height}`
    );

    const { buffer: imageBuffer, seed: actualSeed } = await vastaiGenerateFlux1(
      prompt,
      seed,
      width,
      height,
      steps
    );

    // Save with prompt-based filename
    const fileId = generateFileId();
    const safeName = sanitizeFilename(prompt);
    const timestamp = getTimestamp();
    const filename = `flux1-${safeName}-s${actualSeed}-${timestamp}.png`;

    const targetDir = path.join(CONFIG.baseDir, CONTENT_DIRS.image);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, imageBuffer);

    const metadata = {
      id: fileId,
      filename,
      type: "image",
      source: "vastai-flux1",
      prompt,
      seed: actualSeed,
      width,
      height,
      steps,
      size: imageBuffer.length,
      createdAt: new Date().toISOString(),
      path: `/${CONTENT_DIRS.image}/${filename}`,
    };

    fileRegistry.set(fileId, metadata);
    await saveRegistry();

    const baseUrl = `http://${req.headers.host}`;

    sendJson(res, {
      success: true,
      file: {
        id: fileId,
        filename,
        url: `${baseUrl}/files/${fileId}/${filename}`,
        directUrl: `${baseUrl}${metadata.path}`,
        downloadUrl: `${baseUrl}/download/${fileId}`,
        metadata,
      },
    });

    console.log(
      `✅ VastAI Flux1: ${filename} (${(imageBuffer.length / 1024).toFixed(
        1
      )}KB)`
    );
  } catch (error) {
    console.error("❌ VastAI Flux1 Error:", error.message);
    sendError(res, error.message, 500);
  }
};

/**
 * Handle file upload from XTTS v2 Coqui
 */
const handleXttsUpload = async (req, res) => {
  try {
    const parts = await parseMultipart(req);

    const prompt = parts.prompt ?? parts.text ?? "xtts-audio";
    const voice = parts.voice ?? CONFIG.defaults.xtts.voice;
    const file = parts.file ?? parts.audio;

    if (!file?.data) {
      return sendError(res, "No audio file provided");
    }

    const fileId = generateFileId();
    const safeName = sanitizeFilename(prompt);
    const timestamp = getTimestamp();
    const ext = path.extname(file.filename || ".wav") || ".wav";
    const filename = `xtts-${safeName}-${voice}-${timestamp}${ext}`;

    const targetDir = path.join(CONFIG.baseDir, CONTENT_DIRS.audio);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, file.data);

    const metadata = {
      id: fileId,
      filename,
      originalFilename: file.filename,
      type: "audio",
      source: "xtts-v2-coqui",
      prompt,
      voice,
      size: file.data.length,
      createdAt: new Date().toISOString(),
      path: `/${CONTENT_DIRS.audio}/${filename}`,
    };

    fileRegistry.set(fileId, metadata);
    await saveRegistry();

    const baseUrl = `http://${req.headers.host}`;

    sendJson(res, {
      success: true,
      file: {
        id: fileId,
        filename,
        url: `${baseUrl}/files/${fileId}/${filename}`,
        directUrl: `${baseUrl}${metadata.path}`,
        downloadUrl: `${baseUrl}/download/${fileId}`,
        metadata,
      },
    });

    console.log(
      `✅ XTTS Upload: ${filename} (${(file.data.length / 1024).toFixed(1)}KB)`
    );
  } catch (error) {
    console.error("❌ XTTS Upload Error:", error);
    sendError(res, error.message, 500);
  }
};

/**
 * Handle file upload from Flux1
 */
const handleFlux1Upload = async (req, res) => {
  try {
    const parts = await parseMultipart(req);

    const prompt = parts.prompt ?? "flux1-image";
    const seed = parts.seed ?? "random";
    const steps = parts.steps ?? String(CONFIG.defaults.flux1.steps);
    const file = parts.file ?? parts.image;

    if (!file?.data) {
      return sendError(res, "No image file provided");
    }

    const fileId = generateFileId();
    const safeName = sanitizeFilename(prompt);
    const timestamp = getTimestamp();
    const ext = path.extname(file.filename || ".png") || ".png";
    const filename = `flux1-${safeName}-s${seed}-${timestamp}${ext}`;

    const targetDir = path.join(CONFIG.baseDir, CONTENT_DIRS.image);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, file.data);

    const metadata = {
      id: fileId,
      filename,
      originalFilename: file.filename,
      type: "image",
      source: "flux1-schnell",
      prompt,
      seed,
      steps,
      size: file.data.length,
      createdAt: new Date().toISOString(),
      path: `/${CONTENT_DIRS.image}/${filename}`,
    };

    fileRegistry.set(fileId, metadata);
    await saveRegistry();

    const baseUrl = `http://${req.headers.host}`;

    sendJson(res, {
      success: true,
      file: {
        id: fileId,
        filename,
        url: `${baseUrl}/files/${fileId}/${filename}`,
        directUrl: `${baseUrl}${metadata.path}`,
        downloadUrl: `${baseUrl}/download/${fileId}`,
        thumbnailUrl: `${baseUrl}/thumb/${fileId}`,
        metadata,
      },
    });

    console.log(
      `✅ Flux1 Upload: ${filename} (${(file.data.length / 1024).toFixed(1)}KB)`
    );
  } catch (error) {
    console.error("❌ Flux1 Upload Error:", error);
    sendError(res, error.message, 500);
  }
};

/**
 * Handle generic file upload with prompt-based naming
 */
const handleGenericUpload = async (req, res) => {
  try {
    const parts = await parseMultipart(req);

    const prompt = parts.prompt ?? parts.name ?? "uploaded-file";
    const source = parts.source ?? "manual";
    const file = parts.file;

    if (!file?.data) {
      return sendError(res, "No file provided");
    }

    const fileId = generateFileId();
    const safeName = sanitizeFilename(prompt);
    const timestamp = getTimestamp();
    const ext = path.extname(file.filename || "");
    const filename = `${safeName}-${timestamp}${ext}`;

    // Determine content type from extension
    let contentDir = CONTENT_DIRS.video; // default
    if ([".mp3", ".wav", ".ogg", ".flac"].includes(ext.toLowerCase())) {
      contentDir = CONTENT_DIRS.audio;
    } else if (
      [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext.toLowerCase())
    ) {
      contentDir = CONTENT_DIRS.image;
    }

    const targetDir = path.join(CONFIG.baseDir, contentDir);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    await fs.writeFile(filePath, file.data);

    const metadata = {
      id: fileId,
      filename,
      originalFilename: file.filename,
      type: contentDir.toLowerCase().slice(0, -1),
      source,
      prompt,
      size: file.data.length,
      createdAt: new Date().toISOString(),
      path: `/${contentDir}/${filename}`,
    };

    fileRegistry.set(fileId, metadata);
    await saveRegistry();

    const baseUrl = `http://${req.headers.host}`;

    sendJson(res, {
      success: true,
      file: {
        id: fileId,
        filename,
        url: `${baseUrl}/files/${fileId}/${filename}`,
        directUrl: `${baseUrl}${metadata.path}`,
        downloadUrl: `${baseUrl}/download/${fileId}`,
        metadata,
      },
    });

    console.log(
      `✅ Upload: ${filename} (${(file.data.length / 1024).toFixed(1)}KB)`
    );
  } catch (error) {
    console.error("❌ Upload Error:", error);
    sendError(res, error.message, 500);
  }
};

/**
 * Serve static file
 */
const serveFile = async (
  res,
  filePath,
  download = false,
  customFilename = null
) => {
  try {
    if (!existsSync(filePath)) {
      sendError(res, "File not found", 404);
      return;
    }

    const stat = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";
    const filename = customFilename ?? path.basename(filePath);

    const headers = {
      "Content-Type": mimeType,
      "Content-Length": stat.size,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=31536000",
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    }

    res.writeHead(200, headers);
    createReadStream(filePath).pipe(res);
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

/**
 * List all files with optional filtering
 */
const handleListFiles = async (req, res, params) => {
  const type = params.get("type");
  const source = params.get("source");
  const search = params.get("search")?.toLowerCase();
  const limit = Math.min(parseInt(params.get("limit") ?? "100"), 1000);
  const offset = parseInt(params.get("offset") ?? "0");

  let files = Array.from(fileRegistry.values());

  if (type) {
    files = files.filter((f) => f.type === type);
  }
  if (source) {
    files = files.filter((f) => f.source === source);
  }
  if (search) {
    files = files.filter(
      (f) =>
        f.prompt?.toLowerCase().includes(search) ||
        f.filename.toLowerCase().includes(search)
    );
  }

  files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = files.length;
  files = files.slice(offset, offset + limit);

  const baseUrl = `http://${req.headers.host}`;

  sendJson(res, {
    success: true,
    total,
    offset,
    limit,
    files: files.map((f) => ({
      ...f,
      url: `${baseUrl}/files/${f.id}/${f.filename}`,
      directUrl: `${baseUrl}${f.path}`,
    })),
  });
};

/**
 * Generate URL from prompt (without uploading)
 */
const handleGenerateUrl = async (req, res) => {
  try {
    const body = await parseJsonBody(req);
    const {
      prompt,
      source = "generated",
      type = "audio",
      extension = ".wav",
    } = body;

    if (!prompt) {
      return sendError(res, "Prompt is required");
    }

    const fileId = generateFileId();
    const safeName = sanitizeFilename(prompt);
    const timestamp = getTimestamp();
    const filename = `${source}-${safeName}-${timestamp}${extension}`;

    const baseUrl = `http://${req.headers.host}`;

    sendJson(res, {
      success: true,
      generated: {
        id: fileId,
        filename,
        suggestedPath: `/${CONTENT_DIRS[type] ?? "VIDEOS"}/${filename}`,
        uploadUrl: `${baseUrl}/upload/${source}`,
        expectedUrl: `${baseUrl}/files/${fileId}/${filename}`,
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

/**
 * Main request router
 */
const handleRequest = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  console.log(`${method} ${pathname}`);

  // API Routes
  if (method === "POST") {
    // VastAI generation endpoints
    if (pathname === "/vastai/xtts" || pathname === "/generate/xtts") {
      return handleVastaiXtts(req, res);
    }
    if (pathname === "/vastai/flux1" || pathname === "/generate/flux1") {
      return handleVastaiFlux1(req, res);
    }

    if (pathname === "/upload/xtts" || pathname === "/api/xtts") {
      return handleXttsUpload(req, res);
    }
    if (pathname === "/upload/flux1" || pathname === "/api/flux1") {
      return handleFlux1Upload(req, res);
    }
    if (pathname === "/upload" || pathname === "/api/upload") {
      return handleGenericUpload(req, res);
    }
    if (pathname === "/api/generate-url") {
      return handleGenerateUrl(req, res);
    }
  }

  if (method === "GET") {
    // List files
    if (pathname === "/api/files" || pathname === "/files") {
      return handleListFiles(req, res, url.searchParams);
    }

    // Health check
    if (pathname === "/health" || pathname === "/api/health") {
      return sendJson(res, {
        status: "ok",
        files: fileRegistry.size,
        uptime: process.uptime(),
        system: {
          hostname: CONFIG.system.hostname,
          platform: CONFIG.system.platform,
          cpus: CONFIG.system.cpuCount,
          memoryMB: CONFIG.system.totalMemMB,
          externalIp: CONFIG.system.externalIp,
        },
        vastai: {
          xtts: CONFIG.vastai.xttsEndpoint ? "configured" : "not configured",
          flux1: CONFIG.vastai.flux1Endpoint ? "configured" : "not configured",
        },
      });
    }

    // Get current configuration (non-sensitive)
    if (pathname === "/config" || pathname === "/api/config") {
      return sendJson(res, {
        server: {
          port: CONFIG.port,
          host: CONFIG.host,
          publicUrl:
            CONFIG.publicUrl ??
            `http://${CONFIG.system.externalIp ?? "localhost"}:${CONFIG.port}`,
        },
        limits: {
          maxUploadSize: CONFIG.maxUploadSize,
          maxFilenameLength: CONFIG.maxFilenameLength,
        },
        directories: CONTENT_DIRS,
        defaults: CONFIG.defaults,
        vastai: {
          xttsEndpoint: CONFIG.vastai.xttsEndpoint ? "configured" : null,
          flux1Endpoint: CONFIG.vastai.flux1Endpoint ? "configured" : null,
          timeout: CONFIG.vastai.timeout,
        },
        system: CONFIG.system,
        configFile: existsSync(CONFIG_PATH) ? CONFIG_PATH : null,
      });
    }

    // VastAI status check
    if (pathname === "/vastai/status") {
      const status = { xtts: null, flux1: null };

      if (CONFIG.vastai.xttsEndpoint) {
        try {
          const res = await fetch(`${CONFIG.vastai.xttsEndpoint}/`, {
            method: "GET",
          });
          status.xtts = {
            endpoint: CONFIG.vastai.xttsEndpoint,
            status: res.ok ? "online" : "error",
          };
        } catch (e) {
          status.xtts = {
            endpoint: CONFIG.vastai.xttsEndpoint,
            status: "offline",
            error: e.message,
          };
        }
      }

      if (CONFIG.vastai.flux1Endpoint) {
        try {
          const res = await fetch(`${CONFIG.vastai.flux1Endpoint}/`, {
            method: "GET",
          });
          status.flux1 = {
            endpoint: CONFIG.vastai.flux1Endpoint,
            status: res.ok ? "online" : "error",
          };
        } catch (e) {
          status.flux1 = {
            endpoint: CONFIG.vastai.flux1Endpoint,
            status: "offline",
            error: e.message,
          };
        }
      }

      return sendJson(res, { success: true, vastai: status });
    }

    // Serve file by ID with custom filename
    const fileMatch = pathname.match(/^\/files\/([a-f0-9]+)\/(.+)$/);
    if (fileMatch) {
      const [, fileId, requestedFilename] = fileMatch;
      const metadata = fileRegistry.get(fileId);
      if (metadata) {
        const filePath = path.join(CONFIG.baseDir, metadata.path);
        return serveFile(res, filePath, false, requestedFilename);
      }
      return sendError(res, "File not found", 404);
    }

    // Download by ID
    const downloadMatch = pathname.match(/^\/download\/([a-f0-9]+)$/);
    if (downloadMatch) {
      const metadata = fileRegistry.get(downloadMatch[1]);
      if (metadata) {
        const filePath = path.join(CONFIG.baseDir, metadata.path);
        return serveFile(res, filePath, true, metadata.filename);
      }
      return sendError(res, "File not found", 404);
    }

    // Get file metadata
    const metaMatch = pathname.match(/^\/meta\/([a-f0-9]+)$/);
    if (metaMatch) {
      const metadata = fileRegistry.get(metaMatch[1]);
      if (metadata) {
        const baseUrl = `http://${req.headers.host}`;
        return sendJson(res, {
          success: true,
          metadata: {
            ...metadata,
            url: `${baseUrl}/files/${metadata.id}/${metadata.filename}`,
            directUrl: `${baseUrl}${metadata.path}`,
          },
        });
      }
      return sendError(res, "File not found", 404);
    }

    // Serve static files from content directories
    if (
      pathname.startsWith("/AUDIOS/") ||
      pathname.startsWith("/IMAGES/") ||
      pathname.startsWith("/VIDEOS/")
    ) {
      const filePath = path.join(CONFIG.baseDir, decodeURIComponent(pathname));
      return serveFile(res, filePath);
    }

    // API documentation / index
    if (pathname === "/" || pathname === "/api") {
      return sendJson(res, {
        name: "BRANDYFICATION File Host",
        version: "1.0.0",
        vastai: {
          xtts:
            CONFIG.vastai.xttsEndpoint ??
            "not configured (set VASTAI_XTTS_URL)",
          flux1:
            CONFIG.vastai.flux1Endpoint ??
            "not configured (set VASTAI_FLUX1_URL)",
        },
        endpoints: {
          "POST /vastai/xtts":
            "Generate TTS via VastAI XTTS (JSON: {text, voice?, language?, speed?})",
          "POST /vastai/flux1":
            "Generate image via VastAI Flux1 (JSON: {prompt, seed?, width?, height?, steps?})",
          "GET /vastai/status": "Check VastAI endpoint status",
          "POST /upload/xtts":
            "Upload XTTS v2 Coqui audio with prompt-based naming",
          "POST /upload/flux1": "Upload Flux1 image with prompt-based naming",
          "POST /upload": "Generic file upload with prompt-based naming",
          "POST /api/generate-url":
            "Generate filename/URL from prompt without uploading",
          "GET /api/files":
            "List all files (supports ?type=audio|image|video&source=&search=)",
          "GET /files/:id/:filename": "Serve file with custom filename in URL",
          "GET /download/:id": "Download file with original filename",
          "GET /meta/:id": "Get file metadata",
          "GET /health": "Health check",
        },
        sources: [
          "vastai-xtts",
          "vastai-flux1",
          "xtts-v2-coqui",
          "flux1-schnell",
          "manual",
        ],
        types: ["audio", "image", "video"],
      });
    }
  }

  // Delete file
  if (method === "DELETE") {
    const deleteMatch = pathname.match(/^\/files\/([a-f0-9]+)$/);
    if (deleteMatch) {
      const fileId = deleteMatch[1];
      const metadata = fileRegistry.get(fileId);
      if (metadata) {
        try {
          await fs.unlink(path.join(CONFIG.baseDir, metadata.path));
          fileRegistry.delete(fileId);
          await saveRegistry();
          return sendJson(res, { success: true, deleted: fileId });
        } catch (error) {
          return sendError(res, error.message, 500);
        }
      }
      return sendError(res, "File not found", 404);
    }
  }

  sendError(res, "Not found", 404);
};

/**
 * Start server with auto port assignment
 */
const startServer = async () => {
  await loadRegistry();

  // Find available port
  CONFIG.port = await findAvailablePort(CONFIG.preferredPort);

  const server = http.createServer(handleRequest);

  server.listen(CONFIG.port, CONFIG.host, () => {
    const publicUrl =
      CONFIG.publicUrl ??
      `http://${CONFIG.system.externalIp ?? "localhost"}:${CONFIG.port}`;

    console.log(`
🚀 BRANDYFICATION File Host Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Local:    http://${CONFIG.host}:${CONFIG.port}
🌐 Public:   ${publicUrl}
📁 Base Dir: ${CONFIG.baseDir}
📊 Registry: ${fileRegistry.size} files

System Info:
  Host:     ${CONFIG.system.hostname}
  Platform: ${CONFIG.system.platform}
  CPUs:     ${CONFIG.system.cpuCount}
  Memory:   ${CONFIG.system.totalMemMB} MB
  Ext IP:   ${CONFIG.system.externalIp ?? "unknown"}
  PID:      ${process.pid}

Port Assignment:
  Preferred: ${CONFIG.preferredPort}
  Assigned:  ${CONFIG.port} ${
      CONFIG.port === CONFIG.preferredPort ? "✓" : "(fallback)"
    }

Configuration:
  Source:   ${
    existsSync(ENV_PATH)
      ? ".env"
      : existsSync(CONFIG_PATH)
      ? "config.json"
      : "defaults"
  }
  Timeout:  ${CONFIG.vastai.timeout}ms
  Max Upload: ${Math.round(CONFIG.maxUploadSize / 1024 / 1024)}MB

VastAI Endpoints:
  XTTS:  ${CONFIG.vastai.xttsEndpoint ?? "❌ Set VASTAI_XTTS_URL"}
  Flux1: ${CONFIG.vastai.flux1Endpoint ?? "❌ Set VASTAI_FLUX1_URL"}

XTTS Defaults:
  Voice:  ${CONFIG.defaults.xtts.voice}
  Lang:   ${CONFIG.defaults.xtts.language}
  Speed:  ${CONFIG.defaults.xtts.speed}
  Format: ${CONFIG.defaults.xtts.outputFormat}

Flux1 Defaults:
  Size:   ${CONFIG.defaults.flux1.width}x${CONFIG.defaults.flux1.height}
  Steps:  ${CONFIG.defaults.flux1.steps}

API Endpoints:
  POST /vastai/xtts     Generate TTS (MP3) via VastAI
  POST /vastai/flux1    Generate images via VastAI
  GET  /vastai/status   Check VastAI status
  GET  /config          View current configuration
  GET  /health          Health check + system info
  POST /upload/*        Upload files
  GET  /api/files       List files
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down...");
    await saveRegistry();
    process.exit(0);
  });
};

startServer();
