import type { GenericSchema } from 'valibot';

export interface LlmGenerationOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export interface LlmProvider {
  /**
   * Generates a plain text response from a prompt.
   */
  generateText(prompt: string, options?: LlmGenerationOptions): Promise<string>;

  /**
   * Generates a structured JSON response validated against a Valibot schema.
   */
  generateJSON<T>(prompt: string, schema: GenericSchema<T>, options?: LlmGenerationOptions): Promise<T>;
}
