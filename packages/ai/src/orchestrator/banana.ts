import { ProviderFactory } from '../factory';
import { SinglePromptStrategy } from './strategies/single-prompt';
import { StepByStepStrategy } from './strategies/step-by-step';
import type { VideoPlan, Scene } from './types';
import type { VideoGenerator, VideoResult } from '../interfaces/video';
import { storage } from '@lerno/storage';
import { randomUUID } from 'node:crypto';

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
   * Orchestrates the entire generation process.
   */
  async generate(prompt: string, mode: 'single' | 'step' = 'single'): Promise<GeneratedAsset[]> {
    const strategy = mode === 'single' ? new SinglePromptStrategy() : new StepByStepStrategy();

    // 1. Planning
    const plan = await strategy.plan(prompt, this.llm);
    const assets: GeneratedAsset[] = [];

    // 2. Asset Generation (Parallel)
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
}
