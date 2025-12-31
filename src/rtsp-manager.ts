/**
 * RTSP Stream Manager
 * 
 * Manages real-time streaming from RTSP sources (IP cameras) using FFmpeg.
 * Transcodes RTSP streams to HLS format for browser playback.
 * 
 * @module rtsp-manager
 */

import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RTSPConfig {
  ffmpegPath?: string;
  outputDir: string;
  videoCodec?: string;
  audioCodec?: string;
  preset?: string;
  crf?: string;
  resolution?: string;
  framerate?: string;
  bitrate?: string;
  audioBitrate?: string;
  hlsTime?: string;
  hlsListSize?: string;
  hlsFlags?: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

interface StreamData {
  process: any;
  url: string;
  name: string;
  status: string;
  startedAt: Date;
}

/**
 * RTSP Stream Manager
 * Handles RTSP → HLS transcoding for IP camera streams
 */
export class RTSPStreamManager {
  private config: RTSPConfig;
  private streams: Map<string, StreamData>;
  private reconnectAttempts: Map<string, number>;

  constructor(config: RTSPConfig) {
    this.config = {
      videoCodec: "libx264",
      audioCodec: "aac",
      preset: "ultrafast",
      crf: "23",
      resolution: "1280x720",
      framerate: "30",
      bitrate: "2000k",
      audioBitrate: "128k",
      hlsTime: "2",
      hlsListSize: "3",
      hlsFlags: "delete_segments",
      reconnectDelay: 5000,
      maxReconnectAttempts: 10,
      debug: false,
      ...config,
    };
    
    this.streams = new Map();
    this.reconnectAttempts = new Map();

    // Set FFmpeg binary path if provided
    if (this.config.ffmpegPath) {
      (ffmpeg as any).setFfmpegPath(this.config.ffmpegPath);
    }

    this.ensureOutputDirectory();
  }

  private ensureOutputDirectory(): void {
    const outputDir = path.resolve(__dirname, "..", this.config.outputDir);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`📁 Created stream output directory: ${outputDir}`);
    }
  }

  /**
   * Parse RTSP streams from environment variables
   * Format: RTSP_STREAM_1=rtsp://url, RTSP_NAME_1=Name
   */
  static parseStreamsFromEnv(): { id: string; url: string; name: string; enabled: boolean }[] {
    const streams: { id: string; url: string; name: string; enabled: boolean }[] = [];
    let index = 1;

    while (process.env[`RTSP_STREAM_${index}`]) {
      const url = process.env[`RTSP_STREAM_${index}`]!;
      const name = process.env[`RTSP_NAME_${index}`] || `Stream ${index}`;

      streams.push({
        id: `stream${index}`,
        url,
        name,
        enabled: true,
      });

      index++;
    }

    return streams;
  }

  /**
   * Start streaming from an RTSP source
   */
  startStream(streamId: string, rtspUrl: string, streamName: string): boolean {
    if (this.streams.has(streamId)) {
      console.log(`⚠️ Stream ${streamId} is already running`);
      return false;
    }

    const outputDir = path.resolve(__dirname, "..", this.config.outputDir);
    const playlistPath = path.join(outputDir, `${streamId}.m3u8`);
    const segmentPattern = path.join(outputDir, `${streamId}_%03d.ts`);

    console.log(`🎥 Starting RTSP stream: ${streamName} (${streamId})`);
    console.log(`📡 Source: ${this.sanitizeUrl(rtspUrl)}`);
    console.log(`📺 Output: ${playlistPath}`);

    const ffmpegProcess = ffmpeg(rtspUrl)
      .inputOptions([
        "-rtsp_transport", "tcp",
        "-analyzeduration", "1000000",
        "-probesize", "1000000",
      ])
      .outputOptions([
        "-c:v", this.config.videoCodec!,
        "-preset", this.config.preset!,
        "-crf", this.config.crf!,
        "-c:a", this.config.audioCodec!,
        "-b:a", this.config.audioBitrate!,
        "-ac", "2",
        "-ar", "44100",
        "-s", this.config.resolution!,
        "-r", this.config.framerate!,
        "-b:v", this.config.bitrate!,
        "-f", "hls",
        "-hls_time", this.config.hlsTime!,
        "-hls_list_size", this.config.hlsListSize!,
        "-hls_flags", this.config.hlsFlags!,
        "-hls_segment_filename", segmentPattern,
      ])
      .output(playlistPath)
      .on("start", (commandLine) => {
        if (this.config.debug) {
          console.log(`🔧 FFmpeg command: ${commandLine}`);
        }
      })
      .on("error", (err) => {
        console.error(`❌ Stream ${streamId} error:`, err.message);
        this.handleStreamError(streamId, rtspUrl, streamName);
      })
      .on("end", () => {
        console.log(`⏹️ Stream ${streamId} ended`);
        this.streams.delete(streamId);
      });

    ffmpegProcess.run();

    this.streams.set(streamId, {
      process: ffmpegProcess,
      url: rtspUrl,
      name: streamName,
      status: "active",
      startedAt: new Date(),
    });

    this.reconnectAttempts.set(streamId, 0);
    return true;
  }

  /**
   * Handle stream errors and attempt reconnection
   */
  private handleStreamError(streamId: string, rtspUrl: string, streamName: string): void {
    const attempts = this.reconnectAttempts.get(streamId) || 0;
    const maxAttempts = this.config.maxReconnectAttempts!;

    if (attempts < maxAttempts) {
      this.reconnectAttempts.set(streamId, attempts + 1);
      const delay = this.config.reconnectDelay!;

      console.log(`🔄 Reconnecting ${streamId} in ${delay}ms (attempt ${attempts + 1}/${maxAttempts})...`);

      setTimeout(() => {
        this.streams.delete(streamId);
        this.startStream(streamId, rtspUrl, streamName);
      }, delay);
    } else {
      console.error(`💔 Stream ${streamId} failed after ${maxAttempts} attempts`);
      this.streams.delete(streamId);
      this.reconnectAttempts.delete(streamId);
    }
  }

  /**
   * Stop a specific stream
   */
  stopStream(streamId: string): boolean {
    const stream = this.streams.get(streamId);
    if (!stream) {
      console.log(`⚠️ Stream ${streamId} not found`);
      return false;
    }

    console.log(`⏹️ Stopping stream: ${streamId}`);
    (stream.process as any).kill("SIGKILL");
    this.streams.delete(streamId);
    this.reconnectAttempts.delete(streamId);
    this.cleanupStreamFiles(streamId);
    return true;
  }

  /**
   * Stop all active streams
   */
  stopAllStreams(): void {
    console.log(`⏹️ Stopping all ${this.streams.size} active streams...`);

    for (const [streamId, stream] of this.streams.entries()) {
      (stream.process as any).kill("SIGKILL");
      this.cleanupStreamFiles(streamId);
    }

    this.streams.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Clean up HLS segment files
   */
  private cleanupStreamFiles(streamId: string): void {
    const outputDir = path.resolve(__dirname, "..", this.config.outputDir);
    try {
      const files = fs.readdirSync(outputDir);
      files.forEach((file) => {
        if (file.startsWith(streamId)) {
          const filePath = path.join(outputDir, file);
          fs.unlinkSync(filePath);
        }
      });
    } catch (error) {
      console.error(`Error cleaning up stream files for ${streamId}:`, error);
    }
  }

  /**
   * Get status of all streams
   */
  getStreamStatus(): {
    id: string;
    name: string;
    status: string;
    url: string;
    startedAt: Date;
    uptime: number;
  }[] {
    const status: {
      id: string;
      name: string;
      status: string;
      url: string;
      startedAt: Date;
      uptime: number;
    }[] = [];

    for (const [streamId, stream] of this.streams.entries()) {
      status.push({
        id: streamId,
        name: stream.name,
        status: stream.status,
        url: this.sanitizeUrl(stream.url),
        startedAt: stream.startedAt,
        uptime: Math.floor((Date.now() - stream.startedAt.getTime()) / 1000),
      });
    }

    return status;
  }

  /**
   * Sanitize RTSP URL for logging (hide credentials)
   */
  private sanitizeUrl(url: string): string {
    return url.replace(/:\/\/([^:]+):([^@]+)@/, "://***:***@");
  }

  /**
   * Get stream playlist URL
   */
  getPlaylistUrl(streamId: string): string {
    return `/streams/${streamId}.m3u8`;
  }
}

export default RTSPStreamManager;
