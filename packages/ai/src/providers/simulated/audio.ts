import type { AudioProvider, AudioGenerationOptions } from '../../interfaces/audio';

export class SimulatedAudioProvider implements AudioProvider {
    /**
     * Returns a minimal valid 1-second silence MP3 buffer.
     */
    async generateClip(prompt: string, options?: AudioGenerationOptions): Promise<Buffer> {
        const mp3Header = '////8ExAAAAAAAAAAAAAA'; // very small MP3 dummy
        return Buffer.from(mp3Header, 'base64');
    }
}
