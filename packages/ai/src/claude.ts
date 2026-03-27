import Anthropic from '@anthropic-ai/sdk';
import { type AIProvider } from './provider';

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async generate({ messages, systemPrompt, maxTokens = 1024 }: any) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: messages.filter((m: any) => m.role !== 'system').map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });
    return (response.content[0] as { text: string }).text;
  }
  
  async generateWithVision({ prompt, imageBase64, mimeType }: any) {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType as any, data: imageBase64 } },
          { type: 'text', text: prompt },
        ],
      }],
    });
    return (response.content[0] as { text: string }).text;
  }
}
