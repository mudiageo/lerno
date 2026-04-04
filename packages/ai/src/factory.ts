import type { LlmProvider } from './interfaces/llm';
import type { ImageProvider } from './interfaces/image';
import type { TtsProvider } from './interfaces/tts';
import type { AudioProvider } from './interfaces/audio';
import type { VideoGenerator } from './interfaces/video';

import { GeminiLlmProvider } from './providers/google/llm';
import { NanoBananaImageProvider } from './providers/google/image';
import { GeminiTtsProvider } from './providers/google/tts';
import { LyriaAudioProvider } from './providers/google/audio';
import { FfmpegVideoGenerator } from './providers/video/ffmpeg';

import { SimulatedLlmProvider } from './providers/simulated/llm';
import { SimulatedImageProvider } from './providers/simulated/image';
import { SimulatedTtsProvider } from './providers/simulated/tts';
import { SimulatedAudioProvider } from './providers/simulated/audio';
import { SimulatedVideoGenerator } from './providers/simulated/video';

import 'dotenv/config';

export class ProviderFactory {
  static getLlmProvider(type?: string): LlmProvider {
    const provider = type || process.env.AI_PROVIDER || process.env.LLM_PROVIDER || 'google';
    if (provider === 'simulated') return new SimulatedLlmProvider();
    return new GeminiLlmProvider();
  }

  static getImageProvider(type?: string): ImageProvider {
    const provider = type || process.env.AI_PROVIDER || process.env.IMAGE_PROVIDER || 'google';
    if (provider === 'simulated') return new SimulatedImageProvider();
    return new NanoBananaImageProvider();
  }

  static getTtsProvider(type?: string): TtsProvider {
    const provider = type || process.env.AI_PROVIDER || process.env.TTS_PROVIDER || 'google';
    if (provider === 'simulated') return new SimulatedTtsProvider();
    return new GeminiTtsProvider();
  }

  static getAudioProvider(type?: string): AudioProvider {
    const provider = type || process.env.AI_PROVIDER || process.env.AUDIO_PROVIDER || 'google';
    if (provider === 'simulated') return new SimulatedAudioProvider();
    return new LyriaAudioProvider();
  }

  static getVideoGenerator(): VideoGenerator {
    if (process.env.AI_VIDEO_GENERATOR === 'simulated') return new SimulatedVideoGenerator();
    return new FfmpegVideoGenerator();
  }
}
