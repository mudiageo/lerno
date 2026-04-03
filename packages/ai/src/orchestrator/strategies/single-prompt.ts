import * as v from 'valibot';
import type { LlmProvider } from '../../interfaces/llm';
import type { VideoPlan } from '../types';

export interface OrchestrationStrategy {
  plan(prompt: string, llm: LlmProvider): Promise<VideoPlan>;
}

const VideoPlanSchema = v.object({
  title: v.string(),
  description: v.string(),
  bgmPrompt: v.string(),
  scenes: v.array(v.object({
    timestamp: v.number(),
    duration: v.number(),
    script: v.string(),
    imagePrompt: v.string(),
  })),
});

/**
 * Generates everything in one go using a single complex JSON prompt.
 * Best for high-tier models like 3.1 Flash.
 */
export class SinglePromptStrategy implements OrchestrationStrategy {
  async plan(prompt: string, llm: LlmProvider): Promise<VideoPlan> {
    const systemPrompt = `
      You are an expert educational video director. 
      Generate a detailed video plan including title, description, BGM prompt (for AI music), 
      and a list of scenes with script for narration and image prompts for Nano Banana.
    `;

    return llm.generateJSON<VideoPlan>(prompt, VideoPlanSchema as any, { systemPrompt });
  }
}
