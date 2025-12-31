/**
 * RTMP Ingest Server
 * 
 * Receives live streams FROM external streaming software (OBS Studio, vMix, etc.)
 * and automatically transcodes them to HLS format for browser playback.
 * 
 * This is a PUSH model server - it RECEIVES streams from broadcasting
 * software, unlike RTSP which PULLS from IP cameras.
 * 
 * @module rtmp-server
 * @example
 * // OBS Studio Configuration:
 * // Server: rtmp://localhost:1935/live
 * // Stream Key: mystreamkey
 * // Output URL: http://localhost:8000/live/mystreamkey/index.m3u8
 */

import NodeMediaServer from "node-media-server";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RTMPConfig {
  rtmpPort?: number;
  httpPort?: number;
  ffmpegPath?: string;
  mediaRoot?: string;
  validateStreamKey?: boolean;
  validStreamKeys?: string[];
}

interface ActiveStream {
  startTime: Date;
  app: string;
  name: string;
  id: string;
}

/**
 * RTMP Ingest Server
 * Handles OBS/vMix → HLS transcoding for live streaming
 */
export class RTMPIngestServer {
  private config: RTMPConfig;
  private nms: NodeMediaServer | null;
  private activeStreams: Map<string, ActiveStream>;

  constructor(config: RTMPConfig) {
    this.config = {
      rtmpPort: 1935,
      httpPort: 8000,
      ffmpegPath: "ffmpeg",
      mediaRoot: "./BRANDYFICATION",
      validateStreamKey: false,
      validStreamKeys: [],
      ...config,
    };
    this.nms = null;
    this.activeStreams = new Map();
  }

  /**
   * Start the RTMP ingest server and HLS HTTP server
   */
  start(): void {
    const rtmpConfig = {
      rtmp: {
        port: this.config.rtmpPort,
        chunk_size: 60000,
        gop_cache: true,
        ping: 30,
        ping_timeout: 60,
      },
      http: {
        port: this.config.httpPort,
        allow_origin: "*",
        mediaroot: path.resolve(__dirname, "..", this.config.mediaRoot || "./BRANDYFICATION"),
      },
      trans: {
        ffmpeg: this.config.ffmpegPath,
        tasks: [
          {
            app: "live",
            hls: true,
            hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
            hlsKeep: true,
            dash: false,
          },
        ],
      },
    };

    this.nms = new NodeMediaServer(rtmpConfig);

    // Connection events
    this.nms.on("preConnect", (id: string, args: Record<string, unknown>) => {
      console.log(`[RTMP] preConnect: id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on("postConnect", (id: string, args: Record<string, unknown>) => {
      console.log(`[RTMP] postConnect: id=${id}`);
    });

    this.nms.on("doneConnect", (id: string, args: Record<string, unknown>) => {
      console.log(`[RTMP] doneConnect: id=${id}`);
    });

    // Publish events
    this.nms.on("prePublish", (id: string, StreamPath: string, args: Record<string, unknown>) => {
      console.log(`[RTMP] prePublish: id=${id} StreamPath=${StreamPath}`);

      const parts = StreamPath.split("/");
      const app = parts[1];
      const streamKey = parts[2];

      // Validate stream key if enabled
      if (this.config.validateStreamKey) {
        const validKeys = this.config.validStreamKeys || [];
        if (validKeys.length > 0 && !validKeys.includes(streamKey)) {
          console.log(`[RTMP] Rejected invalid stream key: ${streamKey}`);
          const session = (this.nms as any).getSession(id);
          session.reject();
          return;
        }
      }

      // Track active stream
      this.activeStreams.set(streamKey, {
        startTime: new Date(),
        app: app,
        name: (args as any).name || streamKey,
        id: id,
      });

      console.log(`✅ Stream started: ${streamKey} (app: ${app})`);
    });

    this.nms.on("postPublish", (id: string, StreamPath: string, args: Record<string, unknown>) => {
      console.log(`[RTMP] postPublish: id=${id} StreamPath=${StreamPath}`);
    });

    this.nms.on("donePublish", (id: string, StreamPath: string, args: Record<string, unknown>) => {
      console.log(`[RTMP] donePublish: id=${id} StreamPath=${StreamPath}`);

      const parts = StreamPath.split("/");
      const streamKey = parts[2];
      this.activeStreams.delete(streamKey);
      console.log(`⏹️ Stream ended: ${streamKey}`);
    });

    this.nms.run();

    console.log(`📡 RTMP Ingest Server running on port ${this.config.rtmpPort}`);
    console.log(`🌐 HLS HTTP Server running on port ${this.config.httpPort}`);
    console.log(`📺 Stream to: rtmp://localhost:${this.config.rtmpPort}/live/{YOUR_STREAM_KEY}`);
    console.log(`🎬 Watch HLS at: http://localhost:${this.config.httpPort}/live/{YOUR_STREAM_KEY}/index.m3u8`);
  }

  /**
   * Stop the RTMP server
   */
  stop(): void {
    if (this.nms) {
      this.nms.stop();
      console.log("🛑 RTMP Ingest Server stopped");
    }
  }

  /**
   * Get list of active streams
   */
  getActiveStreams(): {
    streamKey: string;
    app: string;
    name: string;
    startTime: Date;
    uptime: number;
    playlistUrl: string;
  }[] {
    return Array.from(this.activeStreams.entries()).map(([key, data]) => ({
      streamKey: key,
      app: data.app,
      name: data.name,
      startTime: data.startTime,
      uptime: Math.floor((Date.now() - data.startTime.getTime()) / 1000),
      playlistUrl: `/live/${key}/index.m3u8`,
    }));
  }

  /**
   * Get stream URLs for a specific stream key
   */
  getStreamUrl(streamKey: string): { rtmp: string; hls: string } {
    return {
      rtmp: `rtmp://localhost:${this.config.rtmpPort || 1935}/live/${streamKey}`,
      hls: `http://localhost:${this.config.httpPort || 8000}/live/${streamKey}/index.m3u8`,
    };
  }
}

export default RTMPIngestServer;
