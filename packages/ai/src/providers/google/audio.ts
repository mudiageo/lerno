import { GoogleClient } from './client';
import type { AudioProvider, AudioGenerationOptions } from '../../interfaces/audio';

export class LyriaAudioProvider implements AudioProvider {
  private model = 'lyria-3-clip-preview';

  async generateClip(prompt: string, options?: AudioGenerationOptions): Promise<Buffer> {
    const ai = GoogleClient.getInstance();
    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        responseModalities: ['AUDIO', 'TEXT'],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part || !part.inlineData) {
      throw new Error('No audio data returned from Lyria');
    }

    return Buffer.from(part.inlineData.data, 'base64');
  }
}
