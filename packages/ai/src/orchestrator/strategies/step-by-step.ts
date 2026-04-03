import * as v from 'valibot';
import type { LlmProvider } from '../../interfaces/llm';
import type { VideoPlan } from '../types';
import type { OrchestrationStrategy } from './single-prompt';

const ScriptSchema = v.object({
  title: v.string(),
  description: v.string(),
  fullScript: v.string(),
});

const ScenesSchema = v.array(v.object({
  timestamp: v.number(),
  duration: v.number(),
  script: v.string(),
  imagePrompt: v.string(),
}));

/**
 * Plans the video in stages:
 * 1. Scriptwriting (Hook-first, engaging)
 * 2. Visual Storyboarding (Cinematic visuals)
 * 3. BGM Planning
 */
export class StepByStepStrategy implements OrchestrationStrategy {
  async plan(prompt: string, llm: LlmProvider): Promise<VideoPlan> {
    const scriptSystem = `
      You are an elite scriptwriter for "Lerno". 
      Your goal is to write a 30-60 second educational script that feels like a viral "TikTok/Reels/Youtube SHorts" hit.
      - Start with a massive hook.
      - Use "You" language.
      - Explain one complex concept simply.
      - The script should be engaging and easy to understand.
    `;
    const boardSystem = `
      You are a visual director. 
      Convert the following script into 5-8 fast-paced scenes.
      Image prompts should be cinematic, modern, and high-clarity for Nano Banana image generation.
    `;

    // Step 1: Brainstorm Script
    const scriptData = await llm.generateJSON(
      `Topic: ${prompt}`,
      ScriptSchema as any,
      { systemPrompt: scriptSystem }
    );

    // Step 2: Scenes
    const scenes = await llm.generateJSON(
      `Based on this script, create 5-8 scenes with image prompts:\n\n${scriptData.fullScript}`,
      ScenesSchema as any,
      { systemPrompt: boardSystem }
    );

    return {
      title: scriptData.title,
      description: scriptData.description,
      bgmPrompt: `Dynamic, high-energy background music for ${scriptData.title}`,
      scenes: scenes as any,
    };
  }
}
