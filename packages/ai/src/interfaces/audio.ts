export interface AudioGenerationOptions {
  duration?: number;
  mood?: string;
  instruments?: string[];
  genre?: string;
}

export interface AudioProvider {
  /**
   * Generates an audio clip (music, sound effects) and returns a Buffer.
   */
  generateClip(prompt: string, options?: AudioGenerationOptions): Promise<Buffer>;
}
