import type { LlmProvider, LlmGenerationOptions } from '../../interfaces/llm';
import { type GenericSchema, parse } from 'valibot';

export class SimulatedLlmProvider implements LlmProvider {
  async generateText(prompt: string, options?: LlmGenerationOptions): Promise<string> {
    return `Simulated response for: ${prompt.substring(0, 50)}...`;
  }

  async generateJSON<T>(prompt: string, schema: GenericSchema<T>, options?: LlmGenerationOptions): Promise<T> {
    // Return a default object that hopefully satisfies the schema for common video planning
    const mockData = {
      title: 'Simulated Video',
      description: 'A simulated video plan for development.',
      fullScript: 'This is a simulated script. Welcome to the world of AI video generation.',
      bgmPrompt: 'Cheerful acoustic music',
      scenes: [
        {
          timestamp: 0,
          duration: 5,
          script: 'Welcome to this simulated lesson.',
          imagePrompt: 'A classroom with a chalkboard'
        },
        {
          timestamp: 5,
          duration: 5,
          script: 'Today we are learning about abstraction.',
          imagePrompt: 'A set of abstract shapes'
        }
      ]
    };

    return parse(schema, mockData as any);
  }
}
