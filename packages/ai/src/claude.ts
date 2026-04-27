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
  
  async generateWithFile({ prompt, fileData, mimeType, systemPrompt, jsonMode = false, maxTokens = 1500 }: any): Promise<string> {
    // Claude supports PDF and plain-text documents as base64 source blocks.
    const base64 = Buffer.from(fileData as ArrayBuffer).toString('base64');

    const isDocument = mimeType === 'application/pdf' || mimeType.startsWith('text/');
    const contentBlock: any = isDocument
      ? { type: 'document', source: { type: 'base64', media_type: mimeType, data: base64 } }
      : { type: 'text', text: `[File content omitted — unsupported type: ${mimeType}]` };

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: [contentBlock, { type: 'text', text: prompt }],
      }],
    });
    return (response.content[0] as { text: string }).text;
  }
}
