export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIProvider {
  generate(params: {
    messages: AIMessage[];
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }): Promise<string>;
  
  generateWithVision(params: {
    prompt: string;
    imageBase64: string;
    mimeType: string;
  }): Promise<string>;
}
