export interface ImageGenerationOptions {
  aspectRatio?: '1:1' | '16:9' | '9:16';
  style?: string;
  negativePrompt?: string;
}

export interface ImageProvider {
  /**
   * Generates an image and returns a Buffer of the resulting data.
   */
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<Buffer>;
}
