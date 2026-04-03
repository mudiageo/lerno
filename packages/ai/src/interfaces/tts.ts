export interface TtsOptions {
  voice?: string;
  speed?: number;
  pitch?: number;
  language?: string;
}

export interface TtsProvider {
  /**
   * Generates a sound clip (speech) and returns a Buffer of the audio data.
   */
  generateSpeech(text: string, options?: TtsOptions): Promise<Buffer>;
}
