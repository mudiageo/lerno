import { ProviderFactory } from '../factory';
import { SinglePromptStrategy } from './strategies/single-prompt';
import { StepByStepStrategy } from './strategies/step-by-step';
import type { VideoPlan, Scene } from './types';
import type { VideoResult } from '../interfaces/video';
import { storage } from '@lerno/storage';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface GeneratedAsset {
  type: 'image' | 'audio' | 'bgm';
  sceneIndex?: number;
  buffer: Buffer;
  mimeType: string;
  url?: string;
}

export class BananaOrchestrator {
  private llm = ProviderFactory.getLlmProvider();
  private image = ProviderFactory.getImageProvider();
  private tts = ProviderFactory.getTtsProvider();
  private audio = ProviderFactory.getAudioProvider();

  /**
   * High-level entry point to generate a complete video, including assets and assembly.
   */
  async generateFullVideo(prompt: string, options: { mode?: 'single' | 'step' } = {}): Promise<VideoResult & { scenes: Scene[], title: string, description: string }> {
    const mode = options.mode || 'single';
    const strategy = mode === 'single' ? new SinglePromptStrategy() : new StepByStepStrategy();

    // 1. Planning
    const plan = await strategy.plan(prompt, this.llm);

    // 2. Asset Generation (Parallel)
    const assets = await this.generateWithPlan(plan);

    // 3. Assembly
    const videoGenerator = ProviderFactory.getVideoGenerator();
    
    // We expect the generator to have an assembleFromAssets method for this flow
    const assembly = videoGenerator as any;
    if (typeof assembly.assembleFromAssets !== 'function') {
      throw new Error('Video generator does not support asset assembly');
    }

    const tempDir = path.join(process.cwd(), '.tmp');
    if (!fs.existsSync(tempDir)) {
      await fs.promises.mkdir(tempDir, { recursive: true });
    }
    
    const tempPath = path.join(tempDir, `video-${randomUUID()}.mp4`);
    await assembly.assembleFromAssets(assets, tempPath);

    // 4. Persistence
    const buffer = await fs.promises.readFile(tempPath);
    const key = `ai/videos/${randomUUID()}.mp4`;
    const videoUrl = await storage.upload(key, buffer, 'video/mp4');

    // 5. Cleanup
    await fs.promises.unlink(tempPath).catch(() => {});

    return {
      url: videoUrl,
      buffer,
      mimeType: 'video/mp4',
      title: plan.title,
      description: plan.description,
      scenes: plan.scenes,
    };
  }

  /**
   * Helper to generate assets from a plan.
   */
  private async generateWithPlan(plan: VideoPlan): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    const assetPromises: Promise<void>[] = [];

    // Background Music
    assetPromises.push(
      this.audio.generateClip(plan.bgmPrompt).then(async buffer => {
        const key = `ai/audio/${randomUUID()}.mp3`;
        const url = await storage.upload(key, buffer, 'audio/mpeg');
        assets.push({ type: 'bgm', buffer, mimeType: 'audio/mp3', url });
      })
    );

    // Scenes
    for (let i = 0; i < plan.scenes.length; i++) {
      const scene = plan.scenes[i];

      // Image
      assetPromises.push(
        this.image.generateImage(scene.imagePrompt).then(async buffer => {
          const key = `ai/images/${randomUUID()}.png`;
          const url = await storage.upload(key, buffer, 'image/png');
          assets.push({ type: 'image', sceneIndex: i, buffer, mimeType: 'image/png', url });
        })
      );

      // Narration
      assetPromises.push(
        this.tts.generateSpeech(scene.script).then(async buffer => {
          const key = `ai/audio/tts-${randomUUID()}.wav`;
          const url = await storage.upload(key, buffer, 'audio/wav');
          assets.push({ type: 'audio', sceneIndex: i, buffer, mimeType: 'audio/wav', url });
        })
      );
    }

    await Promise.all(assetPromises);
    return assets;
  }

  /**
   * Backward compatibility for raw asset generation.
   */
  async generate(prompt: string, mode: 'single' | 'step' = 'single'): Promise<GeneratedAsset[]> {
    const strategy = mode === 'single' ? new SinglePromptStrategy() : new StepByStepStrategy();
    const plan = await strategy.plan(prompt, this.llm);
    return this.generateWithPlan(plan);
  }
}
