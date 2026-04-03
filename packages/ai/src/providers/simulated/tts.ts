import type { TtsProvider, TtsOptions } from '../../interfaces/tts';

export class SimulatedTtsProvider implements TtsProvider {
  /**
   * Returns a minimal valid 1-second silence WAV buffer (8kHz, 16-bit, Mono).
   */
  async generateSpeech(text: string, options?: TtsOptions): Promise<Buffer> {
    const waveHeader = 'UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
    return Buffer.from(waveHeader, 'base64');
  }
}
