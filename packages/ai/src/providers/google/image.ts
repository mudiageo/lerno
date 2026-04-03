import { GoogleClient } from './client';
import type { ImageProvider, ImageGenerationOptions } from '../../interfaces/image';

export class NanoBananaImageProvider implements ImageProvider {
  private model = 'gemini-3.1-flash-image-preview';

  async generateImage(prompt: string, options?: ImageGenerationOptions): Promise<Buffer> {
    const ai = GoogleClient.getInstance();
    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) {
      throw new Error('No image data returned from Nano Banana');
    }

    return Buffer.from(part.inlineData.data, 'base64');
  }
}
