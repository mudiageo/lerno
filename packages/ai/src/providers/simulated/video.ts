import type { VideoGenerator, VideoOptions, VideoResult } from '../../interfaces/video';

export class SimulatedVideoGenerator implements VideoGenerator {
    /**
     * Returns a minimal valid dummy MP4 buffer.
     */
    async generateVideo(prompt: string, options?: VideoOptions): Promise<VideoResult> {
        return {
            buffer: Buffer.alloc(0), // Dummy empty buffer
            mimeType: 'video/mp4',
            url: 'https://example.com/simulated.mp4'
        };
    }
}
