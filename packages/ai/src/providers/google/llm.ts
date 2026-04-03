import { GoogleClient } from './client';
import type { LlmProvider, LlmGenerationOptions } from '../../interfaces/llm';
import { type GenericSchema, parse } from 'valibot';

export class GeminiLlmProvider implements LlmProvider {
  private model = 'gemini-3.1-flash-lite-preview';

  async generateText(prompt: string, options?: LlmGenerationOptions): Promise<string> {
    const ai = GoogleClient.getInstance();
    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: options?.systemPrompt,
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
      }
    });

    if (!response.text) {
      throw new Error('No text returned from Gemini LLM');
    }

    return response.text;
  }

  async generateJSON<T>(prompt: string, schema: GenericSchema<T>, options?: LlmGenerationOptions): Promise<T> {
    const ai = GoogleClient.getInstance();
    const response = await ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: options?.systemPrompt,
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        responseMimeType: 'application/json',
      }
    });

    if (!response.text) {
      throw new Error('No JSON text returned from Gemini LLM');
    }

    const parsed = JSON.parse(response.text);
    return parse(schema, parsed);
  }
}
