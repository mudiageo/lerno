import { GoogleClient } from './client';
import type { TtsProvider, TtsOptions } from '../../interfaces/tts';
import * as wav from 'wav';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { os } from 'node:os';

export class GeminiTtsProvider implements TtsProvider {
  private model = 'gemini-2.5-flash-preview-tts';

  async generateSpeech(text: string, options?: TtsOptions): Promise<Buffer> {
    const ai = GoogleClient.getInstance();

    // As per user example: "Say cheerfully: Have a wonderful day!"
    const promptText = options?.voice === 'cheerful' ? `Say cheerfully: ${text}` : text;

    const response = await ai.models.generateContent({
      model: this.model,
      contents: [{ parts: [{ text: promptText }] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: options?.voice || 'Kore' },
          },
        },
      },
    });

    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!data) {
      throw new Error('No audio data returned from Gemini TTS');
    }

    const pcmBuffer = Buffer.from(data, 'base64');

    // We need to wrap it in a WAV container as per the user's example
    // We'll use a temporary file to leverage the 'wav' library's FileWriter easily
    const tempDir = path.join(process.cwd(), '.tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFile = path.join(tempDir, `tts-${Date.now()}.wav`);

    await new Promise((resolve, reject) => {
      const writer = new wav.FileWriter(tempFile, {
        channels: 1,
        sampleRate: 24000,
        bitDepth: 16, // 2 bytes * 8
      });

      writer.on('finish', resolve);
      writer.on('error', reject);

      writer.write(pcmBuffer);
      writer.end();
    });

    const finalBuffer = fs.readFileSync(tempFile);

    // Clean up
    try {
      fs.unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }

    return finalBuffer;
  }
}
