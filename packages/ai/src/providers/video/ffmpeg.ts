import ffmpeg from 'fluent-ffmpeg';
import type { VideoGenerator, VideoOptions, VideoResult } from '../../interfaces/video';
import type { GeneratedAsset } from '../../orchestrator/banana';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

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
   * Currently implements a sequential montage with narration.
   */
  async assembleFromAssets(assets: GeneratedAsset[], outputPath: string): Promise<string> {
    const tempDir = path.join(process.cwd(), '.tmp', `assemble-${randomUUID()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 1. Filter and sort assets
    const images = assets.filter(a => a.type === 'image').sort((a, b) => (a.sceneIndex || 0) - (b.sceneIndex || 0));
    const narrations = assets.filter(a => a.type === 'audio').sort((a, b) => (a.sceneIndex || 0) - (b.sceneIndex || 0));
    const bgm = assets.find(a => a.type === 'bgm');

    // 2. Write temp files and prepare durations
    // For now we assume ~5s per scene or based on narration length.
    // In a high-quality implementation, we would probe narration files to get exact durations.
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

    // 3. Build FFmpeg command
    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Add inputs
      imagePaths.forEach(p => {
        command = command.input(p).loop(4.5); // Fixed duration for now
      });

      // Add audio inputs (Narration)
      narrationPaths.forEach(p => {
        command = command.input(p);
      });

      if (bgm) {
        const bgmPath = path.join(tempDir, 'bgm.mp3');
        fs.writeFileSync(bgmPath, bgm.buffer);
        command = command.input(bgmPath);
      }

      command
        .videoCodec('libx264')
        .size('1080x1920') // Portrait for Shorts/TikTok
        .format('mp4')
        .outputOptions([
          '-pix_fmt yuv420p',
          '-shortest', // Stop when shortest stream ends (usually the images montage)
        ])
        .on('end', async () => {
          // Cleanup temp folder
          await fs.promises.rm(tempDir, { recursive: true, force: true }).catch(() => { });
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('[FFmpeg Error]:', err);
          reject(err);
        })
        .mergeToFile(outputPath, tempDir);
    });
  }
}
