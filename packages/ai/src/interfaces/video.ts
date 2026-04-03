export interface VideoOptions {
  aspectRatio?: '16:9' | '9:16' | '1:1';
  duration?: number;
  resolution?: '720p' | '1080p';
  theme?: string;
}

export interface VideoResult {
  url?: string;
  buffer?: Buffer;
  mimeType: string;
}

export interface VideoGenerator {
  /**
   * Generates a video and returns the result.
   */
  generateVideo(prompt: string, options?: VideoOptions): Promise<VideoResult>;
}
