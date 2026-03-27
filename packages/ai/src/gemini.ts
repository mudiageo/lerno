import { GoogleGenerativeAI } from '@google/generative-ai';
import { type AIProvider } from './provider';

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model = 'gemini-2.5-pro';
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  async generate({ messages, systemPrompt, maxTokens = 1024, jsonMode = false }: any) {
    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: maxTokens,
        responseMimeType: jsonMode ? 'application/json' : 'text/plain',
      },
    });
    
    const chat = model.startChat({ history: messages.slice(0, -1).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))});
    
    const last = messages[messages.length - 1];
    const result = await chat.sendMessage(last.content);
    return result.response.text();
  }
  
  async generateWithVision({ prompt, imageBase64, mimeType }: any) {
    const model = this.client.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      prompt,
    ]);
    return result.response.text();
  }
}
