// Type declarations for modules without TypeScript support

declare module "node-media-server" {
  interface RTMPConfig {
    port?: number;
    chunk_size?: number;
    gop_cache?: boolean;
    ping?: number;
    ping_timeout?: number;
  }

  interface HTTPConfig {
    port?: number;
    allow_origin?: string;
    mediaroot?: string;
  }

  interface TransTask {
    app: string;
    hls?: boolean;
    hlsFlags?: string;
    hlsKeep?: boolean;
    dash?: boolean;
  }

  interface TransConfig {
    ffmpeg?: string;
    tasks: TransTask[];
  }

  interface NodeMediaServerConfig {
    rtmp?: RTMPConfig;
    http?: HTTPConfig;
    trans?: TransConfig;
  }

  class NodeMediaServer {
    constructor(config: NodeMediaServerConfig);
    run(): void;
    stop(): void;
    on(event: string, callback: (...args: any[]) => void): void;
    getSession(id: string): { reject: () => void };
  }

  export = NodeMediaServer;
}

declare module "fluent-ffmpeg" {
  interface FfmpegCommand {
    inputOptions(options: string[]): FfmpegCommand;
    outputOptions(options: string[]): FfmpegCommand;
    output(path: string): FfmpegCommand;
    on(event: "start", callback: (commandLine: string) => void): FfmpegCommand;
    on(event: "error", callback: (err: Error, stdout?: string, stderr?: string) => void): FfmpegCommand;
    on(event: "end", callback: () => void): FfmpegCommand;
    run(): void;
    kill(signal: string): void;
  }

  function ffmpeg(input: string): FfmpegCommand;
  
  namespace ffmpeg {
    function setFfmpegPath(path: string): void;
    export { FfmpegCommand };
  }

  export = ffmpeg;
}
