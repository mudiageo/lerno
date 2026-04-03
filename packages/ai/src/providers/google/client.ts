import { GoogleGenAI } from '@google/genai';

/**
 * Shared client for Google GenAI services.
 * In a real app, this would be configured via env vars.
 */
export class GoogleClient {
  private static instance: GoogleGenAI;

  static getInstance(): GoogleGenAI {
    if (!this.instance) {
      if (!process.env.GOOGLE_GENAI_API_KEY) {
        throw new Error('GOOGLE_GENAI_API_KEY is not defined');
      }
      this.instance = new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENAI_API_KEY,
      });
    }
    return this.instance;
  }
}
