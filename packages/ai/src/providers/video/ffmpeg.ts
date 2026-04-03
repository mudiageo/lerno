import ffmpeg from 'fluent-ffmpeg';
import type { VideoGenerator, VideoOptions, VideoResult } from '../../interfaces/video';
import type { GeneratedAsset } from '../../orchestrator/banana';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * The default assembly engine using FFmpeg.
 * It stitches together images and narration into a final MP4.
 */
export class FfmpegVideoGenerator implements VideoGenerator {
  async generateVideo(prompt: string, options?: VideoOptions): Promise<VideoResult> {
    // This method is usually called by the higher-level Orchestrator with assets.
    // For now, let's implement the specialized 'assemble' method that takes pre-generated assets.
    throw new Error('Please use assembleFromAssets for FfmpegVideoGenerator');
  }

  /**
   * Stitches the provided assets into a video.
   */
  async assembleFromAssets(assets: GeneratedAsset[], outputPath: string): Promise<string> {
    const tempDir = path.join(process.cwd(), '.tmp', `assemble-${Date.now()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 1. Prepare files
    const images = assets.filter(a => a.type === 'image').sort((a, b) => (a.sceneIndex || 0) - (b.sceneIndex || 0));
    const narrations = assets.filter(a => a.type === 'audio').sort((a, b) => (a.sceneIndex || 0) - (b.sceneIndex || 0));
    const bgm = assets.find(a => a.type === 'bgm');

    const imagePaths: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const p = path.join(tempDir, `img-${i}.png`);
      fs.writeFileSync(p, images[i].buffer);
      imagePaths.push(p);
    }

    const narrationPaths: string[] = [];
    for (let i = 0; i < narrations.length; i++) {
      const p = path.join(tempDir, `tts-${i}.wav`);
      fs.writeFileSync(p, narrations[i].buffer);
      narrationPaths.push(p);
    }

    // 2. Build FFmpeg command
    // This is a simplified version that just concatenates images for 5 seconds each
    // In a real implementation, we'd use complex filters for timing and audio mixing.

    return new Promise((resolve, reject) => {
      const command = ffmpeg();

      // Add inputs
      imagePaths.forEach(p => {
        command.input(p).loop(5); // 5 seconds per image for now
      });

      if (bgm) {
        const bgmPath = path.join(tempDir, 'bgm.mp3');
        fs.writeFileSync(bgmPath, bgm.buffer);
        command.input(bgmPath);
      }

      // Add all narration tracks as inputs
      narrationPaths.forEach(p => command.input(p));

      command
        .on('end', () => resolve(outputPath))
        .on('error', (err) => reject(err))
        .mergeToFile(outputPath, tempDir);
    });
  }
}
