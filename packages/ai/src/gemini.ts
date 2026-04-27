import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { type AIProvider } from './provider';

/** Files smaller than this are sent as inline base64 data; larger ones go through the File API. */
const INLINE_SIZE_LIMIT_BYTES = 4 * 1024 * 1024; // 4 MB

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private genaiClient: GoogleGenAI;
  private model = 'gemini-2.5-pro';
  
  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.genaiClient = new GoogleGenAI({ apiKey });
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

  async generateWithFile({
    prompt,
    fileData,
    mimeType,
    fileName = 'course-material',
    systemPrompt,
    jsonMode = false,
    maxTokens = 1500,
  }: {
    prompt: string;
    fileData: ArrayBuffer;
    mimeType: string;
    fileName?: string;
    systemPrompt?: string;
    jsonMode?: boolean;
    maxTokens?: number;
  }): Promise<string> {
    const buffer = Buffer.from(fileData);

    // Determine whether to use inline data or the File API
    let filePart: any;
    let uploadedFileName: string | undefined;

    if (buffer.length < INLINE_SIZE_LIMIT_BYTES) {
      filePart = { inlineData: { mimeType, data: buffer.toString('base64') } };
    } else {
      const { part, resourceName } = await this._uploadFileAndGetPart(buffer, mimeType, fileName);
      filePart = part;
      uploadedFileName = resourceName;
    }

    try {
      const response = await this.genaiClient.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [filePart, { text: prompt }] }],
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: maxTokens,
          responseMimeType: jsonMode ? 'application/json' : 'text/plain',
        },
      });
      return response.text ?? '';
    } finally {
      if (uploadedFileName) {
        try {
          await this.genaiClient.files.delete({ name: uploadedFileName });
        } catch {
          // Ignore cleanup errors — files expire automatically after 48 h
        }
      }
    }
  }

  /** Upload file via the Gemini File API and return a fileData part + resource name. */
  private async _uploadFileAndGetPart(
    buffer: Buffer,
    mimeType: string,
    displayName: string,
  ): Promise<{ part: any; resourceName: string }> {
    const uploaded = await this.genaiClient.files.upload({
      file: new Blob([buffer], { type: mimeType }),
      config: { mimeType, displayName },
    });

    return {
      part: { fileData: { mimeType, fileUri: uploaded.uri } },
      resourceName: uploaded.name,
    };
  }
}
