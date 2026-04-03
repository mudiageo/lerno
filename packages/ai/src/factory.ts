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

export class ProviderFactory {
  static getLlmProvider(): LlmProvider {
    if (process.env.AI_LLM_PROVIDER === 'simulated') return new SimulatedLlmProvider();
    return new GeminiLlmProvider();
  }

  static getImageProvider(): ImageProvider {
    if (process.env.AI_IMAGE_PROVIDER === 'simulated') return new SimulatedImageProvider();
    return new NanoBananaImageProvider();
  }

  static getTtsProvider(): TtsProvider {
    if (process.env.AI_TTS_PROVIDER === 'simulated') return new SimulatedTtsProvider();
    return new GeminiTtsProvider();
  }

  static getAudioProvider(): AudioProvider {
    if (process.env.AI_AUDIO_PROVIDER === 'simulated') return new SimulatedAudioProvider();
    return new LyriaAudioProvider();
  }

  static getVideoGenerator(): VideoGenerator {
    if (process.env.AI_VIDEO_GENERATOR === 'simulated') return new SimulatedVideoGenerator();
    return new FfmpegVideoGenerator();
  }
}
