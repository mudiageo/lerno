import { type AIProvider } from './provider';
import { GeminiProvider } from './gemini';
import { ClaudeProvider } from './claude';
import 'dotenv/config';

export function createAIProvider(): AIProvider {
  const primary = new GeminiProvider(process.env.GEMINI_API_KEY!);
  const fallback = new ClaudeProvider(process.env.ANTHROPIC_API_KEY!);

  return new Proxy(primary, {
    get(target, prop) {
      return async (...args: any[]) => {
        try {
          return await (target as any)[prop](...args);
        } catch (err) {
          console.warn(`Gemini failed, falling back to Claude: ${err}`);
          return await (fallback as any)[prop](...args);
        }
      };
    },
  });
}

// Ensure process.env.GEMINI_API_KEY exists if we are going to instantiate this immediately
// Though usually we assume process.env is injected by the consumer (web/worker)
export const ai = process.env.GEMINI_API_KEY ? createAIProvider() : null as unknown as AIProvider;

export * from './provider';
export * from './gemini';
export * from './claude';
export * from './rate-limiter';
export * from './prompts/content';

// New AI Video Generation Pipeline
export * from './orchestrator/banana';
export * from './factory';
export type { OrchestrationMode } from './orchestrator/strategies/single-prompt';
export * from './interfaces/llm';
export * from './interfaces/image';
export * from './interfaces/tts';
export * from './interfaces/audio';
export * from './interfaces/video';
