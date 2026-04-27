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

  /**
   * Generate content from a file (PDF, DOCX, PPTX, text, etc.).
   * Small files (<4 MB) are sent as inline base64 data;
   * large files are uploaded via the Gemini File API first.
   */
  generateWithFile(params: {
    prompt: string;
    fileData: ArrayBuffer;
    mimeType: string;
    fileName?: string;
    systemPrompt?: string;
    jsonMode?: boolean;
    maxTokens?: number;
  }): Promise<string>;
}
