import type { ImageProvider, ImageGenerationOptions } from '../../interfaces/image';

export class SimulatedImageProvider implements ImageProvider {
  /**
   * Returns a minimal 1x1 red PNG pixel base64-encoded to simulate an image.
   */
  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<Buffer> {
    const redPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    return Buffer.from(redPixel, 'base64');
  }
}
